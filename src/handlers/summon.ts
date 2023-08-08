import { ACCOUNTS, COIN_TYPES, Coin } from "../constants";
import { ContractId, NetworkAddress, ReachAccount, SummonHandle } from "../types";
import { makeReach, getRarity, summonPotr } from "../utils";
import { ASA_IDS } from "../data";
import { CONTRACT_BACKENDS } from "../contracts";

export default async function summon(summonerAddr: NetworkAddress, contractId: ContractId) {
    const reach = makeReach();
    try {
        console.log(`${summonerAddr} initiated summon: ${contractId}`);

        // have admin sign into its account
        const Admin: ReachAccount = await reach.newAccountFromMnemonic(ACCOUNTS.TestNet.admin.mnemonic);

        console.log(`Kingdom admin signed in successfully`);

        // attach admin to contract
        const ctcHandle = Admin.contract<SummonHandle>(CONTRACT_BACKENDS.summon, contractId);

        console.log(`Kingdom connected to contract`);

        // have admin connect and wait for contract completion
        await ctcHandle.p.Admin({
            get_potr: async (paymentCoin) => {
                // get payment coin type
                const paymentCoinAsaId = Number(paymentCoin);
                const paymentCoinIdx = Object.values(ASA_IDS.TestNet.coin).indexOf(paymentCoinAsaId);
                const paymentCoinType = COIN_TYPES[paymentCoinIdx] as Coin;
                console.log(`Summoning potr using ${paymentCoinType} coin`);

                // determine rarity of potr based on coin type
                console.log(`Determining rarity of potr`);
                const isRarePotr = getRarity(paymentCoinType);
                console.log(`Is rare potr: ${isRarePotr}`);

                // get available potrs from admin account
                console.log(`Searching for potr to summon`);
                const potrId = await summonPotr(isRarePotr);
                console.log(`Potr found!`, potrId);
                console.log(`Sending summoned potr ${potrId} to contract`);

                return potrId;
            },
            ...reach.hasConsoleLogger,
        });

        console.log("done summoning");
    } catch (e) {
        console.error(`Summon ${contractId} Failed: ${e.message}`);
    }
}
