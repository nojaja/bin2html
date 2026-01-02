// HTML Generator unit test
import { HtmlGenerator } from '../../src/HtmlGenerator';

describe('HtmlGenerator', () => {
    describe('generateHtml', () => {
        // Given（前提）: ZIPとPNGのBase64データが存在する
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: 完全なHTMLが生成される
        it('正常系: ZIP+PNGデータを埋め込んだHTMLを生成', () => {
            const zipBase64 = Buffer.from('test zip data').toString('base64');
            const pngBase64 = Buffer.from('test png data').toString('base64');
            const filename = 'test-file';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html');
            expect(html).toContain('</html>');
            expect(html).toContain(zipBase64);
            expect(html).toContain(pngBase64);
            expect(html).toContain(filename);
        });

        // Given（前提）: HTMLの基本構造が正しい
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: head, bodyタグが含まれる
        it('正常系: HTML基本構造が含まれる', () => {
            const zipBase64 = 'dGVzdA==';
            const pngBase64 = 'cG5nZGF0YQ==';
            const filename = 'sample';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('<head>');
            expect(html).toContain('</head>');
            expect(html).toContain('<body>');
            expect(html).toContain('</body>');
            expect(html).toContain('<meta charset="UTF-8">');
        });

        // Given（前提）: ダウンロード機能が必要
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: ダウンロードボタンが含まれる
        it('正常系: ダウンロードボタンが含まれる', () => {
            const zipBase64 = 'dGVzdA==';
            const pngBase64 = 'cG5nZGF0YQ==';
            const filename = 'sample';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('zipでdownload');
            expect(html).toContain('pngでdownload');
        });

        // Given（前提）: 新規生成機能が必要
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: ファイルアップロード要素が含まれる
        it('正常系: ファイルアップロード要素が含まれる', () => {
            const zipBase64 = 'dGVzdA==';
            const pngBase64 = 'cG5nZGF0YQ==';
            const filename = 'sample';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('input');
            expect(html).toContain('type="file"');
            expect(html).toContain('新しくこのページを生成');
        });

        // Given（前提）: スクリプトが埋め込まれている
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: scriptタグが含まれる
        it('正常系: JavaScriptが埋め込まれている', () => {
            const zipBase64 = 'dGVzdA==';
            const pngBase64 = 'cG5nZGF0YQ==';
            const filename = 'sample';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('<script>');
            expect(html).toContain('</script>');
            expect(html).toContain('function');
        });

        // Given（前提）: スタイルが埋め込まれている
        // When（操作）: generateHtmlを呼び出す
        // Then（期待）: styleタグが含まれる
        it('正常系: CSSが埋め込まれている', () => {
            const zipBase64 = 'dGVzdA==';
            const pngBase64 = 'cG5nZGF0YQ==';
            const filename = 'sample';

            const generator = new HtmlGenerator();
            const html = generator.generateHtml(zipBase64, pngBase64, filename);

            expect(html).toContain('<style>');
            expect(html).toContain('</style>');
        });
    });
});
