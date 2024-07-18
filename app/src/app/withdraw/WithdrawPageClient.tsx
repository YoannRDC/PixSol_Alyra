'use client';

import { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
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
import { AnchorProvider, Program } from '@project-serum/anchor';
import * as anchor from "@project-serum/anchor";
import { confirmTx } from '../utils/helper';

export default function WithdrawPageClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const wallet = useWallet();
  const [umi, setUmi] = useState<any>(null);
  const anchorWallet = useAnchorWallet(); 
  const [log, setLog] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string | null>(null);
  
  const { connection } = useConnection();

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string);
      const newUmi = createUmi(connection).use(mplBubblegum());

      const signer = createSignerFromWalletAdapter(wallet);
      newUmi.use(signerIdentity(signer));
      
      setUmi(newUmi);
    }
  }, [wallet.connected, wallet.publicKey]);

  const handleWithdraw = async () => {
    if (!wallet.connected || !wallet.publicKey || !umi) {
      setError('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssetId(null);

    try {
      console.log('Calling withdraw...');

      // ******
      // PREPARE TRANSACTIONS
      // ******

      // See: declare_id!("6o6i8WPQLGoc78qvrLLU1sHTPvjg7eDztfgP26cfUrWZ");
      const pixsol_governance_program = "6o6i8WPQLGoc78qvrLLU1sHTPvjg7eDztfgP26cfUrWZ";
      const PROGRAM_ID = new PublicKey(pixsol_governance_program);
      
      const response = await fetch('/idl.json');
      const idl = await response.json();

      if (anchorWallet) {
        const provider = new AnchorProvider(connection, anchorWallet, {
          commitment: "confirmed",
        });
        const program = new Program(idl, PROGRAM_ID, provider);
          
        // ******
        // READ Account.
        // ******
        const pixel_board_account = await program.account.pixelBoard.all();
        console.log("pixel_board_account:", pixel_board_account);
        
        setLog(JSON.stringify(pixel_board_account, null, 2));

        // Call: pub fn is_minted_pixel(ctx: Context<IsMintedPixel>, x: u16, y: u16)
        const x = 100; 
        const y = 200; 

        const pixel_Boad_address = "BXtrMtGrghWzhkwwPwnS9A22VvVgna7X6xBEmgx2C8LZ";
        const pixelBoardPublicKey = publicKey(pixel_Boad_address);

        console.log("pixelBoardPublicKey:", pixelBoardPublicKey);

        // ******
        // CALL function.
        // ******

        // To fetch event data (if the instruction emits an event)
        const txSignature_no_return = await program.methods
          .isMintedPixel(x, y)
          .accounts({
            pixelBoard: pixelBoardPublicKey,
          }).rpc();

        console.log("txSignature_no_return:", txSignature_no_return);

        
        // ******
        // CALL function with answer
        // ******

        // To fetch event data (if the instruction emits an event)
        const result = await program.methods
        .isMintedPixelV2(x, y)
        .accounts({
          pixelBoard: pixelBoardPublicKey,
        }).rpc();

        console.log("result:", result);
        setEventLog(JSON.stringify(result, null, 2));

        // ******
        // CATCH Event.
        // ******


      }

    } catch (err) {
      setError('An error occurred during the withdraw process: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleWithdraw}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        disabled={loading || !wallet.connected}
      >
        {loading ? 'Withdrawing...' : 'Withdraw'}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {assetId && <p className="text-green-500 mt-4">Asset ID: {assetId}</p>}
      <pre>{log}</pre>
      <pre>{eventLog}</pre>
    </div>
  );
}
