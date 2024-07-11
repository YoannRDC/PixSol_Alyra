import { NextRequest, NextResponse } from 'next/server';
import { PixelService } from '../../services/PixelService';
import { RedisPixelRepository } from '../../repositories/RedisPixelRepository';

const pixelService = new PixelService(new RedisPixelRepository());

export async function POST(request: NextRequest) {
  try {
    const { pixels, owner } = await request.json();
    await pixelService.buyPixels(pixels, owner);
    return NextResponse.json({ message: 'Pixels bought successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error buying pixels' }, { status: 500 });
  }
}