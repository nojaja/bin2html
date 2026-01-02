import { ZipAsPng } from '../../src/ZipAsPng';

describe('ZipAsPng', () => {
    describe('zipToPng', () => {
        // Given（前提）: 有効なPNGとZIPのバイナリデータが存在する
        // When（操作）: zipToPngを呼び出す
        // Then（期待）: PNG形式でZIPを埋め込んだバイナリが返される
        it('正常系: 有効なPNGとZIPからPNG+ZIPを生成', () => {
            // 簡易的なPNGヘッダ（実際のPNGの最小構造）
            const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
            const ihdrData = Buffer.from('000000010000000108020000', 'hex'); // 1x1 RGB
            const ihdrCrc = Buffer.from('90773836', 'hex');
            const iendChunk = Buffer.from('0000000049454e44ae426082', 'hex');
            const pngBuff = Buffer.concat([pngHeader, ihdrData, ihdrCrc, iendChunk]);

            // 有効な空のZIPファイル
            // End of central directory record (EOCD)
            const zipBuff = Buffer.from(
                '504b05060000000000000000000000000000000000000000',
                'hex'
            );
            // CENのオフセットをEOCD位置より前に設定（0バイト目）
            zipBuff.writeInt32LE(0, 16); // ZIP_ENDOFF位置にCENのオフセットを書き込む

            const zipAsPng = new ZipAsPng();

            expect(() => {
                const result = zipAsPng.zipToPng(zipBuff, pngBuff);
                expect(Buffer.isBuffer(result)).toBe(true);
                expect(result.length).toBeGreaterThan(pngBuff.length);
            }).not.toThrow();
        });

        // Given（前提）: 無効なPNGヘッダが渡される
        // When（操作）: zipToPngを呼び出す
        // Then（期待）: エラーがスローされる
        it('異常系: 無効なPNGヘッダでエラー', () => {
            const invalidPng = Buffer.from('invalid png data');
            const zipBuff = Buffer.from('504b05060000000000000000000000000000000000000000', 'hex');
            zipBuff.writeInt32LE(0, 16);

            const zipAsPng = new ZipAsPng();

            expect(() => {
                zipAsPng.zipToPng(zipBuff, invalidPng);
            }).toThrow('Invalid PNG Header');
        });

        // Given（前提）: ZIPファイルにEOCDが含まれていない
        // When（操作）: zipToPngを呼び出す
        // Then（期待）: エラーがスローされる
        it('異常系: EOCDが見つからない場合エラー', () => {
            const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
            const ihdrData = Buffer.from('000000010000000108020000', 'hex');
            const ihdrCrc = Buffer.from('90773836', 'hex');
            const iendChunk = Buffer.from('0000000049454e44ae426082', 'hex');
            const pngBuff = Buffer.concat([pngHeader, ihdrData, ihdrCrc, iendChunk]);

            const invalidZip = Buffer.from('invalid zip data');

            const zipAsPng = new ZipAsPng();

            expect(() => {
                zipAsPng.zipToPng(invalidZip, pngBuff);
            }).toThrow('SIG_EOCD not found');
        });
    });

    describe('pngToZip', () => {
        // Given（前提）: ZIP埋め込み済みのPNGバイナリが存在する
        // When（操作）: pngToZipを呼び出す
        // Then（期待）: 元のZIPバイナリが抽出される
        it('正常系: PNG+ZIPからZIPを抽出', () => {
            // まず埋め込みPNGを作成
            const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
            const ihdrData = Buffer.from('000000010000000108020000', 'hex');
            const ihdrCrc = Buffer.from('90773836', 'hex');
            const iendChunk = Buffer.from('0000000049454e44ae426082', 'hex');
            const pngBuff = Buffer.concat([pngHeader, ihdrData, ihdrCrc, iendChunk]);

            const zipBuff = Buffer.from('504b05060000000000000000000000000000000000000000', 'hex');
            zipBuff.writeInt32LE(0, 16);

            const zipAsPng = new ZipAsPng();
            const embeddedPng = zipAsPng.zipToPng(zipBuff, pngBuff);

            // 埋め込みPNGからZIPを抽出
            const extractedZip = zipAsPng.pngToZip(embeddedPng);

            expect(Buffer.isBuffer(extractedZip)).toBe(true);
            expect(extractedZip.equals(zipBuff)).toBe(true);
        });

        // Given（前提）: ZIP埋め込みされていないPNGが渡される
        // When（操作）: pngToZipを呼び出す
        // Then（期待）: エラーがスローされる
        it('異常系: ZIP埋め込みされていないPNGでエラー', () => {
            const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
            const ihdrData = Buffer.from('000000010000000108020000', 'hex');
            const ihdrCrc = Buffer.from('90773836', 'hex');
            const iendChunk = Buffer.from('0000000049454e44ae426082', 'hex');
            const normalPng = Buffer.concat([pngHeader, ihdrData, ihdrCrc, iendChunk]);

            const zipAsPng = new ZipAsPng();

            expect(() => {
                zipAsPng.pngToZip(normalPng);
            }).toThrow('ziPc chunk not found');
        });
    });
});
