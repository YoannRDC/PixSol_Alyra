import React, { createContext, useState, useEffect, useContext, useMemo, ReactNode } from "react";
import { SystemProgram, Keypair, Connection, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { Program } from "@project-serum/anchor";
import { getProgram, getVoterAddress } from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";

interface AppContextType {
    createVote: (topic: string, description: string, optionsArray: string[], duration: number) => Promise<void>;
    viewVotes: () => Promise<void>;
    vote: (index: number, proposalPubKey: PublicKey) => Promise<void>;
    votes: any[];
    error: string;
    success: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    // const program = useMemo<Program | undefined>(() => {
    //     if (connection) {
    //     // UPDATE 2 - Wallet connection
    //     return getProgram(connection, wallet ?? {mockWallet});
    //     }
    // }, [connection, wallet]);
    const program = useMemo<Program | undefined>(() => {
        if (connection && wallet) {
            return getProgram(connection, wallet);
        }
        return undefined; // Handle case where wallet is undefined
    }, [connection, wallet]);
    

    useEffect(() => {
        if (votes.length === 0) {
        viewVotes();
        }
    }, [program]);

    const [votes, setVotes] = useState<any[]>([]);

    const viewVotes = async () => {
        if (!program) return;

        const votes = await program.account.proposal.all();
        const sortedVotes = votes.sort((a, b) => (a.account.deadline as number) - (b.account.deadline as number));
        setVotes(sortedVotes);

        if (wallet && wallet.publicKey) {
        const updatedVotes = await Promise.all(sortedVotes.map(async (vote) => {
            const voterAccountAddress = await getVoterAddress(vote.publicKey, wallet.publicKey);
            const voterInfo = await program.account.voter.fetchNullable(voterAccountAddress);
            return {
            ...vote,
            voterInfo: voterInfo
            };
        }));

        setVotes(updatedVotes);
        }
    };

    const createVote = async (topic: string, description: string, optionsArray: string[], duration: number) => {
        if (!program || !wallet) return;

        // Randomly generate a keypair for the voteAccount
        const proposalKeyPair = Keypair.generate();

        // Call the smart contract method createVote
        const tx = await program.methods
        .createProposal(topic, description, optionsArray, new BN(duration))
        .accounts({
            signer: wallet.publicKey,
            proposal: proposalKeyPair.publicKey,
            systemProgram: SystemProgram.programId
        })
        .signers([proposalKeyPair])
        .rpc();

        console.log("tx:", tx);
        await confirmTx(tx, connection);

        viewVotes();
    };

    const vote = async (index: number, proposalPubKey: PublicKey) => {
        if (!program || !wallet) return;

        const voterAddress = await getVoterAddress(proposalPubKey, wallet.publicKey);

        // Call the smart contract method createVote
        const tx = await program.methods
        .castVote(index)
        .accounts({
            signer: wallet.publicKey,
            proposal: proposalPubKey,
            voter: voterAddress,
            systemProgram: SystemProgram.programId
        })
        .rpc();

        console.log("tx:", tx);
        await confirmTx(tx, connection);

        viewVotes();
    };

    if (!program) {
        return null; // Or any loading indicator if needed
    }

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

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};
