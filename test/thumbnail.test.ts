import { generateThumbnail } from '../src/lib/thumbnail';

test('generateThumbnail works', async () => {
  expect(await generateThumbnail('video.mp4')).toBeDefined();
});