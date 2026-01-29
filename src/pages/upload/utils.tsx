/**
 * gcs path를 문서 링크로 변환
 */
export function getResourceLink(gcsPath: string): string {
  const match = gcsPath.match(/^gs:\/\/[^/]+\/(.+)$/);
  return `${import.meta.env.VITE_RESOURCE_CENTER_URL}/resource/${match?.[1]}`;
}
