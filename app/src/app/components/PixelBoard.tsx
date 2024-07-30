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
} from '@chakra-ui/react'
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
  const boardRef = useRef<HTMLDivElement>(null);
  const boardRef2 = useRef<HTMLCanvasElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const getPixelCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (boardRef2.current) {
        const rect = boardRef2.current.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / (rect.width / boardSize));
        const y = Math.floor((clientY - rect.top) / (rect.height / boardSize));
        return { x: Math.max(0, Math.min(x, boardSize - 1)), y: Math.max(0, Math.min(y, boardSize - 1)) };
      }
      return null;
    },
    [boardSize]
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
      handleSelectionStart(event.clientX, event.clientY);
    },
    [handleSelectionStart]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      handleSelectionMove(event.clientX, event.clientY);
    },
    [handleSelectionMove]
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
      handleSelectionMove(touch.clientX, touch.clientY);
    },
    [handleSelectionMove]
  );

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
    if (currentSelection) {
      onSelectionChange(currentSelection);
      if (isMobile) {
        onOpen();
      }
    }
  }, [selectionStart, selectionEnd, onSelectionChange, onOpen, isMobile]);

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
        for (let x = 0; x < boardSize; x++) {
          for (let y = 0; y < boardSize; y++) {
            const key = `x${x}y${y}`;
            ctx.fillStyle = pixelData[key]?.color || 'white';
            ctx.fillRect(x * (canvas.width / boardSize), y * (canvas.height / boardSize), canvas.width / boardSize, canvas.height / boardSize);
          }
        }
        if (currentSelection) {
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            currentSelection.start.x * (canvas.width / boardSize),
            currentSelection.start.y * (canvas.height / boardSize),
            (currentSelection.end.x - currentSelection.start.x + 1) * (canvas.width / boardSize),
            (currentSelection.end.y - currentSelection.start.y + 1) * (canvas.height / boardSize)
          );
        }
      }
    }
  }, [pixelData, boardSize, currentSelection]);

  // const renderPixel = useCallback((x: number, y: number) => {
  //   const key = `x${x}y${y}`;
  //   const backgroundColor = pixelData[key]?.color || 'white';
  //   const isSelected = currentSelection &&
  //     x >= Math.min(currentSelection.start.x, currentSelection.end.x) &&
  //     x <= Math.max(currentSelection.start.x, currentSelection.end.x) &&
  //     y >= Math.min(currentSelection.start.y, currentSelection.end.y) &&
  //     y <= Math.max(currentSelection.start.y, currentSelection.end.y);

  //     return (
  //       <div
  //         key={key}
  //         className={`relative box-border border border-gray-300 ${isSelected ? 'shadow-inner shadow-blue-900' : ''}`}
  //         style={{ width: `${100 / boardSize}%`, paddingBottom: `${100 / boardSize}%`, backgroundColor }}
  //       >
  //         {isSelected && (
  //           <div className="absolute inset-0 bg-white opacity-30" />
  //         )}
  //       </div>
  //     );
  //   }, [pixelData, boardSize, currentSelection]);

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

//   return (
//     <Flex 
//       direction={isMobile ? "column" : "row"} 
//       alignItems="flex-start" 
//       justifyContent={isMobile?"":"center"}
//       width="100%"
//       height="100vh"
//       overflow="hidden"
//       marginTop={"50px"}
      
      
//     >
//       <Box
//         ref={boardRef}
//         width={isMobile ? "100%" : "min(calc(100vh - 100px), 500px)"}
//         height={isMobile ? "auto" : "min(calc(100vh - 100px), 500px)"}
//         aspectRatio="1 / 1"
//         margin="0"
//         display="flex"
//         flexWrap="wrap"
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//       >
//         {Array.from({ length: boardSize * boardSize }, (_, index) => {
//           const x = index % boardSize
//           const y = Math.floor(index / boardSize)
//           return renderPixel(x, y)
//         })}
//       </Box>
      
//       {!isMobile && (
//         <Box width="300px" ml={4} height="calc(100vh - 100px)" overflowY="auto">
//           <InfoBoard
//             selectedArea={currentSelection}
//             onColorChange={onColorChange}
//             onImageUpload={onImageUpload}
//           />
//         </Box>
//       )}
  
//       {isMobile && (
//         <>
//           <Button 
//           onClick={handleConfirmSelection} 
//           colorScheme="blue" 
//           width="80%" 
//           alignContent="center" 
//           ml="10%"
//           mt={10}
//           isDisabled={!currentSelection}
//         >
//             Confirm Selection
//           </Button>
//           <Modal isOpen={isOpen} onClose={onClose} size="full">
//             <ModalOverlay />
//             <ModalContent>
//               <ModalHeader>Pixel Information</ModalHeader>
//               <ModalCloseButton />
//               <ModalBody>
//                 <InfoBoard
//                   selectedArea={currentSelection}
//                   onColorChange={onColorChange}
//                   onImageUpload={onImageUpload}
//                   // onBuy={onBuy}
//                 />
//               </ModalBody>
//             </ModalContent>
//           </Modal>
//         </>
//       )}
//     </Flex>
//   )
// }

export default PixelBoard