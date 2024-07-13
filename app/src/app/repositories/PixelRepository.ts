import { PixelData } from '../types/PixelData';

export interface PixelRepository {
  savePixel(pixel: PixelData): Promise<void>;
  getPixel(address: string): Promise<PixelData | null>;
  getAllPixels(): Promise<PixelData[]>;
  updatePixels(pixels: PixelData[]): Promise<void>;
}