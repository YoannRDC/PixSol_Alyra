'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import TransferComponent from './TransferComponent';

export default function TransferPage() {
  const wallet = useWallet();
  const [message, setMessage] = useState<string>('');
  const [nfts, setNfts] = useState<any[]>([]);

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

  const fetchAssetsByOwner = async (umi, ownerPublicKey: PublicKey) => {
    const { items } = await umi.rpc.getAssetsByOwner({
      owner: ownerPublicKey,
    });

    return items;
  };

  return (
    <div>
      <h1>Transfer Page</h1>
      <p>{message}</p>
      {wallet.connected && nfts.length > 0 && (
        <TransferComponent nfts={nfts} wallet={wallet} />
      )}
    </div>
  );
}
