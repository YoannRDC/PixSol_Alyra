import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import { PublicKey, Connection, Commitment } from "@solana/web3.js";
import IDL from "./idl.json";
import { PROGRAM_ID } from "./constants";
import { AnchorWallet } from "@solana/wallet-adapter-react";

type Wallet = {
    publicKey: PublicKey | null;
    signTransaction: (transaction: any) => Promise<any>;
    signAllTransaction: (transaction: any[]) => Promise<any[]>;
}

export const getProgram = (connection: Connection, wallet: AnchorWallet): Program => {
    // UPDATE 2 - Program connection
    // confirmed => 2 to 3 seconds
    // finalized => 10 to 20 seconds.
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed" as Commitment,
    });
    const program = new Program(IDL as Idl, PROGRAM_ID, provider);
    return program;
};

export const getVoterAddress = async (votePublicKey: PublicKey, userPublicKey: PublicKey) => {
    return (
        await PublicKey.findProgramAddressSync(
            [votePublicKey.toBuffer(), userPublicKey.toBuffer()],
            PROGRAM_ID
        )
    )[0];
};