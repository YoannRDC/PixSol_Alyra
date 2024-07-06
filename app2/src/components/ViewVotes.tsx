import { useAppContext } from "../context/context";
import Vote from "./Votes";
import style from '../styles/ViewVotes.module.css';

const ViewVotes = () => {

    const {votes} = useAppContext();

    // READ PROGRAM DATA - Front
    return (
        <div>
        {votes?.map((vote) => (
            <div key={vote.publicKey} className="mb-4 p-4 rounded-lg shadow-md">
            <Vote key={vote.publicKey} {...vote} />
            </div>
        ))}
        </div>
    );
};

export default ViewVotes;
