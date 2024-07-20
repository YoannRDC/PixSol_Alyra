import fetch from 'node-fetch';

const rpcEndpointUrl = "https://api.devnet.solana.com";  // Replace with your RPC endpoint URL

interface AssetResponse {
    jsonrpc: string;
    result: {
        interface: string;
        id: string;
        content: object;
        authorities: Array<object>;
        compression: {
            eligible: boolean;
            compressed: boolean;
            data_hash: string;
            creator_hash: string;
            asset_hash: string;
            tree: string;
            seq: number;
            leaf_id: number;
        };
        grouping: Array<object>;
        royalty: object;
        creators: Array<object>;
        ownership: object;
        supply: object;
        mutable: boolean;
    };
    id: string;
}

async function getAsset(assetId: string): Promise<AssetResponse> {
    const response = await fetch(rpcEndpointUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAsset",
            params: {
                id: assetId,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: any = await response.json();
    return data;
}

// Example usage:
const assetId = "fuudBaDytxCVSHEF39SQspGo88HLgVhnhXSmd3iipLS";  // Replace with your asset ID
getAsset(assetId).then(asset => {
    console.log("Asset Data:", asset);
}).catch(err => {
    console.error("Error fetching asset data:", err);
});
