import dotenv from 'dotenv';
import { publicKey, createSignerFromKeypair, generateSigner, signerIdentity, type Context } from '@metaplex-foundation/umi';
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

// Create a signer from the Solana keypair for use with Umi
const umiKeypairSigner = createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(secretKeyArray));
umi.use(signerIdentity(umiKeypairSigner));

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
        maxSupply: 10000,
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

async function createMerkleTree(): Promise<any> {
    console.log('Creating Merkle Tree...');
    try {
        const merkleTreeSigner = generateSigner(umi);
        
        // Create the Merkle Tree
        const builder = await createTree(umi, {
            merkleTree: merkleTreeSigner,
            maxDepth: 14,
            maxBufferSize: 64,
            public: true,
        });

        // Send and confirm the transaction
        const result = await builder.sendAndConfirm(umi);
        // Log and return the Merkle tree address
        const merkleTreeAddress = merkleTreeSigner.publicKey;
        console.log('Merkle Tree created successfully. Address:', merkleTreeAddress.toString());
        console.log('Merkle Tree created successfully');
        return merkleTreeSigner;
    } catch (error) {
        console.error('Error creating Merkle Tree:', error);
        throw error;
    }
}

async function fetchTree(merkleTreePublicKey: PublicKey): Promise<void> {
    console.log('Fetching Merkle Tree...');
    try {
        const merkleTreeSigner = generateSigner(umi);

        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: publicKey(merkleTreePublicKey),
        });
        
        console.log('Merkle Tree fetched successfully');
        console.log('Tree Config:', treeConfig);
        
    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}

async function mintToCollection(merkleTreePublicKey: PublicKey): Promise<void> {
  console.log('Minting a cNFT in collection');
  try {
      const leafOwner = umi.identity.publicKey;

      const mintLog = await mintToCollectionV1(umi, {
          leafOwner: publicKey("M88kr8ntGbL6heuAYRXf4DULABTahMgEjje1sBkhFGD"),
          merkleTree: publicKey(merkleTreePublicKey),
          collectionMint: publicKey("9TSwr3ZFE7HMUQLGKucu55hdDfJxhMdzYi92WiiGe3s8"),
          collectionAuthority: umi.identity,
          metadata: {
              name: '1',
              uri: 'https://example.com/my-cnft.json',
              sellerFeeBasisPoints: 500, // 5%
              collection: { key: publicKey("9TSwr3ZFE7HMUQLGKucu55hdDfJxhMdzYi92WiiGe3s8"), verified: false },
              creators: [
                  { address: umi.identity.publicKey, verified: false, share: 100 },
              ],
          },
      }).sendAndConfirm(umi);

      console.log('CNFT minted:', JSON.stringify({
          signature: Array.from(mintLog.signature),
          result: mintLog.result
      }));
  } catch (error) {
      console.error('Error minting cNFT:', error);
  }
}

async function main() {
    console.log('Main starts...');

    // Create a new connection to use with the createCollection function
    const connection = new Connection(solanaRpcHttpsMainnet);

    // Create metadata for the collection
    const collectionMetadata: DataV2 = {
        name: "PixSol Board",
        symbol: "PXSB",
        uri: "https://lh3.googleusercontent.com/d44g19NCqGoJAXBtnVxgXPnMuCD0_eD1HK2w9iJ7f51280HY_shGWcJK94fMc416WNq5m_fUva3V_-bLaxzqpfFpWsOhZU0_03Ok",
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
        // 
        // CREATION DE LA COLLECTION A FAIRE UNE FOIS
        //
        const collectionDetails = await createCollection(connection, solanaKeypair, metadata);
        console.log('Collection created:', collectionDetails);

        // Create Merkle Tree
         // CREATION DE LA COLLECTION A FAIRE UNE FOIS
         //
        console.log('Creating Merkle Tree...');
        //const merkleTreeSigner = await createMerkleTree();
        console.log('Merkle Tree created');

        // Fetch Merkle Tree
        console.log('Fetching Merkle Tree...');
        //await fetchTree(new PublicKey("3Di4XyyLySkDXW2TtV9EzwpxBfLQUfhkmej7mJ64E4FA"));

        // Mint cNFT
        console.log('Minting cNFT...');
        //await mintCNFT(new PublicKey("3Di4XyyLySkDXW2TtV9EzwpxBfLQUfhkmej7mJ64E4FA"));;
          //await mintToCollection(new PublicKey("3Di4XyyLySkDXW2TtV9EzwpxBfLQUfhkmej7mJ64E4FA"));
        // Fetch Merkle Tree again to see changes
        console.log('Fetching Merkle Tree after minting...');
        //await fetchTree(new PublicKey("3Di4XyyLySkDXW2TtV9EzwpxBfLQUfhkmej7mJ64E4FA"));

        console.log('Main ends...');
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main().catch(console.error);