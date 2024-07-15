use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use mpl_token_metadata::{
    accounts::{Metadata as MetadataAccount},
    types::DataV2,
};
use mpl_token_metadata::state::Metadata;
/// ☝️We have to check how access metadata of the pixel.
/// Check Method that we can find on Internet.

declare_id!("AkJJwPqnKJghe5mU9QEXHg8BJxP5KreqtBNY91ofMNS2");


#[program]
pub mod vault {
    use super::*;

    ///////////////////////
    /// Initialisation ////
    ///////////////////////

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault: &mut Account<Vault> = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key(); //🫲Key of the deployer
        vault.total_balance = 0;
        Ok(())
    }

    ///////////////////////
    /// Deposit        ////
    ///////////////////////
    // Let see if we don't want to inpu the ids beginning, ids ends.
    pub fn deposit(ctx: Context<Deposit>, amount: u64, x_beg: u32, y_beg: u32, x_end: u32, y_end: u32) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &ctx.accounts.user;

        // Transfer tokens from user of the Board to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            amount,
        )?;

        vault.total_balance += amount;

        // Update matrix counters
        for x in x_beg..=x_end {
            for y in y_beg..=y_end {
                let key = (x, y);
                // Update the count that is reinitialize when the user withdraw
                let count = vault.matrix_counter.entry(key).or_insert(0);
                *count += 1;
                // Update the total count of the pixel
                let totalcount = vault.total_count.entry(key).or_insert(0);
                *totalcount += 1;
            }
        }

        vault.total_balance += amount;
        Ok(())
    }

    ///////////////////////
    /// Withdraw       ////
    ///////////////////////


    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Access metadata of the NFT
        // let nft_data = &ctx.accounts.nft_metadata;
        let nft_metadata = Metadata::from_account_info(&ctx.accounts.nft_metadata)?;

        // Verify NFT ownership and collection
        require!(
            //We have to convert the PubKey of the collection into the array to have access to the withdraw function.
            *nft_metadata.key == Pubkey::new_from_array([0xdf, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            VaultError::InvalidNFTCollection
        );

        // Get NFT counter value
        let counter = nft_metadata.data.name.parse::<u64>().unwrap();
        let last_withdraw = vault.last_withdraw_counter.get(&ctx.accounts.user.key()).unwrap_or(&0);
        let withdraw_amount = counter.saturating_sub(*last_withdraw);

        require!(withdraw_amount > 0, VaultError::NoWithdrawAvailable);
        require!(amount <= withdraw_amount, VaultError::WithdrawAmountTooHigh);
        require!(amount <= vault.total_balance, VaultError::InsufficientFunds);

        // Transfer tokens from vault to user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: vault.to_account_info(),
                },
                &[&[b"vault", &[vault.bump]]],
            ),
            amount,
        )?;

        vault.total_balance -= amount;
        vault.last_withdraw_counter.insert(ctx.accounts.user.key(), counter);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 32)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: We're reading NFT metadata, which is safe
    // #[account(owner = mpl_token_metadata::id())]
    // pub nft_metadata: AccountInfo<'info>,
    pub nft_metadata: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub total_balance: u64,
    pub last_withdraw_counter: std::collections::HashMap<Pubkey, u64>,
    pub matrix_counter: std::collections::HashMap<(u32, u32), u64>,
    pub total_count: std::collections::HashMap<(u32, u32), u64>,
    pub bump: u8,
}

#[error_code]
pub enum VaultError {
    #[msg("Invalid NFT collection")]
    InvalidNFTCollection,
    #[msg("No withdraw available")]
    NoWithdrawAvailable,
    #[msg("Withdraw amount too high")]
    WithdrawAmountTooHigh,
    #[msg("Insufficient funds in the vault")]
    InsufficientFunds,
    #[msg("Invalid NFT metadata")]
    InvalidNFTMetadata,
}