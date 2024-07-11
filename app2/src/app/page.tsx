'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import PixelBoard from './components/PixelBoard'
import InfoBoard from './components/InfoBoard'
import styles from './styles/page.module.css'

export default function Home() {
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null)
  const [pixelColors, setPixelColors] = useState<{ [key: string]: string }>({})
  const { publicKey, connected } = useWallet()

  const handlePixelClick = (x: number, y: number) => {
    setSelectedPixel({ x, y })
  }

  const handleColorChange = (color: string) => {
    if (selectedPixel) {
      const key = `x${selectedPixel.x}y${selectedPixel.y}`
      setPixelColors(prev => ({ ...prev, [key]: color }))
    }
  }

  const handleBuy = async () => {
    if (selectedPixel && connected && publicKey) {
      const key = `x${selectedPixel.x}y${selectedPixel.y}`
      const color = pixelColors[key]
      
      try {
        const response = await fetch('/api/buy-pixel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: key, color, wallet: publicKey.toString() }),
        })
        if (response.ok) {
          console.log('Pixel bought successfully')
          setSelectedPixel(null) // Clear selected pixel after purchase
        } else {
          console.error('Failed to buy pixel')
        }
      } catch (error) {
        console.error('Error buying pixel:', error)
      }
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pixel Board</h1>
      <div className={styles.content}>
        <div className={styles.pixelBoard}>
          <PixelBoard onPixelClick={handlePixelClick} pixelColors={pixelColors} />
        </div>
        <div className={styles.infoBoard}>
          <InfoBoard
            selectedPixel={selectedPixel}
            onColorChange={handleColorChange}
            onBuy={handleBuy}
            isConnected={connected}
          />
        </div>
      </div>
    </div>
  )
}