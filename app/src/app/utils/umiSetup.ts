import { createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';

const solanaRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const privateKeyBase58 = process.env.PRIVATE_KEY_BASE58;

if (!privateKeyBase58) {
  throw new Error('PRIVATE_KEY_BASE58 is not defined in the environment variables');
}

const umi = createUmi(solanaRpcUrl).use(mplBubblegum());

const privateKeyUint8Array = bs58.decode(privateKeyBase58);
const solanaKeypair = Keypair.fromSecretKey(privateKeyUint8Array);

const umiKeypairSigner = createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(privateKeyUint8Array));
umi.use(signerIdentity(umiKeypairSigner));

export { umi, solanaKeypair };