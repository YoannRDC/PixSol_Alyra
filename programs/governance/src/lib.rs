use anchor_lang::prelude::*;

declare_id!("9C6m91JP9san9xyZFurePehJvRdBuT2JScMuE6cZeJe9");

#[program]
pub mod governance_v3 {
    use super::*;

    pub fn update_board(ctx: Context<UpdateBoard>, x: u16, y: u16) -> Result<()> {
        // TODO: Add security: Only a Pixel contract can call.
        // TODO: Add a event
        let pixel_board = &mut ctx.accounts.pixel_board;
        let new_pixel = Pixel { x, y };
        if !pixel_board
            .owned_pixels
            .iter()
            .any(|pixel| *pixel == new_pixel)
        {
            pixel_board.owned_pixels.push(new_pixel);
        }
        Ok(())
    }

    pub fn initialize_board(ctx: Context<InitializeBoard>) -> Result<()> {
        // TODO: Add a event
        let pixel_board = &mut ctx.accounts.pixel_board;
        pixel_board.owned_pixels = Vec::new();
        Ok(())
    }

    pub fn is_owned_pixels(ctx: Context<IsOwnedPixel>, x: u16, y: u16) -> Result<()> {
        let pixel_board = &ctx.accounts.pixel_board;
        let pixel_to_check = Pixel { x, y };
        let is_owned = pixel_board
            .owned_pixels
            .iter()
            .any(|pixel| *pixel == pixel_to_check);

        // Emitting an event with the result
        emit!(OwnedPixelResult { x, y, is_owned });

        Ok(())
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
}

#[derive(Accounts)]
pub struct IsOwnedPixel<'info> {
    pub pixel_board: Account<'info, PixelBoard>,
}

#[account]
pub struct PixelBoard {
    pub owned_pixels: Vec<Pixel>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct Pixel {
    pub x: u16,
    pub y: u16,
}

#[event]
pub struct OwnedPixelResult {
    pub x: u16,
    pub y: u16,
    pub is_owned: bool,
}
