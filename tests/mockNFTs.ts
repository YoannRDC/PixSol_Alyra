interface NFT {
    id: number;
    name: string;
    uri: string;
    symbol: string;
}

class NFTCollection {
    private nfts: NFT[] = [];

    constructor(size: number = 10000) {
        this.generateCollection(size);
    }

    private generateCollection(size: number) {
        for (let i = 0; i < size; i++) {
            this.nfts.push({
            id: i + 1,
            name: `Pixel #${i + 1}`,
            uri: `https://example.com/metadata/${i + 1}.json`,
            symbol: 'PXL',
            });
        }
    }

    getNFTById(id: number): NFT | undefined {
        return this.nfts.find(nft => nft.id === id);
    }

    getAllNFTs(): NFT[] {
        return this.nfts;
    }

    getRandomNFT(): NFT {
        const randomIndex = Math.floor(Math.random() * this.nfts.length);
        return this.nfts[randomIndex];
    }
}

module.exports = NFTCollection;

// In your test file
/**
describe('NFT Collection Tests', () => {
    let collection: NFTCollection;

    before(() => {
        collection = new NFTCollection();
    });

    it('should have 1000 NFTs', () => {
        assert.equal(collection.getAllNFTs().length, 1000);
    });

    it('should retrieve a specific NFT', () => {
        const nft = collection.getNFTById(500);
        assert.equal(nft?.id, 500);
        assert.equal(nft?.name, 'Pixel #500');
    });

    it('should return undefined for non-existent NFT', () => {
        const nft = collection.getNFTById(1001);
        assert.isUndefined(nft);
    });

    it('should return a random NFT', () => {
        const nft = collection.getRandomNFT();
        assert.isObject(nft);
        assert.isNumber(nft.id);
        assert.isString(nft.name);
    });
});
 */