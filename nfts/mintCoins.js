import { createReachAPI, loadReachWithOpts } from '@jackcom/reachduck';
import { loadStdlib } from '@reach-sh/stdlib';
import { KINGDOM_MNEMONIC } from '../utils/.secrets.js';
import { REACH_NETWORK, REACH_PROVIDER_ENV } from '../utils/constants.js';
import mintAsa from './mintAsa.js';

// load reach
loadReachWithOpts(loadStdlib, {
    chain: 'ALGO',
    network: REACH_NETWORK,
    providerEnv: REACH_PROVIDER_ENV,
});

(async () => {
    const reach = createReachAPI();
    const RandKingdomVault = await reach.newAccountFromMnemonic(KINGDOM_MNEMONIC);
    const url = 'protectorsoftherand.com';
    const coinInfo = [
        ['Bronze Coin', 'POTRBC', 1000],
        ['Silver Coin', 'POTRSC', 500],
        ['Gold Coin', 'POTRGC', 100],
    ];
    console.log('Connected to wallet\n');

    const asaIds = await Promise.all(coinInfo
        .map(([name, sym, supply]) => mintAsa({
            acc: RandKingdomVault,
            supply,
            sym,
            name,
            url,
        })));
    console.log('Success', asaIds);
})();
