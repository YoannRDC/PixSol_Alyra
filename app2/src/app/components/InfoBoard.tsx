'use client'

import React from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import styles from '../styles/InfoBoard.module.css'

interface InfoBoardProps {
  selectedPixel: { x: number; y: number } | null
  onColorChange: (color: string) => void
  onBuy: () => void
  isConnected: boolean
}

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedPixel, onColorChange, onBuy, isConnected }) => {
  const { setVisible } = useWalletModal()

  if (!selectedPixel) {
    return <div className={styles.infoBoard}>Select a pixel to see info</div>
  }

  const handleButtonClick = () => {
    if (isConnected) {
      onBuy()
    } else {
      setVisible(true)
    }
  }

  return (
    <div className={styles.infoBoard}>
      <h2>Selected Pixel</h2>
      <p>Address: x{selectedPixel.x}y{selectedPixel.y}</p>
      <ColorWheel
        onChange={color => onColorChange(color.toString('hex'))}
      />
      <button 
        onClick={handleButtonClick} 
        className={styles.buyButton}
      >
        {isConnected ? 'Buy Pixel' : 'Connect Wallet to Buy'}
      </button>
    </div>
  )
}

export default InfoBoard