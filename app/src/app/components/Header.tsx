'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Flex, Heading, HStack, Button, useColorModeValue, useDisclosure, IconButton, VStack, Collapse } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { ClientWalletMultiButton } from "./ClientWalletMultiButton";

// const HEADER_HEIGHT = 80;

const Header: React.FC = () => {
    const bgColor = useColorModeValue('#edf5f7', 'gray.900');
    const textColor = useColorModeValue('gray.800', 'white');
    const { isOpen, onToggle } = useDisclosure();
    const pathname = usePathname();

    return (
        <Box bg={bgColor} px={4} boxShadow="0px 4px 8px rgba(0, 0, 0, 0.1)" position="sticky" top={0} zIndex="sticky" w="100%" >
            <Flex h={16} alignItems="center" justifyContent="space-between">
                <NextLink href="/" passHref>
                    <Heading as="h1" size="lg" letterSpacing={'tighter'} cursor="pointer">
                        PixSol
                    </Heading>
                </NextLink>

                <HStack as="nav" spacing={2} display={{ base: 'none', md: 'flex' }}>
                    <NavLink href="/" isActive={pathname === "/"}>Home</NavLink>
                    <NavLink href="/mint" isActive={pathname === "/mint"}>Mint</NavLink>
                    <NavLink href="/lottery" isActive={pathname === "/lottery"}>Lottery</NavLink>
                    <NavLink href="/withdraw" isActive={pathname === "/withdraw"}>Withdraw</NavLink>
                    <NavLink href="/smartContractDemo" isActive={pathname === "/smartContractDemo"}>Smart Contract Demo</NavLink>
                    <NavLink href="/daozone" isActive={pathname === "/daozone"}>DAO</NavLink>
                </HStack>

                <Flex alignItems="center">
                    <ClientWalletMultiButton />
                    <IconButton
                        display={{ base: 'flex', md: 'none' }}
                        onClick={onToggle}
                        icon={isOpen ? <CloseIcon w={15} h={15} /> : <HamburgerIcon w={15} h={15} />}
                        variant="ghost"
                        aria-label="Toggle Navigation"
                        ml={2}
                    />
                </Flex>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
                <VStack p={4} display={{ md: 'none' }} spacing={2} align="stretch">
                    <NavLink href="/" isActive={pathname === "/"}>Home</NavLink>
                    <NavLink href="/mint" isActive={pathname === "/mint"}>Mint</NavLink>
                    <NavLink href="/lottery" isActive={pathname === "/lottery"}>Lottery</NavLink>
                    <NavLink href="/withdraw" isActive={pathname === "/withdraw"}>Withdraw</NavLink>
                    <NavLink href="/smartContractDemo" isActive={pathname === "/smartContractDemo"}>SC Demo</NavLink>
                    <NavLink href="/daozone" isActive={pathname === "/daozone"}>DAO</NavLink>
                </VStack>
            </Collapse>
        </Box>
    );
};



interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, isActive }) => (
    <Button
        as={NextLink}
        href={href}
        variant={isActive ? "solid" : "ghost"}
        colorScheme={isActive ? "blue" : "gray"}
        color={useColorModeValue('gray.600', 'white')}
    >
        {children}
    </Button>
);

export default Header;