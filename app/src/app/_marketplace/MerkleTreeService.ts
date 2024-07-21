import { createSignerFromKeypair, generateSigner, signerIdentity, type Context } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, fetchMerkleTree, fetchTreeConfigFromSeeds, mintToCollectionV1, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';

const solanaWeb3 = require('@solana/web3.js');
const { MerkleTree } = require('merkletreejs');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');


const fs = require('fs');
const path = require('path');
const os = require('os');
// const umi = require('umi');

console.log('Preload...');

// Generate a new keypair for the Merkle Tree account
const merkleTreeKeypair = Keypair.generate();
const merkleTreePublicKey = merkleTreeKeypair.publicKey;

console.log('Merkle Tree Public key:', merkleTreePublicKey.toString());


//const solanaRpcHttpsMainnet = process.env.SOLANA_RPC_HTTPS_MAINNET as string;
const solanaRpcHttpsMainnet = "https://api.devnet.solana.com";
if (!solanaRpcHttpsMainnet) {
  throw new Error('SOLANA_RPC_HTTPS_MAINNET is not defined in the .env file');
}

// Initialiser Umi avec l'URL RPC
const umi = createUmi(solanaRpcHttpsMainnet).use(mplBubblegum());
// Générer un nouveau signer pour l'arbre Merkle
const merkleTreeSigner = generateSigner(umi);

// ******
// Create KeyPair
// ******


// Chemin par défaut de la clé secrète Solana
const keyFilePath = path.join(os.homedir(), '.config', 'solana', 'id.json');

// Lire le contenu du fichier de clé secrète
const secretKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

// Convertir en Uint8Array si nécessaire
const secretKeyArray = new Uint8Array(secretKey);

// Créer le keypair avec la clé secrète
const solanaKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyArray);


// Fonction pour créer l'arbre Merkle
async function createMerkleTree(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Creating Merkle Tree...');
    try {

        console.log('Public Key:', solanaKeypair.publicKey.toString());
        console.log('Secret Key:', solanaKeypair.secretKey);

        const myKeypairSigner = createSignerFromKeypair(umi, solanaKeypair);
        umi.use(signerIdentity(myKeypairSigner));

        // Créer l'arbre Merkle
        const builder = await createTree(umi, {
            merkleTree: merkleTreeSigner,
            maxDepth: 14,
            maxBufferSize: 64,
            public: true,
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
        const merkleTreeAccount = await fetchMerkleTree(umi, merkleTreeSigner.publicKey);
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: merkleTreeSigner.publicKey,
        });
        const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

        console.log('Merkle Tree fetched successfully');
        console.log('Tree Config:', treeConfig);
        console.log('Canopy Depth:', canopyDepth);
    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}


// Fonction pour Mint 1 NFT (sans collection associé)
async function mintCNFT(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Minting a cNFT...');
    try {
        const merkleTreeAccount = await fetchMerkleTree(umi, merkleTreeSigner.publicKey);
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: merkleTreeSigner.publicKey,
        });
        const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

        const leafOwner =  umi.identity.publicKey;

        const mintLog = await mintV1(umi, {
            leafOwner: leafOwner,
            merkleTree: merkleTreeSigner.publicKey,
            metadata: {
                name: 'PixSol X100 Y200', // TBD
                uri: 'https://example.com/my-cnft.json',
                sellerFeeBasisPoints: 500, // 5%
                collection: null,
                creators: [
                    { address: umi.identity.publicKey, verified: false, share: 100 },
                ],
            },
        }).sendAndConfirm(umi)
        

        
        console.log('CNFT minted: %s', JSON.stringify({
            signature: Array.from(mintLog.signature),
            result: mintLog.result
        }));

    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}
/*
// Fonction pour Mint
async function mintCNFTcollection(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Minting a cNFT...');
    try {
        const merkleTreeAccount = await fetchMerkleTree(umi, merkleTreeSigner.publicKey);
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: merkleTreeSigner.publicKey,
        });
        const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

        const leafOwner =  solanaKeypair.publicKey;

        const collectionMint = new PublicKey("CoLLvRE5Y9kzzz5dMzCw2eNWJz7HvLn9zWDiE8SAmsFe");

        

        // Chemin vers votre fichier JSON
        const keypairFile = 'Co11aqX6XLa5WYm9UKnqUVEucsaHJ3puFmtYVTCvjrWX.json';

        // Charger et parser le fichier JSON
        const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairFile, 'utf8')));

        // Créer une Keypair à partir de la clé secrète
        const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);


        //const collectionMint = generateSigner(umi);

        await mintToCollectionV1(umi, {
            leafOwner,
            merkleTreeAccount,
            merkleTreeSigner,
            metadata: {
              name: 'My Compressed NFT',
              uri: 'https://example.com/my-cnft.json',
              sellerFeeBasisPoints: 500, // 5%
              collection: { key: keypair, verified: false },
              creators: [
                { address: umi.identity.publicKey, verified: false, share: 100 },
              ],
            },
          }).sendAndConfirm(umi)
          

        console.log('Merkle Tree fetched successfully');
        console.log('Tree Config:', treeConfig);
        console.log('Canopy Depth:', canopyDepth);
    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}
*/

// Fonction principale
async function main() {
    console.log('Main starts...');
    const context = { rpc: umi.rpc };
    await createMerkleTree(context);
    await fetchTree(context);
    await mintCNFT(context);
    await fetchTree(context);
    console.log('Main ends...');
}

main().catch(console.error);
