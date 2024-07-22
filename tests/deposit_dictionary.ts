import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { expect } from 'chai';
import { MutableDictionary } from '../target/types/types_mutable_dictionary'; // Adjust path if necessary

describe('Mutable Dictionary', () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.MutableDictionary as Program<MutableDictionary>;

    const user = provider.wallet as anchor.Wallet;

    // Keypairs for dictionary and vault accounts
    const dictionaryKeypair = Keypair.generate();
    const vaultKeypair = Keypair.generate();

    it('Initialize the dictionary and vault', async () => {
        await program.methods.initialize()
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
                vault: vaultKeypair.publicKey,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .signers([dictionaryKeypair, vaultKeypair])
            .rpc();

        const dictionary = await program.account.dictionary.fetch(dictionaryKeypair.publicKey);
        const vault = await program.account.vault.fetch(vaultKeypair.publicKey);
    
        expect(dictionary.entries.length).to.equal(100);
        expect(vault.totalBalance.toNumber()).to.equal(0);
    });
    
    it('Read an entry from the dictionary', async () => {
        const entryId = 1;
    
        await program.methods.read(entryId)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
            })
            .rpc();
    
        // Assuming the `read` method only logs output and doesn't return anything
    });

    it('Update an entry in the dictionary with deposit', async () => {
        const entryId = 1;
        const depositAmount = new anchor.BN(10000000);
    
        await program.methods.update(entryId, depositAmount)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
                vault: vaultKeypair.publicKey,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
    
        const dictionary = await program.account.dictionary.fetch(dictionaryKeypair.publicKey);
        const vault = await program.account.vault.fetch(vaultKeypair.publicKey);
    
        const entry = dictionary.entries.find(e => e.id === entryId);
        expect(entry.value).to.equal(1);
        expect(vault.totalBalance.toNumber()).to.equal(depositAmount.toNumber());
    });

    it('Withdraw and reset an entry in the dictionary', async () => {
        const entryId = 1;
    
        await program.methods.withdrawAndReset(entryId)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
                vault: vaultKeypair.publicKey,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            }as any)
            .rpc();
    
        const dictionary = await program.account.dictionary.fetch(dictionaryKeypair.publicKey);
        const vault = await program.account.vault.fetch(vaultKeypair.publicKey);
    
        const entry = dictionary.entries.find(e => e.id === entryId);
        expect(entry.value).to.equal(0);
        expect(vault.totalBalance.toNumber()).to.equal(0);
    });

    it('Update multiple entries in the dictionary by batch with deposit', async () => {
        const entryIds = Buffer.from([1, 2, 3]);
        const depositAmount = new anchor.BN(15000000);
    
        await program.methods.updateByBatch(entryIds, depositAmount)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
                vault: vaultKeypair.publicKey,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
    
        const dictionary = await program.account.dictionary.fetch(dictionaryKeypair.publicKey);
        const vault = await program.account.vault.fetch(vaultKeypair.publicKey);
    
        entryIds.forEach(id => {
            const entry = dictionary.entries.find(e => e.id === id);
            expect(entry.value).to.equal(1);
        });
        expect(vault.totalBalance.toNumber()).to.equal(depositAmount.toNumber());
    });

    it('Withdraw and reset multiple entries in the dictionary by batch', async () => {
        const entryIds = Buffer.from([1, 2, 3]);
    
        await program.methods.withdrawAndResetByBatch(entryIds)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
                vault: vaultKeypair.publicKey,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            }as any)
            .rpc();
    
        const dictionary = await program.account.dictionary.fetch(dictionaryKeypair.publicKey);
        const vault = await program.account.vault.fetch(vaultKeypair.publicKey);
    
        entryIds.forEach(id => {
            const entry = dictionary.entries.find(e => e.id === id);
            expect(entry.value).to.equal(0);
        });
        expect(vault.totalBalance.toNumber()).to.equal(0);
    });

    it('Read multiple entries from the dictionary by batch', async () => {
        const entryIds = Buffer.from([1, 2, 3]);
    
        await program.methods.readByBatch(entryIds)
            .accounts({
                dictionary: dictionaryKeypair.publicKey,
            })
            .rpc();
    
        // Assuming the `readByBatch` method only logs output and doesn't return anything
    });
});