# bin2html

バイナリデータ（ZIPファイル）とサムネイル画像（PNG）を埋め込んだ単独のHTMLファイルを生成するツールです。

## 概要

このツールは以下の機能を提供します：

1. **HTML生成ツール**
   - ZIPファイルとPNGサムネイルを選択してアップロード
   - それらを埋め込んだ単独のHTMLファイルを生成・ダウンロード

2. **生成されたHTML**
   - ①ダウンロードセクション：内包しているZIPファイルをダウンロード
   - ②新規生成セクション：新しいZIP+PNGから新しいHTMLを生成

## 使い方

### HTML生成ツールを起動

```powershell
# 依存パッケージのインストール
npm install --legacy-peer-deps

# 開発サーバを起動
npm run dev
```

ブラウザで http://localhost:8080 を開き、以下を実行：

1. ZIPファイルを選択
2. サムネイル用のPNGファイルを選択
3. ファイル名を入力
4. 「HTMLを生成してダウンロード」ボタンをクリック

### 本番ビルド

```powershell
npm run build
```

生成されたファイルは `docs/` ディレクトリに出力されます。

### 生成されたHTMLの使い方

生成されたHTMLファイルをブラウザで開くと：

- **①ダウンロードセクション**
  - 「zipでdownload」：内包しているZIPファイルをダウンロード
  - 「pngでdownload」：ZIPを埋め込んだPNG画像をダウンロード

- **②新規生成セクション**
  - 新しいZIPとPNGをアップロード
  - 新しいHTMLファイルを生成・ダウンロード

## プロジェクト構造

```
bin2html/
├── src/
│   ├── ZipAsPng.ts          # PNG↔ZIP変換機能
│   ├── Base64Converter.ts   # Base64エンコード/デコード
│   ├── HtmlGenerator.ts     # HTML生成機能
│   ├── index.ts             # エクスポート
│   └── ui/                  # UIファイル
│       ├── index.html       # HTML生成ツール
│       ├── main.ts          # UIロジック
│       └── styles.css       # スタイル
├── test/
│   └── unit/                # ユニットテスト
├── docs/                    # ビルド出力先
├── webpack.config.js        # Webpack設定
├── package.json
└── README.md
```

## 技術スタック

- TypeScript 5.3.3
- Webpack 5.99.8
- Jest 29.6.1 (ユニットテスト)
- Node.js v22.21.0

## テスト実行

```powershell
npm run test
```

## ライセンス

MIT

## 参考実装

- [ZipAsPng.js](https://github.com/nojaja/bpmn-modeler/blob/develop/src/js/fs/ZipAsPng.js)

Store binary in html
