'use client'

import React, { useState, useEffect, useCallback } from 'react'
import styles from '../styles/PixelBoard.module.css'

interface PixelBoardProps {
  onSelectionChange: (selection: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => void
  pixelData: { [key: string]: { color?: string, imageData?: ImageData } }
  boardSize: number // Assuming a square board, e.g., 20x20
}

const PixelBoard: React.FC<PixelBoardProps> = ({ onSelectionChange, pixelData, boardSize }) => {
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const handleMouseDown = useCallback((x: number, y: number) => {
    setSelectionStart({x, y})
    setSelectionEnd({x, y})
    setIsSelecting(true)
  }, [])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (isSelecting) {
      setSelectionEnd({x, y})
    }
  }, [isSelecting])

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false)
    if (selectionStart && selectionEnd) {
      onSelectionChange({start: selectionStart, end: selectionEnd})
    }
  }, [selectionStart, selectionEnd, onSelectionChange])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false)
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const renderPixel = useCallback((x: number, y: number) => {
    const key = `x${x}y${y}`
    const pixelStyle: React.CSSProperties = {
      width: `${100 / boardSize}%`,
      height: `${100 / boardSize}%`,
      border: '1px solid #ccc',
      boxSizing: 'border-box',
    }

    if (pixelData[key]) {
      if (pixelData[key].color) {
        pixelStyle.backgroundColor = pixelData[key].color
      } else if (pixelData[key].imageData) {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.putImageData(pixelData[key].imageData!, 0, 0)
          pixelStyle.backgroundImage = `url(${canvas.toDataURL()})`
          pixelStyle.backgroundSize = 'cover'
        }
      }
    }

    if (selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x)
      const maxX = Math.max(selectionStart.x, selectionEnd.x)
      const minY = Math.min(selectionStart.y, selectionEnd.y)
      const maxY = Math.max(selectionStart.y, selectionEnd.y)

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        pixelStyle.boxShadow = 'inset 0 0 0 2px blue'
      }
    }

    return (
      <div
        key={key}
        style={pixelStyle}
        onMouseDown={() => handleMouseDown(x, y)}
        onMouseMove={() => handleMouseMove(x, y)}
        onMouseUp={handleMouseUp}
      />
    )
  }, [pixelData, boardSize, selectionStart, selectionEnd, handleMouseDown, handleMouseMove, handleMouseUp])

  return (
    <div 
      className={styles.board}
      onMouseLeave={() => setIsSelecting(false)}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        aspectRatio: '1 / 1',
      }}
    >
      {Array.from({ length: boardSize * boardSize }, (_, index) => {
        const x = index % boardSize
        const y = Math.floor(index / boardSize)
        return renderPixel(x, y)
      })}
    </div>
  )
}

export default PixelBoard