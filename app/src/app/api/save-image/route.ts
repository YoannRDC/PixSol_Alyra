import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.APICLOUDKEY,
  api_secret: process.env.SECRETCLOUD
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert File to a format usable by Cloudinary
    const buffer = await file.arrayBuffer();
    const dataUri = 'data:image/png;base64,' + Buffer.from(buffer).toString('base64');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'Pixsol'  // Optionally specify a folder in your Cloudinary account
    });
    
    // Return the URL of the uploaded image
    return NextResponse.json({ message: 'Image saved successfully', url: result.url }, { status: 200 });
  } catch (error) {
    console.error('Error saving image:', error);
    return NextResponse.json({ error: 'Error saving image' }, { status: 500 });
  }
}