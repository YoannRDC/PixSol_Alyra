'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import styles from '../styles/InfoBoard.module.css'
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutableDictionary } from '../hooks/useMutableDictionary';

interface InfoBoardProps {
  selectedArea: {start: {x: number, y: number}, end: {x: number, y: number}} | null
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
  onBuy: () => void
}

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedArea, onColorChange, onImageUpload, onBuy }) => {

  // Front imports
  const { setVisible } = useWalletModal()
  const [selectedOption, setSelectedOption] = useState<'color' | 'image'>('color')
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Back imports
  const { 
    updateByBatch,
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

  const isMultiplePixelsSelected = useMemo(() => {
    if (!selectedArea) return false
    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width > 1 || height > 1
  }, [selectedArea])

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
    } catch (error) {
      console.error('Batch update failed:', error instanceof Error ? error.message : String(error));
      setUpdateStatus(`Batch update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleColorPixelButtonClick = async () => {

    if (selectedArea) {

      // Convert the pixel selection Position to ids. 
      const pixels: number[] = [];
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          pixels.push(y * 20 + x + 1);
        }
      }

      const pixelString = pixels.join(',');
      setBatchIds(pixelString);

      handleUpdateByBatch();
 
    } else {
      const errorMsg = 'Select an Area before Change color.';
      setError(errorMsg);
      console.error(errorMsg);
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && isMultiplePixelsSelected) {
      onImageUpload(file)
    }
  }

  return (
    <div className={styles.infoBoard}>
      {selectedArea ? (
        <>
          <h2>Selected Area</h2>
          <p>From: x{selectedArea.start.x}y{selectedArea.start.y}</p>
          <p>To: x{selectedArea.end.x}y{selectedArea.end.y}</p>
          <div>
            <button className={styles.imageButton} onClick={() => setSelectedOption('color')}>Color</button>
            <button 
            className={styles.imageButton}
              onClick={() => setSelectedOption('image')}
              disabled={!isMultiplePixelsSelected}
              title={!isMultiplePixelsSelected ? "Select at least 2x2 pixels for image upload" : ""}
            >
              Image
            </button>
          </div>
          {selectedOption === 'color' ? (
            <ColorWheel 
              onChange={color => onColorChange(color.toString('hex'))} 
              UNSAFE_style={{ width: '150px', height: '150px' }} 
            />
          ) : (
            isMultiplePixelsSelected ? (
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            ) : (
              <p>Select at least 2x2 pixels to upload an image</p>
            )
          )}
        </>
      ) : (
        <p>Select a Pixel or an area on the pixel board</p>
      )}
      <button 
        onClick={handleColorPixelButtonClick} 
        className={styles.buyButton}
        disabled={connected && !selectedArea}
      >
        {connected ? (selectedArea ? 'Color Pixel(s)' : 'Select Pixel(s) to Color') : 'Connect Wallet to Paint'}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">{success}</p>}
      {updateStatus && <p className="text-green-500 mt-4">{updateStatus}</p>}
    </div>
  )
}

export default InfoBoard

