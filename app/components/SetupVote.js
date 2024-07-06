import React, { useState } from 'react';
import { useAppContext } from "../context/context";
import style from '../styles/SetupVote.module.css';

const SetupVote = () => {
  const { createVote } = useAppContext();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState('');
  const [duration, setDuration] = useState('');

  const creerVote = () => {
    const optionsArray = options.split(',').map(option => option.trim());

    const currentTimestamp = new Date().getTime() / 1000;
    const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
    const deadline = parseInt(currentTimestamp + durationInSeconds);

    createVote(topic, description, optionsArray, deadline);
  };

  return (
    <div className={style.container}>
      <label className={style.label} htmlFor="topic">Vote Titre</label>
      <input
        className={style.input}
        type="text"
        id="topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

    <label className={style.label} htmlFor="topic">Vote Description</label>
      <input
        className={style.input}
        type="text"
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <label className={style.label} htmlFor="options">Options (séparé par des virgules)</label>
      <input
        className={style.input}
        type="text"
        id="options"
        value={options}
        onChange={(e) => setOptions(e.target.value)}
      />

      <label className={style.label} htmlFor="duration">Durée en jour</label>
      <input
        className={style.input}
        type="number"
        id="duration"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />

      <a className={style.button} onClick={creerVote}>
        Creer un vote
      </a>
    </div>
  );
};

export default SetupVote;
