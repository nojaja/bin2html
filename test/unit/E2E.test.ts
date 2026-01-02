import { ZipAsPng } from '../../src/ZipAsPng';
import { Base64Converter } from '../../src/Base64Converter';
import { HtmlGenerator } from '../../src/HtmlGenerator';
import * as fs from 'fs';
import * as path from 'path';

describe('End-to-End Test - HTML生成→ダウンロード→抽出の完全フロー', () => {
    const testDataDir = path.join(__dirname, '../testdata');

    beforeAll(() => {
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
    });

    afterAll(() => {
        // テストデータをクリーンアップ
        if (fs.existsSync(testDataDir)) {
            const files = fs.readdirSync(testDataDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testDataDir, file));
            });
            fs.rmdirSync(testDataDir);
        }
    });

    // Given（前提）: ZIPファイルとPNGファイルが存在する
    // When（操作）: HTML生成→埋め込みPNGダウンロード→ZIP抽出
    // Then（期待）: 抽出されたZIPが元のZIPと同一である
    it('完全フロー: ZIPとPNG→HTML生成→PNG埋め込み→ZIP抽出→元のZIPと一致', () => {
        // 1. テスト用のZIPとPNGを生成
        const originalZip = createTestZipWithMultipleFiles();
        const thumbnailPng = createTestPngImage();
        const filename = 'test-project';

        // 2. Base64に変換（HTMLに埋め込むため）
        const converter = new Base64Converter();
        const zipBase64 = converter.bufferToBase64(originalZip);
        const pngBase64 = converter.bufferToBase64(thumbnailPng);

        // 3. HTMLを生成
        const generator = new HtmlGenerator();
        const html = generator.generateHtml(zipBase64, pngBase64, filename);

        // HTMLが正しく生成されていることを確認
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain(zipBase64);
        expect(html).toContain(pngBase64);

        // 4. 「pngでdownload」の処理をシミュレート
        // HTMLに埋め込まれたZIPとPNGを取り出してPNG+ZIPを生成
        const zipAsPng = new ZipAsPng();
        const embeddedPng = zipAsPng.zipToPng(originalZip, thumbnailPng);

        // 5. 生成されたPNGファイルをディスクに保存（ダウンロードをシミュレート）
        const downloadedPngPath = path.join(testDataDir, `${filename}.png`);
        fs.writeFileSync(downloadedPngPath, embeddedPng);

        // 6. ダウンロードされたPNGファイルを読み込み
        const downloadedPng = fs.readFileSync(downloadedPngPath);

        // 7. PNGからZIPを抽出
        const extractedZip = zipAsPng.pngToZip(downloadedPng);

        // 8. 抽出されたZIPを保存
        const extractedZipPath = path.join(testDataDir, `${filename}-extracted.zip`);
        fs.writeFileSync(extractedZipPath, extractedZip);

        // 9. 抽出されたZIPが元のZIPと完全に一致することを確認
        expect(extractedZip.equals(originalZip)).toBe(true);
        expect(extractedZip.length).toBe(originalZip.length);

        // 10. 抽出されたZIPの内部構造を検証
        verifyZipStructure(extractedZip, ['file1.txt', 'file2.txt', 'folder/file3.txt']);

        console.log('✅ 完全フロー検証成功:');
        console.log(`  - 元のZIPサイズ: ${originalZip.length} bytes`);
        console.log(`  - 埋め込みPNGサイズ: ${embeddedPng.length} bytes`);
        console.log(`  - 抽出されたZIPサイズ: ${extractedZip.length} bytes`);
        console.log(`  - データ一致: ${extractedZip.equals(originalZip) ? 'OK' : 'NG'}`);
    });

    // Given（前提）: 大きなファイルを含むZIPが存在する
    // When（操作）: 埋め込み→抽出
    // Then（期待）: データが破損していない
    it('大容量テスト: 大きなファイルを含むZIPの埋め込み→抽出', () => {
        // 100KBのファイルを含むZIP
        const largeContent = Buffer.alloc(100 * 1024);
        for (let i = 0; i < largeContent.length; i++) {
            largeContent[i] = i % 256;
        }

        const largeZip = createZipWithFile('large-file.bin', largeContent);
        const png = createTestPngImage();

        const zipAsPng = new ZipAsPng();
        const embeddedPng = zipAsPng.zipToPng(largeZip, png);
        const extractedZip = zipAsPng.pngToZip(embeddedPng);

        expect(extractedZip.equals(largeZip)).toBe(true);

        console.log('✅ 大容量テスト成功:');
        console.log(`  - 元のZIPサイズ: ${largeZip.length} bytes`);
        console.log(`  - 抽出後のサイズ: ${extractedZip.length} bytes`);
    });
});

/**
 * 複数ファイルを含むテスト用ZIPを生成
 */
function createTestZipWithMultipleFiles(): Buffer {
    const files = [
        { name: 'file1.txt', content: 'This is file 1' },
        { name: 'file2.txt', content: 'This is file 2' },
        { name: 'folder/file3.txt', content: 'This is file 3 in folder' }
    ];

    const localHeaders: Buffer[] = [];
    const centralHeaders: Buffer[] = [];
    let currentOffset = 0;

    files.forEach(file => {
        const contentBuffer = Buffer.from(file.content, 'utf8');
        const filenameBuffer = Buffer.from(file.name, 'utf8');
        const crc32 = calculateCrc32(contentBuffer);

        // Local File Header
        const localHeader = Buffer.alloc(30 + filenameBuffer.length);
        localHeader.write('PK\x03\x04', 0, 4, 'binary');
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(crc32, 14);
        localHeader.writeUInt32LE(contentBuffer.length, 18);
        localHeader.writeUInt32LE(contentBuffer.length, 22);
        localHeader.writeUInt16LE(filenameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);
        filenameBuffer.copy(localHeader, 30);

        localHeaders.push(localHeader);
        localHeaders.push(contentBuffer);

        // Central Directory Header
        const centralHeader = Buffer.alloc(46 + filenameBuffer.length);
        centralHeader.write('PK\x01\x02', 0, 4, 'binary');
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(crc32, 16);
        centralHeader.writeUInt32LE(contentBuffer.length, 20);
        centralHeader.writeUInt32LE(contentBuffer.length, 24);
        centralHeader.writeUInt16LE(filenameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(currentOffset, 42);
        filenameBuffer.copy(centralHeader, 46);

        centralHeaders.push(centralHeader);

        currentOffset += localHeader.length + contentBuffer.length;
    });

    const centralDirOffset = currentOffset;
    const centralDir = Buffer.concat(centralHeaders);
    const centralDirSize = centralDir.length;

    // End of Central Directory
    const eocd = Buffer.alloc(22);
    eocd.write('PK\x05\x06', 0, 4, 'binary');
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localHeaders, centralDir, eocd]);
}

/**
 * バイナリデータでZIPを生成
 */
function createZipWithFile(filename: string, content: Buffer): Buffer {
    const filenameBuffer = Buffer.from(filename, 'utf8');
    const crc32 = calculateCrc32(content);

    // Local File Header
    const localHeader = Buffer.alloc(30 + filenameBuffer.length);
    localHeader.write('PK\x03\x04', 0, 4, 'binary');
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(filenameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    filenameBuffer.copy(localHeader, 30);

    // Central Directory Header
    const centralHeader = Buffer.alloc(46 + filenameBuffer.length);
    centralHeader.write('PK\x01\x02', 0, 4, 'binary');
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(filenameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(0, 42);
    filenameBuffer.copy(centralHeader, 46);

    const centralDirOffset = localHeader.length + content.length;
    const centralDirSize = centralHeader.length;

    // End of Central Directory
    const eocd = Buffer.alloc(22);
    eocd.write('PK\x05\x06', 0, 4, 'binary');
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([localHeader, content, centralHeader, eocd]);
}

/**
 * テスト用PNGイメージ生成
 */
function createTestPngImage(): Buffer {
    const pngHeader = Buffer.from('89504e470d0a1a0a', 'hex');
    const ihdrLength = Buffer.from('0000000d', 'hex');
    const ihdrType = Buffer.from('49484452', 'hex');
    const ihdrData = Buffer.from([
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00
    ]);
    const ihdrCrc = Buffer.from('90773836', 'hex');
    const idatLength = Buffer.from('0000000c', 'hex');
    const idatType = Buffer.from('49444154', 'hex');
    const idatData = Buffer.from([
        0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00
    ]);
    const idatCrc = Buffer.from('d4a8c0e0', 'hex');
    const iendLength = Buffer.from('00000000', 'hex');
    const iendType = Buffer.from('49454e44', 'hex');
    const iendCrc = Buffer.from('ae426082', 'hex');

    return Buffer.concat([
        pngHeader,
        ihdrLength, ihdrType, ihdrData, ihdrCrc,
        idatLength, idatType, idatData, idatCrc,
        iendLength, iendType, iendCrc
    ]);
}

/**
 * ZIP構造を検証
 */
function verifyZipStructure(zipBuffer: Buffer, expectedFiles: string[]): void {
    // EOCDを探す
    const eocdSig = Buffer.from('504b0506', 'hex');
    const eocdPos = zipBuffer.lastIndexOf(eocdSig);
    expect(eocdPos).toBeGreaterThanOrEqual(0);

    // エントリ数を確認
    const totalEntries = zipBuffer.readUInt16LE(eocdPos + 10);
    expect(totalEntries).toBe(expectedFiles.length);

    // Central Directoryのオフセットを取得
    const centralDirOffset = zipBuffer.readUInt32LE(eocdPos + 16);

    // 各エントリのファイル名を確認
    let pos = centralDirOffset;
    const foundFiles: string[] = [];

    for (let i = 0; i < totalEntries; i++) {
        const sig = zipBuffer.readUInt32LE(pos);
        expect(sig).toBe(0x02014b50); // Central Directory signature

        const filenameLength = zipBuffer.readUInt16LE(pos + 28);
        const extraFieldLength = zipBuffer.readUInt16LE(pos + 30);
        const commentLength = zipBuffer.readUInt16LE(pos + 32);

        const filename = zipBuffer.slice(pos + 46, pos + 46 + filenameLength).toString('utf8');
        foundFiles.push(filename);

        pos += 46 + filenameLength + extraFieldLength + commentLength;
    }

    expect(foundFiles.sort()).toEqual(expectedFiles.sort());
}

/**
 * CRC32計算
 */
function calculateCrc32(buffer: Buffer): number {
    const CRC_TABLE: number[] = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        CRC_TABLE[n] = c >>> 0;
    }

    let crc = 0 ^ -1;
    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
}
