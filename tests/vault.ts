import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { assert } from 'chai';
const NFTCollection = require('./mockNFTs');


//Creation of a Pixel Collection.
const pixelCollection = new NFTCollection();

// Vault interfaces
interface Vault {
  authority: PublicKey;
  totalBalance: anchor.BN;
  lastWithdrawCounter: Map<string, anchor.BN>;
  matrixCounter: Map<string, anchor.BN>;
  totalCount: Map<string, anchor.BN>;
  bump: number;
}

describe('vault', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  let vaultPDA: PublicKey;
  let vaultBump: number;
  let mintA: Token;
  let userTokenAccountA: PublicKey;
  let vaultTokenAccountA: PublicKey;

  const payer = anchor.web3.Keypair.generate();
  const mintAuthority = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    const [_vaultPDA, _vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('vault'))],
      program.programId
    );
    vaultPDA = _vaultPDA;
    vaultBump = _vaultBump;

    await program.rpc.initialize({
      accounts: {
        vault: vaultPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.authority.equals(provider.wallet.publicKey));
    assert.ok(vault.totalBalance.toNumber() === 0);
  });

  it('Can deposit', async () => {
    const amount = new anchor.BN(100);
    const x_beg = 0;
    const y_beg = 0;
    const x_end = 1;
    const y_end = 1;

    await program.rpc.deposit(amount, x_beg, y_beg, x_end, y_end, {
      accounts: {
        vault: vaultPDA,
        user: provider.wallet.publicKey,
        userTokenAccount: userTokenAccountA,
        vaultTokenAccount: vaultTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.totalBalance.toNumber() === 100);
  });

  it('Updates matrix counters on deposit', async () => {
    const amount = new anchor.BN(50);
    const id = 1234; // Replace with a valid NFT ID from the NFT collection
    const { x, y } = getCoordinatesFromId(id);

    await program.rpc.deposit(amount, x, y, x, y, {
        accounts: {
            vault: vaultPDA,
            user: provider.wallet.publicKey,
            userTokenAccount: userTokenAccountA,
            vaultTokenAccount: vaultTokenAccountA,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.matrixCounter.get(`${x},${y}`) === 2);
    assert.ok(vault.totalCount.get(`${x},${y}`) === 2);
});

  it('Can withdraw', async () => {
    const amount = new anchor.BN(50);

    // Create a mock NFT metadata account
    const nftMetadata = Keypair.generate();
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(nftMetadata.publicKey, 1000000000),
      "confirmed"
    );

    await program.rpc.withdraw(amount, {
      accounts: {
        vault: vaultPDA,
        user: provider.wallet.publicKey,
        userTokenAccount: userTokenAccountA,
        vaultTokenAccount: vaultTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
        nftMetadata: nftMetadata.publicKey,
      },
      signers: [nftMetadata],
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.totalBalance.toNumber() === 50);
  });

  it('Cannot withdraw more than available', async () => {
    const amount = new anchor.BN(100);

    // Create a mock NFT metadata account
    const nftMetadata = Keypair.generate();
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(nftMetadata.publicKey, 1000000000),
      "confirmed"
    );

    try {
      await program.rpc.withdraw(amount, {
        accounts: {
          vault: vaultPDA,
          user: provider.wallet.publicKey,
          userTokenAccount: userTokenAccountA,
          vaultTokenAccount: vaultTokenAccountA,
          tokenProgram: TOKEN_PROGRAM_ID,
          nftMetadata: nftMetadata.publicKey,
        },
        signers: [nftMetadata],
      });
      assert.fail('Expected withdrawal to fail');
    } catch (error) {
      assert.include(error.toString(), 'WithdrawAmountTooHigh');
    }
  });

  it('Cannot withdraw with invalid NFT collection', async () => {
    const amount = new anchor.BN(10);

    // Create an invalid NFT metadata account
    const invalidNftMetadata = Keypair.generate();
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(invalidNftMetadata.publicKey, 1000000000),
      "confirmed"
    );

    try {
      await program.rpc.withdraw(amount, {
        accounts: {
          vault: vaultPDA,
          user: provider.wallet.publicKey,
          userTokenAccount: userTokenAccountA,
          vaultTokenAccount: vaultTokenAccountA,
          tokenProgram: TOKEN_PROGRAM_ID,
          nftMetadata: invalidNftMetadata.publicKey,
        },
        signers: [invalidNftMetadata],
      });
      assert.fail('Expected withdrawal to fail');
    } catch (error) {
      assert.include(error.toString(), 'InvalidNFTCollection');
    }
  });

  it('Updates matrix counter on deposit', async () => {
    const amount = new anchor.BN(50);
    const x_beg = 0;
    const y_beg = 0;
    const x_end = 1;
    const y_end = 1;

    await program.rpc.deposit(amount, x_beg, y_beg, x_end, y_end, {
      accounts: {
        vault: vaultPDA,
        user: provider.wallet.publicKey,
        userTokenAccount: userTokenAccountA,
        vaultTokenAccount: vaultTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.matrixCounter.get('0,0') === 2);
    assert.ok(vault.matrixCounter.get('0,1') === 2);
    assert.ok(vault.matrixCounter.get('1,0') === 2);
    assert.ok(vault.matrixCounter.get('1,1') === 2);
  });

  it('Updates total count on deposit', async () => {
    const amount = new anchor.BN(25);
    const x_beg = 0;
    const y_beg = 0;
    const x_end = 0;
    const y_end = 0;

    await program.rpc.deposit(amount, x_beg, y_beg, x_end, y_end, {
      accounts: {
        vault: vaultPDA,
        user: provider.wallet.publicKey,
        userTokenAccount: userTokenAccountA,
        vaultTokenAccount: vaultTokenAccountA,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    const vault = await program.account.vault.fetch(vaultPDA);
    assert.ok(vault.totalCount.get('0,0') === 3);
  });

  // Helper function to create and initialize token accounts
  async function createAndInitializeTokenAccount(mint: Token, owner: PublicKey): Promise<PublicKey> {
    const tokenAccount = await mint.createAccount(owner);
    await mint.mintTo(
      tokenAccount,
      mintAuthority.publicKey,
      [mintAuthority],
      1000
    );
    return tokenAccount;
  }

  before(async () => {
    // Airdrop SOL to payer
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(payer.publicKey, 10000000000),
      "confirmed"
    );

    // Create mint
    mintA = await Token.createMint(
      program.provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      6,
      TOKEN_PROGRAM_ID
    );

    // Create token accounts
    userTokenAccountA = await createAndInitializeTokenAccount(mintA, provider.wallet.publicKey);
    vaultTokenAccountA = await createAndInitializeTokenAccount(mintA, vaultPDA);
  });
});

