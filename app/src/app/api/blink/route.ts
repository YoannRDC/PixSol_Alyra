import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS  } from "@solana/actions";

// Mint part from api/mint-nft//
import { NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { mintToCollectionV1 } from '@metaplex-foundation/mpl-bubblegum';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { TransactionBuilder } from '@metaplex-foundation/umi';

export const dynamic = "force-dynamic";
// Environment variables
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const COLLECTION_MINT = process.env.COLLECTION_MINT as string;
const MERKLE_TREE = process.env.MERKLE_TREE as string;
if (!SOLANA_RPC_URL || !PRIVATE_KEY || !COLLECTION_MINT || !MERKLE_TREE) {
  throw new Error('Missing required environment variables');
}
const umi = createUmi(SOLANA_RPC_URL).use(mplBubblegum());
let arraykey = JSON.parse(PRIVATE_KEY);
const privateKeyUint8Array = new Uint8Array(arraykey);
const keypair = umi.eddsa.createKeypairFromSecretKey(privateKeyUint8Array);
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));
/////

export async function GET(request: Request) {
    const responseBody: ActionGetResponse = {
        icon: "https://res.cloudinary.com/daxwfi2jl/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1721576574/photo_2024-07-19_15-01-42_bu7chb.jpg",
        description: "Certified Pixsol Production.",
        title: "Mint your Pixsol with Blink!",
        label: "Blink me !",
        error: {
            message: "This blink is localhosted actually!"
        }
    };

    return Response.json(responseBody,{headers:ACTIONS_CORS_HEADERS});
}


export async function POST(request: Request) {
  const postRequest: ActionPostRequest = await request.json();
  const userPubkey = postRequest.account;
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    const currentMintCount = await pixelService.getMintCount();
    const nextMintCount = await pixelService.incrementMintCount();
    
    // TODO add signature and validation blockhash 
  
    const mintResult = await mintToCollectionV1(umi, {
      leafOwner: publicKey(userPubkey),
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

    const signatureSerialize = base58.deserialize(mintResult.signature);
    const response : ActionPostResponse = {
      transaction: signatureSerialize.toString(),
      message: `Pixsol n°: ${nextMintCount} minted`
    }
    return Response.json({ 
      response
    },{headers:ACTIONS_CORS_HEADERS, status: 200 });
  } catch (error) {
    console.error('Minting error:', error);
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    return Response.json({ error: 'Failed to mint NFT', details: errorMessage }, {headers:ACTIONS_CORS_HEADERS, status: 500 });
  }
}

export async function OPTIONS(request:Request) {
    return new Response(null, {headers:ACTIONS_CORS_HEADERS})
}
