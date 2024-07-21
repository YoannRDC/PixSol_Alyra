'use client'
import { useState, useEffect } from 'react';
import { useMutableDictionary } from '../hooks/useMutableDictionary';
import { useWallet } from '@solana/wallet-adapter-react';


export default function HttpWebsocketPage() {
    const { 
      readDictionaryInfo, 
      readVaultInfo, 
      updatePixel, 
      withdrawAndReset, 
      updateByBatch, 
      withdrawAndResetByBatch,
      isInitializing, 
      programInitialized 
    } = useMutableDictionary();
  const { connected } = useWallet();
  const [dictionaryInfo, setDictionaryInfo] = useState<any>(null);
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [pixelId, setPixelId] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(10000000); // 0.01 SOL in lamports
  const [batchIds, setBatchIds] = useState<string>('');
  const [batchDepositAmount, setBatchDepositAmount] = useState<number>(20000000);

  useEffect(() => {
    if (connected && programInitialized) {
      fetchInfo();
    }
  }, [connected, programInitialized]);

  const fetchInfo = async () => {
    try {
      const dictInfo = await readDictionaryInfo();
      setDictionaryInfo(dictInfo);
      const vInfo = await readVaultInfo();
      setVaultInfo(vInfo);
    } catch (error) {
      console.error('Error fetching info:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleUpdatePixel = async () => {
    if (!connected) {
      setUpdateStatus('Please connect your wallet first.');
      return;
    }

    if (!programInitialized) {
      setUpdateStatus('Program is not initialized yet. Please wait.');
      return;
    }

    setUpdateStatus('Updating pixel...');
    try {
      const tx = await updatePixel(pixelId, depositAmount);
      setUpdateStatus(`Pixel update successful. Transaction signature: ${tx}`);
      await fetchInfo(); // Refresh info after update
    } catch (error) {
      console.error('Pixel update failed:', error instanceof Error ? error.message : String(error));
      setUpdateStatus(`Pixel update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const handleWithdrawAndReset = async () => {
    if (!connected || !programInitialized) {
      setUpdateStatus('Please connect your wallet and wait for program initialization.');
      return;
    }

    setUpdateStatus('Withdrawing and resetting...');
    try {
      const tx = await withdrawAndReset(pixelId);
      setUpdateStatus(`Withdraw and reset successful. Transaction signature: ${tx}`);
      await fetchInfo();
    } catch (error) {
      console.error('Withdraw and reset failed:', error instanceof Error ? error.message : String(error));
      setUpdateStatus(`Withdraw and reset failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateByBatch = async () => {
    if (!connected || !programInitialized) {
      setUpdateStatus('Please connect your wallet and wait for program initialization.');
      return;
    }

    const ids = batchIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length === 0) {
      setUpdateStatus('Please enter valid pixel IDs for batch update.');
      return;
    }

    setUpdateStatus('Updating pixels in batch...');
    try {
      const tx = await updateByBatch(ids, batchDepositAmount);
      setUpdateStatus(`Batch update successful. Transaction signature: ${tx}`);
      await fetchInfo();
    } catch (error) {
      console.error('Batch update failed:', error instanceof Error ? error.message : String(error));
      setUpdateStatus(`Batch update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleWithdrawAndResetByBatch = async () => {
    if (!connected || !programInitialized) {
      setUpdateStatus('Please connect your wallet and wait for program initialization.');
      return;
    }

    const ids = batchIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length === 0) {
      setUpdateStatus('Please enter valid pixel IDs for batch withdraw and reset.');
      return;
    }

    setUpdateStatus('Withdrawing and resetting pixels in batch...');
    try {
      const tx = await withdrawAndResetByBatch(ids);
      setUpdateStatus(`Batch withdraw and reset successful. Transaction signature: ${tx}`);
      await fetchInfo();
    } catch (error) {
      console.error('Batch withdraw and reset failed:', error instanceof Error ? error.message : String(error));
      setUpdateStatus(`Batch withdraw and reset failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (isInitializing) {
    return <div className="flex justify-center items-center h-screen">Initializing program...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Mutable Dictionary</h1>

      {connected ? (
        programInitialized ? (
          <>
            <div className="mb-4">
              <input 
                type="number" 
                value={pixelId}
                onChange={(e) => setPixelId(Number(e.target.value))}
                className="mr-2 p-2 border rounded"
                placeholder="Pixel ID"
              />
              <input 
                type="number" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="mr-2 p-2 border rounded"
                placeholder="Deposit Amount (lamports)"
              />
              <button
                onClick={handleUpdatePixel}
                className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                Update Pixel
              </button>
              <button
              onClick={handleWithdrawAndReset}
              className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
            >
              Withdraw and Reset
            </button>

            </div>

            <div className="mb-4">
            <input 
              type="text" 
              value={batchIds}
              onChange={(e) => setBatchIds(e.target.value)}
              className="mr-2 p-2 border rounded"
              placeholder="Pixel IDs (comma-separated)"
            />
            <input 
              type="number" 
              value={batchDepositAmount}
              onChange={(e) => setBatchDepositAmount(Number(e.target.value))}
              className="mr-2 p-2 border rounded"
              placeholder="Batch Deposit Amount (lamports)"
            />
            <button
              onClick={handleUpdateByBatch}
              className="px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
            >
              Update by Batch
            </button>
            <button
                onClick={handleWithdrawAndResetByBatch}
                className="px-4 py-2 font-bold text-white bg-yellow-500 rounded hover:bg-yellow-700"
              >
                Withdraw and Reset by Batch
              </button>
          </div>
            
            <button
              onClick={fetchInfo}
              className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 mb-4"
            >
              Refresh Info
            </button>

            {dictionaryInfo && (
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Dictionary Info:</h2>
                <pre className="bg-gray-100 p-2 rounded max-h-[100px] overflow-auto">
                  {JSON.stringify(dictionaryInfo, null, 2)}
                </pre>
              </div>
            )}

            {vaultInfo && (
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Vault Info:</h2>
                <pre className="bg-gray-100 p-2 rounded max-h-[100px] overflow-auto">
                {JSON.stringify({
        ...vaultInfo,
        totalBalance: `(${vaultInfo.totalBalance} lamports)`
      }, null, 2)}
                </pre>
              </div>
            )}
          </>
        ) : (
          <p className="text-red-500">Program failed to initialize. Please refresh the page and try again.</p>
        )
      ) : (
        <p className="text-red-500">Please connect your wallet to interact with the Mutable Dictionary.</p>
      )}

      {updateStatus && (
        <p className="mt-4 text-sm text-gray-600">{updateStatus}</p>
      )}
    </div>
  );
}