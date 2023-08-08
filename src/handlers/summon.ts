import {
	ContractIdT,
	NetworkAddressT,
	makeReach,
	ReachAccountT,
	SummonHandleT,
	CONTRACT_BACKENDS,
	Coin,
	ASA_IDS,
	COIN_TYPES,
	coinToAsaId,
} from "potr-common";
import { ACCOUNTS } from "../constants";
import { getRarity, summonPotr } from "../utils";

export default async function summon(summonerAddr: NetworkAddressT, coin: Coin, contractId: ContractIdT) {
	const reach = makeReach();
	try {
		console.log(`${summonerAddr} initiated summon: ${contractId}`);

		// have admin sign into its account
		const Admin: ReachAccountT = await reach.newAccountFromMnemonic(ACCOUNTS.TestNet.admin.mnemonic);

		console.log(`Kingdom admin signed in successfully`);

		// attach admin to contract
		const ctcHandle = Admin.contract<SummonHandleT>(CONTRACT_BACKENDS.summon, contractId);

		console.log(`Kingdom connected to contract`);

		// have admin connect and wait for contract completion
		await ctcHandle.p.Admin({
			coin: coinToAsaId(coin),
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
