'use client'

import { useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import PixelBoard from './components/PixelBoard';
import InfoBoard from './components/InfoBoard';
import { Box, Heading, Flex } from '@chakra-ui/react';

export const fetchCache = 'force-no-store'; 
export const dynamic = "force-dynamic"

// WARNING: CHANGE ALSO IN INFO BORAD
const BOARD_SIZE = 10; // grid


export default function Home() {
  const [selectedArea, setSelectedArea] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null)
  const [pixelData, setPixelData] = useState<{ [key: string]: { color: string, owner: string } }>({})
  const [isLoading, setIsLoading] = useState(true)
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  useEffect(() => {
    const loadPixelData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/pixels');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const pixels = await response.json();
        const newPixelData = pixels.reduce((acc: { [key: string]: { color: string, player_pubkey: string } }, pixel: any) => {
          acc[pixel.address] = { color: pixel.color, player_pubkey: pixel.owner };
          return acc;
        }, {} as { [key: string]: { color: string, owner: string } });
        setPixelData(newPixelData);
      } catch (error) {
        console.error('Error loading pixel data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPixelData();
  }, []);

  const handleSelectionChange = useCallback((selection: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => {
    setSelectedArea(selection);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    if (selectedArea) {
      const newPixelData = { ...pixelData };
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`;
          newPixelData[key] = { ...newPixelData[key], color };
        }
      }
      setPixelData(newPixelData);
    }
  }, [selectedArea, pixelData]);

  const handleImageUpload = useCallback((image: File) => {
    if (selectedArea) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
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
              newPixelData[key] = { ...newPixelData[key], color };
            }
          }
          setPixelData(newPixelData);
        }
      };
      img.src = URL.createObjectURL(image);
    }
  }, [selectedArea, pixelData]);

  

  return (
    <Box className="flex flex-col h-screen p-4">
      <Heading as="h1" size="lg" className="text-center mb-4">Pixel Board</Heading>
      <Flex className="flex-1 gap-4">
        <Box className="flex-1 h-full overflow-hidden">
          <PixelBoard 
            onSelectionChange={handleSelectionChange} 
            pixelData={pixelData} 
            boardSize={BOARD_SIZE}
            isLoading={isLoading}
            onColorChange={handleColorChange}
            onImageUpload={handleImageUpload}
            //onBuy={handleBuy}
            isConnected={!!publicKey}
          />
        </Box>
      </Flex>
    </Box>
  );
}