// Base64 Converter unit test
import { Base64Converter } from '../../src/Base64Converter';

describe('Base64Converter', () => {
    describe('bufferToBase64', () => {
        // Given（前提）: バイナリデータが存在する
        // When（操作）: bufferToBase64を呼び出す
        // Then（期待）: Base64文字列が返される
        it('正常系: BufferをBase64文字列に変換', () => {
            const testData = Buffer.from('Hello, World!');
            const converter = new Base64Converter();

            const result = converter.bufferToBase64(testData);

            expect(typeof result).toBe('string');
            expect(result).toBe('SGVsbG8sIFdvcmxkIQ==');
        });

        // Given（前提）: 空のBufferが渡される
        // When（操作）: bufferToBase64を呼び出す
        // Then（期待）: 空文字列が返される
        it('正常系: 空のBufferで空文字列を返す', () => {
            const emptyBuffer = Buffer.from([]);
            const converter = new Base64Converter();

            const result = converter.bufferToBase64(emptyBuffer);

            expect(result).toBe('');
        });
    });

    describe('base64ToBuffer', () => {
        // Given（前提）: Base64文字列が存在する
        // When（操作）: base64ToBufferを呼び出す
        // Then（期待）: 元のBufferが返される
        it('正常系: Base64文字列をBufferに変換', () => {
            const base64String = 'SGVsbG8sIFdvcmxkIQ==';
            const converter = new Base64Converter();

            const result = converter.base64ToBuffer(base64String);

            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.toString()).toBe('Hello, World!');
        });

        // Given（前提）: 空のBase64文字列が渡される
        // When（操作）: base64ToBufferを呼び出す
        // Then（期待）: 空のBufferが返される
        it('正常系: 空文字列で空Bufferを返す', () => {
            const converter = new Base64Converter();

            const result = converter.base64ToBuffer('');

            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        // Given（前提）: 無効なBase64文字列が渡される
        // When（操作）: base64ToBufferを呼び出す
        // Then（期待）: エラーがスローされる
        it('異常系: 無効なBase64文字列でエラー', () => {
            const invalidBase64 = '!!!invalid base64!!!';
            const converter = new Base64Converter();

            expect(() => {
                converter.base64ToBuffer(invalidBase64);
            }).toThrow('Invalid Base64 string');
        });
    });

    describe('bufferToDataUrl', () => {
        // Given（前提）: PNGバイナリとMIMEタイプが存在する
        // When（操作）: bufferToDataUrlを呼び出す
        // Then（期待）: Data URL形式の文字列が返される
        it('正常系: BufferをData URLに変換', () => {
            const pngData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
            const converter = new Base64Converter();

            const result = converter.bufferToDataUrl(pngData, 'image/png');

            expect(result).toMatch(/^data:image\/png;base64,/);
            expect(result.length).toBeGreaterThan('data:image/png;base64,'.length);
        });

        // Given（前提）: MIMEタイプが指定されていない
        // When（操作）: bufferToDataUrlを呼び出す
        // Then（期待）: デフォルトのMIMEタイプが使われる
        it('正常系: MIMEタイプ省略時はapplication/octet-streamを使用', () => {
            const data = Buffer.from('test');
            const converter = new Base64Converter();

            const result = converter.bufferToDataUrl(data);

            expect(result).toMatch(/^data:application\/octet-stream;base64,/);
        });
    });

    describe('dataUrlToBuffer', () => {
        // Given（前提）: Data URL形式の文字列が存在する
        // When（操作）: dataUrlToBufferを呼び出す
        // Then（期待）: 元のBufferが返される
        it('正常系: Data URLをBufferに変換', () => {
            const originalData = Buffer.from('test data');
            const converter = new Base64Converter();
            const dataUrl = converter.bufferToDataUrl(originalData, 'text/plain');

            const result = converter.dataUrlToBuffer(dataUrl);

            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.equals(originalData)).toBe(true);
        });

        // Given（前提）: 無効なData URL形式の文字列が渡される
        // When（操作）: dataUrlToBufferを呼び出す
        // Then（期待）: エラーがスローされる
        it('異常系: 無効なData URLでエラー', () => {
            const invalidDataUrl = 'not a data url';
            const converter = new Base64Converter();

            expect(() => {
                converter.dataUrlToBuffer(invalidDataUrl);
            }).toThrow('Invalid Data URL format');
        });
    });
});
