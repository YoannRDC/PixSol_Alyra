'use client'

import React, { useState, useMemo } from 'react'
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

  const isMultiplePixelsSelected = useMemo(() => {
    if (!selectedArea) return false
    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width > 1 || height > 1
  }, [selectedArea])

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
            <ColorWheel onChange={color => onColorChange(color.toString('hex'))} />
          ) : (
            isMultiplePixelsSelected ? (
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            ) : (
              <p>Select at least 2x2 pixels to upload an image</p>
            )
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