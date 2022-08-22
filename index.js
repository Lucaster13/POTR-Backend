import { createReachAPI, loadReachWithOpts } from '@jackcom/reachduck';
import { loadStdlib } from '@reach-sh/stdlib';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { RAND_KINGDOM_MNEMONIC } from './utils/.secrets';
import {
    COIN_IDS, CONTRACTS, PORT, REACH_NETWORK, REACH_PROVIDER_ENV,
} from './utils/constants';

const app = express();

loadReachWithOpts(loadStdlib, {
    chain: 'ALGO',
    network: REACH_NETWORK,
    providerEnv: REACH_PROVIDER_ENV,
});

app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve('build')));

app.get('/summon', async (req, res) => {
    const reach = createReachAPI();
    const RandKingdomAccount = await reach.newAccountFromMnemonic(RAND_KINGDOM_MNEMONIC);
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
                const coinType = Object.keys(COIN_IDS)[Object.values(COIN_IDS).indexOf(Number(paymentCoin))];
                console.log(`generating potr with ${coinType}`);
                const potr = 0; // FILL IN
                console.log(`sending potr id ${potr}`);
                return potr;
            },
            showError: async (task, err) => {
                console.log('CONTRACT ERROR:', err);
                throw new Error(err);
            },
            ...reach.hasRandom,
        });
        console.log('done summoning');
    } catch (e) {
        console.error(e);
        return res.status(500);
    }
});

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
});
