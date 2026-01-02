/**
 * 処理名: HtmlGenerator
 *
 * 処理概要: ZIP+PNGデータを埋め込んだ単独HTMLファイルを生成する
 *
 * 実装理由: バイナリデータをHTMLに保持し、ダウンロードや新規生成機能を提供するため
 */

export class HtmlGenerator {
  /**
   * ZIP+PNGデータを埋め込んだHTMLを生成する
   * @param zipBase64 - ZIPファイルのBase64データ
   * @param pngBase64 - サムネイル画像(PNG)のBase64データ
   * @param filename - ファイル名
   * @returns 生成されたHTML文字列
   */
  generateHtml(zipBase64: string, pngBase64: string, filename: string): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(filename)} - Binary Storage HTML</title>
  <style>
${this.generateCss()}
  </style>
</head>
<body>
  <div class="container">
    <h1>Binary Storage HTML</h1>
    
    <!-- ① ダウンロードセクション -->
    <section class="download-section">
      <h2>① ${this.escapeHtml(filename)}のdownload</h2>
      <div class="thumbnail">
        <img src="data:image/png;base64,${pngBase64}" alt="Thumbnail">
      </div>
      <div class="button-group">
        <button onclick="downloadZip()">zipでdownload</button>
        <button onclick="downloadPng()">pngでdownload</button>
      </div>
    </section>

    <!-- ② 新規生成セクション -->
    <section class="generate-section">
      <h2>② 新しくこのページを生成</h2>
      <div class="upload-area">
        <div class="form-group">
          <label for="zipFile">ZIPファイル:</label>
          <input type="file" id="zipFile" accept=".zip">
        </div>
        <div class="form-group">
          <label for="pngFile">PNGファイル (サムネイル):</label>
          <input type="file" id="pngFile" accept=".png">
        </div>
        <button onclick="generateNewHtml()">HTMLを生成してダウンロード</button>
      </div>
    </section>
  </div>

  <script>
${this.generateScript(zipBase64, pngBase64, filename)}
  </script>
</body>
</html>`;
  }

  /**
   * HTMLエスケープ処理
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * CSS生成
   */
  private generateCss(): string {
    return `    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 30px;
      text-align: center;
    }
    h2 {
      color: #34495e;
      margin: 20px 0 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
    section {
      margin-bottom: 40px;
    }
    .thumbnail {
      text-align: center;
      margin: 20px 0;
    }
    .thumbnail img {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .button-group {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    button {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }
    button:hover {
      background: #2980b9;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    input[type="file"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .upload-area {
      padding: 20px;
      background: #f9f9f9;
      border-radius: 4px;
    }`;
  }

  /**
   * JavaScript生成
   */
  private generateScript(zipBase64: string, pngBase64: string, filename: string): string {
    return `    // 埋め込みデータ
    const EMBEDDED_ZIP_BASE64 = '${zipBase64}';
    const EMBEDDED_PNG_BASE64 = '${pngBase64}';
    const EMBEDDED_FILENAME = '${this.escapeJs(filename)}';

    // Base64をBlobに変換
    function base64ToBlob(base64, mimeType) {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    }

    // ZIPファイルをダウンロード
    function downloadZip() {
      const blob = base64ToBlob(EMBEDDED_ZIP_BASE64, 'application/zip');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = EMBEDDED_FILENAME + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // PNGファイルをダウンロード（ZIP埋め込み済み）
    async function downloadPng() {
      try {
        const zipBlob = base64ToBlob(EMBEDDED_ZIP_BASE64, 'application/zip');
        const pngBlob = base64ToBlob(EMBEDDED_PNG_BASE64, 'image/png');
        
        // BlobをUint8Arrayに非同期変換
        const zipBuffer = await zipBlob.arrayBuffer();
        const pngBuffer = await pngBlob.arrayBuffer();
        
        const zipArray = new Uint8Array(zipBuffer);
        const pngArray = new Uint8Array(pngBuffer);
        
        const embeddedPng = embedZipIntoPng(zipArray, pngArray);
        
        const blob = new Blob([embeddedPng], { type: 'image/png' });
        downloadBlobAs(blob, EMBEDDED_FILENAME + '.png');
      } catch (error) {
        alert('PNG生成エラー: ' + error.message);
      }
    }

    // Blobをダウンロード
    function downloadBlobAs(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // CRC32テーブル（IEEE 802.3）
    const CRC_TABLE = (() => {
      const table = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
      }
      return table;
    })();

    // CRC32計算
    function crc32(buffer, previous = 0) {
      let crc = previous ^ -1;
      for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xFF];
      }
      return crc ^ -1;
    }

    // Hex文字列をUint8Arrayに変換（ブラウザ環境用）
    function hexToUint8Array(hexStr) {
      const bytes = [];
      for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(parseInt(hexStr.substr(i, 2), 16));
      }
      return new Uint8Array(bytes);
    }

    // ZIPをPNGに埋め込む（Node.js版ZipAsPngをブラウザに移植）
    function embedZipIntoPng(zipData, pngData) {
      const HEAD_PNG = hexToUint8Array('89504e470d0a1a0a0000000d49484452');
      const SIZE_PNG_HEAD_IHDR = 8 + 4 + 4 + 0x0d + 4; // PNGヘッダ+IHDRのサイズ
      const SIG_EOCD = hexToUint8Array('504b0506'); // EOCDのシグネチャ
      const SIG_CEN = 0x02014b50; // CENのシグネチャ
      const SIZE_ZIP_CEN = 46; // CENの固定長部分のサイズ
      const ZIP_ENDSIZ = 12; // EOCD内のCENの全体長のoffset
      const ZIP_ENDOFF = 16; // EOCD内のCENのオフセットのoffset
      const ZIP_CENNAM = 28; // CEN内のファイル名サイズのoffset
      const ZIP_CENEXT = 30; // CEN内の拡張情報サイズのoffset
      const ZIP_CENCOM = 32; // CEN内のコメントサイズのoffset
      const ZIP_CENOFF = 42; // CEN内のLOCのoffset
      const OFFSET_ZIP = SIZE_PNG_HEAD_IHDR + 4 + 4; // オフセット補正値

      // PNGヘッダをチェック
      const pngHeadHex = Array.from(pngData.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (pngHeadHex !== '89504e470d0a1a0a') {
        throw new Error('Invalid PNG Header');
      }

      // PNGにEOCDが含まれていないかチェック
      const eocdsigBytes = Array.from(SIG_EOCD);
      for (let i = 0; i < pngData.length - 3; i++) {
        if (pngData[i] === eocdsigBytes[0] && pngData[i+1] === eocdsigBytes[1] &&
            pngData[i+2] === eocdsigBytes[2] && pngData[i+3] === eocdsigBytes[3]) {
          throw new Error('contains EOCD in PNG');
        }
      }

      // ZIPファイルのEOCDを探す
      let posEocd = -1;
      const eocdBytes = Array.from(SIG_EOCD);
      for (let i = zipData.length - 1; i >= Math.max(0, zipData.length - 65557); i--) {
        if (zipData[i] === eocdBytes[0] && zipData[i+1] === eocdBytes[1] &&
            zipData[i+2] === eocdBytes[2] && zipData[i+3] === eocdBytes[3]) {
          posEocd = i;
          break;
        }
      }
      if (posEocd === -1) throw new Error('SIG_EOCD not found');

      // ZIPファイルのCENを探す
      const posCenDv = new DataView(zipData.buffer, zipData.byteOffset + posEocd + ZIP_ENDOFF, 4);
      const posCen = posCenDv.getInt32(0, true);
      const sizeCenDv = new DataView(zipData.buffer, zipData.byteOffset + posEocd + ZIP_ENDSIZ, 4);
      const sizeCen = sizeCenDv.getInt32(0, true);

      // 空のZIPでない場合のみCENのバリデーション
      if (sizeCen > 0) {
        if (posEocd <= posCen) throw new Error('invalid order CEN and EOCD');
        const cenSigDv = new DataView(zipData.buffer, zipData.byteOffset + posCen, 4);
        if (SIG_CEN !== cenSigDv.getUint32(0, true)) {
          throw new Error('SIG_CEN not found');
        }
      }

      // PNGヘッダ + IHDRチャンク
      const outBuff1 = pngData.slice(0, SIZE_PNG_HEAD_IHDR);

      // ZIPコンテナの長さ・チャンク名を作成
      const outBuff2 = new Uint8Array(8);
      const dv2 = new DataView(outBuff2.buffer);
      dv2.setInt32(0, zipData.length, false); // ビッグエンディアン
      outBuff2.set(new TextEncoder().encode('ziPc'), 4);

      // ZIPファイル（コピーして書き換え）
      const outBuff3 = new Uint8Array(zipData);

      // CENの中のLOCのオフセットを書き換える
      for (let size = 0; size < sizeCen;) {
        const locOffsetIdx = posCen + size + ZIP_CENOFF;
        const locOffsetDv = new DataView(outBuff3.buffer, outBuff3.byteOffset + locOffsetIdx, 4);
        const offsetLoc = locOffsetDv.getInt32(0, true);
        locOffsetDv.setInt32(0, offsetLoc + OFFSET_ZIP, true);

        const namSizeDv = new DataView(outBuff3.buffer, outBuff3.byteOffset + posCen + size + ZIP_CENNAM, 4);
        const namSize = namSizeDv.getInt32(0, true);
        const extSizeDv = new DataView(outBuff3.buffer, outBuff3.byteOffset + posCen + size + ZIP_CENEXT, 4);
        const extSize = extSizeDv.getInt32(0, true);
        const comSizeDv = new DataView(outBuff3.buffer, outBuff3.byteOffset + posCen + size + ZIP_CENCOM, 4);
        const comSize = comSizeDv.getInt32(0, true);
        size += SIZE_ZIP_CEN + namSize + extSize + comSize;
      }

      // EOCDの中のCENのオフセットを書き換える
      const cenOffsetDv = new DataView(outBuff3.buffer, outBuff3.byteOffset + posEocd + ZIP_ENDOFF, 4);
      cenOffsetDv.setInt32(0, posCen + OFFSET_ZIP, true);

      // ZIPコンテナのCRCを計算
      const crcNameBuf = new Uint8Array(4);
      crcNameBuf.set(new TextEncoder().encode('ziPc'));
      const crc1 = crc32(crcNameBuf);
      const crc2 = crc32(outBuff3, crc1);
      const outBuff4 = new Uint8Array(4);
      const dv4 = new DataView(outBuff4.buffer);
      dv4.setInt32(0, crc2, false); // ビッグエンディアン

      // PNGのIHDRチャンクより後
      const outBuff5 = pngData.slice(SIZE_PNG_HEAD_IHDR);

      // 結合
      const result = new Uint8Array(outBuff1.length + outBuff2.length + outBuff3.length + outBuff4.length + outBuff5.length);
      let offset = 0;
      result.set(outBuff1, offset); offset += outBuff1.length;
      result.set(outBuff2, offset); offset += outBuff2.length;
      result.set(outBuff3, offset); offset += outBuff3.length;
      result.set(outBuff4, offset); offset += outBuff4.length;
      result.set(outBuff5, offset);

      return result;
    }

    // Uint8ArrayのBuffer互換ヘルパー
    if (!Uint8Array.prototype.slice) {
      Uint8Array.prototype.slice = function(start, end) {
        return new Uint8Array(this.buffer, this.byteOffset + (start || 0), (end || this.length) - (start || 0));
      };
    }

    // 新しいHTMLを生成
    async function generateNewHtml() {
      const zipFile = document.getElementById('zipFile').files[0];
      const pngFile = document.getElementById('pngFile').files[0];
      
      if (!zipFile || !pngFile) {
        alert('ZIPファイルとPNGファイルの両方を選択してください');
        return;
      }
      
      try {
        const zipBase64 = await fileToBase64(zipFile);
        const pngBase64 = await fileToBase64(pngFile);
        const filename = zipFile.name.replace(/\\.zip$/, '');
        
        // 現在のHTMLをテンプレートとして使用
        const currentHtml = document.documentElement.outerHTML;
        
        // データを置換
        let newHtml = currentHtml;
        newHtml = newHtml.replace(EMBEDDED_ZIP_BASE64, zipBase64);
        newHtml = newHtml.replace(EMBEDDED_PNG_BASE64, pngBase64);
        newHtml = newHtml.replace(new RegExp(EMBEDDED_FILENAME, 'g'), filename);
        
        // HTMLファイルとしてダウンロード
        const blob = new Blob([newHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        alert('HTML生成エラー: ' + error.message);
      }
    }

    // ファイルをBase64に変換
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }`;
  }

  /**
   * JavaScriptエスケープ処理
   */
  private escapeJs(text: string): string {
    return text.replace(/\\/g, '\\\\')
               .replace(/'/g, "\\'")
               .replace(/"/g, '\\"')
               .replace(/\n/g, '\\n')
               .replace(/\r/g, '\\r');
  }
}
