use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use mpl_token_metadata::state::Metadata;

declare_id!("");



#[program]
pub mod vault {
    use super::*;

    ///////////////////////
    /// Initialisation ////
    ///////////////////////

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.total_balance = 0;
        Ok(())
    }

    ///////////////////////
    /// Deposit        ////
    ///////////////////////

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &ctx.accounts.user;

        // Transfer tokens from user to vault
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
        Ok(())
    }

    ///////////////////////
    /// Withdraw       ////
    ///////////////////////


    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let nft_data = &ctx.accounts.nft_metadata;

        // Verify NFT ownership and collection
        require!(
            //We have to convert the PubKey of the collection into the array to have access to the withdraw function.
            nft_data.collection.key == Pubkey::new_from_array([0xdf, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            VaultError::InvalidNFTCollection
        );

        // Get NFT counter value
        let counter = nft_data.data.name.parse::<u64>().unwrap();
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
    #[account(owner = mpl_token_metadata::id())]
    pub nft_metadata: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub total_balance: u64,
    pub last_withdraw_counter: std::collections::HashMap<Pubkey, u64>,
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
}