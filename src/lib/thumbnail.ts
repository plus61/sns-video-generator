export async function generateThumbnail(videoPath: string) {
  return {
    path: `${videoPath.replace(/\.[^.]+$/, '')}_thumb.jpg`
  };
}