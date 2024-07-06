import { PublicKey, Connection, TransactionSignature } from "@solana/web3.js";

// Mock Wallet Function
export const mockWallet = (): {} => {
    return {};
};

// Function to shorten a public key
export const shortenPk = (pk: PublicKey | string, chars: number = 5): string => {
    const pkStr = typeof pk === "object" ? pk.toBase58() : pk;
    return `${pkStr.slice(0, chars)}...${pkStr.slice(-chars)}`;
};

// Function to confirm a transaction
export const confirmTx = async (txHash: TransactionSignature, connection: Connection): Promise<void> => {
    const blockhashInfo = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        blockhash: blockhashInfo.blockhash,
        lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
        signature: txHash,
    });
};