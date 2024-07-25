'use client';
import axios from "axios";
//import WebSocket from 'ws';
//import dotenv from 'dotenv';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SubmittedToast, SuccessToast, ErrorToast } from '../components/ToastParty';
import { Box, Button, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast } from '@chakra-ui/react';

// Constants
const LAMPORTS_PER_SOL = 1_000_000;

// Interfaces
interface WalletRequests {
    [key: number]: string;
}

interface WalletSubscriptions {
    [key: number]: string;
}

interface WalletTransactions {
    wallet: string;
    sols: number;
    timestamp: number;
}

interface TokenAccounts {
    [key: string]: string; // name - address
}

// Store the mapping between the wallet and the listeners id.
const walletRequests: WalletRequests = {};
let currentRequestId = 1;

// Store the mapping between the wallet and its subscription id.
const walletSubscriptions: WalletSubscriptions = {};

// Store the mapping between the wallet and its subscription id.
const walletTransactions: WalletTransactions[] = [];

// Token accounts to follow.
const tokenAccounts: TokenAccounts = {};

function subscribeToAccount(ws: any, account: any) {
  const requestData = {
      "jsonrpc": "2.0",
      "id": currentRequestId,
      "method": "accountSubscribe",
      "params": [
          account,
          {
              "encoding": "jsonParsed",
              "commitment": "finalized"
          }
      ]
  };
  walletRequests[currentRequestId] = account;
  currentRequestId++;
  ws.send(JSON.stringify(requestData));
}

export default function MintPage() {
  const { publicKey, connected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const [webSocketMsg, setWebSocketMsg] = useState<string | null>(null);
  const toast = useToast();
  const hasLaunchedWSS = useRef(false);
  const [httpMsg, setHttpMsg] = useState<any[]>([]);

  useEffect(() => {
    if (!hasLaunchedWSS.current) {
      // Launch WebSocket connection
      launchWSS();
      hasLaunchedWSS.current = true;
    }
  }, []);

  const handleMint = async () => {
    console.log("handleMint ...");

    if (!publicKey) return;

    setIsMinting(true);
    setMintResult(null);

    toast({
      duration: 5000,
      isClosable: true,
      render: () => <SubmittedToast />
    });

    try {
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
      
      toast({
        duration: 7000,
        isClosable: true,
        render: () => <SuccessToast signature={data.signature} />
      });

    } catch (error) {
      console.error('Minting error:', error);
      setMintResult('Minting failed. Please try again.');
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        duration: 7000,
        isClosable: true,
        render: () => <ErrorToast errorMessage={errorMessage} />
      });

    } finally {
      setIsMinting(false);
    }
  };

  const launchWSS = () => {
    console.log("launchWSS ... ");

    const solanaRpcWssAlchemy = "wss://api.devnet.solana.com";
    if (!solanaRpcWssAlchemy) {
        throw new Error('SOLANA_RPC_WSS_ALCHEMY is not defined in the .env file');
    }
    const ws = new WebSocket(solanaRpcWssAlchemy);

    ws.onopen = () => {
      console.log('connected');

      const pixsolTokenMerkleTree_devnet = "4zUUwSvaL3jagoYZHW7ArUtNj2xKTbN7Hk7PSxn5D7Kc"; 

      subscribeToAccount(ws, pixsolTokenMerkleTree_devnet);
    };

    ws.onmessage = (event) => {
      const jsonMessage = event.data;
      console.log('Wallet event receiver ...');

      const wsMsg = JSON.parse(jsonMessage.toString());

      if (wsMsg.id) {
        const walletAddress = walletRequests[wsMsg.id];

        if (walletAddress) {
            walletSubscriptions[wsMsg.result] = walletAddress;
            console.log('Subscribed to wallet:', walletAddress, 'with subscription ID:', wsMsg.result);
        }
      } else if (wsMsg.method === "accountNotification") {
        const subscriptionId = wsMsg.params.subscription;
        const walletAddress = walletSubscriptions[subscriptionId];

        if (walletAddress) {
          const lamports = wsMsg.params.result.value.lamports;
          const sols = lamports / LAMPORTS_PER_SOL;
          const timestamp = Date.now();

          // console.log('Wallet %s, sol balance: %s', walletAddress, sols);

          if (wsMsg.result && wsMsg.result.value && wsMsg.result.value.data && wsMsg.result.value.data.parsed) {
              const accountData = wsMsg.result.value.data.parsed;
              if (accountData.info && accountData.info.mint) {
              const mintAddress = accountData.info.mint;
              const tokenName = Object.keys(tokenAccounts).find(key => tokenAccounts[key] === mintAddress);
              if (tokenName) {
                  console.log(`Interaction détectée avec le token ${tokenName} (${mintAddress})`);
              }
              }
          }

          walletTransactions.push({
              wallet: walletAddress,
              sols: sols,
              timestamp: timestamp
          });

          console.log(" --------------------------------------------");
          console.log("[   Wallet Address                             , Bal(Sol),  Timestamp          ]");
          
          let walletContent = `
            <table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid black; padding: 8px;">Wallet Address</th>
                  <th style="border: 1px solid black; padding: 8px;">Balance (Sol)</th>
                  <th style="border: 1px solid black; padding: 8px;">Timestamp</th>
                </tr>
              </thead>
            <tbody>
          `;
          
          walletTransactions.forEach(transaction => {
              const logMessage = `[ ${transaction.wallet} , ${transaction.sols.toFixed(2)} , ${new Date(transaction.timestamp).toLocaleString()} ]`;
              console.log(logMessage);
              walletContent += `
              <tr>
                  <td style="border: 1px solid black; padding: 8px;">${transaction.wallet}</td>
                  <td style="border: 1px solid black; padding: 8px;">${transaction.sols.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 8px;">${new Date(transaction.timestamp).toLocaleString()}</td>
              </tr>
          `;
          });

          walletContent += `</tbody></table>`;
          
          console.log(" --------------------------------------------");
          
          setWebSocketMsg(walletContent);
            
        }
      }
    };

    ws.onclose = () => {
        console.log('disconnected');
        currentRequestId = 1;
    };
  };

  const handleHttpButtonClick = () => {

    const pixsolTokenMerkleTree_devnet = "4zUUwSvaL3jagoYZHW7ArUtNj2xKTbN7Hk7PSxn5D7Kc"; 

    // Appel de la fonction pour récupérer les transactions
    getLastTransactionsForProgram(pixsolTokenMerkleTree_devnet);


  };

  // Function to get the last x confirmed transactions for a given Solana program
  async function getLastTransactionsForProgram(programAddress: string) {
    try {
        const solanaRpcWssAlchemy = "https://api.devnet.solana.com";
        const response = await axios.post(solanaRpcWssAlchemy, {
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [programAddress, { limit: 3 }],
        });

        const transactions = response.data.result;

        // Process each transaction
        transactions.forEach((transaction: any) => {
            console.log('Transaction BlockTime:', convertBlocktimeToDate(transaction.blockTime));
        });

        // Set the transactions to the state
        setHttpMsg(transactions);
        
        console.log(' -----------------------------------');
        console.log('Transactions bruts:', transactions);

        const blockTimes = transactions.map((tx: { blockTime: any; }) => tx.blockTime);
        blockTimes.forEach((blockTime: any) => console.log('Transaction BlockTime:', convertBlocktimeToDate(blockTime)));

    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
  }

  function convertBlocktimeToDate(blocktime: any) {
    // Convert the blocktime to milliseconds
    const date = new Date(blocktime * 1000);
  
    // Format the date
    const formattedDate = date.toLocaleString();
  
    return formattedDate;
  }

  const headingStyle: React.CSSProperties = {
    fontSize: '20px',
    textDecoration: 'underline',
  };

  return (
    <Box p={5} className="max-w-4xl mx-auto">
      <Tabs variant="enclosed" className="bg-gray-100 rounded-lg shadow-md">
        <TabList className="bg-white border-b border-gray-200">
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">Mint NFT</Tab>
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
        </TabPanels>
      </Tabs>
      <div>
        <br></br>
        <Button onClick={handleHttpButtonClick} colorScheme="teal" className="mt-4">Read the last 3 transactions of the Merkle Tree</Button>
        {httpMsg && (
          <div className="mt-2">
            {httpMsg.map((msg, index) => (
              <div key={index} className="mb-2 p-2 border border-gray-200 rounded">
                <Text>Signature: {msg.signature}</Text>
                <Text>Slot: {msg.slot}</Text>
                <Text>Block Time: {convertBlocktimeToDate(msg.blockTime)}</Text>
                <Text>Status: {msg.confirmationStatus}</Text>
              </div>
            ))}
          </div>
        )}
        <br></br><br></br>
        <h1 style={headingStyle}>Websocket listener on MerkleTree wallet:</h1>
        {webSocketMsg && (
          <> 
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: webSocketMsg }}></div>
          </>
        )}
      </div>
    </Box>
  );
}
