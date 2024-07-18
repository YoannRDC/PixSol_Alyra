use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use std::collections::HashMap;

declare_id!("DTB5RA5VU7PmXwCmwaafLD6s5udJDZRRd5fHDA8eY2Rm");

#[program]
pub mod vault {
    use super::*;

    ///////////////////////
    /// Constants      ////
    ///////////////////////

    const DEPOSIT_AMOUNT_PER_PIXEL: u64 = 900000;
    const WITHDRAW_AMOUNT_PER_PIXEL: u64 = 450000;

    ///////////////////////
    /// Initialisation ////
    ///////////////////////

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault: &mut Account<Vault> = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key(); //<==Key of the deployer
        vault.nft_mint = ctx.accounts.nft_mint.key(); //
        vault.total_balance = 0;
        vault.matrix_counter = HashMap::new();
        vault.total_count = HashMap::new();
        Ok(())
    }

    ///////////////////////
    /// Deposit        ////
    ///////////////////////

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
        nft_id_beg: u32,
        nft_id_end: u32,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        let coord_beg = get_coordinates_from_id(nft_id_beg);
        let coord_end = get_coordinates_from_id(nft_id_end);

        let number_of_elements: u64 =
            ((coord_end.y - coord_beg.y + 1) * (coord_end.x - coord_beg.x + 1)).into(); //A verif avec calcul matriciel, devrait etre bon
        require!(
            amount >= (number_of_elements * DEPOSIT_AMOUNT_PER_PIXEL).into(),
            VaultError::DepositAmountTooLow
        );

        // Update matrix counters
        for x in coord_beg.x..=coord_end.x {
            for y in coord_beg.y..=coord_end.y {
                let key = (x, y);
                // Update the count that is reinitialize when the user withdraw
                let count = vault.matrix_counter.entry(key).or_insert(0);
                *count += 1;
                // Update the total count of the pixel
                let totalcount = vault.total_count.entry(key).or_insert(0);
                *totalcount += 1;
            }
        }
        // **user.to_account_info().try_borrow_mut_lamports()? -= deposit_amount;
        // **vault.to_account_info().try_borrow_mut_lamports()? += deposit_amount;
        // We have to determine if A or V is the best
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        vault.total_balance += amount;
        Ok(())
    }

    ///////////////////////
    /// Withdraw       ////
    ///////////////////////

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &ctx.accounts.user;
        let user_token_account = &ctx.accounts.user_token_account;

        let nft_count = check_pixel_number(user_token_account, user, vault.nft_mint)?;
        let mut total_withdraw_amount: u64 = 0;

        for _ in 0..nft_count {
            for (_, count) in vault.matrix_counter.iter_mut() {
                if *count > 0 {
                    total_withdraw_amount += *count * WITHDRAW_AMOUNT_PER_PIXEL;
                    *count = 0;
                }
            }
        }

        require!(total_withdraw_amount > 0, VaultError::NoWithdrawAvailable);
        require!(
            total_withdraw_amount <= vault.total_balance,
            VaultError::InsufficientFunds
        );

        **vault.to_account_info().try_borrow_mut_lamports()? -= total_withdraw_amount;
        **user.to_account_info().try_borrow_mut_lamports()? += total_withdraw_amount;

        vault.total_balance -= total_withdraw_amount;
        // vault.last_withdraw_counter.insert(ctx.accounts.user.key(), counter);
        Ok(())
    }
}

///////////////////////
/// Helpers        ////
///////////////////////

pub fn check_pixel_number(
    user_token_account: &Account<TokenAccount>,
    user: &Signer,
    nft_mint: Pubkey,
) -> Result<u32> {
    if user_token_account.owner == user.key() && user_token_account.mint == nft_mint {
        let nft_count = user_token_account.amount as u32;
        Ok(nft_count)
    } else {
        Ok(0)
    }
}

#[derive(Clone, Copy)]
struct Coordinates {
    x: u32,
    y: u32,
}
// Helper function to convert NFT ID to coordinates
fn get_coordinates_from_id(id: u32) -> Coordinates {
    let row = ((id - 1) / 1000) as u32;
    let col = ((id - 1) % 1000) as u32;
    let x = col + 1;
    let y = row + 1;
    Coordinates { x, y }
}

//////////////////////////////
/// Accounts Specification////
//////////////////////////////

#[account]
pub struct Vault {
    authority: Pubkey,
    nft_mint: Pubkey, // Clé publique de la collection
    total_balance: u64,
    matrix_counter: HashMap<(u32, u32), u64>,
    total_count: HashMap<(u32, u32), u64>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 8)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    // pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
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
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_account.owner == vault.key())]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// #[derive(Accounts)]
// pub struct CheckPixelNumber<'info> {
//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,
//     pub user: Signer<'info>,
//     pub vault: Account<'info, Vault>,
// }

#[error_code]
pub enum VaultError {
    #[msg("Deposit amount is too low")]
    DepositAmountTooLow,
    #[msg("No withdraw available")]
    NoWithdrawAvailable,
    #[msg("Insufficient funds in the vault")]
    InsufficientFunds,
}
