use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("p6xhgFgsVzDvwC2NeZg7JioSQMv7TH4mP251cmgtB1c");

#[program]
mod vote {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        choices: Vec<String>,
        deadline: u64,
    ) -> Result<()> {
        let proposal_account = &mut ctx.accounts.proposal;

        // Verifier < 10 choices sinon erreur
        require!(
            choices.len() <= MAX_COUNT_OF_CHOICES,
            VoteError::MaxChoicesReach
        );

        proposal_account.title = title;
        proposal_account.description = description;
        proposal_account.deadline = deadline;

        let mut vec_choices = Vec::new();

        for choice in choices {
            let option = Choice {
                label: choice,
                count: 0,
            };

            vec_choices.push(option);
        }

        proposal_account.choices = vec_choices;

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, choice: u8) -> Result<()> {
        let proposal_account = &mut ctx.accounts.proposal;
        let voter_account = &mut ctx.accounts.voter;

        require!(
            Clock::get()?.unix_timestamp < proposal_account.deadline as i64,
            VoteError::VotingIsOver
        );

        require!(
            choice <= proposal_account.choices.len() as u8,
            VoteError::InvalidOption
        );

        voter_account.proposal = proposal_account.key();
        voter_account.user = ctx.accounts.signer.key();
        voter_account.choice_option = choice;

        proposal_account.choices[choice as usize].count += 1;
        Ok(())
    }
}

const MAX_COUNT_OF_CHOICES: usize = 10;

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 32 + (32 + 8) * MAX_COUNT_OF_CHOICES + 8)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(init, payer = signer, space = 8 + 32 + 32 + 1 + 1, seeds = [proposal.key().as_ref(), signer.key().as_ref()], bump)]
    pub voter: Account<'info, Voter>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Proposal {
    title: String,
    description: String,
    choices: Vec<Choice>,
    deadline: u64,
}

#[account]
pub struct Voter {
    proposal: Pubkey,
    user: Pubkey,
    choice_option: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Choice {
    label: String,
    count: u64,
}

#[error_code]
pub enum VoteError {
    #[msg("Too many choices")]
    MaxChoicesReach,
    #[msg("Invalid option")]
    InvalidOption,
    #[msg("Vote is over")]
    VotingIsOver,
}
