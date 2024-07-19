import { Metaplex, ReadApiConnection } from "@metaplex-foundation/js";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Set up the connection
const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");
const connection = new ReadApiConnection(CLUSTER_URL);
const assetpublickey = "fuudBaDytxCVSHEF39SQspGo88HLgVhnhXSmd3iipLS"

async function getAssetId(assetAddress: string) {
  const metaplex = Metaplex.make(connection);

  // Convert the asset address string to a PublicKey
  const assetPublicKey = new PublicKey(assetAddress);

  try {
    // Fetch the NFT by its address
    const nft = await metaplex.nfts().findByAssetId({ assetId: assetPublicKey });
    
    
    return nft;
  } catch (error) {
    console.error("Error fetching NFT:", error);
    throw error;
  }
}

// Usage
const assetAddress = "fuudBaDytxCVSHEF39SQspGo88HLgVhnhXSmd3iipLS";
getAssetId(assetAddress)
  .then(assetId => console.log( assetId))
  .catch(error => console.error("Failed to get Asset ID:", error));