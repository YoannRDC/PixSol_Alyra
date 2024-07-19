import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import { PublicKey, Connection, Commitment } from "@solana/web3.js";
import IDL from "./idl.json";
import { AnchorWallet } from "@solana/wallet-adapter-react";


const PROGRAM_ID = "6FBQBJE6pFaRq6iPMc2HN6rRq7TCtzWqLBv7za9BNvtU"
export const getProgram = (connection: Connection, wallet: AnchorWallet): Program => {
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed" as Commitment,
    });
    return new Program(IDL as Idl, PROGRAM_ID, provider);
};

// Supposons que l'adresse du compte du dictionnaire soit une constante connue
export const DICTIONARY_PUBKEY = new PublicKey("9kGNj5psG8cLzsLkMBUjeVXS3e5LFGk7vZwgLvKEdguB");

export const VAULT_PUBKEY = new PublicKey("G63GN7Ew8JMTtkQCjeaokWZF6aRcHTSrTo6L1CJB7CVT");

export const PRICE_BY_PIXEL = 10_000_000;

// Vous n'avez pas besoin de fonction pour dériver des adresses dans ce cas