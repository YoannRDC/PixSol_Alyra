'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Box, Button, Heading, Text, Flex, VStack, Input, Divider } from '@chakra-ui/react';

// Back needs
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  fetchMerkleTree,
  mintV1, 
  mplBubblegum,
  fetchTreeConfigFromSeeds
} from "@metaplex-foundation/mpl-bubblegum";
import { 
  signerIdentity, 
  transactionBuilder, 
  publicKey, 
  Signer, 
  generateSigner 
} from '@metaplex-foundation/umi';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { AnchorProvider, Program } from '@project-serum/anchor';
import * as anchor from "@project-serum/anchor";
import { confirmTx } from '../utils/helper';

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
      await fetchInfo();
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
      console.log('Selected pixels:', pixels);
      console.log('Selected pixels (json):', JSON.stringify(pixels));
      setBatchIds(JSON.stringify(pixels));

      // setBatchDepositAmount(); // Default values are fine.
      console.log('BatchDepositAmount:', JSON.stringify(batchDepositAmount) );
      handleUpdateByBatch();
      onBuy()
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
    <Box p={5} border="1px" borderColor="gray.200" borderRadius="md">
      {selectedArea ? (
        <VStack spacing={4} align="stretch">
          <Heading size="md">Selected Area</Heading>
          <Flex justifyContent="space-between">
            <VStack spacing={2} align="stretch">
              <Text>From: x{selectedArea.start.x} y{selectedArea.start.y}</Text>
              <Text>To: x{selectedArea.end.x} y{selectedArea.end.y}</Text>
            </VStack>
            <Divider orientation="vertical" />
            <VStack spacing={2} align="stretch">
              <Text>Pixel Resolution:</Text>
              <Text>{Math.abs(selectedArea.end.x - selectedArea.start.x) + 1} x {Math.abs(selectedArea.end.y - selectedArea.start.y) + 1}</Text>
            </VStack>
          </Flex>
          <Flex>
            <Button 
              onClick={() => setSelectedOption('color')} 
              colorScheme={selectedOption === 'color' ? 'blue' : 'gray'} 
              mr={2}
            >
              Color
            </Button>
            <Button 
              onClick={() => setSelectedOption('image')} 
              colorScheme={selectedOption === 'image' ? 'blue' : 'gray'} 
              disabled={!isMultiplePixelsSelected}
              title={!isMultiplePixelsSelected ? "Select at least 2x2 pixels for image upload" : ""}
            >
              Image
            </Button>
          </Flex>
          {selectedOption === 'color' ? (
            <ColorWheel onChange={color => onColorChange(color.toString('hex'))} />
          ) : (
            isMultiplePixelsSelected ? (
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            ) : (
              <Text>Select at least 2x2 pixels to upload an image</Text>
            )
          )}
        </VStack>
      ) : (
        <Text>Select a Pixel or an area on the pixel board</Text>
      )}
      <Button 
        onClick={handleColorPixelButtonClick} 
        colorScheme="green" 
        mt={4}
        isDisabled={connected && !selectedArea}
      >
        {connected ? (selectedArea ? 'Color Pixel(s)' : 'Select Pixel(s) to Color') : 'Connect Wallet to Paint'}
      </Button>
      {error && <Text color="red.500" mt={4}>{error}</Text>}
      {success && <Text color="green.500" mt={4}>{success}</Text>}
    </Box>
  )
}

export default InfoBoard

function setUpdateStatus(arg0: string) {
  throw new Error('Function not implemented.')
}
function fetchInfo() {
  throw new Error('Function not implemented.')
}

