import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, maxSizeMB = 1, maxWidthOrHeight = 800) {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
  };
  const compressedBlob = await imageCompression(file, options);
  return new File([compressedBlob], file.name, { type: compressedBlob.type });
}
