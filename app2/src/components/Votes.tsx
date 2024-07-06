'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from "../app/context/context";
import style from '../styles/Vote.module.css';
import { PublicKey } from '@solana/web3.js';

interface VoteProps {
    account: {
        deadline: number; 
        title: string;
        description: string;
        choices: {
            label: string;
            count: number; 
        }[];
    };
    publicKey: PublicKey;
}

const Vote: React.FC<VoteProps> = ({ account, publicKey }) => {
    const { vote } = useAppContext();
    const [timeLeft, setTimeLeft] = useState('');
    const [voteOver, setVoteOver] = useState(false);

    useEffect(() => {
        const deadline = account.deadline * 1000;
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = deadline - now;
    
            if (distance < 0) {
            setTimeLeft('Voting has ended.');
            setVoteOver(true);
            } else {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        };
    
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
    
        return () => clearInterval(interval);
        }, [account.deadline]);

    return (
        <div className={style.wrapper}>
        <h2 className={style.title}>{account.title}</h2>
        <p>{account.description}</p>
        {account.choices.map((option, index) => (
            <div key={index} className={style.option}>
            <div>
                <p>Option {index + 1}: {option.label}</p>
                <p className={style.voteCount}>Votes: {option.count}</p>
            </div>
            {!voteOver && (
                <button
                className={style.button}
                onClick={() => vote(index, publicKey)}
                >
                Vote
                </button>
            )}
            </div>
        ))}
        <div className={style.timer}>
            {timeLeft}
        </div>
        </div>
    );
};

export default Vote;
