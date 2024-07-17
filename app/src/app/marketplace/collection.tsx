import dotenv from 'dotenv';
import { createSignerFromKeypair, generateSigner, signerIdentity, type Context } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, fetchMerkleTree, fetchTreeConfigFromSeeds, mintToCollectionV1, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as beet from '@metaplex-foundation/beet';
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  CreateMetadataAccountArgsV3,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  DataV2,
} from "@metaplex-foundation/mpl-token-metadata";

const solanaWeb3 = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Preload...');

const solanaRpcHttpsMainnet = "https://api.devnet.solana.com";
if (!solanaRpcHttpsMainnet) {
  throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
}

// Initialize Umi with the RPC URL
const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());

// Path to the Solana secret key file
const keyFilePath = path.join(os.homedir(), '.config', 'solana', 'id.json');

// Read the content of the secret key file
const secretKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

// Convert to Uint8Array if necessary
const secretKeyArray = new Uint8Array(secretKey);

// Create the keypair with the secret key
const solanaKeypair = Keypair.fromSecretKey(secretKeyArray);

async function createCollection(
  connection: Connection,
  payer: Keypair,
  metadata: CreateMetadataAccountArgsV3
): Promise<{ mint: PublicKey; metadataAccount: PublicKey; masterEditionAccount: PublicKey }> {
  // Create the mint account
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    0 // 0 decimals for NFT
  );
  console.log("Mint created:", mint.toBase58());

  // Get the token account address
  const tokenAccount = await getAssociatedTokenAddress(mint, payer.publicKey);

  // Create the associated token account
  const createAccountIx = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    tokenAccount,
    payer.publicKey,
    mint
  );

  // Mint 1 token to the associated token account
  const mintToIx = createMintToInstruction(
    mint,
    tokenAccount,
    payer.publicKey,
    1 // Amount to mint
  );

  // Create metadata account
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf8"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  console.log('Metadata being passed to instruction:', JSON.stringify(metadata, null, 2));

  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: metadata,
    }
  );

  // Create master edition account
  const [masterEditionAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf8"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition", "utf8")],
    TOKEN_METADATA_PROGRAM_ID
  );

  const createMasterEditionInstruction = createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionAccount,
      mint: mint,
      updateAuthority: payer.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      metadata: metadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    }
  );

  try {
    const tx = new Transaction()
      .add(createAccountIx)
      .add(mintToIx)
      .add(createMetadataInstruction)
      .add(createMasterEditionInstruction);

    tx.feePayer = payer.publicKey;

    const txtSignature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    console.log(`Successfully created a collection with the txt sig: ${txtSignature}`);
    return { mint, metadataAccount, masterEditionAccount };
  } catch (err) {
    console.error(`Failed to create collection with error: ${err}`);
    throw err;
  }
}

async function main() {
    console.log('Main starts...');

    // Create a new connection to use with the createCollection function
    const connection = new Connection(solanaRpcHttpsMainnet);

    // Create metadata for the collection
    const collectionMetadata: DataV2 = {
        name: "My Collection",
        symbol: "MYCOL",
        uri: "https://example.com/my-collection-metadata.json",
        sellerFeeBasisPoints: 500,
        creators: [{ address: solanaKeypair.publicKey, verified: true, share: 100 }],
        collection: null,
        uses: null,
    };

    const metadata: CreateMetadataAccountArgsV3 = {
        data: collectionMetadata,
        isMutable: true,
        collectionDetails: null,
    };

    try {
        // Create the collection
        console.log('Creating collection...');
        const collectionDetails = await createCollection(connection, solanaKeypair, metadata);
        console.log('Collection created:', collectionDetails);

        console.log('Main ends...');
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main().catch(console.error);