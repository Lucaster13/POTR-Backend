import { createConnectorAPI } from '@jackcom/reachduck';
import fs from 'fs';
import deletePotr from './nfts/deletePotr.js';
import mintAsa from './nfts/mintAsa.js';
import { RARE_TRAIT_MAPPING } from './nfts/traits.js';
import {
    execPython
} from './utils/common.js';
import { COIN_RARITY_WEIGHTS, REACH_NETWORK } from './utils/constants.js';
import { checkNFTExists, storeNFT } from './utils/ipfs.js';

function getRarity(coinType) {
    const max = 10000;
    const randomVal = Math.round(Math.random() * max);
    const rarityRange = Math.round(COIN_RARITY_WEIGHTS[coinType] * max);
    const isRare = randomVal <= rarityRange;
    return isRare;
}

function findRareTraits(validIdx, traits, currIdx) {
    if (validIdx) return validIdx;

    const isRare = Object
        .keys(RARE_TRAIT_MAPPING)
        .map((type) => RARE_TRAIT_MAPPING[type].includes(traits[type]))
        .filter((rare) => rare)
        .reduce((rare, curr) => rare || curr, false);

    if (isRare) return currIdx;

    return validIdx;
}

const makeArc69Metadata = (traits, description, assetUrl) => ({
    standard: 'arc69',
    description,
    external_url: assetUrl,
    mime_type: 'image/png',
    properties: traits,
});

const getNextIdNum = (assets) => {
    const ascendingIds = assets
        .filter((md) => md) // filter out null
        .map(({ name }) => name) // extract name
        .map((name) => name.split(' ')[1]) // retrieve id num from name
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id) && id >= 1)
        .sort((id1, id2) => id1 - id2); // convert str to numbers
    const minId = ascendingIds[0];
    // if potr 1 hasnt been minted, return first id
    if (minId !== 1) return 1;

    // increment counter from minId to find next avaliable id
    return ascendingIds.reduce((currId, id) => {
        if (currId === id) return id + 1;
        return currId;
    }, 1);
};

export default async function generatePotr(adminAcc, coinType) {
    // determine if rare
    const isRare = getRarity(coinType);
    if (isRare) console.log('RARE POTR IS GENERATING');
    // loop and set potr
    let traits = null;
    let imgPath = null;
    let fileNames = [];
    while (!traits) {
        // clear images folder
        fileNames.map((fn) => fs.unlinkSync(fn, () => {}));
        // execute file and get potr metadatas
        const rawPotrData = await execPython('generatePotr.py');
        const [randomMetadata, generatedFileNames] = rawPotrData.map((x) => JSON.parse(x));
        fileNames = generatedFileNames;

        // check if there is a valid choice based on isRare
        const validPotrIdx = isRare ? randomMetadata.reduce(findRareTraits, null) : 0;
        if (validPotrIdx === null) continue;
        // extract valid potr data
        imgPath = generatedFileNames[validPotrIdx];
        // check if exists on ipfs
        const exists = await checkNFTExists(imgPath);
        if (exists) {
            console.log('POTR exists, continuing...');
            continue;
        }
        // get metadata to mint
        traits = randomMetadata[validPotrIdx];
    }
    console.log('Found Valid Potr', traits);

    // pin to ipfs
    console.log('Pinning image to ipfs');
    const cid = await storeNFT(imgPath);
    const ipfsUrl = `ipfs://${cid}`;
    let asaId = null;

    // if anything goes wrong here remove the pin
    try {
        // retrieve assets in rand kingdom acc
        const network = createConnectorAPI('ALGO', REACH_NETWORK);
        // get next potr number
        let idNum = null;
        const assets = await network.searchAssetsByName('Protector ');

        // make sure number is valid
        while (idNum === 0 || idNum > 4000) idNum = getNextIdNum(assets);

        const description = `Protector of the Rand #${idNum}`;
        const websiteUrl = 'protectorsoftherand.com';
        const idString = String(getNextIdNum(assets)).padStart(4, '0');

        // create metadata for mint
        const arc69MetadataJson = makeArc69Metadata(traits, description, websiteUrl);
        const arc69Metadata = new TextEncoder().encode(JSON.stringify(arc69MetadataJson));
        // mint potr
        asaId = await mintAsa({
            acc: adminAcc,
            supply: 1,
            sym: `POTR${idString}`,
            name: `Protector ${idString}`,
            url: ipfsUrl,
            arc69Metadata,
        });
        // clear images folder
        fileNames.map((fn) => fs.unlinkSync(fn), () => {});
        // return asa id and cid
        return { asaId, cid };
    } catch (e) {
        console.log('something went wrong');
        // clear images folder
        fileNames.map((fn) => fs.unlinkSync(fn), () => {});
        await deletePotr(adminAcc, { asaId, cid });
        throw new Error(e);
    }
}
