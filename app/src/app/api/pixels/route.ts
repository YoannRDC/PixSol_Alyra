import { NextResponse } from 'next/server';

const SingletonPixelService = require('../pixelService');

export async function GET() {
  try {
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    const pixels = await pixelService.getAllPixels();
    return NextResponse.json(pixels);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching pixels' }, { status: 500 });
  }
}