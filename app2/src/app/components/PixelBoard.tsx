import React from 'react'
import styles from '../styles/PixelBoard.module.css'

interface PixelBoardProps {
  onPixelClick: (x: number, y: number) => void
  pixelColors: { [key: string]: string }
}

const PixelBoard: React.FC<PixelBoardProps> = ({ onPixelClick, pixelColors }) => {
  const size = 20 // 20x20 grid

  return (
    <div className={styles.board}>
      {Array.from({ length: size }, (_, y) => (
        <div key={y} className={styles.row}>
          {Array.from({ length: size }, (_, x) => {
            const key = `x${x}y${y}`
            return (
              <div
                key={x}
                className={styles.pixel}
                style={{ backgroundColor: pixelColors[key] || 'white' }}
                onClick={() => onPixelClick(x, y)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default PixelBoard