'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import styles from '../styles/Lottery.module.css'
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
import { CldImage } from 'next-cloudinary';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useToast } from '@chakra-ui/react';
import { SubmittedToast, SuccessToast, ErrorToast } from '../components/ToastParty';

const BOARD_SIZE = 10; // 20x20 grid

export default function Home() {
  const [pixelData, setPixelData] = useState<{ [key: string]: { color: string, player_pubkey: string } }>({})
  const [pixelplayer_pubkeys, setPixelplayer_pubkeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const wallet = useWallet();
  const [umi, setUmi] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [shouldMint, setShouldMint] = useState(false);
  const [winnerWallet, setWinnerWallet] = useState<string | null>(null);
  const [triggerUpdateBDD, setTriggerUpdateBDD] = useState(false);
  const toast = useToast();

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
        const newPixelData = pixels.reduce((acc: { [key: string]: { color: string, player_pubkey: string } }, pixel: any) => {
          acc[pixel.address] = { color: pixel.color, player_pubkey: pixel.player_pubkey };
          return acc;
        }, {} as { [key: string]: { color: string, player_pubkey: string } });
        setPixelData(newPixelData);
        
        // Extract unique player_pubkeys
        const player_pubkeys = [...new Set(pixels.map((pixel: any) => pixel.player_pubkey)) as any];
        setPixelplayer_pubkeys(player_pubkeys);
      } catch (error) {
        console.error('Error loading pixel data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPixelData();
  }, []);

  useEffect(() => {
    if (shouldMint && imageUrl) {
      handleMint();
      setShouldMint(false);  // Reset this after minting
    }
  }, [shouldMint, imageUrl]);

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
        const data = await response.json();
        const imageUrl = data.url;
        console.log('Pixel board image saved successfully:', imageUrl);
        setImageUrl(imageUrl);
        setShouldMint(true);  // Set this to true to trigger minting
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
    if (!wallet.connected || !wallet.publicKey || !umi || pixelplayer_pubkeys.length === 0) {
      setError('Please connect your wallet and ensure pixel data is loaded.');
      toast({
        duration: 5000,
        isClosable: true,
        render: () => <ErrorToast errorMessage="Please connect your wallet and ensure pixel data is loaded." />
      });
      return;
    }

    setLoading(true);
    setError(null);
    setAssetId(null);

    toast({
      duration: 2000,
      render: () => <SubmittedToast />
    });
    
    try {
      const merkleTreePublicKey = new PublicKey("4ywBZEPV4qZjTCjcC9HSuhHQuVJb3rhsuLmTjopmuruG");

      const treeConfig = await fetchTreeConfigFromSeeds(umi, {
        merkleTree: createPublicKey(merkleTreePublicKey.toBase58()),
      });

      console.log('Tree Config:', treeConfig);
      
      // Randomly select a pixel player_pubkey
      const randomplayer_pubkey = pixelplayer_pubkeys[Math.floor(Math.random() * pixelplayer_pubkeys.length)];
      setWinnerWallet(randomplayer_pubkey);
      const tx = transactionBuilder()
        .add(mintV1(umi, {
          leafOwner: createPublicKey(randomplayer_pubkey),
          merkleTree: createPublicKey(merkleTreePublicKey.toBase58()),
          metadata: {
            name: 'NFT FOR DAO',
            uri: imageUrl,
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

      const signatureSerialize = base58.deserialize(result.signature);
      const assetIdString = signatureSerialize.toString();
      setAssetId(assetIdString);

      // Trigger BDD update
      setTriggerUpdateBDD(true);

      toast({
        duration: 7000,
        isClosable: true,
        render: () => <SuccessToast signature={assetIdString} />
      });

      console.log("Minting successful");
    } catch (err) {
      const errorMessage = 'An error occurred during the minting process: ' + (err as Error).message;
      setError(errorMessage);
      console.error(err);
      
      toast({
        duration: 7000,
        isClosable: true,
        render: () => <ErrorToast errorMessage={errorMessage} />
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pixel Board</h1>
      <button 
        onClick={handleSavePixelBoard}
        className={styles.lotteryButton}
        disabled={isLoading || loading || !wallet.connected}
      >
        {isLoading ? 'Loading...' : loading ? 'Minting...' : 'Save Pixel Board and Mint your DAO access'}
      </button>
      {imageUrl ? (
        <CldImage
        alt="pixsol before mint"
          src={imageUrl}
          width="500"
          height="500"
          crop="fill"
        />
      ) : (
        <p>No image to display, please save board first</p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {assetId && (
        <div>
          <p className={styles.success}>Transaction ID: {assetId}</p>
          {winnerWallet && (
            <p className={styles.winner}>
              Winner Wallet: {winnerWallet.slice(0, 4)}...{winnerWallet.slice(-4)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}