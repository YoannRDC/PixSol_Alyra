import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");
import { AppProvider } from "../context/context";

import Header from "../components/Header";
import SetupVote from "../components/SetupVote";
import ViewVotes from "../components/ViewVotes";
import style from "../styles/Home.module.css";

export default function Home() {
  // UPDATE 1 - Choose your development environment - either local or devnet.
  // URL du RPC à indiquer ici. 
  // const endpoint = "http://127.0.0.1:8899"; 
  const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppProvider>
            <div className={style.wrapper}>
              <Header />
              <SetupVote />
              <ViewVotes />
            </div>
          </AppProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}