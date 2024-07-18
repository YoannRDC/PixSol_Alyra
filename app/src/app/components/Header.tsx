'use client';

import React from 'react';
import Link from 'next/link';
import { ClientWalletMultiButton } from "./ClientWalletMultiButton";

const Header: React.FC = () => {
    return (
        <div className="bg-gray-900 w-full min-h-16 text-white flex items-center px-4 justify-between sticky top-0 border-b border-white">
            <div className="text-2xl cursor-pointer font-bold flex items-center">
                PixSol
            </div>
            <nav>
                <Link href="/" className="mr-4 text-white hover:text-blue-300">Home</Link>
                <Link href="/mint" className="mr-4 text-white hover:text-blue-300">Mint Page</Link>
                <Link href="/lottery" className="mr-4 text-white hover:text-blue-300">Lottery Page</Link>
                <Link href="/withdraw" className="mr-4 text-white hover:text-blue-300">Withdraw Page</Link>
             </nav>
            <ClientWalletMultiButton />
        </div>
    );
};

export default Header;