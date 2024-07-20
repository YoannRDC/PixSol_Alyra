use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::merkle::{MerkleTree, PixelData};

declare_id!("DTB5RA5VU7PmXwCmwaafLD6s5udJDZRRd5fHDA8eY2Rm");

#[program]
pub mod vault {
    use super::*;

    ///////////////////////
    /// Constants      ////
    ///////////////////////

    const DEPOSIT_AMOUNT_PER_PIXEL: u64 = 900_000; //Amount deposited in Deposit / Pixels
    const WITHDRAW_AMOUNT_PER_PIXEL: u64 = 450_000; //Amount withdrawable / Pixels

    ///////////////////////
    /// Initialisation ////
    ///////////////////////

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault: &mut Account<Vault> = &mut ctx.accounts.vault;
        let merkle_tree: &mut Account<MerkleTreeAccount> = &mut ctx.accounts.merkle_tree;

        vault.authority = ctx.accounts.authority.key();
        vault.nft_mint = ctx.accounts.nft_mint.key();
        vault.total_balance = 0;
        vault.merkle_tree = merkle_tree.key();

        merkle_tree.root = [0; 32];
        merkle_tree.leaves = vec![[0; 32]; 2_usize.pow(20)];

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
            ((coord_end.y - coord_beg.y + 1) * (coord_end.x - coord_beg.x + 1)).into();
        require!(
            amount >= (number_of_elements * DEPOSIT_AMOUNT_PER_PIXEL).into(),
            VaultError::DepositAmountTooLow
        );

        let mut merkle_tree = MerkleTree::new_with_root(&vault.merkle_root);

        for x in coord_beg.x..=coord_end.x {
            for y in coord_beg.y..=coord_end.y {
                let index = get_index_from_coordinates(x, y);
                let mut pixel_data = PixelData::default();

                pixel_data.matrix_counter += 1;
                pixel_data.total_count += 1;

                // merkle_tree.update(index, &pixel_data);
                update_merkle_tree(merkle_tree, index, &pixel_data);
            }
        }

        vault.merkle_root = merkle_tree.root;

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

    fn update_merkle_tree(
        merkle_tree: &mut Account<MerkleTreeAccount>,
        index: usize,
        data: &PixelData,
    ) {
        let leaf = keccak::hash(&data.try_to_vec().unwrap()).to_bytes();
        merkle_tree.leaves[index] = leaf;
        merkle_tree.root = calculate_root(&merkle_tree.leaves);
    }

    fn calculate_root(leaves: &Vec<[u8; 32]>) -> [u8; 32] {
        // Implement the Merkle root calculation here
        // This is a placeholder implementation
        [0; 32]
    }

    ///////////////////////
    /// Withdraw        ///
    ///////////////////////

    pub fn withdraw(
        ctx: Context<Withdraw>,
        nft_ids: Vec<u32>,
        merkle_proofs: Vec<Vec<[u8; 32]>>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let merkle_tree = &mut ctx.accounts.merkle_tree;

        let vault = &mut ctx.accounts.vault;
        let user = &ctx.accounts.user;
        let user_token_account = &ctx.accounts.user_token_account;

        let nft_count = check_pixel_number(user_token_account, user, vault.nft_mint)?;
        require!(
            nft_count >= nft_ids.len() as u32,
            VaultError::InsufficientNFTs
        );

        let mut total_withdraw_amount: u64 = 0;
        let mut merkle_tree = MerkleTree::new_with_root(&vault.merkle_root);

        for (nft_id, proof) in nft_ids.iter().zip(merkle_proofs.iter()) {
            let coord = get_coordinates_from_id(*nft_id);
            let index = get_index_from_coordinates(coord.x, coord.y);

            let leaf = merkle_tree.leaves[index];

            // Verify the Merkle proof
            require!(
                verify_merkle_proof(index, &merkle_tree.root, proof, &leaf),
                VaultError::InvalidMerkleProof
            );

            let mut pixel_data = PixelData::try_from_slice(&leaf).unwrap();

            if pixel_data.matrix_counter > 0 {
                total_withdraw_amount += pixel_data.matrix_counter * WITHDRAW_AMOUNT_PER_PIXEL;
                pixel_data.matrix_counter = 0;
                update_merkle_tree(merkle_tree, index, &pixel_data);
            }
        }

        require!(total_withdraw_amount > 0, VaultError::NoWithdrawAvailable);
        require!(
            total_withdraw_amount <= vault.total_balance,
            VaultError::InsufficientFunds
        );

        let cpi_accounts = token::Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let vault_bump = ctx.bumps.vault;
        let seeds = &[b"vault".as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, total_withdraw_amount)?;

        vault.total_balance -= total_withdraw_amount;
        vault.merkle_root = merkle_tree.root;
        Ok(())
    }
}

///////////////////////
/// Helpers        ////
///////////////////////

fn get_index_from_coordinates(x: u32, y: u32) -> usize {
    ((y - 1) * 1000 + (x - 1)) as usize
}
// Helper function to convert NFT ID to coordinates
fn get_coordinates_from_id(id: u32) -> Coordinates {
    let row = ((id - 1) / 1000) as u32;
    let col = ((id - 1) % 1000) as u32;
    let x = col + 1;
    let y = row + 1;
    Coordinates { x, y }
}

// pub fn check_pixel_number(
//     user_token_account: &Account<TokenAccount>,
//     user: &Signer,
//     nft_mint: Pubkey,
// ) -> Result<u32> {
//     if user_token_account.owner == user.key() && user_token_account.mint == nft_mint {
//         let nft_count = user_token_account.amount as u32;
//         Ok(nft_count)
//     } else {
//         Ok(0)
//     }
// }

pub fn check_pixel_number(
    user_token_account: &Account<TokenAccount>,
    user: &Signer,
    nft_mint: Pubkey,
) -> Result<u32> {
    if user_token_account.owner == user.key() && user_token_account.mint == nft_mint {
        let nft_count = user_token_account.amount as u32;
        Ok(nft_count)
    } else {
        Err(VaultError::InvalidAccountData.into())
    }
}

#[derive(Clone, Copy)]
struct Coordinates {
    x: u32,
    y: u32,
}

//////////////////////////////
/// Accounts Specification ///
//////////////////////////////

#[account]
pub struct Vault {
    authority: Pubkey,
    nft_mint: Pubkey,
    total_balance: u64,
    merkle_tree: Pubkey,
}

#[account]
pub struct MerkleTreeAccount {
    pub root: [u8; 32],
    pub leaves: Vec<[u8; 32]>,
}

#[account(zero_copy)]
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PixelData {
    pub matrix_counter: u64,
    pub total_count: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 8)]
    pub vault: Account<'info, Vault>,
    #[account(init, payer = authority, space = 8 + 32 + (32 * 2_usize.pow(20)))]
    pub merkle_tree: Account<'info, MerkleTreeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, nft_id_beg: u32, nft_id_end: u32)]
pub struct Deposit<'info> {
    #[account(
        mut, 
        seeds = [b"vault"], 
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut, 
        constraint = merkle_tree.key() == vault.merkle_tree
    )]
    pub merkle_tree: Account<'info, MerkleTreeAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut, 
        constraint = merkle_tree.key() == vault.merkle_tree
    )]
    pub merkle_tree: Account<'info, MerkleTreeAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_account.owner == vault.key())]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pixel_data: AccountLoader<'info, PixelData>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum VaultError {
    #[msg("Deposit amount is too low")]
    DepositAmountTooLow,
    #[msg("No withdraw available")]
    NoWithdrawAvailable,
    #[msg("Insufficient funds in the vault")]
    InsufficientFunds,
    #[msg("Insufficient NFTs")]
    InsufficientNFTs,
    #[msg("Invalid account data")]
    InvalidAccountData,
}
