'use client'
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function MintPage() {
  const { publicKey, connected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);

  const handleMint = async () => {
    if (!publicKey) return;

    setIsMinting(true);
    setMintResult(null);

    try {
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPublicKey: publicKey.toString() }),
      });

      if (!response.ok) {
        throw new Error('Minting failed');
      }

      const data = await response.json();
      setMintResult(`NFT minted successfully! Signature: ${data.signature}`);
    } catch (error) {
      console.error('Minting error:', error);
      setMintResult('Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div>
      <h1>Mint Your NFT</h1>
      {!connected ? (
        <p>Please connect your wallet to mint.</p>
      ) : (
        <div>
          <p>Connected: {publicKey?.toBase58()}</p>
          <button 
            onClick={handleMint} 
            disabled={isMinting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isMinting ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      )}
      {mintResult && <p>{mintResult}</p>}
    </div>
  );
}