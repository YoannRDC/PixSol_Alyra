import ViewVotes from './components/ViewVotes';
import SetupVote from './components/SetupVote';

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">DAO Vote App</h1>
      <SetupVote />
      <ViewVotes />
    </div>
  );
}