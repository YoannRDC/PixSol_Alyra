'use strict'
import * as React from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
    return (
        <div className="bg-gray-900 w-full min-h-16 text-white flex items-center px-4 justify-between sticky top-0 border-b border-white">
            <div className="text-2xl cursor-pointer font-bold text-blue-500 flex items-center">
                DAO Vote App
            </div>
            <WalletMultiButton />
        </div>
    );
};