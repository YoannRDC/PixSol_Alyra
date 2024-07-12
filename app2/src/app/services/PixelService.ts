import { PixelData } from '../types/PixelData';
import { PixelRepository } from '../repositories/PixelRepository';

export class PixelService {
  constructor(private repository: PixelRepository) {}

  async buyPixels(pixels: { [key: string]: string }, owner: string): Promise<void> {
    const pixelsToUpdate = Object.entries(pixels).map(([address, color]) => ({
      address,
      color,
      owner
    }));
    await this.repository.updatePixels(pixelsToUpdate);
  }

  async getAllPixels(): Promise<PixelData[]> {
    return this.repository.getAllPixels();
  }
}