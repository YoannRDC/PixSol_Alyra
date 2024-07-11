
import dotenv from 'dotenv';
import { generateSigner, publicKey, type Context, type PublicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createTree, fetchMerkleTree, fetchTreeConfigFromSeeds, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum'

//************/
// HTTPS RPC CONNECTION
//************/

// Charger les variables d'environnement à partir du fichier .env
dotenv.config({ path: '../../.env' });
const solanaRpcHttpsMainnet = process.env.SOLANA_RPC_HTTPS_MAINNET as string;
if (!solanaRpcHttpsMainnet) {
  throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
}

// *************
// INITIALISATION
// *************

// Initialiser Umi avec l'URL RPC
const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());
// Générer un nouveau signer pour l'arbre Merkle
const merkleTree = generateSigner(umi);

// *************
// CREATE OR FETCH MERKLE TREE
// *************

// Fonction pour créer l'arbre Merkle
export async function createMerkleTree(context: Pick<Context, 'rpc'>): Promise<void> {
    // Initialiser Umi avec l'URL RPC
    const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());

    // Créer l'arbre Merkle
    const builder = await createTree(umi, {
        merkleTree,
        maxDepth: 14,
        maxBufferSize: 64,
    });

    // Envoyer et confirmer la transaction
    await builder.sendAndConfirm(umi);

    console.log('Merkle Tree created successfully');
}

// Fonction pour créer l'arbre Merkle
export async function fetchTree(context: Pick<Context, 'rpc'>): Promise<void> {

    const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey);

    const treeConfig = await fetchTreeConfigFromSeeds(umi, {
        merkleTree: merkleTree.publicKey,
      })

      const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

    console.log('Merkle Tree fetched successfully');
    console.log('Tree Config:', treeConfig);
    console.log('Canopy Depth:', canopyDepth);
}

// *************
// MAIN
// *************

(async () => {
    const context: Pick<Context, 'rpc'> = { rpc: umi.rpc };
  
    // Create the Merkle tree
    await createMerkleTree(context);
  
    // Fetch the Merkle tree
    await fetchTree(context);
  })();