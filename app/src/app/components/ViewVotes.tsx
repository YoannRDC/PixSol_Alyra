'use client';

import React from 'react';
import { useAppContext } from "../contexts/AppContext";
import Vote from "./Votes";

const ViewVotes: React.FC = () => {
    const { votes } = useAppContext();

    return (
        <div>
            {votes?.map((vote) => (
                <div key={vote.publicKey.toString()} className="mb-4 p-4 rounded-lg shadow-md">
                    <Vote {...vote} />
                </div>
            ))}
        </div>
    );
};

export default ViewVotes;