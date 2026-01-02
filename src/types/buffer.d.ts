/**
 * Buffer型の拡張定義
 * @types/node のバージョンによる型エラーを回避するための型定義
 */

declare global {
    interface BufferConstructor {
        concat(list: ReadonlyArray<Uint8Array>, totalLength?: number): Buffer;
        from(data: Uint8Array | ReadonlyArray<number> | ArrayBuffer | SharedArrayBuffer | string): Buffer;
        from(str: string, encoding?: BufferEncoding): Buffer;
    }

    interface Buffer extends Uint8Array {
        readonly length: number;
        [index: number]: number;
    }
}

export { };
