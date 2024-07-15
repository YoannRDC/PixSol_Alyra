'use client';

import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { getProgram, getVoterAddress } from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";
import { AppContext } from "./AppContext";

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [votes, setVotes] = useState<any[]>([]);

  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (connection && wallet) {
      return getProgram(connection, wallet);
    }
    return null;
  }, [connection, wallet]);

  useEffect(() => {
    if (votes.length === 0 && program) {
      viewVotes();
    }
  }, [program]);

  const viewVotes = async () => {
    // ... (rest of the viewVotes function)
  }

  const createVote = async (topic: string, description: string, optionsArray: string[], duration: number) => {
    // ... (rest of the createVote function)
  };

  const vote = async (index: number, proposalPubKey: PublicKey) => {
    // ... (rest of the vote function)
  };

  return (
    <AppContext.Provider
      value={{
        createVote,
        viewVotes,
        vote,
        votes,
        error,
        success
      }}
    >
      {children}
    </AppContext.Provider>
  );
};