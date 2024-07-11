'use client'

import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import PixelBoard from './components/PixelBoard'
import InfoBoard from './components/InfoBoard'
import styles from './styles/page.module.css'

const BOARD_SIZE = 20; // 20x20 grid

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null)
  const [pixelData, setPixelData] = useState<{ [key: string]: { color?: string, imageData?: ImageData } }>({})
  const { publicKey, connected } = useWallet()

  const handleSelectionChange = useCallback((selection: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => {
    setSelectedArea(selection)
  }, [])

  const handleColorChange = useCallback((color: string) => {
    if (selectedArea) {
      const newPixelData = { ...pixelData }
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`
          newPixelData[key] = { color }
        }
      }
      setPixelData(newPixelData)
    }
  }, [selectedArea, pixelData])

  const handleImageUpload = useCallback((image: File) => {
    if (selectedArea) {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const width = selectedArea.end.x - selectedArea.start.x + 1
          const height = selectedArea.end.y - selectedArea.start.y + 1
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          const imageData = ctx.getImageData(0, 0, width, height)

          const newPixelData = { ...pixelData }
          for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
              const key = `x${selectedArea.start.x + x}y${selectedArea.start.y + y}`
              const index = (y * width + x) * 4
              const r = imageData.data[index]
              const g = imageData.data[index + 1]
              const b = imageData.data[index + 2]
              const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
              newPixelData[key] = { color }
            }
          }
          setPixelData(newPixelData)
        }
      }
      img.src = URL.createObjectURL(image)
    }
  }, [selectedArea, pixelData])

  const handleBuy = useCallback(async () => {
    if (selectedArea && connected && publicKey) {
      console.log('Buying pixels:', selectedArea, 'with wallet:', publicKey.toString())
      
      // Log all pixel addresses and their associated colors
      const pixelsToBuy: {[key: string]: string} = {}
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`
          if (pixelData[key] && pixelData[key].color) {
            pixelsToBuy[key] = pixelData[key].color!
          }
        }
      }
      console.log('Pixels to buy:', pixelsToBuy)

      // Here you would typically make an API call to process the purchase
      // await buyPixels(pixelsToBuy, publicKey.toString())

      // Then clear the selection and update the UI
      setSelectedArea(null)
    }
  }, [selectedArea, connected, publicKey, pixelData])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pixel Board</h1>
      <div className={styles.content}>
        <div className={styles.pixelBoard}>
          <PixelBoard 
            onSelectionChange={handleSelectionChange} 
            pixelData={pixelData} 
            boardSize={BOARD_SIZE}
          />
        </div>
        <div className={styles.infoBoard}>
          <InfoBoard
            selectedArea={selectedArea}
            onColorChange={handleColorChange}
            onImageUpload={handleImageUpload}
            onBuy={handleBuy}
          />
        </div>
      </div>
    </div>
  )
}