import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { default: SingletonPixelService } = await import('../pixelService');
    const pixelService = SingletonPixelService.getInstance().getPixelService();
    const pixels = await pixelService.getAllPixels();
    
    return NextResponse.json(pixels);
  } catch (error) {
    console.error('Error in /api/pixels:', error);

    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    return NextResponse.json({ message: 'Error fetching pixels', error: errorMessage }, { status: 500 });
  }
}
