'use client';

import React, { useState } from 'react';
import { useAppContext } from "../contexts/AppContext";

const SetupVote: React.FC = () => {
    const { createVote } = useAppContext();
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState('');
    const [duration, setDuration] = useState('');

    const creerVote = () => {
        const optionsArray = options.split(',').map(option => option.trim());

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
        const deadline = currentTimestamp + durationInSeconds;

        createVote(topic, description, optionsArray, deadline);
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
            <label className="block mb-2 font-bold text-gray-700" htmlFor="topic">Vote Titre</label>
            <input
                className="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded-lg appearance-none focus:outline-none focus:shadow-outline"
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
            />

            <label className="block mb-2 font-bold text-gray-700" htmlFor="description">Vote Description</label>
            <input
                className="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded-lg appearance-none focus:outline-none focus:shadow-outline"
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            
            <label className="block mb-2 font-bold text-gray-700" htmlFor="options">Options (séparé par des virgules)</label>
            <input
                className="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded-lg appearance-none focus:outline-none focus:shadow-outline"
                type="text"
                id="options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
            />

            <label className="block mb-2 font-bold text-gray-700" htmlFor="duration">Durée en jour</label>
            <input
                className="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded-lg appearance-none focus:outline-none focus:shadow-outline"
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
            />

            <button
                className="block w-full px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                onClick={creerVote}
            >
                Créer un vote
            </button>
        </div>
    );
};

export default SetupVote;