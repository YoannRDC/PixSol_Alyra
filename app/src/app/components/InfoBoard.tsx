'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ColorWheel } from '@react-spectrum/color'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Box, Button, Heading, Text, Flex, VStack, Input, Divider, useToast } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMutableDictionary } from '../hooks/useMutableDictionary'
import { SubmittedToast, SuccessToast, ErrorToast } from './ToastParty'

const BOARD_SIZE = 10 // grid size

interface SelectedArea {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

interface InfoBoardProps {
  selectedArea: SelectedArea | null
  onColorChange: (color: string) => void
  onImageUpload: (image: File) => void
}

const AreaInfo: React.FC<{ selectedArea: SelectedArea }> = ({ selectedArea }) => (
  <Flex justifyContent="space-between">
    <VStack spacing={2} align="stretch">
      <Text>
        From: <Text as="span" fontSize="sm">(x{selectedArea.start.x}, y{selectedArea.start.y})</Text>
      </Text>
      <Text>
        To: <Text as="span" fontSize="sm">(x{selectedArea.end.x}, y{selectedArea.end.y})</Text>
      </Text>
    </VStack>
    <Divider orientation="vertical" mx={1} borderColor="navy" height="auto" />
    <VStack spacing={2} align="stretch">
      <Text>Image Resolution:</Text>
      <Text fontSize="sm">
        ({Math.abs(selectedArea.end.x - selectedArea.start.x) + 1} x {Math.abs(selectedArea.end.y - selectedArea.end.y) + 1}) px
      </Text>
    </VStack>
  </Flex>
)

const OptionSelector: React.FC<{
  selectedOption: 'color' | 'image'
  setSelectedOption: (option: 'color' | 'image') => void
  isValidImageSelection: boolean
}> = ({ selectedOption, setSelectedOption, isValidImageSelection }) => (
  <Flex>
    <Button 
      onClick={() => setSelectedOption('color')} 
      colorScheme={selectedOption === 'color' ? 'blue' : 'gray'} 
      mr={2}
    >
      Color
    </Button>
    <Button 
      onClick={() => setSelectedOption('image')} 
      colorScheme={selectedOption === 'image' ? 'blue' : 'gray'} 
      disabled={!isValidImageSelection}
      title={!isValidImageSelection ? "Select at least 2x2 pixels for image upload" : ""}
    >
      Image
    </Button>
  </Flex>
)

const ColorSelector: React.FC<{ onColorChange: (color: string) => void }> = ({ onColorChange }) => (
  <ColorWheel onChange={color => onColorChange(color.toString('hex'))} />
)

const ImageUploader: React.FC<{
  onImageUpload: (image: File) => void
  isValidImageSelection: boolean
}> = ({ onImageUpload, isValidImageSelection }) => (
  <Input 
    type="file" 
    accept="image/*" 
    onChange={(event) => {
      const file = event.target.files?.[0]
      if (file) onImageUpload(file)
    }} 
    disabled={!isValidImageSelection}
  />
)

const InfoBoard: React.FC<InfoBoardProps> = ({ selectedArea, onColorChange, onImageUpload }) => {
  const [selectedOption, setSelectedOption] = useState<'color' | 'image'>('color')
  const { updateByBatch, programInitialized } = useMutableDictionary()
  const { connected, publicKey: player_pubkey } = useWallet()
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [batchIds, setBatchIds] = useState<string>('')
  const [batchDepositAmount, setBatchDepositAmount] = useState<number>(0)
  const [pixelData, setPixelData] = useState<{ [key: string]: { color: string, player_pubkey: string } }>({})
  const [pixelsUpdateBDD, setPixelsUpdateBDD] = useState<{ [key: string]: string }>({})
  const [triggerUpdateBDD, setTriggerUpdateBDD] = useState(false)
  const [triggerUpdateSC, setTriggerUpdateSC] = useState(false)
  const toast = useToast()

  const isValidImageSelection = useMemo(() => {
    if (!selectedArea) return false
    const width = Math.abs(selectedArea.end.x - selectedArea.start.x) + 1
    const height = Math.abs(selectedArea.end.y - selectedArea.start.y) + 1
    return width >= 2 && height >= 2 && !(width === 2 && height === 1) && !(width === 1 && height === 2)
  }, [selectedArea])

  useEffect(() => {
    if (!selectedArea) {
      setBatchDepositAmount(0)
      return
    }
    
    const pixels = []
    for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
      for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
        pixels.push(y * BOARD_SIZE + x)
      }
    }
    
    setBatchDepositAmount(pixels.length * 10000000)
    setBatchIds(pixels.join(','))
  }, [selectedArea])

  const handleUpdateByBatch = async () => {
    if (!connected || !programInitialized) {
      setUpdateStatus('Please connect your wallet and wait for program initialization.')
      return
    }

    const ids = batchIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    if (ids.length === 0) {
      setUpdateStatus('Please enter valid pixel IDs for batch update.')
      return
    }

    toast({ duration: 5000, isClosable: true, render: () => <SubmittedToast /> })

    setUpdateStatus('Updating pixels in batch...')
    try {
      const tx = await updateByBatch(ids, batchDepositAmount)
      setUpdateStatus(`Batch update successful. Transaction signature: ${tx}`)
      setTriggerUpdateBDD(true)
      toast({ duration: 7000, isClosable: true, render: () => <SuccessToast signature={tx} /> })
    } catch (error) {
      const errorMsg = `Batch update failed: ${error instanceof Error ? error.message : String(error)}`
      console.error('Batch update failed:', errorMsg)
      setUpdateStatus(errorMsg)
      toast({ duration: 7000, isClosable: true, render: () => <ErrorToast errorMessage={errorMsg} /> })
    }
  }

  useEffect(() => {
    if (triggerUpdateSC) {
      handleUpdateByBatch()
      setTriggerUpdateSC(false)
    }
  }, [triggerUpdateSC])

  useEffect(() => {
    if (triggerUpdateBDD) {
      triggerUpdateBDDcolors()
      setTriggerUpdateBDD(false)
    }
  }, [triggerUpdateBDD])

  const triggerUpdateBDDcolors = async () => {
    if (player_pubkey) {
      await fetch('/api/pixels-color-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixels: pixelsUpdateBDD,
          player_pubkey: player_pubkey.toString(),
        }),
      })
    }
  }

  const handleChangePixelColorButtonClick = async () => {
    if (selectedArea && player_pubkey) {
      const pixelsUpdateBDD_build: {[key: string]: string} = {}

      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`
          if (pixelData[key]) {
            pixelsUpdateBDD_build[key] = pixelData[key].color
          }
        }
      }

      setPixelsUpdateBDD(pixelsUpdateBDD_build)
      setTriggerUpdateSC(true)
    } else {
      setSelectedOption('image')
    }
  }

  const handleColorChange = (color: string) => {
    onColorChange(color)
    if (player_pubkey && selectedArea) {
      const newPixelData = { ...pixelData }
      for (let x = selectedArea.start.x; x <= selectedArea.end.x; x++) {
        for (let y = selectedArea.start.y; y <= selectedArea.end.y; y++) {
          const key = `x${x}y${y}`
          newPixelData[key] = { color, player_pubkey: player_pubkey.toString() }
        }
      }
      setPixelData(newPixelData)
    }
  }

  return (
    <Box p={5} border="1px" borderColor="gray.200" borderRadius="md">
      {selectedArea ? (
        <VStack spacing={4} align="stretch">
          <Heading size="md" color="navy">Selected Area</Heading>
          <AreaInfo selectedArea={selectedArea} />
          <OptionSelector 
            selectedOption={selectedOption} 
            setSelectedOption={setSelectedOption}
            isValidImageSelection={isValidImageSelection}
          />
          {selectedOption === 'color' 
            ? <ColorSelector onColorChange={handleColorChange} />
            : <ImageUploader onImageUpload={onImageUpload} isValidImageSelection={isValidImageSelection} />
          }
        </VStack>
      ) : (
        <Text>Select a Pixel or an area on the board</Text>
      )}
      <Button 
        onClick={handleChangePixelColorButtonClick} 
        colorScheme="green" 
        mt={4}
        isDisabled={!connected || !selectedArea}
      >
        {connected ? (selectedArea ? 'Save changes' : 'Select Pixel(s) to Color') : 'Connect Wallet to Paint'}
      </Button>
      {selectedOption === 'image' && !isValidImageSelection && (
        <Text color="red.500" mt={2} fontSize="sm">
          Please select at least a 2x2 area to upload an image. 
          Selections of 1 line or 1 row are not allowed for image uploads.
        </Text>
      )}
    </Box>
  )
}

export default InfoBoard