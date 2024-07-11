'use client'

import React, { useState } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import styles from '../styles/InfoBoard.module.css'

interface InfoBoardProps {
  selectedArea: {start: {x: number, y: number}, end: {x: number, y: number}} | null
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
  onBuy: () => void
}

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedArea, onColorChange, onImageUpload, onBuy }) => {
  const { setVisible } = useWalletModal()
  const { connected } = useWallet()
  const [selectedOption, setSelectedOption] = useState<'color' | 'image'>('color')

  const handleButtonClick = () => {
    if (connected) {
      if (selectedArea) {
        onBuy()
      } else {
        alert("Please select an area on the pixel board before buying.")
      }
    } else {
      setVisible(true)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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
            <button className={styles.buyButton} onClick={() => setSelectedOption('color')}>Color</button>
            <button className={styles.buyButton} onClick={() => setSelectedOption('image')}>Image</button>
          </div>
          {selectedOption === 'color' ? (
            <ColorWheel onChange={color => onColorChange(color.toString('hex'))} />
          ) : (
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          )}
        </>
      ) : (
        <p>Select an area on the pixel board</p>
      )}
      <button 
        onClick={handleButtonClick} 
        className={styles.buyButton}
        disabled={connected && !selectedArea}
      >
        {connected ? (selectedArea ? 'Buy Pixels' : 'Select Pixels to Buy') : 'Connect Wallet to Buy'}
      </button>
    </div>
  )
}

export default InfoBoard