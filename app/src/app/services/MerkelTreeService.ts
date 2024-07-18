/*import dotenv from 'dotenv';
import { createSignerFromKeypair, generateSigner, none, percentAmount, publicKey, signerIdentity, Umi, type Context } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, fetchMerkleTree, fetchTreeConfigFromSeeds, mintToCollectionV1, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';

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

// Set my my key to umi.
const myKeypairSigner = createSignerFromKeypair(umi, solanaKeypair);
umi.use(signerIdentity(myKeypairSigner));

// Creating PixCol collection
const rawData = fs.readFileSync('coLsYhKiWt8PrdPx5gpZJw6hFH9PsoCWdXiEYMGm85h.json', 'utf-8');
const jsonData = JSON.parse(rawData);

const collectionKeypair = Keypair.fromSecretKey(Uint8Array.from(jsonData));
console.log("collectionKeypair:", collectionKeypair);

// Fonction pour créer l'arbre Merkle
async function createMerkleTree(context: Pick<Context, 'rpc'>): Promise<void> {
    console.log('Creating Merkle Tree...');
    try {

        console.log('Public Key:', solanaKeypair.publicKey.toString());
        console.log('Secret Key:', solanaKeypair.secretKey);

        // Créer l'arbre Merkle
        const builder = await createTree(umi, {
            merkleTree: merkleTreeSigner,
            maxDepth: 14,
            maxBufferSize: 64,
        });

        // Envoyer et confirmer la transaction
        const txRes = await builder.sendAndConfirm(umi);
        console.log("txRes:", txRes);

        console.log("builder: ", builder);
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
async function mintCNFT(context: Pick<Context, 'rpc'>, x: number, y: number): Promise<void> {
    console.log('Minting a cNFT...');
    try {
        const merkleTreeAccount = await fetchMerkleTree(umi, merkleTreeSigner.publicKey);
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: merkleTreeSigner.publicKey,
        });
        const canopyDepth = Math.log2(merkleTreeAccount.canopy.length + 2) - 1;

        const leafOwner =  solanaKeypair.publicKey;

        // Construire X100 et Y200 à partir des paramètres passés
        const name = `PixSol X${x} Y${y}`;

        const mintLog = await mintV1(umi, {
            leafOwner: leafOwner,
            merkleTree: merkleTreeSigner.publicKey,
            metadata: {
              name: name, 
              uri: 'ipfs://bafybeia3wuho4sfnks5vvd76qbbnnd5yqr2zoeiriskrlowzgjb5fqeuie/',
              sellerFeeBasisPoints: 500, // 5%
              collection: collectionKeypair,
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

// Fonction pour Mint
async function mintCNFTcollection(treeAddress: string, x: number, y: number): Promise<void> {
    console.log('Minting a cNFT to a collection...');
    try {

        console.log("treeAddress:", treeAddress);
        // Load the tree
        const treeConfig = await fetchTreeConfigFromSeeds(umi, {
            merkleTree: publicKey(treeAddress),
        });
        console.log("treeConfig.");

        const merkleTreePublicKey = new PublicKey("7VYvSpAZY9TGeVA1FuBU7LpuUmLRJrKaq7kWwYPNsZtD");
        const treeAccount = await fetchMerkleTree(umi, merkleTreePublicKey);
        console.log("treeAccount.");

        const leafOwner =  solanaKeypair.publicKey;
        console.log("leafOwner.");
        // Créer une Keypair à partir de la clé secrète
        //const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);

        console.log("bef", x, y);
        const name = `PixSol X${x} Y${y}`;
        console.log("treeConfig.publicKey", treeConfig.publicKey);
        console.log("leafOwner", leafOwner);
        console.log("treeAccount.publicKey", treeAccount.publicKey);
        console.log("collectionKeypair.publicKey", collectionKeypair.publicKey);

        // And a Collection NFT.
        const collectionMint = generateSigner(umi);

        const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          );

        const txCreateNFT = await createNft(umi, {
            mint: collectionMint,
            name: 'PixSol Collection',
            uri: 'ipfs://bafybeia3wuho4sfnks5vvd76qbbnnd5yqr2zoeiriskrlowzgjb5fqeuie/',
            sellerFeeBasisPoints: percentAmount(5.5), // 5.5%
            isCollection: true,
        }).sendAndConfirm(umi);
        console.log("txCreateNFT", txCreateNFT);
        umi.programs.add(SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID)

        const tx = await mintToCollectionV1(umi, {
            treeConfig: treeConfig.publicKey,
            leafOwner: leafOwner,
            merkleTree: treeAccount.publicKey,
            collectionMint: collectionMint.publicKey,
            metadata: {
              name: name,
              symbol: 'PXS',
              isMutable: false,
              uri: 'ipfs://bafybeia3wuho4sfnks5vvd76qbbnnd5yqr2zoeiriskrlowzgjb5fqeuie/',
              sellerFeeBasisPoints: 500, // 5%
              collection: { key: umi.identity.publicKey, verified: false },
              creators: [
                { address: umi.identity.publicKey, verified: false, share: 100 },
              ],
            },
        }).sendAndConfirm(umi)
        console.log("tx:", tx);

        console.log('Mint To Collection successfully.');
    } catch (error) {
        console.error('Error fetching Merkle Tree:', error);
    }
}


// Fonction principale
async function main() {
    console.log('Main starts...');

    // TODO: Store the publicKey from the mint, into a file. Then load the file here.
    const treeAddress = "7VYvSpAZY9TGeVA1FuBU7LpuUmLRJrKaq7kWwYPNsZtD";
    const merkleTreePublicKey3 = new PublicKey(treeAddress);

    // Display tree information
    const treeConfig = await fetchTreeConfigFromSeeds(umi, {
        merkleTree: publicKey(merkleTreePublicKey3),
    });
    console.log('Tree Config:', treeConfig);

    const merkleTreeAccount = await fetchMerkleTree(umi, merkleTreePublicKey3);
    console.log('Tree Account:', merkleTreeAccount);

    //const context = { rpc: umi.rpc };
    //await createMerkleTree(context);
    //await fetchTree(treeAddress);

    const x1=50;
    const y1=50;
    await mintCNFTcollection(treeAddress, x1, y1);

    const x2=51;
    const y2=51;
    //await mintCNFTcollection(treeAddress, x2, y2);

    //await fetchTree(treeAddress);
    console.log('Main ends...');
}

main().catch(console.error);
function loadWalletKey(arg0: string) {
    throw new Error('Function not implemented.');
}
    
*/
