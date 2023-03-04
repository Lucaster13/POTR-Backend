import axios from "axios";
import { ALGO_INDEXER_SERVER, ASA_IDS, ASSET_TRANSACTION_URL, RAND_KINGDOM_ADDR } from "potr-utils/src/constants";
import { AsaId, PotrTraits } from "potr-utils/src/types";
import { isRarePotr } from "./common";

const RESPONSE_LIMIT = 100000;

export default async function summonPotr(isRare: boolean): Promise<AsaId> {
    const availablePotrIds = await getAvailablePotrIds();
    const potrTraits = await getAssetTraits(availablePotrIds);
    const summonablePotrIds = potrTraits
        .filter(({ traits }) => (isRare ? isRarePotr(traits) : !isRarePotr(traits)))
        .map(({ id }) => id);
    const summonedPotrId = summonablePotrIds[Math.floor(Math.random() * summonablePotrIds.length)];
    return summonedPotrId;
}

async function getAvailablePotrIds(): Promise<AsaId[]> {
    const assetMetadataUrl = `${ALGO_INDEXER_SERVER}/v2/accounts/${RAND_KINGDOM_ADDR}/assets?limit=${RESPONSE_LIMIT}`;

    let assetMetadata = [];
    let nextToken = null;

    // paginate retrieving asset metadata
    do {
        // make request url based on nextToken
        const nextTokenQuery = nextToken ? `&next=${nextToken}` : "";
        const requestUrl = `${assetMetadataUrl}${nextTokenQuery}`;
        const { data } = await axios.get(requestUrl);

        // retrieve next token if available
        nextToken = getNextTokenFromRes(data);

        // concatenate assets results
        assetMetadata = [...assetMetadata, ...data.assets];
    } while (nextToken);

    // filter only potrs with balance > 0 and extract asa Id
    const potrIds = assetMetadata
        .filter((asset) => ASA_IDS.potr.includes(getAsaIdFromMd(asset)))
        .filter(({ amount }) => amount > 0)
        .map((md) => getAsaIdFromMd(md));

    return potrIds;
}

async function getAssetTraits(ids): Promise<{ id: AsaId; traits: PotrTraits }[]> {
    const assetConfigTxnsUrl = `${ASSET_TRANSACTION_URL}?address=${RAND_KINGDOM_ADDR}&address-role=sender&limit=${RESPONSE_LIMIT}`;

    let assetConfigTxns = [];
    let nextToken = null;

    // paginate retrieving asset config transactions
    do {
        // make request url based on nextToken
        const nextTokenQuery = nextToken ? `&next=${nextToken}` : "";
        const requestUrl = `${assetConfigTxnsUrl}${nextTokenQuery}`;
        const { data } = await axios.get(requestUrl);

        // retrieve next token if available
        nextToken = getNextTokenFromRes(data);

        // concatenate assets results
        assetConfigTxns = [...assetConfigTxns, ...data.transactions];
    } while (nextToken);

    const txnsByAsaId = assetConfigTxns
        // filter only transactions for potrs owned by this wallet
        .filter((txn) => ids.includes(getAsaIdFromTxn(txn)))
        // convert to object, where (key -> value) is (asaId -> [transactions])
        .reduce((txnsById, txn) => {
            const asaId = getAsaIdFromTxn(txn);

            // if asaId not in object yet, add it
            if (!txnsById[asaId]) txnsById[asaId] = [];

            txnsById[asaId].push(txn);

            // sort array of transactions in descending order by block time
            sortTxnsByDescendingTime(txnsById[asaId]);

            // set array to only the most recent transaction
            txnsById[asaId] = [txnsById[asaId][0]];

            return txnsById;
        }, {});

    // extract notes for each transaction and convert to json
    const traits = Object.entries(txnsByAsaId).map(([asaId, txn]) => {
        const { note } = txn[0];

        // convert note to json
        const arc69Metadata = getJsonFromNote(note);

        return { id: Number(asaId), traits: arc69Metadata.properties as PotrTraits };
    });

    return traits;
}

function getAsaIdFromTxn(txn): AsaId {
    return txn["created-asset-index"];
}
function getAsaIdFromMd(md): AsaId {
    return md["asset-id"];
}
function getNextTokenFromRes(res) {
    return res["next-token"];
}
function getTimeFromTxn(txn) {
    return txn["round-time"];
}
function sortTxnsByDescendingTime(txns) {
    txns.sort((a, b) => getTimeFromTxn(b) - getTimeFromTxn(a));
}
function getJsonFromNote(noteBase64) {
    const noteString = atob(noteBase64)
        .trim()
        .replace(/[^ -~]+/g, "");
    const noteObject = JSON.parse(noteString);
    return noteObject;
}
