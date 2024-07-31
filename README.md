# PixSol_Alyra

Projet : Landes Tom, Antoine Picot, Yoann Radenac

## Présentation générale

Le projet PixSol_Alyra est une application offrant un tableau interactif (Board) où les utilisateurs peuvent colorier des NFTs (appelés Pixels), uploader des images, et compléter les œuvres d'autres utilisateurs. PixSol_Alyra tend à être le proof of concept d'un projet plus ambitieux souhaitant gamifier l'expérience NFT. PixSol_Alyra s'est arrêté avec la fin de notre formation. Rendez-vous sur PixSol.wolrd pour voir comment le projet évolue. 

Fil conducteur du projet: Comment créer un tableau pixélisé de NFT sans que celui-ci soit figé dans le temps ? Comment créer un produit où investisseurs et joueurs trouvent leur intérêt ?

Le projet fait interagir deux acteurs complémentaires :

- **Les utilisateurs** : Ils interagissent avec l’œuvre dans l'espoir d'obtenir de la visibilité, de s'amuser ou de recevoir un NFT exclusif accordé aléatoirement à un utilisateur actif à intervalles réguliers. Chaque pixel placé donne une chance d'obtenir ce NFT, qui est un snapshot du board à un moment donné.

- **Les propriétaires** : Ils possèdent les pixels (NFTs) et ont ainsi droit à une partie des bénéfices générés par leurs pixels. Plus un pixel est populaire (cliqué), plus le propriétaire obtient de revenus par rapport à un pixel moins populaire.

Avec ce projet, nous souhaitons offrir un canal interactif à nos utilisateurs : certains apprécieront le côté ludique et l'évolution rapide du board, tandis que d'autres valoriseront les revenus et les possibilités d'échanges dynamiques des pixels sur le marché secondaire.

## PixSol_Alyra

Dans un souci de transparence, la version actuelle que vous voyez est la V1 du projet. Cette version nous permet de tester nos premiers smart contracts sur Anchor, d'explorer les différentes possibilités et les limites, et d'adapter nos développements pour les versions futures en conséquence.

Cette version nous a permis d'explorer des sujets tels que : les cNFTs (Custom Non-Fungible Tokens), les arbres de Merkle, la gestion des big data dans les smart contracts et ses limites, l'écoute d'événements on-chain, les Blink Transactions, la scalabilité, ainsi que la nécessité d'une balance on-chain/off-chain.

## Visibilité du projet

Le projet est actuellement hébergé sur Vercel et est disponible sur l'url suivante.

[PixSol_Alyra](https://pix-sol.vercel.app/)

URL: disponible

├ ○ /                         

Permet de visualiser le board et d'interagir en tant que joueur avec.
    - Je peux colorier un pixel.
    - Je peux colorier un batch de pixels.
    - Je peux imaginer un batch de pixels.

Le tarif d'une coloration est fixé à 0.01 SOL par pixel.

├ ○ /blinkxsol                           

Disponible seulement avec le projet qui tourne en local. blinkxsol permet de minter un cNFT appartenant à la collection PixelBoard afin de devenir propriétaire en utilisant @solana/actions et le système blink.

├ ○ /compliance                          

Mentions légales et Politique de confidentialité

├ ○ /daozone                             

Zone réservée aux possesseurs d'un cNFT Pixel DAO obtenu par le tirage au sort du wallet d'un joueur du board.

├ ○ /lottery                             

Réalise un snapshot du board à l'instant T et attribue un cNFT Pixel DAO à l'un des joueurs présents sur le tableau. Ce cNFT permet d'accéder à la DAO.

├ ○ /mint                                

Permet de minter un cNFT appartenant à la collection PixelBoard afin de devenir propriétaire d'un emplacement du board et de toucher les rentes générées par les joueurs.

Implémente la supervision d'un merkle tree par requête HTTP et écoute les events d'un merkle tree par websocket. 

├ ○ /smartContractDemo                  

Permet d'interagir avec toutes les fonctionnalités du smart contract sans avoir à utiliser le board.

└ ○ /withdraw                            

Permet au propriétaire de retirer les rentes associées à leur pixel (0.0005 SOL par couleur)

### Frontend - Next.js

Pour lancer l'application en local sur le port 3000, utilisez un terminal :

```bash
git clone https://github.com/YoannRDC/PixSol_Alyra
cd app
npm install
npm run dev
```
### .env

```bash
REDIS_URL=
NEXT_PUBLIC_SOLANA_RPC_URL=
MERKLETREE_LOTTERY=
RPC_URL=
PRIVATE_KEY_BASE58=
COLLECTION_MINT=
MERKLE_TREE=
CLOUDNAME=
APICLOUDKEY=
SECRETCLOUD=
CLOUDINARY_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

### Smart Contracts

Notre Smart Contract est écrit en Rust en utilisant le framework Anchor sur la plateforme solpg.io.

Le smart contract principal et son test se trouvent dans le dossier `/programs/main`.

Il vous suffit de copier-coller les fichiers `mutable_dictionary.rs` et `test.ts` dans un nouveau projet solpg afin de tester toutes les fonctionnalités du smart contract.

Dans la partie `/programs`, vous pouvez découvrir de nombreux autres programmes qui nous ont servi de support de R&D sur des sujets comme la gouvernance, la limitation des données, les arbres Merkle, les votes, etc...

- **mutable_dictionary.rs**: Ce programme gère un dictionnaire mutable contenant 100 entrées, chacune avec un ID et une valeur. Il permet de lire, mettre à jour, déposer des lamports dans un vault et retirer des valeurs en fonction des entrées du dictionnaire. Les fonctions incluses gèrent ces opérations de manière simple et en lot, tout en assurant la validation et la gestion des erreurs. [Lien Explorer](https://explorer.solana.com/address/6FBQBJE6pFaRq6iPMc2HN6rRq7TCtzWqLBv7za9BNvtU?cluster=devnet)

## Tests

`test.ts` couvre l'ensemble des fonctions du smart contract.

- `initialize()`: Initialise un dictionnaire et un vault.
- `update()`: Met à jour le compteur de dépôt sur l'ID d'un pixel et transfère le montant du dépôt dans le vault.
- `read()`: Retourne la valeur du compteur sur un pixel.
- `withdraw_and_reset()`: Retire la somme du vault attribuée à un pixel et réinitialise le compteur à zéro.
- `update_by_batch()`: Met à jour les compteurs sur les IDs des pixels et transfère le montant total du dépôt dans le vault.
- `withdraw_and_reset_by_batch()`: Retire la somme du vault attribuée à des pixels et réinitialise les compteurs à zéro.
- `read_by_batch()`: Retourne les valeurs de plusieurs compteurs.

Vous pouvez retrouver l'implémentation des tests pour la gestion du frontend dans `/app/src/app/hooks/useMutableDictionary.ts`

## Technologies Utilisées

### Backend

-Rust
-Anchor
-Metaplex
-Redis
-Cloudinary

### Frontend

-Next.js
-Typescript
-Vercel
-Chakra-UI
-WalletMultiButton
-Solana/web3.js

### Historique du projet

PowerPoint Pixel_V0 : 09/07/2024
[Lien PowerPoint Pixel_V0](https://docs.google.com/presentation/d/1yz87HRqiVtqLVhp4D0pOigV_HGs85IlP6v7az5wZv1A/edit?usp=sharing)

## License
MIT License