'use client';

import { useState } from 'react';
import { PublicKey, Keypair, Transaction, Connection, sendAndConfirmTransaction } from '@solana/web3.js';
import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression';
import { createTransferInstruction } from '@metaplex-foundation/mpl-bubblegum';
import * as bs58 from 'bs58';

async function transferNft(
  connection: Connection,
  assetId: PublicKey,
  sender: Keypair,
  receiver: PublicKey
) {
  try {
    const assetDataResponse = await fetch(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAsset",
        params: {
          id: assetId,
        },
      }),
    });
    const assetData = (await assetDataResponse.json()).result;

    const assetProofResponse = await fetch(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetProof",
        params: {
          id: assetId,
        },
      }),
    });
    const assetProof = (await assetProofResponse.json()).result;

    const treePublicKey = new PublicKey(assetData.compression.tree);

    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      treePublicKey
    );

    const canopyDepth = treeAccount.getCanopyDepth() || 0;

    const proofPath = assetProof.proof
      .map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
      }))
      .slice(0, assetProof.proof.length - canopyDepth);

    const treeAuthority = treeAccount.getAuthority();
    const leafOwner = new PublicKey(assetData.ownership.owner);
    const leafDelegate = assetData.ownership.delegate
      ? new PublicKey(assetData.ownership.delegate)
      : leafOwner;

    const transferIx = createTransferInstruction(
      {
        merkleTree: treePublicKey,
        treeAuthority,
        leafOwner,
        leafDelegate,
        newLeafOwner: receiver,
        logWrapper: new PublicKey(assetData.compression.logWrapper),
        compressionProgram: new PublicKey(assetData.compression.compressionProgram),
        anchorRemainingAccounts: proofPath,
      },
      {
        root: [...new PublicKey(assetProof.root.trim()).toBytes()],
        dataHash: [...new PublicKey(assetData.compression.data_hash.trim()).toBytes()],
        creatorHash: [...new PublicKey(assetData.compression.creator_hash.trim()).toBytes()],
        nonce: assetData.compression.leaf_id,
        index: assetData.compression.leaf_id,
      }
    );

    const tx = new Transaction().add(transferIx);
    tx.feePayer = sender.publicKey;
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [sender],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
  } catch (err) {
    console.error("\nFailed to transfer nft:", err);
    throw err;
  }
}

export default function TransferComponent({ nfts, wallet }) {
  const [message, setMessage] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [selectedNft, setSelectedNft] = useState<string>('');

  const handleTransfer = async () => {
    if (!wallet?.connected || !wallet?.publicKey || !recipient || !selectedNft) {
      setMessage('Wallet not connected, recipient address or NFT not selected');
      return;
    }

    try {
      const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY;
      if (!secretKey) {
        throw new Error('Secret key not found in environment variables');
      }

      const decodedKey = bs58.decode(secretKey);
      console.log('Decoded secret key:', decodedKey);

      const senderKeypair = Keypair.fromSecretKey(decodedKey);
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
      const recipientPublicKey = new PublicKey(recipient);

      await transferNft(connection, new PublicKey(selectedNft), senderKeypair, recipientPublicKey);
      setMessage('NFT transferred successfully');
    } catch (error) {
      console.error('Error transferring NFT:', error);
      setMessage(`Error transferring NFT: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Transfer NFT</h2>
      <p>{message}</p>
      <div>
        <h3>Select NFT to Transfer</h3>
        <select onChange={(e) => setSelectedNft(e.target.value)}>
          <option value="">Select NFT</option>
          {nfts.map((nft, index) => (
            <option key={index} value={nft.id}>
              {nft.content.metadata.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3>Recipient Address</h3>
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <button onClick={handleTransfer}>Transfer</button>
    </div>
  );
}
