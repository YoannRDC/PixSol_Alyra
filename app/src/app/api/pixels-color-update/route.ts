import { NextRequest, NextResponse } from 'next/server';

export const fetchCache = 'force-no-store';  // Disable caching for this route
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const { pixels, player_pubkey } = await request.json();
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    await pixelService.buyPixels(pixels, player_pubkey);

    const response = NextResponse.json({ message: 'Pixels bought successfully', timestamp: Date.now() });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error) {
    console.error('Error buying pixels:', error);
    const errorResponse = NextResponse.json(
      { message: 'Error buying pixels', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  }
}