import { createReachAPI } from '@jackcom/reachduck';
import { ALGOSDK_PARAMS } from '../utils/constants.js';

export default async function deleteAsa(acc, asaId) {
    try {
        // Destroy an Asset:
        // All of the created assets should now be back in the creators
        // Account so we can delete the asset.
        // If this is not the case the asset deletion will fail

        // First update changing transaction parameters
        // We will account for changing transaction parameters
        // before every transaction in this example
        console.log(`Deleting ${asaId}...`);
        const reach = createReachAPI();

        const { algosdk } = reach;
        const algodClient = new algosdk.Algodv2(...ALGOSDK_PARAMS);

        const params = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        // params.fee = 1000;
        // params.flatFee = true;

        // The address for the from field must be the manager account
        // Which is currently the creator addr1
        const { addr, sk } = acc.networkAccount;
        const note = undefined;
        // if all assets are held by the asset creator,
        // the asset creator can sign and issue "txn" to remove the asset from the ledger.
        const dtxn = algosdk.makeAssetDestroyTxnWithSuggestedParams(
            addr,
            note,
            asaId,
            params,
        );
        // The transaction must be signed by the manager which
        // is currently set to account1
        const rawSignedTxn = dtxn.signTxn(sk);
        const dtx = (await algodClient.sendRawTransaction(rawSignedTxn).do());

        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, dtx.txId, 4);
        // Get the completed Transaction
        console.log(`Transaction ${dtx.txId} confirmed in round ${confirmedTxn['confirmed-round']}`);
    } catch (e) {
        throw new Error(e);
    }
}
