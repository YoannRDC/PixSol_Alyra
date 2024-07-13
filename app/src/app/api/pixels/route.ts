import { NextResponse } from 'next/server';
import { PixelService } from '../../services/PixelService';
import { RedisPixelRepository } from './../../repositories/RedisPixelRepository';

const pixelService = new PixelService(new RedisPixelRepository());

export async function GET() {
  try {
    const pixels = await pixelService.getAllPixels();
    return NextResponse.json(pixels);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching pixels' }, { status: 500 });
  }
}