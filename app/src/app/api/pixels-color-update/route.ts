import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const { pixels, player_pubkey } = await request.json();
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    await pixelService.buyPixels(pixels, player_pubkey);

    const response = NextResponse.json({ message: 'Pixels bought successfully' });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;

  } catch (error) {
    console.error('Error buying pixels:', error);
    const errorResponse = NextResponse.json(
      { message: 'Error buying pixels', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
    
    // Add cache control headers to error response as well
    errorResponse.headers.set('Cache-Control', 'no-store, max-age=0');
    return errorResponse;
  }
}