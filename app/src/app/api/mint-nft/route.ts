import { NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { mintToCollectionV1, } from '@metaplex-foundation/mpl-bubblegum';
import fs from 'fs';
import path from 'path';
import { base58 } from '@metaplex-foundation/umi/serializers';

// Environment variables
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const COLLECTION_MINT = process.env.COLLECTION_MINT as string;
const MERKLE_TREE = process.env.MERKLE_TREE as string;

if (!SOLANA_RPC_URL || !PRIVATE_KEY || !COLLECTION_MINT || !MERKLE_TREE) {
  throw new Error('Missing required environment variables');
}

const umi = createUmi(SOLANA_RPC_URL).use(mplBubblegum());
let arraykey = JSON.parse(PRIVATE_KEY)
// Directly create the keypair from the private key string
const privateKeyUint8Array = new Uint8Array(arraykey); 

const keypair = umi.eddsa.createKeypairFromSecretKey(privateKeyUint8Array);
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

const mintCountPath = path.join(process.cwd(), 'data', 'mintCount.json');

function getMintCount(): number {
  try {
    const data = JSON.parse(fs.readFileSync(mintCountPath, 'utf8'));
    return data.count;
  } catch (error) {
    console.error('Error reading mint count file:', error);
    throw new Error('Failed to read mint count');
  }
}

function incrementMintCount(count: number): void {
  try {
    fs.writeFileSync(mintCountPath, JSON.stringify({ count }, null, 2));
  } catch (error) {
    console.error('Error writing mint count file:', error);
    throw new Error('Failed to write mint count');
  }
}

// Named export for the POST method
export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { userPublicKey } = await req.json();

  try {
    const currentMintCount = getMintCount();
    const nextMintCount = currentMintCount + 1;

    const mintResult = await mintToCollectionV1(umi, {
      leafOwner: publicKey(userPublicKey),
      merkleTree: publicKey(MERKLE_TREE),
      collectionMint: publicKey(COLLECTION_MINT),
      collectionAuthority: signer,
      metadata: {
        name: `${nextMintCount}`,
        uri: `https://lh3.googleusercontent.com/FGm4fXMK3ARExpBT4grq_ZZGuwKMjcovM_Kq2qFkvzpJJVcNFOmOL2mSHFOJprK5Mc0bwXTx2x409_g_0gH7E_KICIfCaPhHl_M`,
        sellerFeeBasisPoints: 500,
        collection: { key: publicKey(COLLECTION_MINT), verified: true },
        creators: [{ address: signer.publicKey, verified: true, share: 100 }],
      },
    }).sendAndConfirm(umi);

    // If we reach this point, the minting was successful
    incrementMintCount(nextMintCount);
    const signatureSerialze = base58.deserialize(mintResult.signature);
    return NextResponse.json({ message: 'NFT minted successfully', signature: signatureSerialze, mintNumber: nextMintCount }, { status: 200 });
  } catch (error) {
    console.error('Minting error:', error);
    return NextResponse.json({ error: 'Failed to mint NFT' }, { status: 500 });
  }
}
