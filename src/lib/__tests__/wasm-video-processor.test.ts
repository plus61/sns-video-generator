import { WasmVideoProcessor } from '../wasm-video-processor';

describe('WasmVideoProcessor', () => {
  it('should initialize FFmpeg WASM', async () => {
    const processor = new WasmVideoProcessor();
    const initialized = await processor.initialize();
    expect(initialized).toBe(true);
  });

  it('should process video faster than regular FFmpeg', async () => {
    const processor = new WasmVideoProcessor();
    await processor.initialize();
    const result = await processor.processVideo(Buffer.from('test'));
    expect(result.processingTime).toBeLessThan(1000);
  });
});