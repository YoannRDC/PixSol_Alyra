import { PixelData } from '../types/PixelData';
import { PixelRepository } from './PixelRepository';
import Redis from 'ioredis';

export class RedisPixelRepository implements PixelRepository {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL as string);
  }

  async savePixel(pixel: PixelData): Promise<void> {
    await this.redis.hset(`pixel:${pixel.address}`, {
      color: pixel.color,
      player_pubkey: pixel.player_pubkey
    });
  }

  async getPixel(address: string): Promise<PixelData | null> {
    const pixel = await this.redis.hgetall(`pixel:${address}`);
    if (!pixel.color) return null;
    return { address, color: pixel.color, player_pubkey: pixel.player_pubkey };
  }

  async getAllPixels(): Promise<PixelData[]> {
    const keys = await this.redis.keys('pixel:*');
    if (keys.length === 0) return [];

    const pipeline = this.redis.pipeline();
    keys.forEach(key => pipeline.hgetall(key));
    const results = await pipeline.exec();

    return results!.map((result , index) => ({
      address: keys[index].split(':')[1],
      color: (result[1] as any).color,
      player_pubkey: (result[1] as any).player_pubkey,
    }));
  }

  async updatePixels(pixels: PixelData[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    pixels.forEach(pixel => {
      pipeline.hset(`pixel:${pixel.address}`, {
        color: pixel.color,
        player_pubkey: pixel.player_pubkey
      });
    });
    await pipeline.exec();
  }
}