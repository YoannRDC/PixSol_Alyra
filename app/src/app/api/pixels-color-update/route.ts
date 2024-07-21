import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const { pixels, player_pubkey } = await request.json();
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    await pixelService.buyPixels(pixels, player_pubkey);
    return NextResponse.json({ message: 'Pixels bought successfully' });
  } catch (error) {
    console.error('Error buying pixels:', error);
    return NextResponse.json(
      { message: 'Error buying pixels', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}