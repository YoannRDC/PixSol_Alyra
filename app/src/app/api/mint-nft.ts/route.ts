import type { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey } from '@solana/web3.js';
import { mintToCollectionV1 } from '@metaplex-foundation/mpl-bubblegum';
import { umi, solanaKeypair } from '../../utils/umiSetup';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPublicKey } = req.body;

  if (!userPublicKey) {
    return res.status(400).json({ error: 'User public key is required' });
  }

  try {
    const merkleTreePublicKey = new PublicKey("3Di4XyyLySkDXW2TtV9EzwpxBfLQUfhkmej7mJ64E4FA");
    
    const mintResult = await mintToCollectionV1(umi, {
      leafOwner: publicKey(userPublicKey),
      merkleTree: merkleTreePublicKey,
      collectionMint: new PublicKey("9TSwr3ZFE7HMUQLGKucu55hdDfJxhMdzYi92WiiGe3s8"),
      collectionAuthority: umi.identity,
      metadata: {
        name: 'PixSol',
        uri: 'https://example.com/my-cnft.json',
        sellerFeeBasisPoints: 500,
        collection: { key: new PublicKey("9TSwr3ZFE7HMUQLGKucu55hdDfJxhMdzYi92WiiGe3s8"), verified: false },
        creators: [
          { address: umi.identity.publicKey, verified: false, share: 100 },
        ],
      },
    }).sendAndConfirm(umi);

    res.status(200).json({ 
      message: 'NFT minted successfully', 
      signature: mintResult.signature 
    });
  } catch (error) {
    console.error('Minting error:', error);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
}