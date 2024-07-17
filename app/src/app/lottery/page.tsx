'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import styles from '../styles/page.module.css'
import { pixelDataToPNG } from '../utils/imageUtils'
import { useState, useEffect } from 'react';
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
  publicKey as createPublicKey, 
  Signer, 
  generateSigner 
} from '@metaplex-foundation/umi';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';

const BOARD_SIZE = 20; // 20x20 grid

export default function Home() {
  const [pixelData, setPixelData] = useState<{ [key: string]: { color: string, owner: string } }>({})
  const [isLoading, setIsLoading] = useState(true)
  const { connection } = useConnection()
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

  useEffect(() => {
    const loadPixelData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/pixels');
        const pixels = await response.json();
        const newPixelData = pixels.reduce((acc, pixel) => {
          acc[pixel.address] = { color: pixel.color, owner: pixel.owner };
          return acc;
        }, {} as { [key: string]: { color: string, owner: string } });
        setPixelData(newPixelData);
      } catch (error) {
        console.error('Error loading pixel data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPixelData();
  }, []);

  const handleSavePixelBoard = async () => {
    try {
      const blob = await pixelDataToPNG(pixelData, BOARD_SIZE);
      const formData = new FormData();
      formData.append('image', blob, 'pixel_board.png');

      const response = await fetch('/api/save-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Pixel board image saved successfully');
        alert('Pixel board saved successfully!');
        handleMint();
      } else {
        console.error('Failed to save pixel board image');
        alert('Failed to save pixel board. Please try again.');
      }
    } catch (error) {
      console.error('Error saving pixel board image:', error);
      alert('An error occurred while saving the pixel board.');
    }
  };

  const handleMint = async () => {
    if (!wallet.connected || !wallet.publicKey || !umi) {
      setError('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssetId(null);

    try {
      const merkleTreePublicKey = new PublicKey("4ywBZEPV4qZjTCjcC9HSuhHQuVJb3rhsuLmTjopmuruG");

      const treeConfig = await fetchTreeConfigFromSeeds(umi, {
        merkleTree: createPublicKey(merkleTreePublicKey.toBase58()),
      });

      console.log('Tree Config:', treeConfig);

      const tx = transactionBuilder()
        .add(mintV1(umi, {
          leafOwner: createPublicKey(wallet.publicKey.toBase58()),
          merkleTree: createPublicKey(merkleTreePublicKey.toBase58()),
          metadata: {
            name: 'NFT FOR DAO',
            uri: 'https://i.ibb.co/sbvh3Wx/pixol.png',
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
    <div className={styles.container}>
      <h1 className={styles.title}>Pixel Board</h1>
      <button 
        onClick={handleSavePixelBoard}
        className={styles.saveButton}
        disabled={isLoading || loading || !wallet.connected}
      >
        {isLoading ? 'Loading...' : loading ? 'Minting...' : 'Save Pixel Board and Mint'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {assetId && <p className={styles.success}>Asset ID: {assetId}</p>}
    </div>
  )
}