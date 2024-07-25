'use client'

import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { publicKey } from '@metaplex-foundation/umi';
import { useMutableDictionary } from '../hooks/useMutableDictionary'; 
import { SubmittedToast, SuccessToast, ErrorToast } from '../components/ToastParty';
import { useToast } from '@chakra-ui/react';

const SPECIFIC_TREE_KEY = '4zUUwSvaL3jagoYZHW7ArUtNj2xKTbN7Hk7PSxn5D7Kc';

export default function WithDrawPage() {
  const wallet = useWallet();
  const [isPixsolOwner, setIsPixsolOwner] = useState<boolean>(false);
  const [pixsolNfts, setPixsolNfts] = useState<any[]>([]);
  const [dictionaryInfo, setDictionaryInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [withdrawStatus, setWithdrawStatus] = useState('');
  const [triggerUpdateBDD, setTriggerUpdateBDD] = useState(false);

  const toast = useToast();

  const { 
    readDictionaryInfo, 
    withdrawAndResetByBatch,
  } = useMutableDictionary();

  useEffect(() => {
    const checkPixsolOwnership = async () => {
      setIsLoading(true);
      if (!wallet.connected || !wallet.publicKey) {
        setIsPixsolOwner(false);
        setPixsolNfts([]);
        setIsLoading(false);
        return;
      }
      try {

        const umi = createUmi(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com')
          .use(dasApi());

        const ownerPublicKey = new PublicKey(wallet.publicKey.toBase58());
        const assets = await fetchAssetsByOwner(umi, ownerPublicKey);

        const specificNfts = await Promise.all(assets.map(async (asset: { id: string; }) => {
          const isFromTree = await checkAssetInTree(umi, asset.id);
          return isFromTree ? asset : null;
        }));

        const filteredNfts = specificNfts.filter(nft => nft !== null);
        
        setPixsolNfts(filteredNfts);
        setIsPixsolOwner(filteredNfts.length > 0);

        const dictionaryInfo = await readDictionaryInfo();
        setDictionaryInfo(dictionaryInfo);
      } catch (error) {
        console.error('Error checking PIXSOL ownership:', error);
        setIsPixsolOwner(false);
        setPixsolNfts([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkPixsolOwnership();
  }, [wallet.connected, wallet.publicKey, readDictionaryInfo]);

  const withdrawableAmount = useMemo(() => {
    if (!dictionaryInfo || pixsolNfts.length === 0) return 0;
    return pixsolNfts.reduce((total, nft) => {
      const id = parseInt(nft.content?.metadata?.name);
      const entry = dictionaryInfo.entries.find((e: { id: number; }) => e.id === id);
      return total + (entry ? entry.value * 5000000 : 0);
    }, 0);
  }, [pixsolNfts, dictionaryInfo]);

  const checkAssetInTree = async (umi: any, assetId: string) => {
    try {
      const proof = await umi.rpc.getAssetProof(publicKey(assetId));
      return proof.tree_id === SPECIFIC_TREE_KEY;
    } catch (e) {
      console.error('Error checking asset proof:', e);
      return false;
    }
  };

  const fetchAssetsByOwner = async (umi: any, ownerPublicKey: PublicKey) => {
    const { items } = await umi.rpc.getAssetsByOwner({
      owner: publicKey(ownerPublicKey.toBase58()),
    });
    return items;
  };

  const handleWithdraw = async () => {
    console.log("Withdraw function triggered");
    setWithdrawStatus('Processing...');
    toast({
      duration: 2000,
      render: () => <SubmittedToast />
    });

    try {
      const ids = pixsolNfts.map(nft => parseInt(nft.content?.metadata?.name));
      const tx = await withdrawAndResetByBatch(ids);
      const successMsg = `Withdrawal successful. Transaction signature: ${tx}`;
      
      setTriggerUpdateBDD(true);
      // Optionally, you can refresh the data here
      setWithdrawStatus(successMsg);

      toast({
        duration: 7000,
        isClosable: true,
        render: () => <SuccessToast signature={tx} />
      });
    } catch (error) {
      console.error('Error during withdrawal:', error instanceof Error ? error.message : String(error));
      setWithdrawStatus('Withdrawal failed. Please try again.');
      toast({
        duration: 7000,
        isClosable: true,
        render: () => <ErrorToast errorMessage={error instanceof Error ? error.message : String(error)} />
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-700 text-white p-8">
      <h1 className="text-4xl font-bold mb-6 text-center">WITHDRAW ZONE</h1>
      
      {isPixsolOwner ? (
        <div className="max-w-3xl mx-auto bg-white bg-opacity-20 rounded-lg p-8 backdrop-blur-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Bienvenue, Propriétaire PIXSOL!</h2>
          <p className="text-lg mb-4">Nombre de cNFTs PIXSOL : {pixsolNfts.length}</p>
          <p className="text-lg mb-4">Montant retirable : {withdrawableAmount} (Lamports)</p>
          <button 
            onClick={handleWithdraw}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Retirer les fonds
          </button>
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Vos cNFTs PIXSOL :</h3>
            <ul className="list-disc list-inside">
              {pixsolNfts.map((nft) => {
                const id = parseInt(nft.content?.metadata?.name);
                const entry = dictionaryInfo?.entries.find((e: { id: number; }) => e.id === id);
                const value = entry ? entry.value * 5000000 : 0;
                return (
                  <li key={nft.id}>
                    {nft.content?.metadata?.name || nft.id.slice(0, 8)} - Valeur retirable: {value}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white bg-opacity-20 rounded-lg p-8 backdrop-blur-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Vous n'êtes pas un propriétaire PIXSOL</h2>
          <p className="text-xl">Connectez-vous avec un wallet contenant des NFTs PIXSOL pour accéder aux fonctionnalités du DAO.</p>
        </div>
      )}
    </div>
  );
}