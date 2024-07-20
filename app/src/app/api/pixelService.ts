import { PixelData } from '../types/PixelData';
import { PixelRepository } from '../repositories/PixelRepository';

export class PixelService {
  constructor(private repository: PixelRepository) {}

  async buyPixels(pixels: { address: string, color: string, player_pubkey: string }[]): Promise<void> {
    const pixelsToUpdate = pixels.map(({ address, color, player_pubkey }) => ({
      address,
      color,
      player_pubkey
    }));
    await this.repository.updatePixels(pixelsToUpdate);
  }

  async getAllPixels(): Promise<PixelData[]> {
    return this.repository.getAllPixels();
  }
}
