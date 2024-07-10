import { createContext, useContext } from "react";
import { PublicKey } from "@solana/web3.js";

interface AppContextType {
  createVote: (topic: string, description: string, optionsArray: string[], duration: number) => Promise<void>;
  viewVotes: () => Promise<void>;
  vote: (index: number, proposalPubKey: PublicKey) => Promise<void>;
  votes: any[];
  error: string;
  success: string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};