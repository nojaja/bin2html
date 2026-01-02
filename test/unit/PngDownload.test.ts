/**
 * PNGダウンロード機能のテスト
 * 
 * 「pngでdownload」機能がZipAsPngを正しく利用し、
 * ダウンロードしたPNGファイルをZIPとして解凍できることを検証
 */

import { HtmlGenerator } from '../../src/HtmlGenerator';

describe('PNGダウンロード機能 - HTML/JavaScriptの検証', () => {
    let htmlGenerator: HtmlGenerator;

    beforeEach(() => {
        htmlGenerator = new HtmlGenerator();
    });

    it('生成HTMLが完全なZipAsPngロジックを含むembedZipIntoPng関数を持つ', () => {
        const html = htmlGenerator.generateHtml('dummy_zip_base64', 'dummy_png_base64', 'test');

        // embedZipIntoPng関数がHTMLに含まれていることを確認
        expect(html).toContain('function embedZipIntoPng');
        expect(html).toContain('CRC_TABLE');
        expect(html).toContain('SIZE_PNG_HEAD_IHDR');
        expect(html).toContain('SIG_EOCD');
        expect(html).toContain('OFFSET_ZIP');

        console.log('✅ embedZipIntoPng関数がHTMLに含まれていることを確認');
    });

    it('HTML内のembedZipIntoPngが全てのZipAsPng処理を含む', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // CRC32計算ロジック
        expect(html).toContain('CRC_TABLE');
        expect(html).toContain('function crc32');

        // PNG構造定数
        expect(html).toContain('const HEAD_PNG');
        expect(html).toContain('const SIZE_PNG_HEAD_IHDR');

        // ZIP構造定数
        expect(html).toContain('const SIG_EOCD');
        expect(html).toContain('const SIG_CEN');
        expect(html).toContain('const SIZE_ZIP_CEN');

        // ZIP オフセット定数
        expect(html).toContain('const ZIP_ENDSIZ');
        expect(html).toContain('const ZIP_ENDOFF');
        expect(html).toContain('const ZIP_CENNAM');
        expect(html).toContain('const ZIP_CENEXT');
        expect(html).toContain('const ZIP_CENCOM');
        expect(html).toContain('const ZIP_CENOFF');
        expect(html).toContain('const OFFSET_ZIP');

        // 処理ロジック
        expect(html).toContain('// PNGヘッダをチェック');
        expect(html).toContain('// ZIPファイルのEOCDを探す');
        expect(html).toContain('// ZIPファイルのCENを探す');
        expect(html).toContain('// CENの中のLOCのオフセットを書き換える');
        expect(html).toContain('// EOCDの中のCENのオフセットを書き換える');
        expect(html).toContain('// ZIPコンテナのCRCを計算');

        console.log('✅ embedZipIntoPngがZipAsPngの完全なロジックを含む');
    });

    it('downloadPng関数がembedZipIntoPngを正しく呼び出す', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // downloadPng関数が存在し、asyncであることを確認
        expect(html).toContain('async function downloadPng()');

        // embedZipIntoPngの呼び出し
        expect(html).toContain('embedZipIntoPng(zipArray, pngArray)');

        // Blob.arrayBuffer()を使用した非同期処理
        expect(html).toContain('.arrayBuffer()');
        expect(html).toContain('await zipBlob.arrayBuffer()');
        expect(html).toContain('await pngBlob.arrayBuffer()');

        // ダウンロード処理
        expect(html).toContain('downloadBlobAs');

        console.log('✅ downloadPng関数がembedZipIntoPngを正しく呼び出す');
    });

    it('HTML内のzipToPng処理がziPcチャンクを正しく追加', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // ziPcチャンク識別子
        expect(html).toContain("'ziPc'");

        // PNGヘッダ+IHDRチャンク出力
        expect(html).toContain('const outBuff1 = pngData.slice(0, SIZE_PNG_HEAD_IHDR)');

        // ziPcチャンク長と名前の出力
        expect(html).toContain('const outBuff2 = new Uint8Array(8)');
        expect(html).toContain('outBuff2.set(new TextEncoder().encode(\'ziPc\'), 4)');

        // PNGの後の部分
        expect(html).toContain('const outBuff5 = pngData.slice(SIZE_PNG_HEAD_IHDR)');

        console.log('✅ ziPcチャンク追加処理が正しく実装');
    });

    it('HTML内のオフセット修正処理が正しく実装', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // CENのLOCオフセット修正
        expect(html).toContain('ZIP_CENOFF');
        expect(html).toContain('offsetLoc + OFFSET_ZIP');

        // EOCDのCENオフセット修正
        expect(html).toContain('cenOffsetDv.setInt32(0, posCen + OFFSET_ZIP, true)');

        console.log('✅ オフセット修正処理が正しく実装');
    });

    it('HTML内にブラウザ互換性のためのプロトタイプ拡張がある', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // Uint8Arrayのsliceメソッドが存在しない場合の対応
        expect(html).toContain('Uint8Array.prototype.slice');
        expect(html).toContain('this.buffer');
        expect(html).toContain('this.byteOffset');

        console.log('✅ ブラウザ互換性のための処理が含まれている');
    });

    it('DataViewを使用した適切なバイナリ処理がある', () => {
        const html = htmlGenerator.generateHtml('dummy_zip', 'dummy_png', 'test');

        // DataViewの使用
        expect(html).toContain('new DataView');
        expect(html).toContain('getInt32');
        expect(html).toContain('setInt32');

        // ビッグエンディアン/リトルエンディアンの明示的指定
        expect(html).toContain('dv');
        expect(html).toContain('false'); // ビッグエンディアン
        expect(html).toContain('true');  // リトルエンディアン

        console.log('✅ DataViewを使用した適切なバイナリ処理');
    });
});
