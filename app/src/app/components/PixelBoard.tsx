import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useBreakpointValue,
  Flex,
  Center,
} from '@chakra-ui/react'
import InfoBoard from './InfoBoard'

interface PixelBoardProps {
  onSelectionChange: (selection: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => void
  pixelData: { [key: string]: { color: string, owner: string } }
  boardSize: number
  isLoading: boolean
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
  onBuy: () => void
  isConnected: boolean
}

const PixelBoard: React.FC<PixelBoardProps> = ({
  onSelectionChange,
  pixelData,
  boardSize,
  isLoading,
  onColorChange,
  onImageUpload,
  onBuy,
  isConnected
}) => {
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const boardRef = useRef<HTMLDivElement>(null)

  const isMobile = useBreakpointValue({ base: true, md: false })

  const getPixelCoordinates = useCallback((clientX: number, clientY: number) => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const x = Math.floor((clientX - rect.left) / (rect.width / boardSize))
      const y = Math.floor((clientY - rect.top) / (rect.height / boardSize))
      return { x: Math.max(0, Math.min(x, boardSize - 1)), y: Math.max(0, Math.min(y, boardSize - 1)) }
    }
    return null
  }, [boardSize])

  const handleSelectionStart = useCallback((clientX: number, clientY: number) => {
    const coords = getPixelCoordinates(clientX, clientY)
    if (coords) {
      setSelectionStart(coords)
      setSelectionEnd(coords)
      setIsSelecting(true)
    }
  }, [getPixelCoordinates])

  const handleSelectionMove = useCallback((clientX: number, clientY: number) => {
    if (isSelecting) {
      const coords = getPixelCoordinates(clientX, clientY)
      if (coords) {
        setSelectionEnd(coords)
      }
    }
  }, [isSelecting, getPixelCoordinates])

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false)
    if (selectionStart && selectionEnd) {
      onSelectionChange({start: selectionStart, end: selectionEnd})
    }
  }, [selectionStart, selectionEnd, onSelectionChange])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    handleSelectionStart(event.clientX, event.clientY)
  }, [handleSelectionStart])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    handleSelectionMove(event.clientX, event.clientY)
  }, [handleSelectionMove])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    handleSelectionStart(touch.clientX, touch.clientY)
  }, [handleSelectionStart])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    handleSelectionMove(touch.clientX, touch.clientY)
  }, [handleSelectionMove])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleSelectionEnd();
    }

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    }
  }, [handleSelectionEnd])

  const handleConfirmSelection = useCallback(() => {
    if (selectionStart && selectionEnd) {
      onSelectionChange({start: selectionStart, end: selectionEnd});
      if (isMobile) {
        onOpen();
      }
    }
  }, [selectionStart, selectionEnd, onSelectionChange, onOpen, isMobile])

  const renderPixel = useCallback((x: number, y: number) => {
    const key = `x${x}y${y}`
    const pixelStyle: React.CSSProperties = {
      width: `${100 / boardSize}%`,
      paddingBottom: `${100 / boardSize}%`,
      border: '1px solid #ccc',
      boxSizing: 'border-box',
      position: 'relative',
      backgroundColor: pixelData[key]?.color || 'white',
    };

    if (selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        pixelStyle.boxShadow = 'inset 0 0 0 2px blue';
      }
    }

    return <Box key={key} style={pixelStyle} />
  }, [pixelData, boardSize, selectionStart, selectionEnd])

  if (isLoading) {
    return <Box>Loading...</Box>
  }

  return (
    <Flex 
      direction={isMobile ? "column" : "row"} 
      alignItems="flex-start" 
      width="100%"
      height="100vh"
      overflow="hidden"
    >
      <Box
        ref={boardRef}
        width={isMobile ? "100%" : "calc(100vh - 100px)"}
        height={isMobile ? "auto" : "calc(100vh - 100px)"}
        maxWidth={isMobile ? "100%" : "calc(100vh - 100px)"}
        aspectRatio="1 / 1"
        margin="0"
        display="flex"
        flexWrap="wrap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {Array.from({ length: boardSize * boardSize }, (_, index) => {
          const x = index % boardSize
          const y = Math.floor(index / boardSize)
          return renderPixel(x, y)
        })}
      </Box>
      
      {!isMobile && (
        <Box width="300px" ml={4} height="calc(100vh - 100px)" overflowY="auto">
          <InfoBoard
            selectedArea={selectionStart && selectionEnd ? {start: selectionStart, end: selectionEnd} : null}
            onColorChange={onColorChange}
            onImageUpload={onImageUpload}
            onBuy={onBuy}
          />
        </Box>
      )}

      {/* Pour les gens sur mobiles par la suite
      Il faut améliorer l'UI, mettre un meilleur bouton 
      "Confirm Selection" + adapter un zoom pour sélectionner
      les pixels. */}
  
      {isMobile && (
        <>
          <Button 
          onClick={handleConfirmSelection} 
          colorScheme="blue" 
          width="80%" 
          alignContent="center" 
          ml="10%"
          mt={10}>
            Confirm Selection
          </Button>
          <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Pixel Information</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <InfoBoard
                  selectedArea={selectionStart && selectionEnd ? {start: selectionStart, end: selectionEnd} : null}
                  onColorChange={onColorChange}
                  onImageUpload={onImageUpload}
                  onBuy={onBuy}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Flex>
  )
}

export default PixelBoard