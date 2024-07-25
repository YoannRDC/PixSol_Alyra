import { PixelData } from '../types/PixelData';
import { PixelRepository } from '../repositories/PixelRepository';

export class PixelService {
  constructor(private repository: PixelRepository) {}

  async buyPixels(pixels: Record<string, string>, owner: string): Promise<void> {
    const pixelsToUpdate = Object.entries(pixels).map(([address, color]) => ({
      address,
      color,
      player_pubkey: owner
    }));
    await this.repository.updatePixels(pixelsToUpdate);
  }

  async getAllPixels(): Promise<PixelData[]> {
    return this.repository.getAllPixels();
  }

  async updatePixels(pixels: PixelData[]): Promise<void> {
    await this.repository.updatePixels(pixels);
  }

  async getMintCount(): Promise<number> {
    return this.repository.getMintCount();
  }

  async incrementMintCount(): Promise<number> {
    return this.repository.incrementMintCount();
  }
}