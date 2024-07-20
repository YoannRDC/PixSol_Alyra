'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Box, Button, Heading, Text, Flex, VStack, Input, Divider, useToast } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutableDictionary } from '../hooks/useMutableDictionary';
import { walletAdapterIdentity } from '@metaplex-foundation/js'

// WARNING: CHANGE ALSO IN WITHDRAW PAGE
const BOARD_SIZE = 10; // grid size


interface SelectedArea {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

interface InfoBoardProps {
  selectedArea: SelectedArea | null
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
}

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedArea, onColorChange, onImageUpload }) => {
  const [selectedOption, setSelectedOption] = useState<'color' | 'image'>('color')

  // Back imports
  const { 
    updateByBatch,
    programInitialized 
  } = useMutableDictionary();
  const { connected, publicKey: player_pubkey } = useWallet();
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [batchIds, setBatchIds] = useState<string>('');
  const [batchDepositAmount, setBatchDepositAmount] = useState<number>(20000000);
  const [pixelIds, setPixelIds] = useState<number[]>([]);
  const [pixelData, setPixelData] = useState<{ [key: string]: { color: string, player_pubkey: string } }>({})
  const [isLoading, setIsLoading] = useState(true)

  const toast = useToast();

  const isMultiplePixelsSelected = useMemo(() => {
    if (!selectedArea) return false
    
    const pixels: number[] = []
    for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
      for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
        pixels.push(y * BOARD_SIZE + x);
      }
    }
    setPixelIds(pixels)

    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width > 1 || height > 1
  }, [selectedArea]);

  const isValidImageSelection = useMemo(() => {
    if (!selectedArea) return false
    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width >= 2 && height >= 2 && !(width === 2 && height === 1) && !(width === 1 && height === 2)
  }, [selectedArea])

  const handleUpdateByBatch = async () => {
    if (!connected || !programInitialized) {
      setUpdateStatus('Please connect your wallet and wait for program initialization.')
      return
    }

    const ids = batchIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    if (ids.length === 0) {
      setUpdateStatus('Please enter valid pixel IDs for batch update.')
      return
    }

    setUpdateStatus('Updating pixels in batch...')
    try {
      const tx = await updateByBatch(ids, batchDepositAmount)
      const successMsg = `Batch update successful. Transaction signature: ${tx}`
      setUpdateStatus(successMsg)
    } catch (error) {
      const errorMsg = `Batch update failed: ${error instanceof Error ? error.message : String(error)}`
      console.error('Batch update failed:', errorMsg)
      setUpdateStatus(errorMsg)
    }
  }

  const handleChangePixelColorButtonClick = async () => {
    if (selectedArea && player_pubkey) {
      
      // Convert the pixel selection Position to ids. 
      const pixelsUpdateCounter: number[] = [];
      const pixelsUpdateBDD: {[key: string]: string} = {}
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {

          // For the smart contract update
          pixelsUpdateCounter.push(y * BOARD_SIZE + x);

          // For the BDD update
          const key = `x${x}y${y}`;
          if (pixelData[key]) {
            pixelsUpdateBDD[key] = pixelData[key].color;
            console.log("pixelsUpdateBDD[key]:", pixelsUpdateBDD[key]);
          } else {
            console.log("unknown Pixel:");
          }
        }
      }
      console.log("pixelsUpdateCounter:", pixelsUpdateCounter);

      const pixelUpdateCounterString = pixelsUpdateCounter.join(',');
      console.log("pixelUpdateCounterString:", pixelUpdateCounterString);
      setBatchIds(pixelUpdateCounterString);

      handleUpdateByBatch();

      const isTransactionSuccess = true;
      if( isTransactionSuccess ) {

        console.log("publicKey:", player_pubkey.toString());
        console.log("pixelsUpdateBDD:", pixelsUpdateBDD);

        // Call your API to update the pixel data
        const response = await fetch('/api/pixels-color-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pixels: pixelsUpdateBDD,
            player_pubkey: player_pubkey.toString(),
          }),
        });

        console.log("response:", response);

      }
 
    } else {
      setSelectedOption('image')
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isValidImageSelection) {
      onImageUpload(file);
    }
  
    if (selectedArea && player_pubkey && file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log("Impossible d'obtenir le contexte 2D du canvas");
          return;
        }
        const width = selectedArea.end.x - selectedArea.start.x + 1;
        const height = selectedArea.end.y - selectedArea.start.y + 1;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const newPixelData = { ...pixelData };
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const key = `x${selectedArea.start.x + x}y${selectedArea.start.y + y}`;
            const index = (y * width + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            newPixelData[key] = { color, player_pubkey: player_pubkey.toString() };
          }
        }
        setPixelData(newPixelData);
        console.log("PixelData: ", pixelData);
      };
      img.onerror = () => {
        console.log("Erreur de chargement de l'image");
      };
      img.src = URL.createObjectURL(file);
    }
  }
  
  return (
    <Box p={5} border="1px" borderColor="gray.200" borderRadius="md">
      {selectedArea ? (
        <VStack spacing={4} align="stretch">
          <Heading size="md">Selected Area</Heading>
          <Flex justifyContent="space-between">
            <VStack spacing={2} align="stretch">
              <Text>From: x{selectedArea.start.x}, y{selectedArea.start.y}</Text>
              <Text>To: x{selectedArea.end.x}, y{selectedArea.end.y}</Text>
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
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={!isValidImageSelection}
              />
            ) : (
              <Text>Select at least 2x2 pixels to upload an image</Text>
            )
          )}
        </VStack>
      ) : (
        <Text>Select a Pixel or an area on the pixel board</Text>
      )}
      <Button 
        onClick={handleChangePixelColorButtonClick} 
        colorScheme="green" 
        mt={4}
        isDisabled={connected && !selectedArea}
      >
        {connected ? (selectedArea ? 'Color Pixel(s)' : 'Select Pixel(s) to Color') : 'Connect Wallet to Paint'}
      </Button>
    </Box>
  )
}

export default InfoBoard
