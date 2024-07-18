'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  fetchMerkleTree,
  mintV1, 
  mplBubblegum,
  fetchTreeConfigFromSeeds
} from "@metaplex-foundation/mpl-bubblegum";
import { 
  signerIdentity, 
  transactionBuilder, 
  publicKey, 
  Signer, 
  generateSigner 
} from '@metaplex-foundation/umi';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';

export default function MintPageClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const wallet = useWallet();
  const [umi, setUmi] = useState<any>(null);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string);
      const newUmi = createUmi(connection).use(mplBubblegum());

      const signer = createSignerFromWalletAdapter(wallet);
      newUmi.use(signerIdentity(signer));
      
      setUmi(newUmi);
    }
  }, [wallet.connected, wallet.publicKey]);

  const handleMint = async () => {
    if (!wallet.connected || !wallet.publicKey || !umi) {
      setError('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssetId(null);

    try {
      const merkleTreePublicKey = new PublicKey("7VYvSpAZY9TGeVA1FuBU7LpuUmLRJrKaq7kWwYPNsZtD");

      const treeConfig = await fetchTreeConfigFromSeeds(umi, {
        merkleTree: publicKey(merkleTreePublicKey),
      });

      console.log('Tree Config:', treeConfig);

      

      const tx = transactionBuilder()
        .add(mintV1(umi, {
          leafOwner: publicKey(wallet.publicKey.toString()),
          merkleTree: publicKey(merkleTreePublicKey),
          metadata: {
            name: 'PixSol X100 Y200',
            uri: 'https://example.com/my-cnft.json',
            sellerFeeBasisPoints: 500,
            collection: null,
            creators: [
              { address: umi.identity.publicKey, verified: false, share: 100 },
            ],
          },
        }));

      const result = await tx.sendAndConfirm(umi, {
        confirm: { commitment: 'processed' },
      });

      console.log('CNFT minted:', JSON.stringify({
        signature: result.signature,
        result: result
      }));

      setAssetId(result.signature.toString());
    } catch (err) {
      setError('An error occurred during the minting process: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleMint}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        disabled={loading || !wallet.connected}
      >
        {loading ? 'Minting...' : 'Mint cNFT'}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {assetId && <p className="text-green-500 mt-4">Asset ID: {assetId}</p>}
    </div>
  );
}