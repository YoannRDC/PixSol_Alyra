import React, { useEffect, useState } from 'react';
import { useAppContext } from "../context/context";
import style from '../styles/Vote.module.css';

const Vote = ({ account, publicKey }) => {
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
     }, [account.votingDeadline]);

  return (
    <div className={style.wrapper}>
       <h2 className={style.title}>{account.title}</h2>
       <p>{account.description}</p>
       {account.choices.map((option, index) => (
         <div key={index} className={style.option}>
           <div>
             <p>Option {index + 1}: {option.label}</p>
             <p className={style.voteCount}>Votes: {parseInt(option.count)}</p>
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
