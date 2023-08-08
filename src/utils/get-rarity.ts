import { COIN_RARITY_WEIGHTS, Coin } from "potr-common";

// determines if the coin given will summon a rare potr
export default function getRarity(coinType: Coin) {
	// higher the number the more precise
	const max = 10000;
	// generate an integer [0 - max]
	const randomVal = Math.round(Math.random() * max);
	// determine the range that the random number would need to fall in to result in rare [0 - (max * weight)]
	const rarityRange = Math.round(COIN_RARITY_WEIGHTS[coinType] * max);
	// determine if this is a rare
	const isRare = randomVal <= rarityRange;
	return isRare;
}
