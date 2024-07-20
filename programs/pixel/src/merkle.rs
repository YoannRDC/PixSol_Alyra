use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

#[derive(Default)]
pub struct MerkleTree {
    pub root: [u8; 32],
    pub leaves: Vec<[u8; 32]>,
}

impl MerkleTree {
    pub fn new() -> Self {
        MerkleTree {
            root: [0; 32],
            leaves: vec![[0; 32]; 2_usize.pow(20)], //pow(20) <== 1 000 000 plus store.
        }
    }

    pub fn update(&mut self, index: usize, data: &PixelData) {
        let leaf = keccak::hash(&data.try_to_vec().unwrap()).to_bytes();
        self.leaves[index] = leaf;
        self.root = self.calculate_root();
    }

    pub fn generate_proof(&self, index: usize) -> Vec<[u8; 32]> {
        let mut proof = Vec::new();
        let mut idx = index;
        let mut level = self.leaves.clone();

        while level.len() > 1 {
            let is_right = idx % 2 == 1;
            let sibling_idx = if is_right { idx - 1 } else { idx + 1 };

            if sibling_idx < level.len() {
                proof.push(level[sibling_idx]);
            }

            level = level
                .chunks(2)
                .map(|chunk| {
                    if chunk.len() == 2 {
                        keccak::hash(&[chunk[0], chunk[1]].concat()).to_bytes()
                    } else {
                        chunk[0] // Handle odd number of nodes at a level
                    }
                }).collect();

            idx /= 2;
        }

        proof
    }

    fn calculate_root(&self) -> [u8; 32] {
        let mut level = self.leaves.clone();

        while level.len() > 1 {
            level = level
                .chunks(2)
                .map(|chunk| {
                    if chunk.len() == 2 {
                        keccak::hash(&[chunk[0], chunk[1]].concat()).to_bytes()
                    } else {
                        chunk[0] // Handle odd number of nodes at a level
                    }
                }).collect();
        }

        level[0]
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct PixelData {
    pub matrix_counter: u64,
    pub total_count: u64,
}

pub fn verify_merkle_proof(
    index: usize,
    root: &[u8; 32],
    proof: &[[u8; 32]],
    leaf: &[u8; 32],
) -> bool {
    let mut hash = *leaf;
    let mut idx = index;

    for sibling in proof {
        let is_right = idx % 2 == 1;
        if is_right {
            hash = keccak::hash(&[sibling.to_vec(), hash.to_vec()].concat()).to_bytes();
        } else {
            hash = keccak::hash(&[hash.to_vec(), sibling.to_vec()].concat()).to_bytes();
        }
        idx /= 2;
    }

    &hash == root
}
