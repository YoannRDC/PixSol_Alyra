'use client'

import { useState, useCallback, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import PixelBoard from './components/PixelBoard'
import InfoBoard from './components/InfoBoard'
import styles from './styles/page.module.css'

// WARNING: CHANGE ALSO IN INFO BORAD
const BOARD_SIZE = 10; // grid size


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
        const pixels = await response.json();
        const newPixelData = pixels.reduce((acc: { [key: string]: { color: string, owner: string } }, pixel: any) => {
          acc[pixel.address] = { color: pixel.color, owner: pixel.owner };
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

  const handleBuy = useCallback(async () => {
    if (selectedArea && publicKey) {
      const pixelsToBuy: {[key: string]: string} = {}
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`
          if (pixelData[key]) {
            pixelsToBuy[key] = pixelData[key].color
          }
        }
      }

      const numPixels = Object.keys(pixelsToBuy).length;
      const totalCost = numPixels * 0.01 * 1e9; // 0.01 SOL per pixel, converted to lamports

      const recipientPubkey = new PublicKey("M88kr8ntGbL6heuAYRXf4DULABTahMgEjje1sBkhFGD");

      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: totalCost,
          })
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');

        console.log("Transaction signature", signature);

        // Call your API to update the pixel data
        const response = await fetch('/api/buy-pixels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pixels: pixelsToBuy,
            owner: publicKey.toString(),
            signature: signature,
          }),
        });

        if (response.ok) {
          console.log('Pixels bought successfully');
          // Refresh pixel data after purchase
          const refreshResponse = await fetch('/api/pixels');
          const refreshedPixels = await refreshResponse.json();
          const newPixelData = refreshedPixels.reduce((acc: { [key: string]: { color: string, owner: string } }, pixel: any) => {
            acc[pixel.address] = { color: pixel.color, owner: pixel.owner };
            return acc;
          }, {} as { [key: string]: { color: string, owner: string } });
          setPixelData(newPixelData);
        } else {
          console.error('Error buying pixels');
        }
      } catch (error) {
        console.error('Error buying pixels:', error);
      }

      setSelectedArea(null)
    }
  }, [selectedArea, publicKey, connection, pixelData, sendTransaction]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pixel Board</h1>
      <div className={styles.content}>
        <div className={styles.pixelBoard}>
          <PixelBoard 
            onSelectionChange={handleSelectionChange} 
            pixelData={pixelData} 
            boardSize={BOARD_SIZE}
            isLoading={isLoading}
            {...({} as any)}
          />
        </div>
        <div className={styles.infoBoard}>
          <InfoBoard
            selectedArea={selectedArea}
            onColorChange={handleColorChange}
            onImageUpload={handleImageUpload}
            onBuy={handleBuy}
            isLoading={isLoading}
            {...({} as any)}
            isConnected={!!publicKey}
          />
        </div>
      </div>
    </div>
  )
}