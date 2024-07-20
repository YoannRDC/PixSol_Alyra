import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, WarningTwoIcon } from '@chakra-ui/icons';


interface ToastProps {
    signature?: string;
    errorMessage?: string;
}

export const SubmittedToast: React.FC<ToastProps> = ({ signature }) => (
    <Box p={3} bg="yellow.100" borderRadius="md">
        <Flex align="center">
            <WarningIcon color="yellow.500" mr={3} />
            <Box>
                <Text fontWeight="bold" color="yellow.800">Transaction Submitted</Text>
                <Text fontSize="sm" color="yellow.800">Your transaction is being processed.</Text>
                {signature && (
                    <Text fontSize="xs" color="yellow.600" mt={1}>
                        <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank">
                            Solana Explorer: {signature.slice(0, 6)}...{signature.slice(-4)}
                        </a>
                    </Text>
                )}
            </Box>
        </Flex>
    </Box>
);

export const SuccessToast: React.FC<ToastProps> = ({ signature }) => (
    <Box p={3} bg="green.100" borderRadius="md">
        <Flex align="center">
            <CheckCircleIcon color="green.500" mr={3} />
            <Box>
            <Text fontWeight="bold" color="green.800">Transaction Successful</Text>
            <Text fontSize="sm" color="green.800">Your pixels have been updated.</Text>
            {signature && (
                <Text fontSize="xs" color="green.800">
                    <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" >
                        Solana Explorer : {signature.slice(0, 6)}...{signature.slice(-4)}
                    </a>
                </Text>
            )}
            </Box>
        </Flex>
    </Box>
);

export const ErrorToast: React.FC<ToastProps> = ({ errorMessage }) => (
    <Box p={3} bg="red.100" borderRadius="md">
        <Flex align="center">
            <WarningTwoIcon color="red.500" mr={3} />
            <Box>
                <Text fontWeight="bold" color="red.800">Transaction Failed</Text>
                <Text fontSize="sm" color="red.800">{errorMessage}</Text>
            </Box>
        </Flex>
    </Box>
);