import Header from "../components/Header";
import SetupVote from "../components/SetupVote";
import ViewVotes from "../components/ViewVotes";
import style from "../styles/Home.module.css";

const Home: React.FC = () => {
  return (
    <main className="bg-black pb-8">
      <Header />
      <SetupVote />
      <ViewVotes />
    </main>
  );
}

export default Home;
