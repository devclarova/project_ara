/**
 * 지능형 클라이언트 사이드 이미지 최적화 엔진(Client-side Image Optimization Engine):
 * - 목적(Why): 업로드 전 자원 소모 최소화를 위해 브라우저 레벨의 비손실 압축 및 해상도 정규화를 수행함
 * - 방법(How): Web Worker 기반의 병렬 처리를 통해 메인 스레드 블로킹을 방지함
 */
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
