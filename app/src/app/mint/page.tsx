'use client'
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {SubmittedToast, SuccessToast, ErrorToast } from '../components/ToastParty';
import { Box, Button, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast } from '@chakra-ui/react';

export default function MintPage() {
  const { publicKey, connected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const toast = useToast();

  const handleMint = async () => {
    if (!publicKey) return;

    setIsMinting(true);
    setMintResult(null);

    try {

      toast({
        title: 'Transaction Submitted',
        description: 'Your transaction is being processed.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });

      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPublicKey: publicKey.toString() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Minting failed');
      }
      

      setMintResult(`NFT minted successfully! MintNumber: ${JSON.stringify(data.mintNumber)}, signature: ${JSON.stringify(data.signature)}`);
      <SuccessToast signature={data.signature} />
    } catch (error) {
      console.error('Minting error:', error);
      setMintResult('Minting failed. Please try again.');
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      <ErrorToast />
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Box p={5} className="max-w-4xl mx-auto">
      <Tabs variant="enclosed" className="bg-gray-100 rounded-lg shadow-md">
        <TabList className="bg-white border-b border-gray-200">
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">Mint NFT</Tab>
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">My Collection</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Box className="p-6">
              <Text fontSize="2xl" className="mb-4 font-bold text-gray-800">Mint Your NFT</Text>
              {!connected ? (
                <Text className="text-red-500">Please connect your wallet to mint.</Text>
              ) : (
                <Box>
                  <Text className="mb-4 text-sm text-gray-600">Connected: {publicKey?.toBase58()}</Text>
                  <Button
                    onClick={handleMint}
                    isLoading={isMinting}
                    loadingText="Minting..."
                    colorScheme="blue"
                    className="w-full sm:w-auto px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Mint NFT
                  </Button>
                </Box>
              )}
              {mintResult && <Text className="mt-4 text-green-600">{mintResult}</Text>}
            </Box>
          </TabPanel>
          <TabPanel>
            <Box className="p-6">
              <Text fontSize="2xl" className="mb-4 font-bold text-gray-800">My Collection</Text>
              <Text className="text-gray-600">Your NFT collection will be displayed here.</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}