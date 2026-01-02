/**
 * 処理名: ZipAsPng
 *
 * 処理概要: PNGファイルにZIPファイルを埋め込んだり、抽出したりする
 *
 * 実装理由: バイナリデータをPNG画像に偽装して保存・転送するため
 * 
 * 参考実装: https://github.com/nojaja/bpmn-modeler/blob/develop/src/js/fs/ZipAsPng.js
 */

// PNGヘッダとIHDRの前半部分
const HEAD_PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const SIZE_PNG_HEAD_IHDR = 8 + 4 + 4 + 0x0d + 4; // PNGヘッダ+IHDRのサイズ

const SIG_CEN = 0x02014b50; // CENのシグネチャ
const SIG_EOCD = Buffer.from('504b0506', 'hex'); // EOCDのシグネチャ
const SIZE_ZIP_CEN = 46; // CENの固定長部分のサイズ

const ZIP_ENDSIZ = 12; // EOCD内のCENの全体長のoffset
const ZIP_ENDOFF = 16; // EOCD内のCENのオフセットのoffset
const ZIP_CENNAM = 28; // CEN内のファイル名サイズのoffset
const ZIP_CENEXT = 30; // CEN内の拡張情報サイズのoffset
const ZIP_CENCOM = 32; // CEN内のコメントサイズのoffset
const ZIP_CENOFF = 42; // CEN内のLOCのoffset

// ZIPコンテナ格納時の補正するoffset
const OFFSET_ZIP = SIZE_PNG_HEAD_IHDR + 4 + 4;

/**
 * CRC32計算（簡易実装）
 */
function crc32(buffer: Buffer, previous: number = 0): number {
  let crc = previous ^ -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xFF];
  }
  return crc ^ -1;
}

// CRC32テーブル（IEEE 802.3）
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export class ZipAsPng {
  /**
   * ZIPファイルをPNGファイルに偽装する
   * @param zipBuff - ZIPファイルのBuffer
   * @param pngBuff - PNGファイルのBuffer
   * @returns ZIP埋め込み済みPNGのBuffer
   */
  zipToPng(zipBuff: Buffer, pngBuff: Buffer): Buffer {
    // PNGファイルのヘッダ+IHDR前半チェック
    if (!HEAD_PNG.equals(pngBuff.slice(0, HEAD_PNG.length))) {
      throw new Error('Invalid PNG Header');
    }

    // PNGにEOCDが含まれていないことをチェック
    if (pngBuff.lastIndexOf(SIG_EOCD) !== -1) {
      throw new Error('contains EOCD in PNG');
    }

    // ZIPファイルのEOCDを探す
    const posEocd = zipBuff.lastIndexOf(SIG_EOCD);
    if (posEocd === -1) {
      throw new Error('SIG_EOCD not found');
    }

    // ZIPファイルのCENを探す
    const posCen = zipBuff.readInt32LE(posEocd + ZIP_ENDOFF);
    const sizeCen = zipBuff.readInt32LE(posEocd + ZIP_ENDSIZ);
    
    // 空のZIPでない場合のみCENのバリデーションを行う
    if (sizeCen > 0) {
      if (posEocd <= posCen) {
        throw new Error('invalid order CEN and EOCD');
      }
      if (SIG_CEN !== zipBuff.readInt32LE(posCen)) {
        throw new Error('SIG_CEN not found');
      }
    }

    // PNGヘッダ + IHDRチャンク
    const outBuff1 = pngBuff.slice(0, SIZE_PNG_HEAD_IHDR);

    // ZIPコンテナの長さ・チャンク名
    const outBuff2 = Buffer.alloc(8);
    outBuff2.writeInt32BE(zipBuff.length, 0);
    outBuff2.write('ziPc', 4, 4, 'ascii');

    // ZIPファイル（コピーして書き換え）
    const outBuff3 = Buffer.from(zipBuff);

    // CENの中のLOCのオフセットを書き換える
    for (let size = 0; size < sizeCen;) {
      const offsetLoc = outBuff3.readInt32LE(posCen + size + ZIP_CENOFF);
      outBuff3.writeInt32LE(offsetLoc + OFFSET_ZIP, posCen + size + ZIP_CENOFF);
      size += SIZE_ZIP_CEN +
        outBuff3.readInt32LE(posCen + size + ZIP_CENNAM) +
        outBuff3.readInt32LE(posCen + size + ZIP_CENEXT) +
        outBuff3.readInt32LE(posCen + size + ZIP_CENCOM);
    }

    // EOCDの中のCENのオフセットを書き換える
    outBuff3.writeInt32LE(posCen + OFFSET_ZIP, posEocd + ZIP_ENDOFF);

    // ZIPコンテナのCRCを出力
    const crc1 = crc32(outBuff2.slice(4, 8)); // チャンク名
    const crc2 = crc32(outBuff3, crc1); // チャンクデータ
    const outBuff4 = Buffer.alloc(4);
    outBuff4.writeInt32BE(crc2, 0);

    // PNGのIHDRチャンクより後
    const outBuff5 = pngBuff.slice(SIZE_PNG_HEAD_IHDR);

    // 結合
    const outBuff = Buffer.concat([outBuff1, outBuff2, outBuff3, outBuff4, outBuff5]);

    return outBuff;
  }

  /**
   * PNG+ZIPからZIPファイルを抽出する
   * @param pngBuff - ZIP埋め込み済みPNGのBuffer
   * @returns ZIPファイルのBuffer
   */
  pngToZip(pngBuff: Buffer): Buffer {
    // PNGファイルのヘッダ+IHDR前半チェック
    if (!HEAD_PNG.equals(pngBuff.slice(0, HEAD_PNG.length))) {
      throw new Error('Invalid PNG Header');
    }

    // ziPcチャンクを探す
    const zipcSig = Buffer.from('ziPc', 'ascii');
    let pos = SIZE_PNG_HEAD_IHDR;
    let zipSize = -1;
    let zipStart = -1;

    while (pos < pngBuff.length) {
      const chunkSize = pngBuff.readInt32BE(pos);
      const chunkType = pngBuff.slice(pos + 4, pos + 8);
      
      if (zipcSig.equals(chunkType)) {
        zipSize = chunkSize;
        zipStart = pos + 8;
        break;
      }
      
      pos += 4 + 4 + chunkSize + 4; // length + type + data + crc
    }

    if (zipStart === -1 || zipSize === -1) {
      throw new Error('ziPc chunk not found');
    }

    // ZIP部分を抽出
    const zipBuff = Buffer.from(pngBuff.slice(zipStart, zipStart + zipSize));

    // オフセットを元に戻す
    const posEocd = zipBuff.lastIndexOf(SIG_EOCD);
    if (posEocd === -1) {
      throw new Error('SIG_EOCD not found in extracted ZIP');
    }

    const posCen = zipBuff.readInt32LE(posEocd + ZIP_ENDOFF);
    const realPosCen = posCen - OFFSET_ZIP;
    const sizeCen = zipBuff.readInt32LE(posEocd + ZIP_ENDSIZ);

    // CENの中のLOCのオフセットを元に戻す
    for (let size = 0; size < sizeCen;) {
      const offsetLoc = zipBuff.readInt32LE(realPosCen + size + ZIP_CENOFF);
      zipBuff.writeInt32LE(offsetLoc - OFFSET_ZIP, realPosCen + size + ZIP_CENOFF);
      size += SIZE_ZIP_CEN +
        zipBuff.readInt32LE(realPosCen + size + ZIP_CENNAM) +
        zipBuff.readInt32LE(realPosCen + size + ZIP_CENEXT) +
        zipBuff.readInt32LE(realPosCen + size + ZIP_CENCOM);
    }

    // EOCDの中のCENのオフセットを元に戻す
    zipBuff.writeInt32LE(realPosCen, posEocd + ZIP_ENDOFF);

    return zipBuff;
  }
}
