// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount};
// // use mpl_token_metadata::state::Metadata;

// // ☝️We have to check how access metadata of the pixel.
// // Check Method that we can find on Internet.
// // TODO: Create a variable to claim that the owner of the SC
// // Can withdraw his part of the Vault.
// // Search the different functions that can check metadatas of the pixels when someone
// // want to withdraw.

// declare_id!("");


// #[program]
// pub mod vault {
    
//     const DEPOSIT_AMOUNT_PER_PIXEL: u64 = 900000;
//     const WITHDRAW_AMOUNT_PER_PIXEL: u64 = DEPOSIT_AMOUNT_PER_PIXEL /2;
//     use super::*;

//     ///////////////////////
//     /// Initialisation ////
//     ///////////////////////

//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         let vault: &mut Account<Vault> = &mut ctx.accounts.vault;
//         vault.authority = ctx.accounts.authority.key(); //🫲Key of the deployer
//         vault.total_balance = 0;
//         Ok(())
//     }

//     ///////////////////////
//     /// Deposit        ////
//     ///////////////////////
//     /// TODO: add a require : AmountToDeposit <= amount send inside the deposit function
//     /// With AmountToDeposit = PriceRentPixel * NumberOfPixelSelected
//     pub fn deposit(ctx: Context<Deposit>, amount: u64, nft_id_beg: u32, nft_id_end: u32) -> Result<()> {
//         let vault = &mut ctx.accounts.vault;
//         let user = &ctx.accounts.user;

        
//         let coordBeg = get_coordinates_from_id(nft_id_beg);
//         let x_beg: u32 = coordBeg.x;
//         let y_beg= coordBeg.y;

//         let coordEnd = get_coordinates_from_id(nft_id_end);
//         let x_end = coordEnd.x;
//         let y_end = coordEnd.y;
        
//         let pixelCount = (x_end - x_beg +1)*(y_end - y_beg +1);
//         let deposit_amount = pixelCount as u64 * DEPOSIT_AMOUNT_PER_PIXEL; //Define TODO:

//         **user.to_account_info().try_borrow_mut_lamports()? -= deposit_amount;
//         **vault.to_account_info().try_borrow_mut_lamports()? += deposit_amount;


//         // OR



//         // Transfer tokens from user of the Board to vault
//         // token::transfer(
//         //     CpiContext::new(
//         //         ctx.accounts.token_program.to_account_info(),
//         //         token::Transfer {
//         //             from: ctx.accounts.user_token_account.to_account_info(),
//         //             to: ctx.accounts.vault_token_account.to_account_info(),
//         //             authority: user.to_account_info(),
//         //         },
//         //     ),
//         //     amount,
//         // )?;
//         // vault.total_balance += amount;

//         // OR

//         // let cpi_context = CpiContext::new(
//         //     ctx.accounts.system_program.to_account_info(),
//         //     anchor_lang::system_program::Transfer {
//         //         from: user.to_account_info(),
//         //         to: vault.to_account_info(),
//         //     },
//         // );
//         // anchor_lang::system_program::transfer(cpi_context, deposit_amount)?;

//         // Update matrix counters
//         for x in x_beg..=x_end {
//             for y in y_beg..=y_end {
//                 let key = (x, y);
//                 // Update the count that is reinitialize when the user withdraw
//                 let count = vault.matrix_counter.entry(key).or_insert(0);
//                 *count += 1;
//                 // Update the total count of the pixel
//                 let totalcount = vault.total_count.entry(key).or_insert(0);
//                 *totalcount += 1;
//             }
//         }

//         vault.total_balance += amount;
//         Ok(())
//     }

//     ///////////////////////
//     /// Withdraw       ////
//     ///////////////////////


//     pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
//         let vault = &mut ctx.accounts.vault;
//         let user = &ctx.accounts.user;

//         let mut total_withdraw_amount = 0;
//         let collection_pubKey = Pubkey::new_from_array([0xdf, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

//         // 👇Logic is kill if we cannot initiate AVector as NFT possess from the collection to user
//         // for nft_id in ctx.accounts.user_nfts.iter() {

//         //     require!(
//         //         is_nft_from_collection(*nft_id, &collection_pubKey),
//         //         VaultError::InvalidNFTCollection
//         //     );

//         //     let coordinates = get_coordinates_from_id(*nft_id);
//         //     let key = (coordinates.x, coordinates.y);

//         //     if let Some(count) = vault.matrix_counter.get_mut(&key) {
//         //         total_withdraw_amount += *count;
//         //         *count = 0; 
//         //     }
//         // }

//         // CLAUDE SOLUTION 👇 TO rework with Tom implementation with JS: https://codefile.io/f/Ul0nBi38aa
//         // Assuming user_nfts is a TokenAccount containing the user's NFTs
//         let user_nfts_data = ctx.accounts.user_nfts.try_borrow_data()?;
//         let nft_count = user_nfts_data.len() / 32; // Assuming each NFT is represented by a 32-byte pubkey

//         for i in 0..nft_count {
//             let start = i * 32;
//             let end = start + 32;
//             let nft_pubkey = Pubkey::from(&user_nfts_data[start..end]);
//             let nft_id = get_nft_id_from_pubkey(&nft_pubkey);

//             // Verifyier NFT BElongs to Colletcion.
//             require!(
//                 is_nft_from_collection(nft_id, &nft_pubkey),
//                 VaultError::InvalidNFTCollection
//             );

//             let coordinates = get_coordinates_from_id(nft_id);
//             let key = (coordinates.x, coordinates.y);

//             if let Some(count) = vault.matrix_counter.get_mut(&key) {
//                 total_withdraw_amount += WITHDRAW_AMOUNT_PER_PIXEL;
//                 *count = count.saturating_sub(1);
//             }
//         }

//         require!(total_withdraw_amount > 0, VaultError::NoWithdrawAvailable);
//         require!(total_withdraw_amount <= vault.total_balance, VaultError::InsufficientFunds);

//         **vault.to_account_info().try_borrow_mut_lamports()? -= total_withdraw_amount;
//         **user.to_account_info().try_borrow_mut_lamports()? += total_withdraw_amount;
        
//         // token::transfer(
//         //     CpiContext::new_with_signer(
//         //         ctx.accounts.token_program.to_account_info(),
//         //         token::Transfer {
//         //             from: ctx.accounts.vault_token_account.to_account_info(),
//         //             to: ctx.accounts.user_token_account.to_account_info(),
//         //             authority: vault.to_account_info(),
//         //         },
//         //         &[&[b"vault", &[vault.bump]]],
//         //     ),
//         //     total_withdraw_amount,
//         // )?;

//         vault.total_balance -= total_withdraw_amount;
//         // vault.last_withdraw_counter.insert(ctx.accounts.user.key(), counter);
//         Ok(())
//     }
// }

// #[derive(Clone, Copy)]
// struct Coordinates {
//     x: u32,
//     y: u32,
// }
// // Helper function to convert NFT ID to coordinates
// fn get_coordinates_from_id(id: u32) -> Coordinates {
//     let row = ((id - 1) / 1000) as u32;
//     let col = ((id - 1) % 1000) as u32;
//     let x = col + 1;
//     let y = row + 1;
//     Coordinates {x, y}
// }

// fn get_nft_id_from_pubkey(nft_pubkey: &Pubkey) -> u32 {
//     // TODO: Implement the logic to get the NFT ID from its pubkey
//     let bytes = nft_pubkey.to_bytes();
//     u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
// }

// fn is_nft_from_collection(nft_id: u32, collection_pubkey: &Pubkey) -> bool {
//     // TODO: Assure that the logic helps with verifying that the NFT is actually from the 
//     // Actual Collection.
//     nft_id >= 1 && nft_id <= 1_000_001 && collection_pubkey == &Pubkey::new_from_array([0xdf, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
// }

// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     #[account(init, payer = authority, space = 8 + 32 + 8 + 32)]
//     pub vault: Account<'info, Vault>,
//     #[account(mut)]
//     pub authority: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }

// #[derive(Accounts)]
// pub struct Deposit<'info> {
//     #[account(mut)]
//     pub vault: Account<'info, Vault>,
//     #[account(mut)]
//     pub user: Signer<'info>,
//     // #[account(mut)]
//     // pub user_token_account: Account<'info, TokenAccount>,
//     // #[account(mut)]
//     // pub vault_token_account: Account<'info, TokenAccount>,
//     // pub token_program: Program<'info, Token>,
// }

// #[derive(Accounts)]
// pub struct Withdraw<'info> {
//     #[account(mut)]
//     pub vault: Account<'info, Vault>,
//     #[account(mut)]
//     pub user: Signer<'info>,
//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub vault_token_account: Account<'info, TokenAccount>,
//     pub token_program: Program<'info, Token>,
//     #[account(owner = *user.key)]
//     // pub user_nfts: Vec<u32>,
//     pub user_nfts: UncheckedAccount<'info>,
//     pub system_program: Program<'info, System>,
// }

// #[account]
// pub struct Vault {
//     pub authority: Pubkey,
//     pub total_balance: u64,
//     pub last_withdraw_counter: std::collections::HashMap<Pubkey, u64>,
//     pub matrix_counter: std::collections::HashMap<(u32, u32), u64>,
//     pub total_count: std::collections::HashMap<(u32, u32), u64>,
//     pub bump: u8,
// }

// #[error_code]
// pub enum VaultError {
//     #[msg("Invalid NFT collection")]
//     InvalidNFTCollection,
//     #[msg("No withdraw available")]
//     NoWithdrawAvailable,
//     #[msg("Withdraw amount too high")]
//     WithdrawAmountTooHigh,
//     #[msg("Insufficient funds in the vault")]
//     InsufficientFunds,
//     #[msg("Invalid NFT metadata")]
//     InvalidNFTMetadata,
// }