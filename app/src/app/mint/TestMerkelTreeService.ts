import { createMerkleTree, fetchTree } from './metaplexNFT';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const solanaRpcHttpsMainnet = process.env.SOLANA_RPC_HTTPS_MAINNET as string;
if (!solanaRpcHttpsMainnet) {
  throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
}

(async () => {
  const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());
  const context = { rpc: umi.rpc };

  // Create the Merkle tree
  await createMerkleTree(context);

  // Fetch the Merkle tree
  await fetchTree(context);
})();
