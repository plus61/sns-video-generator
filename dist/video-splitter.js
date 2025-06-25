"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitVideoIntoSegments = splitVideoIntoSegments;
exports.splitVideo = splitVideo;
const fluent_ffmpeg_1 = require("fluent-ffmpeg");
const fs_1 = require("fs");
const path_1 = require("path");
// FFmpegのパスを設定
fluent_ffmpeg_1.default.setFfmpegPath('/opt/homebrew/bin/ffmpeg');
/**
 * 動画を指定されたセグメントに分割する
 */
async function splitVideoIntoSegments(inputPath, options) {
    const { outputDir, segments, parallel = 3 } = options;
    // 入力検証
    if (!segments || segments.length === 0) {
        throw new Error('No segments specified');
    }
    // 入力ファイルの存在確認
    try {
        await fs_1.promises.access(inputPath);
    }
    catch (_a) {
        throw new Error('Input video file not found');
    }
    // 出力ディレクトリの作成
    await fs_1.promises.mkdir(outputDir, { recursive: true });
    const results = [];
    // 並列処理の制御
    const chunks = [];
    for (let i = 0; i < segments.length; i += parallel) {
        chunks.push(segments.slice(i, i + parallel));
    }
    // チャンクごとに処理
    for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (segment, chunkIndex) => {
            const globalIndex = chunks.indexOf(chunk) * parallel + chunkIndex;
            const outputPath = path_1.default.join(outputDir, `segment_${globalIndex}.mp4`);
            await extractSegment(inputPath, outputPath, segment.start, segment.duration);
            // ファイルサイズを取得
            const stats = await fs_1.promises.stat(outputPath);
            return {
                index: globalIndex,
                path: outputPath,
                start: segment.start,
                duration: segment.duration,
                size: stats.size
            };
        });
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
    }
    // インデックス順にソート
    results.sort((a, b) => a.index - b.index);
    return results;
}
/**
 * 単一のセグメントを抽出
 */
function extractSegment(inputPath, outputPath, startTime, duration) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .setStartTime(startTime)
            .setDuration(duration)
            .output(outputPath)
            .outputOptions([
            '-c:v copy', // ビデオコーデックをコピー（高速・品質維持）
            '-c:a copy', // オーディオコーデックをコピー
            '-avoid_negative_ts make_zero',
            '-movflags +faststart' // Web配信用に最適化
        ])
            .on('end', () => {
            resolve();
        })
            .on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`));
        })
            .run();
    });
}
/**
 * 既存のAPIとの互換性のためのラッパー関数
 */
async function splitVideo(videoPath, segments) {
    if (!segments) {
        // セグメントが指定されていない場合はデフォルトの3分割
        segments = [
            { start: 0, end: 10 },
            { start: 10, end: 20 },
            { start: 20, end: 30 }
        ];
    }
    // end時刻をdurationに変換
    const segmentOptions = segments.map(seg => ({
        start: seg.start,
        duration: seg.end - seg.start
    }));
    const outputDir = path_1.default.join('/tmp', 'video-segments', Date.now().toString());
    return splitVideoIntoSegments(videoPath, {
        outputDir,
        segments: segmentOptions
    });
}
