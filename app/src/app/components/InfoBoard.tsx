'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import styles from '../styles/InfoBoard.module.css'

// Back needs
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

interface InfoBoardProps {
  selectedArea: {start: {x: number, y: number}, end: {x: number, y: number}} | null
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
  onBuy: () => void
}

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedArea, onColorChange, onImageUpload, onBuy }) => {

  // Front needs
  const { setVisible } = useWalletModal()
  const { connected } = useWallet()
  const [selectedOption, setSelectedOption] = useState<'color' | 'image'>('color')
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Back needs
  const { connection } = useConnection();
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const wallet = useWallet();
  const [umi, setUmi] = useState<any>(null);
  const anchorWallet = useAnchorWallet(); 
  const [log, setLog] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string);
      const newUmi = createUmi(connection).use(mplBubblegum());

      const signer = createSignerFromWalletAdapter(wallet);
      newUmi.use(signerIdentity(signer));
      
      setUmi(newUmi);
    }
  }, [wallet.connected, wallet.publicKey]);

  const isMultiplePixelsSelected = useMemo(() => {
    if (!selectedArea) return false
    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width > 1 || height > 1
  }, [selectedArea])

  const handleColorPixelButtonClick = async () => {
    if (connected) {
      if (selectedArea) {

        // ********
        // Calling program.update.
        // ********

        let updateSuccess =  false;
        try {
          console.log('Calling update (pixel color)...');
    
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
            //const dictionary_account = await program.account.dictionary.all();
            //console.log("dictionary_account:", dictionary_account);
            //setLog(JSON.stringify(dictionary_account, null, 2));
    
            //const vault_account = await program.account.vault.all();
            //console.log("dictionary_account:", vault_account);
            //setLog(JSON.stringify(vault_account, null, 2));
    
            // ******
            // CALL function.
            // ******

            const pixels = [];
            for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
              for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
                pixels.push(y * 20 + x + 1);
              }
            }
            console.log('Selected pixels:', pixels);
      
            const pixel_value = new anchor.BN(20000);
            const idsBuffer = Buffer.from(new Uint8Array(pixels));
            const txSignature = await program.methods
              .updateByBatch(idsBuffer, pixel_value)
              .accounts({
                dictionary: dictionary_address,
                vault: vault_address,
              }).rpc();

              
            console.log('program.methods.update called.');

            try {
              console.log('Transaction signature:', txSignature);
            
              // Vérification des transactions
              const result = await connection.getConfirmedTransaction(txSignature);

              if (result) {
                console.log(`Transaction CONFIRMED: ${txSignature} with result:`, result);
                setSuccess('Pixel color modified successfully !');

                // changePixel Color
                onBuy();
              } else {
                console.error(`Transaction FAILED: ${txSignature} or is not confirmed yet.`);
                setError('Pixel color NOT modified, transaction FAILED');
              }
            } catch (error) {
              console.error('Error in transaction:', error);
              setError('Pixel color NOT modified, error during the process.');
            }

            // Works but single calls.
           /* const promises = pixels.map(async (pixel) => {
              const pixel_id = (pixel.y) * 20 + pixel.x + 1;        
              const pixel_value = new anchor.BN(20000);         
              // Call withdraw_and_reset
              console.log('Selected pixels id:', pixel_id);
              return program.methods
                .update(pixel_id, pixel_value)
                .accounts({
                  dictionary: dictionary_address,
                  vault: vault_address,
                }).rpc();
            });

            console.log('program.methods.update called.');

            try {
              const txSignatures = await Promise.all(promises);
              console.log('Transaction signatures:', txSignatures);
            
              // Vérification des transactions
              const transactionStatuses = await Promise.all(txSignatures.map(async (signature) => {
                const result = await connection.getConfirmedTransaction(signature);
                return { signature, result };
              }));
            
              transactionStatuses.forEach(({ signature, result }) => {
                if (result) {
                  console.log(`Transaction CONFIRMED: ${signature} with result:`, result);
                  setSuccess('Pixel color modified successfully !');

                  // changePixel Color
                  onBuy();
                } else {
                  console.error(`Transaction FAILED: ${signature} or is not confirmed yet.`);
                  setError('Pixel color NOT modified, transaction FAILED');
                }
              });
            } catch (error) {
              console.error('Error in transaction:', error);
              setError('Pixel color NOT modified, error during the process.');
            }
              
            */
  
          }
    
        } catch (err) {
          setError('An error occurred during the withdraw process: ' + (err as Error).message);
          console.error(err);
        } finally {
          // TODO, assert fund are correcltly transafered.
          updateSuccess =  true;
        }
        
        if (updateSuccess) {
          // TODO: callonColorChange(color.toString('hex'))
        } else {
          // TODO: display on front.
          console.log ("cannot color, transaction failed.");
        }
              


        // onBuy()
      } else {
        alert("Please select an area on the pixel board before buying.")
      }
    } else {
      console.log(" > User is not connected.");
      setVisible(true)
    }
  }

  const handleWithdrawButtonClick = async () => {
    if (connected) {
      if (selectedArea) {

        // ********
        // Calling program.update.
        // ********

        let updateSuccess =  false;
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
            // CALL function.
            // ******

            const pixels = [];
            for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
              for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
                pixels.push({ x, y });
              }
            }
            console.log('Selected pixels:', pixels);

            const promises = pixels.map(async (pixel) => {
              const pixel_id = (pixel.y) * 20 + pixel.x + 1;        
              const pixel_value = new anchor.BN(20000);         
              // Call withdraw_and_reset
              console.log('Selected pixels id:', pixel_id);
              return program.methods
              .withdrawAndReset(pixel_id)
              .accounts({
                dictionary: dictionary_address,
                vault: vault_address,
              }).rpc();
            });

            console.log('program.methods.update called.');

            try {
              const txSignatures = await Promise.all(promises);
              console.log('Transaction signatures:', txSignatures);
            
              // Vérification des transactions
              const transactionStatuses = await Promise.all(txSignatures.map(async (signature) => {
                const result = await connection.getConfirmedTransaction(signature);
                return { signature, result };
              }));
            
              transactionStatuses.forEach(({ signature, result }) => {
                if (result) {
                  console.log(`Transaction CONFIRMED: ${signature} with result:`, result);
                  setSuccess('Pixel color modified successfully !');

                  // changePixel Color
                  onBuy();
                } else {
                  console.error(`Transaction FAILED: ${signature} or is not confirmed yet.`);
                  setError('Pixel color NOT modified, transaction FAILED');
                }
              });
            } catch (error) {
              console.error('Error in transaction:', error);
              setError('Pixel color NOT modified, error during the process.');
            }
  
          }
    
        } catch (err) {
          setError('An error occurred during the withdraw process: ' + (err as Error).message);
          console.error(err);
        } finally {
          // TODO, assert fund are correcltly transafered.
          updateSuccess =  true;
        }
        
        if (updateSuccess) {
          // TODO: callonColorChange(color.toString('hex'))
        } else {
          // TODO: display on front.
          console.log ("cannot color, transaction failed.");
        }
              


        // onBuy()
      } else {
        alert("Please select an area on the pixel board before buying.")
      }
    } else {
      console.log(" > User is not connected.");
      setVisible(true)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && isMultiplePixelsSelected) {
      onImageUpload(file)
    }
  }

  return (
    <div>
      <div className={styles.infoBoard}>
        {selectedArea ? (
          <>
            <h2>Selected Area</h2>
            <p>From: x{selectedArea.start.x}y{selectedArea.start.y}</p>
            <p>To: x{selectedArea.end.x}y{selectedArea.end.y}</p>
            <div>
              <button className={styles.imageButton} onClick={() => setSelectedOption('color')}>Color</button>
              <button 
              className={styles.imageButton}
                onClick={() => setSelectedOption('image')}
                disabled={!isMultiplePixelsSelected}
                title={!isMultiplePixelsSelected ? "Select at least 2x2 pixels for image upload" : ""}
              >
                Image
              </button>
            </div>
            {selectedOption === 'color' ? (
              <ColorWheel onChange={color => onColorChange(color.toString('hex'))} />
            ) : (
              isMultiplePixelsSelected ? (
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              ) : (
                <p>Select at least 2x2 pixels to upload an image</p>
              )
            )}
          </>
        ) : (
          <p>Select a Pixel or an area on the pixel board</p>
        )}
        <button 
          onClick={handleColorPixelButtonClick} 
          className={styles.buyButton}
          disabled={connected && !selectedArea}
        >
          {connected ? (selectedArea ? 'Color Pixel(s)' : 'Select Pixel(s) to Color') : 'Connect Wallet to Paint'}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {success && <p className="text-green-500 mt-4">{success}</p>}

      </div>
        <div>
          <button 
            onClick={handleWithdrawButtonClick} 
            className={styles.buyButton}
            disabled={connected && !selectedArea}
          >
            {connected ? (selectedArea ? 'Withdraw' : 'Select Pixel(s) to Withdraw') : 'Connect Wallet to Withdraw'}
          </button>
        </div>
    </div>
  )
}

export default InfoBoard