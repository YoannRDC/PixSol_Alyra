import { NextResponse } from 'next/server';

export const fetchCache = 'force-no-store';  // Disable caching for this route

export async function GET() {
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    const pixels = await pixelService.getAllPixels();
    
    const response = NextResponse.json(pixels);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;

  } catch (error) {
    console.error('Error in /api/pixels:', error);
    
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    
    const errorResponse = NextResponse.json(
      { message: 'Error fetching pixels', error: errorMessage },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    return errorResponse;
  }
}