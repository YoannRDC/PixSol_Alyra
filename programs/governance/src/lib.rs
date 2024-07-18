use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("6o6i8WPQLGoc78qvrLLU1sHTPvjg7eDztfgP26cfUrWZ");

#[program]
pub mod governance {
    use super::*;

    pub fn update_board(ctx: Context<UpdateBoard>, x: u16, y: u16) -> Result<()> {
        // TODO: Add security: Only a Pixel contract can call.
        // TODO: Add a event
        let pixel_board = &mut ctx.accounts.pixel_board;
        let new_pixel = Pixel { x, y };
        if !pixel_board
            .minted_pixels
            .iter()
            .any(|pixel| *pixel == new_pixel)
        {
            pixel_board.minted_pixels.push(new_pixel);

            // Mint the NFT
            let cpi_accounts = token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            };
            let cpi_context =
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::mint_to(cpi_context, 1)?;
        }
        Ok(())
    }

    pub fn initialize_board(ctx: Context<InitializeBoard>) -> Result<()> {
        // TODO: Add a event
        let pixel_board = &mut ctx.accounts.pixel_board;
        pixel_board.minted_pixels = Vec::new();
        Ok(())
    }

    pub fn is_minted_pixel(ctx: Context<IsMintedPixel>, x: u16, y: u16) -> Result<()> {
        let pixel_board = &ctx.accounts.pixel_board;
        let pixel_to_check = Pixel { x, y };
        let is_minted = pixel_board
            .minted_pixels
            .iter()
            .any(|pixel| *pixel == pixel_to_check);

        // Emitting an event with the result
        emit!(MintedPixelResult { x, y, is_minted });

        Ok(())
    }

    pub fn is_minted_pixel_v2(
        ctx: Context<IsMintedPixel>,
        x: u16,
        y: u16,
    ) -> Result<MintedPixelResult> {
        let pixel_board = &ctx.accounts.pixel_board;
        let pixel_to_check = Pixel { x, y };
        let is_minted = pixel_board
            .minted_pixels
            .iter()
            .any(|pixel| *pixel == pixel_to_check);

        Ok(MintedPixelResult { x, y, is_minted })
    }
}

#[derive(Accounts)]
pub struct InitializeBoard<'info> {
    #[account(init, payer = user, space = 8 + 4 + 4 + 1000 * std::mem::size_of::<Pixel>())]
    pub pixel_board: Account<'info, PixelBoard>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBoard<'info> {
    #[account(mut)]
    pub pixel_board: Account<'info, PixelBoard>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct IsMintedPixel<'info> {
    pub pixel_board: Account<'info, PixelBoard>,
}

#[account]
pub struct PixelBoard {
    pub minted_pixels: Vec<Pixel>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct Pixel {
    pub x: u16,
    pub y: u16,
}

#[event]
pub struct MintedPixelResult {
    pub x: u16,
    pub y: u16,
    pub is_minted: bool,
}
