import MintPageClient from './MintPageClient';

export default function MintPage() {
  return (
    <div className="mint-page">
      <h1 className="text-3xl font-bold mb-4">Mint cNFT</h1>
      <MintPageClient />
    </div>
  );
}