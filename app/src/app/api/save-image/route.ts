// app/api/save-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `pixel_board_${timestamp}.png`;
    const filePath = path.join(process.cwd(), 'public', 'images', fileName);

    await writeFile(filePath, Buffer.from(buffer));

    return NextResponse.json({ message: 'Image saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving image:', error);
    return NextResponse.json({ error: 'Error saving image' }, { status: 500 });
  }
}