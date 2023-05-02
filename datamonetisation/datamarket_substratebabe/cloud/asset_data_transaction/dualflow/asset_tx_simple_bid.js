#!/usr/bin/env node
//https://medium.com/coinmonks/starting-with-polkadot-development-part-iii-234fc5e13687
// Import
// https://brightinventions.pl/blog/develop-your-own-cryptocurrency-with-substrate-2/

// To RUN : node initialise_datapallet.js
import { ApiPromise, WsProvider } from '@polkadot/api';

import { Keyring } from '@polkadot/keyring';

import { BN } from 'bn.js';

// Initialise the provider to connect to the local node
//  const provider = new WsProvider('ws://substrate-ws.unice.cust.tasfrance.com');



async function main() {
  // Instantiate the API
  const provider = new WsProvider('ws://substrate-ws.unice.cust.tasfrance.com');

  //const provider = new WsProvider('ws://127.0.0.1:9944');

  const sleeptime = 20000;

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // Constuct the keyring after the API (crypto has an async init)
  const keyring = new Keyring({ type: 'sr25519' });

  // Add Alice to our keyring with a hard-deived path (empty phrase, so uses dev)
  const alice = keyring.addFromUri('//Alice');

  // Add Bob
  const bob = keyring.addFromUri('//Bob');

  // Add Charlie
  const charlie = keyring.addFromUri('//Charlie');

  const vehicle = keyring.createFromUri("trip frown invite narrow nominee plunge first earn pledge kitchen legend layer", { name: 'vehicle' }, 'sr25519');

  const metadata = await api.rpc.state.getMetadata()

  // Step 1: Add an Escrow Account
  const escrow_tx = await api.tx.templateModule.addEscrow()

  const { nonce: alice_nonce, data: balance } = await api.query.system.account(alice.address);

  const hash = await escrow_tx.signAndSend(alice, { nonce: alice_nonce });

  await sleep(sleeptime);
  // Step 2: Add an Asset Admin
  const addassetadmin_tx = await api.tx.templateModule.addAssetAdmin(bob.address)

  const addasset_hash = await addassetadmin_tx.signAndSend(alice, { nonce: alice_nonce + 1 });

  // Step 3: Add an Asset Service Admin
  const addassetserviceadmin_tx = await api.tx.templateModule.addAssetServiceAdmin(charlie.address)

  const addassetservice_hash = await addassetserviceadmin_tx.signAndSend(alice, { nonce: alice_nonce + 2 });

  // Step 4: Add a Vehicle by Asset Admin (bob)
  const addvehicle_tx = await api.tx.templateModule.addVehicle(vehicle.address)

  const { nonce: bob_nonce, data: bob_balance } = await api.query.system.account(bob.address);

  const addvehicle_hash = await addvehicle_tx.signAndSend(bob, { nonce: bob_nonce });

  if (true) {

    // Step 5: Broadcast Asset Demand by Asset Service Admin (charlie)
    const createassetdemand_tx = await api.tx.templateModule.createAssetDemand(200, 500) // Criteria, Price

    const { nonce: charlie_nonce, data: charlie_balance } = await api.query.system.account(charlie.address);

    const createassetdemand_hash = await createassetdemand_tx.signAndSend(charlie, { nonce: charlie_nonce });

    //Step6: Create Asset by Asset Admin (bob)
    const createasset_tx = await api.tx.templateModule.createAsset(600, 200, 550) // Price, Criteria, Price Threshold

    const new_bob_nonce = bob_nonce + 1;

    const createasset_hash = await createasset_tx.signAndSend(bob, { nonce: new_bob_nonce });

    //Step 7: Get Asset Count

    await sleep(sleeptime);

    const asset_count = await api.query.templateModule.allAssetsCount()

    console.log('AssetCount' + asset_count);

    // Start of Asset Finalisation
    for (let i = 0; i < asset_count; i++) {
      // Step 8: Get Asset Id
      const asset_id = await api.query.templateModule.allAssetsArray(i)

      console.log('AssetId' + asset_id);

      //Step 9: Bid Asset by Asset Service Admin (Charlie)  

      const bidasset_tx = await api.tx.templateModule.bidAsset(asset_id, 600, '0') // Asset Id, buy price, encrypted price

      //const new_charlie_nonce = charlie_nonce + i + 1;

      const bidasset_hash = await bidasset_tx.signAndSend(charlie, { nonce: -1 });

      console.log('bidasset_hash' + bidasset_hash);

      //Step 10:  AcceptBid Asset by Asset  Admin (Bob)  

      const accept_bidasset_tx = await api.tx.templateModule.acceptBid(asset_id, 550) // Asset Id, Bid threshold 
      // Bid Price should be greater than or equal to Bid threshold 

      const accept_bidasset_hash = await accept_bidasset_tx.signAndSend(bob, { nonce: -1 });

      console.log('accept_bidasset_hash' + accept_bidasset_hash);

      //Step 10: Submit Asset Proof by Vehicle

      const submitassetproof_tx = await api.tx.templateModule.submitAssetProof(asset_id, '0xbc0560970bbc96e4b0b7a709582fc752d1d9ffac2f6b8578c9e0ee5b4d9ecc65') // Asset Id, Proof

      //const { nonce: vehicle_nonce, data: vehicle_balance } = await api.query.system.account(vehicle.address);

      const submitassetproof_hash = await submitassetproof_tx.signAndSend(vehicle, { nonce: -1 });

      //Step 11: Submit Asset Proof Final by Asset Admin

      const submitassetprooffinal_tx = await api.tx.templateModule.submitAssetProofFinal(asset_id, '0x64ff825edd1f9accd746861f664c1fd2d508a705abe9559e76e9af512675c766') // Asset Id, Proof

      //const { nonce: bobi_nonce, data: bobi_balance } = await api.query.system.account(bob.address);

      const submitassetprooffinal_hash = await submitassetprooffinal_tx.signAndSend(bob, { nonce: -1 });

      await sleep(sleeptime);

      //Step 12: Finalise Transfer Asset by Asset Admin

      const transferasset_tx = await api.tx.templateModule.transferAsset(charlie.address, asset_id) // Asset Id, buyeraddreess

      //const { nonce: bobi_nonce, data: bobi_balance } = await api.query.system.account();

      const transferasset_tx_hash = await transferasset_tx.signAndSend(bob, { nonce: -1 });

      console.log('Transfered ASSET' + transferasset_tx_hash);

      await sleep(sleeptime);

      //Step 13: Finalise Asset Transfer to remove counter for offchain worker

      const deleteOutstandingAssetIndex_tx = await api.tx.templateModule.deleteOutstandingAssetIndex() // Asset Id, buyeraddreess

      const deleteOutstandingAssetIndex_tx_hash = await deleteOutstandingAssetIndex_tx.signAndSend(bob, { nonce: -1 });

      console.log('Deleted Outstanding Asset Index' + deleteOutstandingAssetIndex_tx_hash);

    }
    console.log('FINISHED ASSET')
    //await sleep(20000);
    ////////////////////////////////////////////////////////// Asset Service////////////////////////////////
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch(console.error).finally(() => process.exit(-1));

//main()