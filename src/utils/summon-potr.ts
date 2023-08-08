import {
	AsaIdT,
	REACH_NETWORK,
	Rarity,
	getAllPotrMetadataByAsaId,
	getOwnedPotrAsaIds,
	getPortRarity,
} from "potr-common";
import { ACCOUNTS } from "../constants";

export default async function summonPotr(isRare: boolean): Promise<AsaIdT> {
	const availablePotrIds = await getOwnedPotrAsaIds(ACCOUNTS[REACH_NETWORK].admin.addr);
	const potrMetadataByAsaId = await getAllPotrMetadataByAsaId();
	const summonablePotrIds = Array.from(potrMetadataByAsaId.values())
		.filter(({ id }) => availablePotrIds.includes(id))
		.filter(({ traits }) =>
			isRare ? getPortRarity(traits.Power) !== Rarity.COMMON : getPortRarity(traits.Power) === Rarity.COMMON,
		)
		.map(({ id }) => id);
	const summonedPotrId = summonablePotrIds[Math.floor(Math.random() * summonablePotrIds.length)];
	return summonedPotrId;
}
