import { createReachAPI, loadReachWithOpts } from '@jackcom/reachduck';
import { loadStdlib } from '@reach-sh/stdlib';
import cors from 'cors';
import express from 'express';
import path from 'path';
import generatePotr from './generatePotr';
import deletePotr from './nfts/deletePotr';
import { KINGDOM_MNEMONIC } from './utils/.secrets';
import { COIN_IDS, CONTRACTS } from './utils/constants';

const app = express();
const port = 3300;
const REACH_NETWORK = 'TestNet';
const REACH_PROVIDER_ENV = {
    REACH_CONNECTOR_MODE: 'ALGO',
    REACH_ISOLATED_NETWORK: 'no',
};

loadReachWithOpts(loadStdlib, {
    chain: 'ALGO',
    network: REACH_NETWORK,
    providerEnv: REACH_PROVIDER_ENV,
});

app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve('build')));

app.get('/summon', async (req, res) => {
    let potr = null;
    const reach = createReachAPI();
    const RandKingdomAccount = await reach.newAccountFromMnemonic(KINGDOM_MNEMONIC);
    let error = null;
    try {
        const { coin, addr } = req.query;
        console.log(`${addr} summoning with ${coin}`);
        const RandKingdomHandle = RandKingdomAccount.contract(CONTRACTS.summoning.backend);
        await RandKingdomHandle.p.Admin({
            summonerAddr: { addr },
            coin, // this is the ASA id of the payment coin
            ctcReady: (id) => {
                console.log(`sending contract id: ${id} to ${addr}`);
                res.json({ id: reach.bigNumberToNumber(id) });
            },
            getPotr: async (paymentCoin) => {
                // get coin name from asa id
                console.log(`generating potr with ${paymentCoin}`);

                const coinType = Object.keys(COIN_IDS)[Object
                    .values(COIN_IDS)
                    .indexOf(Number(paymentCoin))];
                console.log(`generating potr with ${coinType}`);
                potr = await generatePotr(RandKingdomAccount, coinType);
                console.log(`sending potr id ${potr.asaId}`);
                return potr.asaId;
            },
            showError: async (task, err) => {
                console.log('CONTRACT ERROR:', err);
                error = new Error(err);
            },
            ...reach.hasRandom,
        });
        console.log('done');

        if (error) throw error;
    } catch (e) {
        console.error(e);
        if (potr) {
            // unpin asset and delete asset
            await deletePotr(RandKingdomAccount, potr);
        }
        return res.status(500);
    }

    return null;
});

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
