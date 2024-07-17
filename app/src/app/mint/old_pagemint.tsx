'use client'
import { useState } from 'react';
import dotenv from 'dotenv';
import {
  fetchMerkleTree,
  findLeafAssetIdPda,
  mintV1,
  mplBubblegum,
  parseLeafFromMintV1Transaction
} from "@metaplex-foundation/mpl-bubblegum";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { PublicKey } from '@solana/web3.js';
import path from 'path';
import { generateSigner } from '@metaplex-foundation/umi';

export default function MintPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);

  const handleMint = async () => {
    setLoading(true);
    setError(null);
    setAssetId(null);

    try {

      console.log('Preload...');
      
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      // Charger les variables d'environnement à partir du fichier .env
      dotenv.config({ path: '../../../../.env' });
      //const solanaRpcHttpsMainnet = process.env.SOLANA_RPC_HTTPS_MAINNET as string;
      const solanaRpcHttpsMainnet = process.env.SOLANA_DEVNET as string;
      if (!solanaRpcHttpsMainnet) {
        throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
      }
      const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());

      // Chemin par défaut de la clé secrète Solana
      const keyFilePath = path.join(os.homedir(), '.config', 'solana', 'id.json');
      const secretKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      const secretKeyArray = new Uint8Array(secretKey);

      // Créer le keypair avec la clé secrète
      const solanaKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyArray);

      console.log('Public Key:', solanaKeypair.publicKey.toString());
      console.log('Secret Key:', solanaKeypair.secretKey);

      // Define leaf parameters.
      const leafOwner = solanaKeypair.publicKey;
      // const merkleTree =  new PublicKey("AENzNGdj8EbFCSE3Cfooqqn9TJUyVKzKrMXwsD9hbfj7");
      //const merkleTree =  new PublicKey("6yVd8QWmbvYw5ugA4SrnSPbikFo8BirqGwE3L3i42eHE");

      const merkleTree = loadWalletKey("6yVd8QWmbvYw5ugA4SrnSPbikFo8BirqGwE3L3i42eHE.json").publicKey;

      //const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey);

      //const merkleTree = generateSigner(umi);

      //const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey);

      await mintV1(umi, {
        leafOwner,
        merkleTree,
        metadata: {
          name: 'PixSol X100 Y200', // TBD
          uri: 'https://example.com/my-cnft.json',
          sellerFeeBasisPoints: 500, // 5%
          collection: null,
          creators: [
            { address: umi.identity.publicKey, verified: false, share: 100 },
          ],
        },
      }).sendAndConfirm(umi)

    } catch (err) {
      setError('An error occurred during the minting process.');
      console.error(err);
    } finally {
      setLoading(false);
    }
      
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Mint Page</h1>
      <button
        onClick={handleMint}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Minting...' : 'Mint'}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {assetId && <p className="text-green-500 mt-4">Asset ID: {assetId}</p>}
    </>
  );
}
function createAndMint() {
  throw new Error('Function not implemented.');
}

function loadWalletKey(arg0: string) {
  throw new Error('Function not implemented.');
}

