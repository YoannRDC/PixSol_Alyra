describe("Mutable Dictionary", () => {
  const dictionaryKeypair = new web3.Keypair();
  const vaultKeypair = new web3.Keypair();

  it("initialize", async () => {
    console.log('Start initialize Test');
    try {
      const txHash = await pg.program.methods
        .initialize()
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
          vault: vaultKeypair.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([dictionaryKeypair, vaultKeypair])
        .rpc();

      console.log(`Initialize transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      const dictionary = await pg.program.account.dictionary.fetch(dictionaryKeypair.publicKey);
      const vault = await pg.program.account.vault.fetch(vaultKeypair.publicKey);

      console.log(`Dictionary entries: ${dictionary.entries.length}`);
      console.log(`Vault balance: ${vault.totalBalance.toString()}`);

      assert(dictionary.entries.length === 100, "Dictionary should have 100 entries");
      assert(vault.totalBalance.eq(new BN(0)), "Vault balance should be 0");
      
      console.log("Initialize test passed successfully");
    } catch (error) {
      console.error("Initialize test failed:", error);
      throw error;
    }
  });

  it("update", async () => {
    console.log('Start Update Test');
    try {
      const id = 0;
      const depositAmount = new BN(5000000);

      const txHash = await pg.program.methods
        .update(id, depositAmount)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
          vault: vaultKeypair.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Update transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      const dictionary = await pg.program.account.dictionary.fetch(dictionaryKeypair.publicKey);
      const vault = await pg.program.account.vault.fetch(vaultKeypair.publicKey);

      console.log(`Updated entry value: ${dictionary.entries[id].value}`);
      console.log(`Updated vault balance: ${vault.totalBalance.toString()}`);

      assert(dictionary.entries[id].value === 1, "Entry value should be 1");
      assert(vault.totalBalance.eq(depositAmount), "Vault balance should match deposit amount");

      console.log("Update test passed successfully");
    } catch (error) {
      console.error("Update test failed:", error);
      throw error;
    }
  });

  it("read", async () => {
    console.log('Start Read Test');
    try {
      const id = 0;

      const txHash = await pg.program.methods
        .read(id)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
        })
        .rpc();

      console.log(`Read transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      console.log("Read test passed successfully");
    } catch (error) {
      console.error("Read test failed:", error);
      throw error;
    }
  });

  it("withdraw_and_reset", async () => {
    console.log('Start Withdraw for one pixel Test');
    try {
      const id = 0;

      const txHash = await pg.program.methods
        .withdrawAndReset(id)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
          vault: vaultKeypair.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Withdraw and reset transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      const dictionary = await pg.program.account.dictionary.fetch(dictionaryKeypair.publicKey);
      const vault = await pg.program.account.vault.fetch(vaultKeypair.publicKey);

      console.log(`Reset entry value: ${dictionary.entries[id].value}`);
      console.log(`Updated vault balance: ${vault.totalBalance.toString()}`);

      assert(dictionary.entries[id].value === 0, "Entry value should be reset to 0");
      assert(vault.totalBalance.eq(new BN(0)), "Vault balance should be 0");

      console.log("Withdraw and reset test passed successfully");
    } catch (error) {
      console.error("Withdraw and reset test failed:", error);
      throw error;
    }
  });

  it("update_by_batch", async () => {
    console.log('Start update  by batch'); 
    try {
      const ids = [1, 2, 3];
      const idsBuffer = Buffer.from(ids);
      const depositAmount = new BN(15_000_000);

      const txHash = await pg.program.methods
        .updateByBatch(idsBuffer, depositAmount)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
          vault: vaultKeypair.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Update by batch transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      const dictionary = await pg.program.account.dictionary.fetch(dictionaryKeypair.publicKey);
      const vault = await pg.program.account.vault.fetch(vaultKeypair.publicKey);

      ids.forEach(id => {
        console.log(`Updated entry ${id} value: ${dictionary.entries[id].value}`);
        assert(dictionary.entries[id].value === 1, `Entry ${id} value should be 1`);
      });

      console.log(`Updated vault balance: ${vault.totalBalance.toString()}`);
      assert(vault.totalBalance.eq(depositAmount), "Vault balance should match deposit amount");

      console.log("Update by batch test passed successfully");
    } catch (error) {
      console.error("Update by batch test failed:", error);
      throw error;
    }
  });

  it("withdraw_and_reset_by_batch", async () => {
    console.log('Start withdraw  by batch'); 
    try {
      const ids = [1, 2, 3];
      const idsBuffer = Buffer.from(ids);
      const txHash = await pg.program.methods
        .withdrawAndResetByBatch(idsBuffer)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
          vault: vaultKeypair.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Withdraw and reset by batch transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      const dictionary = await pg.program.account.dictionary.fetch(dictionaryKeypair.publicKey);
      const vault = await pg.program.account.vault.fetch(vaultKeypair.publicKey);

      ids.forEach(id => {
        console.log(`Reset entry ${id} value: ${dictionary.entries[id].value}`);
        assert(dictionary.entries[id].value === 0, `Entry ${id} value should be reset to 0`);
      });

      console.log(`Updated vault balance: ${vault.totalBalance.toString()}`);
      assert(vault.totalBalance.eq(new BN(0)), "Vault balance should be 0");

      console.log("Withdraw and reset by batch test passed successfully");
    } catch (error) {
      console.error("Withdraw and reset by batch test failed:", error);
      throw error;
    }
  });

  it("read_by_batch", async () => {
    console.log('Start read  by batch'); 
    try {
      const ids = [0, 1, 2, 3];
      const idsBuffer = Buffer.from(ids);
      const txHash = await pg.program.methods
        .readByBatch(idsBuffer)
        .accounts({
          dictionary: dictionaryKeypair.publicKey,
        })
        .rpc();

      console.log(`Read by batch transaction hash: ${txHash}`);
      await pg.connection.confirmTransaction(txHash);

      console.log("Read by batch test passed successfully");
    } catch (error) {
      console.error("Read by batch test failed:", error);
      throw error;
    }
  });
});