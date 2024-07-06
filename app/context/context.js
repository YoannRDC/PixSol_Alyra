import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { SystemProgram } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  getProgram,
  getVoterAddress
} from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (connection) {
      // UPDATE 2 - Wallet connection
      return getProgram(connection, wallet ?? mockWallet());
    }
  }, [connection, wallet]);

  useEffect(() => {
    if(votes.length == 0){
      viewVotes();
    }
  }, [program]);

  const [votes, setVotes] = useState([]);

  const viewVotes = async () => {
    const votes = await program.account.proposal.all();
    const sortedVotes = votes.sort((a, b) => a.account.deadline - b.account.deadline);
    setVotes(sortedVotes);
    

    if(wallet && wallet.publicKey){
      const updatedVotes = await Promise.all(sortedVotes.map(async(vote) => {
        const voterAccountAddress = await getVoterAddress(vote.publicKey, wallet.publicKey);
        const voterInfo = await program.account.voter.fetchNullable(voterAccountAddress);
        return {
          ...vote,
          voterInfo: voterInfo
        };
      }));

      setVotes(updatedVotes);
    }
  }

  const createVote = async (topic, description, optionsArray, duration) => {
    // WRITE PROGRAM DATA - Back

    // Randomly generate a keypair for the voteAccount
    const proposalKeyPair = Keypair.generate();

    // Call the smart contract method createVote
    const tx =  await program.methods
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

  const vote = async (index, proposalPubKey) => {

    const voterAddress = await getVoterAddress(proposalPubKey, wallet.publicKey);

    // Call the smart contract method createVote
    const tx =  await program.methods
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


  // TODO BONUS nouvelle fonctionnalité
  // Récupérer si l'utilisateur a déjà voté pour l'afficher à côté de l'option correspondante
  // Indice 1 : Faire un appel au smart contract pour récupérer le Voter account s'il existe (publickey généré avec la seed voteAccount + userWallet)

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

export const useAppContext = () => {
  return useContext(AppContext);
};
