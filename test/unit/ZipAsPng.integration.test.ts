import { ZipAsPng } from '../../src/ZipAsPng';
import * as fs from 'fs';
import * as path from 'path';

describe('ZipAsPng Integration Test - PNG+ZIP埋め込み→抽出', () => {
  const testDataDir = path.join(__dirname, '../testdata');
  
  beforeAll(() => {
    // テストデータディレクトリを作成
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  // Given（前提）: 実際のZIPファイルとPNGファイルが存在する
  // When（操作）: ZIPをPNGに埋め込み、再度抽出する
  // Then（期待）: 抽出されたZIPが元のZIPと同一である
  it('正常系: 実際のZIPファイルを埋め込み→抽出して内容が同じことを確認', () => {
    // 1. テスト用の実際のZIPファイルを作成
    const zipBuffer = createRealZipFile();
    
    // 2. テスト用の実際のPNGファイルを作成
    const pngBuffer = createRealPngFile();
    
    // 3. ZIPをPNGに埋め込む
    const zipAsPng = new ZipAsPng();
    const embeddedPng = zipAsPng.zipToPng(zipBuffer, pngBuffer);
    
    // 埋め込みPNGがPNGヘッダを持つことを確認
    expect(embeddedPng.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    
    // 埋め込みPNGのサイズが元のPNGより大きいことを確認
    expect(embeddedPng.length).toBeGreaterThan(pngBuffer.length);
    
    // 4. 埋め込みPNGからZIPを抽出
    const extractedZip = zipAsPng.pngToZip(embeddedPng);
    
    // 5. 抽出されたZIPが元のZIPと同一であることを確認
    expect(extractedZip.equals(zipBuffer)).toBe(true);
    expect(extractedZip.length).toBe(zipBuffer.length);
    
    // 6. 抽出されたZIPが有効なZIP構造を持つことを確認
    const eocdSig = Buffer.from('504b0506', 'hex');
    const eocdPos = extractedZip.lastIndexOf(eocdSig);
    expect(eocdPos).toBeGreaterThanOrEqual(0);
  });

  // Given（前提）: ファイル名を含む実際のZIPファイルが存在する
  // When（操作）: ZIPをPNGに埋め込み、再度抽出する
  // Then（期待）: 抽出されたZIPから元のファイル構造が復元できる
  it('正常系: ファイルを含むZIPを埋め込み→抽出して構造を確認', () => {
    // 1. ファイルを含むZIPを作成
    const zipBuffer = createZipWithFile('test.txt', 'Hello, World!');
    
    // 2. テスト用のPNG
    const pngBuffer = createRealPngFile();
    
    // 3. ZIPをPNGに埋め込む
    const zipAsPng = new ZipAsPng();
    const embeddedPng = zipAsPng.zipToPng(zipBuffer, pngBuffer);
    
    // 4. 埋め込みPNGからZIPを抽出
    const extractedZip = zipAsPng.pngToZip(embeddedPng);
    
    // 5. 抽出されたZIPが元のZIPと同一であることを確認
    expect(extractedZip.equals(zipBuffer)).toBe(true);
    
    // 6. ZIPファイルとして保存し、構造を検証
    const testZipPath = path.join(testDataDir, 'extracted.zip');
    fs.writeFileSync(testZipPath, extractedZip);
    
    // ZIPファイルが存在することを確認
    expect(fs.existsSync(testZipPath)).toBe(true);
    
    // クリーンアップ
    fs.unlinkSync(testZipPath);
  });
});

/**
 * 実際の有効なPNGファイルを生成
 * 1x1ピクセルの赤色PNG
 */
function createRealPngFile(): Buffer {
  // PNGヘッダ
  const pngHeader = Buffer.from('89504e470d0a1a0a', 'hex');
  
  // IHDRチャンク（1x1ピクセル、8bit RGB）
  const ihdrLength = Buffer.from('0000000d', 'hex');
  const ihdrType = Buffer.from('49484452', 'hex');
  const ihdrData = Buffer.from([
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08,                   // bit depth: 8
    0x02,                   // color type: RGB
    0x00,                   // compression: deflate
    0x00,                   // filter: adaptive
    0x00                    // interlace: none
  ]);
  const ihdrCrc = Buffer.from('90773836', 'hex');
  
  // IDATチャンク（1x1ピクセルの赤色）
  const idatLength = Buffer.from('0000000c', 'hex');
  const idatType = Buffer.from('49444154', 'hex');
  const idatData = Buffer.from([
    0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00
  ]);
  const idatCrc = Buffer.from('d4a8c0e0', 'hex');
  
  // IENDチャンク
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
 * 実際の有効なZIPファイルを生成（空のZIP）
 */
function createRealZipFile(): Buffer {
  // End of Central Directory Record (EOCD)
  const eocd = Buffer.alloc(22);
  eocd.write('PK\x05\x06', 0, 4, 'binary'); // EOCD signature
  eocd.writeUInt16LE(0, 4);   // disk number
  eocd.writeUInt16LE(0, 6);   // disk with central directory
  eocd.writeUInt16LE(0, 8);   // total entries on this disk
  eocd.writeUInt16LE(0, 10);  // total entries
  eocd.writeUInt32LE(0, 12);  // size of central directory
  eocd.writeUInt32LE(0, 16);  // offset of central directory
  eocd.writeUInt16LE(0, 20);  // comment length
  
  return eocd;
}

/**
 * ファイルを含む実際のZIPファイルを生成
 */
function createZipWithFile(filename: string, content: string): Buffer {
  const contentBuffer = Buffer.from(content, 'utf8');
  const filenameBuffer = Buffer.from(filename, 'utf8');
  
  // Local File Header
  const localHeader = Buffer.alloc(30 + filenameBuffer.length);
  localHeader.write('PK\x03\x04', 0, 4, 'binary'); // signature
  localHeader.writeUInt16LE(20, 4);   // version needed to extract
  localHeader.writeUInt16LE(0, 6);    // general purpose bit flag
  localHeader.writeUInt16LE(0, 8);    // compression method (stored)
  localHeader.writeUInt16LE(0, 10);   // file last mod time
  localHeader.writeUInt16LE(0, 12);   // file last mod date
  localHeader.writeUInt32LE(calculateCrc32(contentBuffer), 14); // crc32
  localHeader.writeUInt32LE(contentBuffer.length, 18); // compressed size
  localHeader.writeUInt32LE(contentBuffer.length, 22); // uncompressed size
  localHeader.writeUInt16LE(filenameBuffer.length, 26); // filename length
  localHeader.writeUInt16LE(0, 28);   // extra field length
  filenameBuffer.copy(localHeader, 30);
  
  // Central Directory Header
  const centralHeader = Buffer.alloc(46 + filenameBuffer.length);
  centralHeader.write('PK\x01\x02', 0, 4, 'binary'); // signature
  centralHeader.writeUInt16LE(20, 4);   // version made by
  centralHeader.writeUInt16LE(20, 6);   // version needed to extract
  centralHeader.writeUInt16LE(0, 8);    // general purpose bit flag
  centralHeader.writeUInt16LE(0, 10);   // compression method
  centralHeader.writeUInt16LE(0, 12);   // file last mod time
  centralHeader.writeUInt16LE(0, 14);   // file last mod date
  centralHeader.writeUInt32LE(calculateCrc32(contentBuffer), 16); // crc32
  centralHeader.writeUInt32LE(contentBuffer.length, 20); // compressed size
  centralHeader.writeUInt32LE(contentBuffer.length, 24); // uncompressed size
  centralHeader.writeUInt16LE(filenameBuffer.length, 28); // filename length
  centralHeader.writeUInt16LE(0, 30);   // extra field length
  centralHeader.writeUInt16LE(0, 32);   // file comment length
  centralHeader.writeUInt16LE(0, 34);   // disk number start
  centralHeader.writeUInt16LE(0, 36);   // internal file attributes
  centralHeader.writeUInt32LE(0, 38);   // external file attributes
  centralHeader.writeUInt32LE(0, 42);   // relative offset of local header
  filenameBuffer.copy(centralHeader, 46);
  
  const centralDirOffset = localHeader.length + contentBuffer.length;
  const centralDirSize = centralHeader.length;
  
  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.write('PK\x05\x06', 0, 4, 'binary');
  eocd.writeUInt16LE(0, 4);   // disk number
  eocd.writeUInt16LE(0, 6);   // disk with central directory
  eocd.writeUInt16LE(1, 8);   // total entries on this disk
  eocd.writeUInt16LE(1, 10);  // total entries
  eocd.writeUInt32LE(centralDirSize, 12); // size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20);  // comment length
  
  return Buffer.concat([localHeader, contentBuffer, centralHeader, eocd]);
}

/**
 * CRC32計算（簡易版）
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
