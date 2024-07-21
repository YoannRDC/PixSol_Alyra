# PixSol

## Présentation générale

Le projet PixSol est un proof of concept pour une application offrant un tableau interactif (Board) où les utilisateurs peuvent colorier des NFTs (appelés Pixels), uploader des images, et compléter les œuvres d'autres utilisateurs.

Le projet fait interagir deux acteurs complémentaires :

- **Les utilisateurs** : Ils interagissent avec l'œuvre dans l'espoir d'obtenir de la visibilité, de s'amuser ou de recevoir un NFT exclusif accordé aléatoirement à un utilisateur actif à intervalles réguliers. Chaque pixel placé donne une chance d'obtenir ce NFT, qui est un snapshot du board à un moment donné.
- **Les propriétaires** : Ils possèdent les pixels (NFTs) et ont ainsi droit à une partie des bénéfices générés par leurs pixels. Plus un pixel est populaire (cliqué), plus le propriétaire obtient de revenus par rapport à un pixel moins populaire.

Avec ce projet, nous souhaitons offrir un canal interactif à nos utilisateurs : certains apprécieront le côté ludique et l'évolution rapide du board, tandis que d'autres valoriseront les revenus et les possibilités d'échanges dynamiques des pixels sur le marché secondaire.

## Version 1

Dans un souci de transparence, la version actuelle que vous voyez est la V1 du projet. Cette version nous permet de tester nos premiers smart contracts sur Anchor, d'explorer les différentes possibilités et limites, et d'adapter les versions futures en conséquence.

## Vidéo de présentation

[Lien vers la vidéo](http://loom.com/)

## Website Demo (Vercel)

[Lien vers le site](https://pixsol.world/)

## Installation du projet

### Backend - Anchor

Pour construire le projet :

```bash
git clone https://github.com/YoannRDC/PixSol
npm install
cd app
npm install
cd ../program
anchor build
anchor deploy

```

☝️Cela génèrera les fichier target/idl/xxx.json à copier dans app/utils/idl.json.

### Frontend - Next.js

Pour lancer l'application en local sur le port 3000, utilisez un terminal :

```bash
cd app
npm run dev

```

## Smart Contracts

Nos smart contracts sont écrits en Rust en utilisant le framework Anchor.

- **mutable_dictionary.rs**: Ce programme gère un dictionnaire mutable contenant 100 entrées, chacune avec un ID et une valeur. Il permet de lire, mettre à jour, déposer des lamports dans un coffre et retirer des valeurs en fonction des entrées du dictionnaire. Les fonctions incluses gèrent ces opérations de manière simple et en lot, tout en assurant la validation et la gestion des erreurs. [Lien Explorer](https://explorer.solana.com/address/6FBQBJE6pFaRq6iPMc2HN6rRq7TCtzWqLBv7za9BNvtU?cluster=devnet)

- **governance.rs**: Ce programme gère un tableau de pixels où chaque pixel peut être suivi pour la propriété. Il inclut des fonctions pour initialiser le tableau, le mettre à jour avec de nouveaux pixels possédés et vérifier si des pixels spécifiques sont possédés. [Lien Explorer](https://explorer.solana.com/address/9C6m91JP9san9xyZFurePehJvRdBuT2JScMuE6cZeJe9?cluster=devnet)

## Tests

(Section à compléter)

## Technologies Utilisées

### Backend

-Redis
-Rust
-Anchor
-Metaplex

### Frontend

-Next.js
-Vercel
-Chakra-UI
-WalletMultiButton
-Solana/web3.js

## License

(Section à compléter)
