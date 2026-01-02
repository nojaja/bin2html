/**
 * 処理名: Base64Converter
 *
 * 処理概要: バイナリデータとBase64文字列の相互変換を行う
 *
 * 実装理由: HTMLにバイナリデータを埋め込むためにBase64エンコード/デコードが必要
 */

export class Base64Converter {
    /**
     * BufferをBase64文字列に変換する
     * @param buffer - 変換元のBuffer
     * @returns Base64文字列
     */
    bufferToBase64(buffer: Buffer): string {
        return buffer.toString('base64');
    }

    /**
     * Base64文字列をBufferに変換する
     * @param base64String - Base64文字列
     * @returns Buffer
     * @throws {Error} 無効なBase64文字列の場合
     */
    base64ToBuffer(base64String: string): Buffer {
        if (base64String === '') {
            return Buffer.from([]);
        }

        // Base64形式の検証（簡易的）
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64String)) {
            throw new Error('Invalid Base64 string');
        }

        try {
            return Buffer.from(base64String, 'base64');
        } catch {
            throw new Error('Invalid Base64 string');
        }
    }

    /**
     * BufferをData URL形式に変換する
     * @param buffer - 変換元のBuffer
     * @param mimeType - MIMEタイプ（デフォルト: application/octet-stream）
     * @returns Data URL形式の文字列
     */
    bufferToDataUrl(buffer: Buffer, mimeType: string = 'application/octet-stream'): string {
        const base64 = this.bufferToBase64(buffer);
        return `data:${mimeType};base64,${base64}`;
    }

    /**
     * Data URL形式の文字列をBufferに変換する
     * @param dataUrl - Data URL形式の文字列
     * @returns Buffer
     * @throws {Error} 無効なData URL形式の場合
     */
    dataUrlToBuffer(dataUrl: string): Buffer {
        // Data URL形式の検証
        const dataUrlMatch = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!dataUrlMatch) {
            throw new Error('Invalid Data URL format');
        }

        const base64Data = dataUrlMatch[2];
        return this.base64ToBuffer(base64Data);
    }
}
