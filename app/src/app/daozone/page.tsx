'use client'

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { publicKey } from '@metaplex-foundation/umi';

const SPECIFIC_TREE_KEY = '4ywBZEPV4qZjTCjcC9HSuhHQuVJb3rhsuLmTjopmuruG';

export default function DaoPage() {
  const wallet = useWallet();
  const [message, setMessage] = useState<string>('');
  const [nfts, setNfts] = useState<any[]>([]);
  const [specificTreeNfts, setSpecificTreeNfts] = useState<any[]>([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!wallet.connected || !wallet.publicKey) {
        setMessage('Wallet not connected');
        return;
      }

      try {
        const umi = createUmi(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com')
          .use(dasApi());

        const ownerPublicKey = new PublicKey(wallet.publicKey.toBase58());
        const assets = await fetchAssetsByOwner(umi, ownerPublicKey);

        if (assets.length > 0) {
          setNfts(assets);
          setMessage(`Found ${assets.length} NFTs in the wallet.`);
          
          // Check each asset if it belongs to the specific Merkle tree
          const treeNfts = [];
          for (const asset of assets) {
            const isFromTree = await checkAssetInTree(umi, asset.id);
            if (isFromTree) {
              treeNfts.push(asset);
            }
          }
          setSpecificTreeNfts(treeNfts);

          console.log("All NFTs:", assets);
          console.log("Specific Tree cNFTs:", treeNfts);
        } else {
          setMessage('No NFTs found.');
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setMessage('Error fetching NFTs');
      }
    };

    fetchNFTs();
  }, [wallet.connected, wallet.publicKey]);

  const checkAssetInTree = async (umi: any, assetId: string) => {
    try {
      const proof = await umi.rpc.getAssetProof(publicKey(assetId));
      return proof.tree_id === SPECIFIC_TREE_KEY;
    } catch (e) {
      console.error('Error checking asset proof:', e);
      return false;
    }
  };

  const fetchAssetsByOwner = async (umi: any, ownerPublicKey: PublicKey) => {
    const { items } = await umi.rpc.getAssetsByOwner({
      owner: publicKey(ownerPublicKey.toBase58()),
    });
    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white p-8">
      <h1 className="text-4xl font-bold mb-6 text-center">PIXSOL DAO</h1>
      <h2 className="text-2xl font-semibold mb-6 text-center">cNFTs from DAO Merkle Tree: {specificTreeNfts.length}</h2>
      
      <div className="max-w-3xl mx-auto bg-white bg-opacity-20 rounded-lg p-8 backdrop-blur-lg">
        {wallet.connected && specificTreeNfts.length > 0 ? (
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Welcome, DAO Member!</h3>
            <img 
              src="https://res.cloudinary.com/daxwfi2jl/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1721394213/DALL_E_2024-07-19_14.59.34_-_A_fantastical_crypto_paradise_in_the_sky_featuring_floating_islands_with_lush_greenery_modern_buildings_with_a_futuristic_design_Solana_logos_integ_ynx4iy.jpg" 
              alt="Welcome to DAO"
              className="rounded-lg shadow-lg mx-auto mb-4 max-w-full h-auto"
            />
            <p className="text-xl">You have access to exclusive DAO features.</p>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">
              {wallet.connected ? "Not a DAO Member 😭" : "Wallet Not Connected"}
            </h3>
            <img 
              src="https://res.cloudinary.com/daxwfi2jl/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1721394468/DALL_E_2024-07-19_15.07.36_-_A_dystopian_crypto_paradise_in_the_sky_featuring_floating_islands_with_decaying_greenery_rundown_buildings_with_a_futuristic_design_PIXSOL_logos_in_rz68xk.webp" 
              alt="Not a DAO Member"
              className="rounded-lg shadow-lg mx-auto mb-4 max-w-full h-auto"
            />
            <p className="text-xl">
              {wallet.connected 
                ? "YOU ARE NOT FROM THE PIXSOL FAMILY YOU LIVE IN A SAD WORLD :'(" 
                : "CONNECT YOUR WALLET TO JOIN THE PIXSOL FAMILY"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}