/**
 * bin2html - バイナリデータをHTMLに埋め込むツール
 * 
 * @module bin2html
 */

export { ZipAsPng } from './ZipAsPng';
export { Base64Converter } from './Base64Converter';
export { HtmlGenerator } from './HtmlGenerator';

/**
 * 処理名: 例の加算
 *
 * 処理概要: 2つの数値を加算して返す
 *
 * 実装理由: テストのサンプルおよび公開APIの雛形として用意
 */
export function sum(a: number, b: number): number {
  return a + b;
}
