import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { Program, BN } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, DICTIONARY_PUBKEY, VAULT_PUBKEY } from '../utils/solanaConfig';

export const useMutableDictionary = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeProgram = async () => {
      if (connection && wallet) {
        try {
          setIsInitializing(true);
          const prog = getProgram(connection, wallet);
          setProgram(prog);
        } catch (error) {
          console.error("Failed to initialize program:", error instanceof Error ? error.message : String(error));
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeProgram();
  }, [connection, wallet]);

  const readDictionaryInfo = useCallback(async () => {
    if (!program) {
      console.error("Program not initialized");
      return null;
    }

    try {
      const dictionaryAccount = await program.account.dictionary.fetch(DICTIONARY_PUBKEY);
      return dictionaryAccount;
    } catch (error) {
      console.error("Error reading dictionary info:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program]);

  const readVaultInfo = useCallback(async () => {
    if (!program) {
      console.error("Program not initialized");
      return null;
    }

    try {
      const vaultAccount = await program.account.vault.fetch(VAULT_PUBKEY);
      return vaultAccount;
    } catch (error) {
      console.error("Error reading vault info:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program]);

  const updatePixel = useCallback(async (id: number, depositAmount: number) => {
    if (!program || !wallet) {
      console.error("Program not initialized or wallet not connected");
      return;
    }

    try {
      const tx = await program.methods
        .update(id, new BN(depositAmount))
        .accounts({
          dictionary: DICTIONARY_PUBKEY,
          vault: VAULT_PUBKEY,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Update transaction signature", tx);
      return tx;
    } catch (error) {
      console.error("Error updating pixel:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program, wallet]);

  const withdrawWithOneNFT = useCallback(async (id: number, depositAmount: number) => {
    if (!program || !wallet) {
      console.error("Program not initialized or wallet not connected");
      return;
    }

    try {
      const tx = await program.methods
        .update(id, new BN(depositAmount))
        .accounts({
          dictionary: DICTIONARY_PUBKEY,
          vault: VAULT_PUBKEY,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Update transaction signature", tx);
      return tx;
    } catch (error) {
      console.error("Error updating pixel:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program, wallet]);

  const withdrawAndReset = useCallback(async (id: number) => {
    if (!program || !wallet) {
      console.error("Program not initialized or wallet not connected");
      return;
    }

    try {
      const tx = await program.methods
        .withdrawAndReset(id)
        .accounts({
          dictionary: DICTIONARY_PUBKEY,
          vault: VAULT_PUBKEY,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Withdraw and reset transaction signature", tx);
      return tx;
    } catch (error) {
      console.error("Error withdrawing and resetting:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program, wallet]);

  const updateByBatch = useCallback(async (ids: number[], depositAmount: number) => {
    if (!program || !wallet) {
      console.error("Program not initialized or wallet not connected");
      return;
    }

    try {
      const idsBuffer = Buffer.from(new Uint8Array(ids));
      const tx = await program.methods
        .updateByBatch(idsBuffer, new BN(depositAmount))
        .accounts({
          dictionary: DICTIONARY_PUBKEY,
          vault: VAULT_PUBKEY,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Update by batch transaction signature", tx);
      return tx;
    } catch (error) {
      console.error("Error updating by batch:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program, wallet]);

  const withdrawAndResetByBatch = useCallback(async (ids: number[]) => {
    if (!program || !wallet) {
      console.error("Program not initialized or wallet not connected");
      return;
    }

    try {
      const idsBuffer = Buffer.from(new Uint8Array(ids));
      const tx = await program.methods
        .withdrawAndResetByBatch(idsBuffer)
        .accounts({
          dictionary: DICTIONARY_PUBKEY,
          vault: VAULT_PUBKEY,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Withdraw and reset by batch transaction signature", tx);
      return tx;
    } catch (error) {
      console.error("Error withdrawing and resetting by batch:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [program, wallet]);

  return {
    readDictionaryInfo,
    readVaultInfo,
    updatePixel,
    withdrawAndReset,
    updateByBatch,
    withdrawAndResetByBatch,
    isInitializing,
    programInitialized: !!program
  };
};