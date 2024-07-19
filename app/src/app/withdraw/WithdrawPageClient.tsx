'use client';

import { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const [xValue, setXValue] = useState<number>(1);
  const [yValue, setYValue] = useState<number>(1);
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
      const pixsol_governance_program = "BXJseNLM3Gor8eHsoqVHjMiCXTk3mdvS9YrnMHUetpnV";
      const PROGRAM_ID = new PublicKey(pixsol_governance_program);
      
      const response = await fetch('/idl.json');
      const idl = await response.json();

      if (anchorWallet) {
        const provider = new AnchorProvider(connection, anchorWallet, {
          commitment: "confirmed",
        });
        const program = new Program(idl, PROGRAM_ID, provider);

        
        // ******
        // Define Account addresses
        // ******
        const dictionary_address = "n3o2JGdht5z9fzwuVutpEUnZaexybmhNEXtAiKGnZef";
        const vault_address = "7upZ6We1oXSKKkzLM9Xt8ZhkZVL9tYp3pfksSLjbnk8H";
          
        // ******
        // READ Account.
        // ******
        const dictionary_account = await program.account.dictionary.all();
        console.log("dictionary_account:", dictionary_account);
        setLog(JSON.stringify(dictionary_account, null, 2));

        //const vault_account = await program.account.vault.all();
        //console.log("dictionary_account:", vault_account);
        //setLog(JSON.stringify(vault_account, null, 2));

        // ******
        // CALL function.
        // ******

        // Call withdraw_and_reset
        const txSignature = await program.methods
        .withdrawAndReset(4)
        .accounts({
          dictionary: dictionary_address,
          vault: vault_address,
        }).rpc();

        /* 

        // To fetch event data (if the instruction emits an event)
         const txSignature = await program.methods
          .read(30)
          .accounts({
            dictionary: dictionary_address,
          }).rpc();

        console.log("txSignature:", txSignature);

        // Fetch the transaction to get event data
        const tx = await connection.getParsedTransaction(txSignature, 'confirmed');
        const logs = tx?.meta?.logMessages;

        // Parse the logs to find the event
        logs?.forEach(log => {
          if (log.includes('Program log: EntryRead')) {
            const eventLog = log.split('Program log: EntryRead')[1].trim();
            const [id, value] = eventLog.split(',');
            console.log(`Entry with ID ${id} has value ${value}`);
          }
        });
*/

        // ******
        // CATCH Event.
        // ******

        // TODO.

      }

    } catch (err) {
      setError('An error occurred during the withdraw process: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!wallet.connected || !wallet.publicKey || !vaultAddress) {
      setError('Please connect your wallet and enter a valid vault address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(vaultAddress),
          lamports: 0.01 * 1e9 // 0.01 SOL in lamports
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Transaction successful with signature:', signature);
      setLog(`Transaction successful with signature: ${signature}`);
    } catch (err) {
      setError('An error occurred during the send process: ' + (err as Error).message);
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
      
      <div className="mt-4">
        <input
          type="text"
          placeholder="Vault Address"
          value={vaultAddress}
          onChange={(e) => setVaultAddress(e.target.value)}
          className="px-4 py-2 border rounded mr-2"
        />
        <input
          type="number"
          placeholder="X"
          value={xValue}
          onChange={(e) => setXValue(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="px-4 py-2 border rounded mr-2"
          min="1"
          max="100"
        />
        <input
          type="number"
          placeholder="Y"
          value={yValue}
          onChange={(e) => setYValue(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="px-4 py-2 border rounded mr-2"
          min="1"
          max="100"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
          disabled={loading || !wallet.connected}
        >
          {loading ? 'Sending...' : 'Change Pixel Color (0.01 SOL)'}
        </button>
      </div>
    </div>
  );
}
