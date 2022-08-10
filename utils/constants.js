// reach consts
import * as SummoningCtcBackend from '../../contracts/build/Summoning.contract.mjs';

export const REACH_NETWORK = 'TestNet';
export const REACH_PROVIDER_ENV = {
    REACH_CONNECTOR_MODE: 'ALGO',
    REACH_ISOLATED_NETWORK: 'no',
};

export const COIN_RARITY_WEIGHTS = {
    bronze: 0.1,
    silver: 0.3,
    gold: 1.0,
};

export const CONTRACTS = {
    summoning: {
        backend: SummoningCtcBackend,
    },
};

export const COIN_IDS = {
    bronze: 99523559,
    silver: 99523577,
    gold: 99523594,
};

const token = '';
const server = `https://${REACH_NETWORK.toLowerCase()}-api.algonode.cloud`;
const port = 443;
export const ALGOSDK_PARAMS = [token, server, port];
