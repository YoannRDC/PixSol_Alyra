import { NextRequest, NextResponse } from 'next/server';

const SingletonPixelService = require('../pixelService');

export async function POST(request: NextRequest) {
  try {
    const { pixels, owner } = await request.json();
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    await pixelService.buyPixels(pixels, owner);
    return NextResponse.json({ message: 'Pixels bought successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error buying pixels' }, { status: 500 });
  }
}