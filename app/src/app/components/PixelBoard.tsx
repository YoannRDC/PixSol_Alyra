import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useBreakpointValue,
  Flex,
  IconButton
} from '@chakra-ui/react'
import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import InfoBoard from './InfoBoard'

interface PixelBoardProps {
  onSelectionChange: (selection: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => void
  pixelData: { [key: string]: { color: string, owner: string } }
  boardSize: number
  isLoading: boolean
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
  isConnected: boolean
}

const PixelBoard: React.FC<PixelBoardProps> = ({
  onSelectionChange,
  pixelData,
  boardSize,
  isLoading,
  onColorChange,
  onImageUpload,
}) => {
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const boardRef2 = useRef<HTMLCanvasElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const getPixelCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (boardRef2.current) {
        const rect = boardRef2.current.getBoundingClientRect();
        const x = Math.floor(((clientX - rect.left) / zoomLevel + panOffset.x) / (rect.width / boardSize));
        const y = Math.floor(((clientY - rect.top) / zoomLevel + panOffset.y) / (rect.height / boardSize));
        return { x: Math.max(0, Math.min(x, boardSize - 1)), y: Math.max(0, Math.min(y, boardSize - 1)) };
      }
      return null;
    },
    [boardSize, zoomLevel, panOffset]
  );

  const handleSelectionStart = useCallback(
    (clientX: number, clientY: number) => {
      const coords = getPixelCoordinates(clientX, clientY);
      if (coords) {
        setSelectionStart(coords);
        setSelectionEnd(coords);
        setIsSelecting(true);
        setCurrentSelection(null);
        onSelectionChange(null);
      }
    },
    [getPixelCoordinates, onSelectionChange]
  );

  const handleSelectionMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isSelecting) {
        const coords = getPixelCoordinates(clientX, clientY);
        if (coords) {
          setSelectionEnd(coords);
        }
      }
    },
    [isSelecting, getPixelCoordinates]
  );

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false);
    if (selectionStart && selectionEnd) {
      const newSelection = { start: selectionStart, end: selectionEnd };
      setCurrentSelection(newSelection);
      onSelectionChange({ start: selectionStart, end: selectionEnd });
    }
  }, [selectionStart, selectionEnd, onSelectionChange]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button === 0) { // Left click
        handleSelectionStart(event.clientX, event.clientY);
      } else if (event.button === 1) { // Middle click (panning)
        setIsDragging(true);
        setLastPanPosition({ x: event.clientX, y: event.clientY });
      }
    },
    [handleSelectionStart]
  );

  const handleMouseMove = useCallback(
  (event: React.MouseEvent) => {
    if (isSelecting) {
      handleSelectionMove(event.clientX, event.clientY);
    } else if (isDragging) {
      const dx = (event.clientX - lastPanPosition.x) / zoomLevel;
      const dy = (event.clientY - lastPanPosition.y) / zoomLevel;

      const canvas = boardRef2.current;
      if (!canvas) return;

      const canvasWidth = canvas.width / zoomLevel;
      const canvasHeight = canvas.height / zoomLevel;

      const maxPanOffsetX = Math.max(0, boardSize - canvasWidth);
      const maxPanOffsetY = Math.max(0, boardSize - canvasHeight);

      const newPanOffsetX = Math.max(0, Math.min(panOffset.x - dx, maxPanOffsetX));
      const newPanOffsetY = Math.max(0, Math.min(panOffset.y - dy, maxPanOffsetY));

      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
      setLastPanPosition({ x: event.clientX, y: event.clientY });
    }
  },
  [handleSelectionMove, isSelecting, isDragging, lastPanPosition, zoomLevel, panOffset, boardSize]
);
  
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      handleSelectionStart(touch.clientX, touch.clientY);
    },
    [handleSelectionStart]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
  
      if (isSelecting) {
        handleSelectionMove(touch.clientX, touch.clientY);
      } else if (isDragging) {
        const dx = (touch.clientX - lastPanPosition.x) / zoomLevel;
        const dy = (touch.clientY - lastPanPosition.y) / zoomLevel;
  
        const canvas = boardRef2.current;
        if (!canvas) return;
  
        const canvasWidth = canvas.width / zoomLevel;
        const canvasHeight = canvas.height / zoomLevel;
  
        const maxPanOffsetX = Math.max(0, boardSize - canvasWidth);
        const maxPanOffsetY = Math.max(0, boardSize - canvasHeight);
  
        const newPanOffsetX = Math.max(0, Math.min(panOffset.x - dx, maxPanOffsetX));
        const newPanOffsetY = Math.max(0, Math.min(panOffset.y - dy, maxPanOffsetY));
  
        setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
        setLastPanPosition({ x: touch.clientX, y: touch.clientY });
      }
    },
    [handleSelectionMove, isDragging, lastPanPosition, zoomLevel, panOffset, boardSize]
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleSelectionEnd();
      setIsDragging(false);
    }

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    }
  }, [handleSelectionEnd])

  const handleConfirmSelection = useCallback(() => {
    if (currentSelection) {
      onSelectionChange(currentSelection);
      if (isMobile) {
        onOpen();
      }
    }
  }, [currentSelection, onSelectionChange, onOpen, isMobile]);

  const adjustPanOffset = useCallback((newZoomLevel: any) => {
    const canvas = boardRef2.current;
    if (!canvas) return;
  
    const canvasWidth = canvas.width / newZoomLevel;
    const canvasHeight = canvas.height / newZoomLevel;
  
    const maxPanOffsetX = Math.max(0, boardSize - canvasWidth);
    const maxPanOffsetY = Math.max(0, boardSize - canvasHeight);
  
    setPanOffset(prevPanOffset => ({
      x: Math.max(0, Math.min(prevPanOffset.x, maxPanOffsetX)),
      y: Math.max(0, Math.min(prevPanOffset.y, maxPanOffsetY)),
    }));
  }, [boardSize]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoomLevel = Math.min(prev * 1.2, 5);
      adjustPanOffset(newZoomLevel);
      return newZoomLevel;
    });
  }, [adjustPanOffset]);
  

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoomLevel = Math.max(prev / 1.2, 1);
      adjustPanOffset(newZoomLevel);
      return newZoomLevel;
    });
  }, [adjustPanOffset]);

  

  useEffect(() => {
    if (boardRef2.current) {
      const canvas = boardRef2.current;
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-panOffset.x, -panOffset.y);

        for (let x = 0; x < boardSize; x++) {
          for (let y = 0; y < boardSize; y++) {
            const key = `x${x}y${y}`;
            ctx.fillStyle = pixelData[key]?.color || 'white';
            ctx.fillRect(x * (canvas.width / boardSize), y * (canvas.height / boardSize), canvas.width / boardSize, canvas.height / boardSize);
          }
        }
        if (currentSelection) {
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2 / zoomLevel;
          ctx.strokeRect(
            currentSelection.start.x * (canvas.width / boardSize),
            currentSelection.start.y * (canvas.height / boardSize),
            (currentSelection.end.x - currentSelection.start.x + 1) * (canvas.width / boardSize),
            (currentSelection.end.y - currentSelection.start.y + 1) * (canvas.height / boardSize)
          );
        }
        ctx.restore();
      }
    }
  }, [pixelData, boardSize, currentSelection, zoomLevel, panOffset]);

  if (isLoading) {
    return <Box>Loading...</Box>
  }
  return (
    <Flex
      direction={isMobile ? 'column' : 'row'}
      alignItems="flex-start"
      justifyContent={isMobile ? '' : 'center'}
      width="100%"
      height="100vh"
      overflow="hidden"
      marginTop={'50px'}
    >
      <Box
        width={isMobile ? '100%' : 'min(calc(100vh - 100px), 500px)'}
        height={isMobile ? 'auto' : 'min(calc(100vh - 100px), 500px)'}
        aspectRatio="1 / 1"
        margin="0"
        position="relative"
      >
        <canvas
          ref={boardRef2}
          width={boardSize * 10}
          height={boardSize * 10}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ width: '100%', height: '100%', border: '1px solid black' }}
        />
        <Box position="absolute" bottom="10px" right="10px">
          <IconButton
            aria-label="Zoom in"
            icon={<AddIcon />}
            onClick={handleZoomIn}
            size="sm"
            mr={2}
            colorScheme="blue"
            opacity={0.7}
          />
          <IconButton
            aria-label="Zoom out"
            icon={<MinusIcon />}
            onClick={handleZoomOut}
            size="sm"
            colorScheme="blue"
            opacity={0.7}
            isDisabled={zoomLevel === 1}
          />
        </Box>
      </Box>
      {!isMobile && (
        <Box width="300px" ml={4} height="calc(100vh - 100px)" overflowY="auto">
          <InfoBoard selectedArea={currentSelection} onColorChange={onColorChange} onImageUpload={onImageUpload} />
        </Box>
      )}
      {isMobile && (
        <>
          <Button
            onClick={handleConfirmSelection}
            colorScheme="blue"
            width="80%"
            alignContent="center"
            ml="10%"
            mt={10}
            isDisabled={!currentSelection}
          >
            Confirm Selection
          </Button>
          <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Pixel Information</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <InfoBoard selectedArea={currentSelection} onColorChange={onColorChange} onImageUpload={onImageUpload} />
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Flex>
  );
};

export default PixelBoard