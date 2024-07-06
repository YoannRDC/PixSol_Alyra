import { useAppContext } from "../context/context";
import Vote from "./Vote";
import style from '../styles/ViewVotes.module.css';

const ViewVotes = () => {

  const {votes} = useAppContext();

  // READ PROGRAM DATA - Front
  return (
    <div>
      {votes?.map((vote) => (
        <div key={vote.publicKey} className={style.voteContainer}>
          <Vote key={vote.publicKey} {...vote} />
        </div>
      ))}
    </div>
  );
};

export default ViewVotes;
