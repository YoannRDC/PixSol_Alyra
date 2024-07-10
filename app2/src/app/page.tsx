'use client';

import Header from "./components/Header";
import SetupVote from "./components/SetupVote";
import ViewVotes from "./components/ViewVotes";

export default function Home() {
  return (
    <div>
      <Header />
      <SetupVote />
      <ViewVotes />
    </div>
  );
}