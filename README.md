

//***********
// Back - Anchor
//***********

Build the projct: 
-> anchor build  
    -> Generates target/idl/xxx.json to copy in app/utils/idl.json

Define the PROGRAM_ID of the contract:
-> src: via betsolpg.io -> build & deploy -> Program ID:
-> dest: app/utils/constant.js

//***********
// Front
//***********

To run the front:
-> cd app
-> npm run dev
-> Open 'http://localhost:3000/' in Browser.

Choose the Wallet Network (phantom):
->  Settings (Réglages) -> Developer parameters (Paramétrages pour développeurs) -> Solana -> Choose Local or Devnet.


//***********
// Memo
//***********

Look for these tags in the code to identify where modifications are needed.

// UPDATE 1 - Choose your development environment - either local or devnet.
// UPDATE 1 - Enter the publicKey of your program
// UPDATE 2 - Program connection
// UPDATE 2 - Wallet connection

// READ PROGRAM DATA - Back
// READ PROGRAM DATA - Front

// WRITE PROGRAM DATA - Back