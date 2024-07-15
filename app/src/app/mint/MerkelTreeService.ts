import dotenv from 'dotenv';
import { createSignerFromKeypair, generateSigner, signerIdentity, type Context } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, fetchMerkleTree, fetchTreeConfigFromSeeds, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';

const fs = require('fs');
const path = require('path');
const os = require('os');
// const umi = require('umi');

console.log('Preload...');

// Charger les variables d'environnement à partir du fichier .env
dotenv.config({ path: '../../../../.env' });
//const solanaRpcHttpsMainnet = process.env.SOLANA_RPC_HTTPS_MAINNET as string;
const solanaRpcHttpsMainnet = process.env.SOLANA_DEVNET as string;
if (!solanaRpcHttpsMainnet) {
    throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
}

// Initialiser Umi avec l'URL RPC
const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());
// Générer un nouveau signer pour l'arbre Merkle
const merkleTree = generateSigner(umi);

// Fonction pour créer l'arbre Merkle
async function createMerkleTree(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Creating Merkle Tree...');
    try {

        // Chemin par défaut de la clé secrète Solana
        const keyFilePath = path.join(os.homedir(), '.config', 'solana', 'id.json');

        // Lire le contenu du fichier de clé secrète
        const secretKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

        // Convertir en Uint8Array si nécessaire
        const secretKeyArray = new Uint8Array(secretKey);

        // Créer le keypair avec la clé secrète
        const solanaKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyArray);

        console.log('Public Key:', solanaKeypair.publicKey.toString());
        console.log('Secret Key:', solanaKeypair.secretKey);

        const myKeypairSigner = createSignerFromKeypair(umi, solanaKeypair);
        umi.use(signerIdentity(myKeypairSigner));

        // Créer l'arbre Merkle
        const builder = await createTree(umi, {
            merkleTree,
            maxDepth: 14,
            maxBufferSize: 64,
        });

        // Envoyer et confirmer la transaction
        await builder.sendAndConfirm(umi);
        console.log('Merkle Tree created successfully');
    } catch (error) {
        console.error('Error creating Merkle Tree:', error);
    }
}

// Fonction pour récupérer l'arbre Merkle
async function fetchTree(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Fetching Merkle Tree...');
    try {
        const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey);
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: merkleTree.publicKey,
        });
        const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

        console.log('Merkle Tree fetched successfully');
        console.log('Tree Config:', treeConfig);
        console.log('Canopy Depth:', canopyDepth);
    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}

// Fonction principale
async function main() {
    console.log('Main starts...');
    const context = { rpc: umi.rpc };
    await createMerkleTree(context);
    await fetchTree(context);
    console.log('Main ends...');
}

main().catch(console.error);
