import { CoinType, ContractId, NetworkAddress, SummonHandle } from "potr-utils/src/types";
import { SummonBackend } from "potr-utils/src/contracts";
import { ASA_IDS, COIN_TYPES } from "potr-utils/src/constants";
import { RAND_KINGDOM_MNEMONIC } from "../utils/.secrets";
import { createReachApi, getRarity } from "../utils/common";
import summonPotr from "../utils/summon-potr";

export default async function Summon(summonerAddr: NetworkAddress, contractId: ContractId) {
    const reach = createReachApi();
    try {
        console.log(`${summonerAddr} initiated summon: ${contractId}`);

        // have admin sign into its account
        const RandKingdomAccount = await reach.newAccountFromMnemonic(RAND_KINGDOM_MNEMONIC);

        console.log(`Kingdom admin signed in successfully`);

        // attach admin to contract
        const SummonCtcHandle: SummonHandle = RandKingdomAccount.contract(SummonBackend, contractId);

        // have admin connect and wait for contract completion
        await SummonCtcHandle.p.Admin({
            get_potr: async (paymentCoin) => {
                // get payment coin type
                const paymentCoinAsaId = Number(paymentCoin);
                const paymentCoinIdx = Object.values(ASA_IDS.coin).indexOf(paymentCoinAsaId);
                const paymentCoinType = COIN_TYPES[paymentCoinIdx] as CoinType;
                console.log(`Summoning potr using ${paymentCoinType} coin`);

                // determine rarity of potr based on coin type
                console.log(`Determining rarity of potr`);
                const isRarePotr = getRarity(paymentCoinType);
                console.log(`Is rare potr: ${isRarePotr}`);

                // get available potrs from admin account
                console.log(`Searching for potr to summon`);
                const potrId = summonPotr(isRarePotr);
                console.log(`Potr found!`, potrId);
                console.log(`Sending summoned potr ${potrId} to contract`);

                return potrId;
            },
            ...reach.hasConsoleLogger,
        });
        console.log("done summoning");
    } catch (e) {
        throw new Error(`Summon ${contractId} Failed: ${e.message}`);
    }
}
