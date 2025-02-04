//Un essai...
/*

import { NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey, Umi } from '@metaplex-foundation/umi';
import { Metadata, PublicKey } from '@metaplex-foundation/js';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';

interface Asset {
    name: string;
    uri: string;
    sellerFeeBasisPoints: number;
    collection: any; 
    creators: any[];
}

interface FetchAssetsResponse {
    items: Asset[];
}

const creator = publicKey('<KEY>');

// Environment variables
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string;

if (!SOLANA_RPC_URL) {
    throw new Error('Missing required environment variable: SOLANA_RPC_URL');
}

const umi: Umi = createUmi(SOLANA_RPC_URL).use(dasApi());

const fetchAssetsByOwner = async (umi: any, ownerPublicKey: PublicKey) => {
    const { items } = await umi.rpc.getAssetsByOwner({
      owner: publicKey(ownerPublicKey.toBase58()),
    });
    return items;
  };

  export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    try {
        const ownerPublicKey = publicKey(address);
        // Fetching assets for owner
        const assets = await fetchAssetsByOwner(umi, ownerPublicKey);

        const nfts = assets.map((asset: any) => ({
            name: asset.content.metadata.name,
            uri: asset.content.metadata.uri,
            sellerFeeBasisPoints: asset.content.sellerFeeBasisPoints,
            collection: asset.content.collection,
            creators: asset.content.creators,
        }));

        return NextResponse.json({ nfts }, { status: 200 });
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
    }
}
*/