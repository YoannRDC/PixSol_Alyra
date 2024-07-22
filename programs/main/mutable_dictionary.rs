use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_instruction, program::invoke_signed};

declare_id!("6FBQBJE6pFaRq6iPMc2HN6rRq7TCtzWqLBv7za9BNvtU");



#[program]
pub mod mutable_dictionary {
    use super::*;
    const WITHDRAW_BY_PIXEL: u64 = 5000000;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let dictionary = &mut ctx.accounts.dictionary;
        dictionary.entries = [Entry::default(); 100];
        for i in 0..100 {
            dictionary.entries[i].id = i as u8;
        }
        msg!("Dictionary initialized with address: {}", dictionary.key());

        let vault = &mut ctx.accounts.vault;
        vault.total_balance = 0;
        msg!("Vault initialized with address: {}", vault.key());

        msg!("Initialization complete");
        Ok(())
    }

    pub fn read(ctx: Context<Read>, id: u8) -> Result<()> {
        require!(id < 100, CustomError::InvalidId);
        let dictionary = &ctx.accounts.dictionary;
        let entry = dictionary.entries.iter().find(|e| e.id == id).unwrap();
        msg!("Entry with ID {} has value {}", id, entry.value);
        Ok(())
    }

    pub fn update(ctx: Context<Update>, id: u8, deposit_amount: u64) -> Result<()> {
        require!(id < 100, CustomError::InvalidId);
        require!(deposit_amount > 0, CustomError::InvalidDepositAmount);

        // Transfer lamports to the vault
        let ix = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            deposit_amount
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update vault balance
        let vault = &mut ctx.accounts.vault;
        vault.total_balance += deposit_amount;

        // Update dictionary entry
        let dictionary = &mut ctx.accounts.dictionary;
        if let Some(entry) = dictionary.entries.iter_mut().find(|e| e.id == id) {
            entry.value = entry.value.checked_add(1).ok_or(CustomError::Overflow)?;
            msg!("Deposited {} lamports and incremented entry with ID {} to value {}", deposit_amount, id, entry.value);
        } else {
            return Err(CustomError::EntryNotFound.into());
        }

        Ok(())
    }

    pub fn withdraw_and_reset(ctx: Context<Update>, id: u8) -> Result<()> {
        require!(id < 100, CustomError::InvalidId);
        let dictionary = &mut ctx.accounts.dictionary;
        let vault = &mut ctx.accounts.vault;

        if let Some(entry) = dictionary.entries.iter_mut().find(|e| e.id == id) {
            let withdraw_amount = (entry.value as u64) * WITHDRAW_BY_PIXEL;
            require!(vault.total_balance >= withdraw_amount, CustomError::InsufficientFunds);

            // Transfer lamports from the vault to the user
            let vault_balance = vault.to_account_info().lamports();
            **vault.to_account_info().try_borrow_mut_lamports()? = vault_balance.checked_sub(withdraw_amount).unwrap();
            **ctx.accounts.user.try_borrow_mut_lamports()? = ctx.accounts.user.lamports().checked_add(withdraw_amount).unwrap();

            vault.total_balance -= withdraw_amount;

            msg!("Withdrawn {} lamports for entry with ID {}", withdraw_amount, id);

            // Reset the entry
            entry.value = 0;
            msg!("Reset entry with ID {} to value 0", id);
        } else {
            return Err(CustomError::EntryNotFound.into());
        }
        Ok(())
    }

    pub fn update_by_batch(ctx: Context<Update>, ids: Vec<u8>, deposit_amount: u64) -> Result<()> {
        require!(deposit_amount > 0, CustomError::InvalidDepositAmount);

        // Transfer lamports to the vault
        let ix = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            deposit_amount
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update vault balance
        let vault = &mut ctx.accounts.vault;
        vault.total_balance += deposit_amount;

        let dictionary = &mut ctx.accounts.dictionary;
        for id in ids {
            require!(id < 100, CustomError::InvalidId);
            if let Some(entry) = dictionary.entries.iter_mut().find(|e| e.id == id) {
                entry.value = entry.value.checked_add(1).ok_or(CustomError::Overflow)?;
                msg!("Incremented entry with ID {} to value {}", id, entry.value);
            } else {
                return Err(CustomError::EntryNotFound.into());
            }
        }
        msg!("Deposited {} lamports for batch update", deposit_amount);
        Ok(())
    }

    pub fn withdraw_and_reset_by_batch(ctx: Context<Update>, ids: Vec<u8>) -> Result<()> {
        let dictionary = &mut ctx.accounts.dictionary;
        let vault = &mut ctx.accounts.vault;
        let mut total_withdraw_amount = 0;

        for &id in ids.iter() {
            require!(id < 100, CustomError::InvalidId);
            if let Some(entry) = dictionary.entries.iter_mut().find(|e| e.id == id) {
                let withdraw_amount = (entry.value as u64) * WITHDRAW_BY_PIXEL;
                total_withdraw_amount += withdraw_amount;
                
                // Reset the entry
                entry.value = 0;
                msg!("Reset entry with ID {} to value 0", id);
            } else {
                return Err(CustomError::EntryNotFound.into());
            }
        }

        require!(vault.total_balance >= total_withdraw_amount, CustomError::InsufficientFunds);

        // Transfer lamports from the vault to the user
        let vault_balance = vault.to_account_info().lamports();
        **vault.to_account_info().try_borrow_mut_lamports()? = vault_balance.checked_sub(total_withdraw_amount).unwrap();
        **ctx.accounts.user.try_borrow_mut_lamports()? = ctx.accounts.user.lamports().checked_add(total_withdraw_amount).unwrap();

        vault.total_balance -= total_withdraw_amount;

        msg!("Withdrawn {} lamports for batch reset", total_withdraw_amount);
        Ok(())
    }

    pub fn read_by_batch(ctx: Context<Read>, ids: Vec<u8>) -> Result<()> {
        let dictionary = &ctx.accounts.dictionary;
        for id in ids {
            require!(id < 100, CustomError::InvalidId);
            if let Some(entry) = dictionary.entries.iter().find(|e| e.id == id) {
                msg!("Entry with ID {} has value {}", id, entry.value);
            } else {
                return Err(CustomError::EntryNotFound.into());
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 100 * (1 + 4) // 8 discriminator + 100 * (1 byte for id + 4 bytes for value)
    )]
    pub dictionary: Account<'info, Dictionary>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 // 8 discriminator + 8 bytes for total_balance
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Read<'info> {
    pub dictionary: Account<'info, Dictionary>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub dictionary: Account<'info, Dictionary>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Dictionary {
    pub entries: [Entry; 100],
}

#[account]
pub struct Vault {
    pub total_balance: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct Entry {
    pub id: u8,
    pub value: u32,
}
#[error_code]
pub enum CustomError {
    #[msg("Invalid ID")]
    InvalidId,
    #[msg("Entry not found")]
    EntryNotFound,
    #[msg("Overflow occurred")]
    Overflow,
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}