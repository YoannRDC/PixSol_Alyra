// utils/imageUtils.ts

export function pixelDataToPNG(pixelData: { [key: string]: { color: string } }, boardSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = boardSize;
    canvas.height = boardSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          const key = `x${x}y${y}`;
          const color = pixelData[key]?.color || '#FFFFFF';
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'image/png');
  });
}