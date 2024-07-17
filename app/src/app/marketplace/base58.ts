const bs58 = require('bs58');

// Paste your array from id.json here
const privateKeyArray = [161,51,41];

// Convert the array to Uint8Array
const secretKey = new Uint8Array(privateKeyArray);

// Convert to Base58
const base58PrivateKey = bs58.encode(secretKey);

console.log(base58PrivateKey);