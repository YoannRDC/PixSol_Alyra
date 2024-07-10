'use client';

import React from 'react';
import { ClientWalletMultiButton } from "./ClientWalletMultiButton";

const Header: React.FC = () => {
    return (
        <div className="bg-gray-900 w-full min-h-16 text-white flex items-center px-4 justify-between sticky top-0 border-b border-white">
            <div className="text-2xl cursor-pointer font-bold text-blue-500 flex items-center">
                DAO Vote App
            </div>
            <ClientWalletMultiButton />
        </div>
    );
};

export default Header;