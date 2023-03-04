import { loadStdlib } from "@reach-sh/stdlib";
import { REACH_STDLIB_ENV, COIN_RARITY_WEIGHTS, RARE_TRAITS } from "potr-utils/src/constants";
import { CoinType, PotrTraits } from "potr-utils/src/types";
/*

    Rarity utils

 */

// determines if the coin given will summon a rare potr
function getRarity(coinType: CoinType) {
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

// takes potr traits and determines if it is rare
function isRarePotr(traits: PotrTraits) {
    const isRare = Object.keys(RARE_TRAITS)
        .map((type) => RARE_TRAITS[type].includes(traits[type]))
        .filter((rare) => rare) // filter not rares
        .reduce((rare, curr) => rare || curr, false); // reduce to boolean value
    return isRare;
}

/*

    Reach utils

*/
function createReachApi() {
    return loadStdlib(REACH_STDLIB_ENV);
}

export { getRarity, isRarePotr, createReachApi };
