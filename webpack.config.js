import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JavaScriptをHTMLに内包するカスタムプラグイン
 */
class InlineBundlePlugin {
  apply(compiler) {
    // afterEmitフックを使用（ファイルが書き込まれた後に実行）
    compiler.hooks.afterEmit.tapPromise('InlineBundlePlugin', async (_compilation) => {
      const outputPath = compiler.options.output.path;
      const htmlFilePath = path.join(outputPath, 'index.html');
      const bundleFilePath = path.join(outputPath, 'bundle.js');
      
      try {
        // 少し待機してファイルが完全に書き込まれるまで待つ
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // bundle.jsファイルが存在するか確認
        try {
          const bundleContent = await fs.readFile(bundleFilePath, 'utf8');
          let html = await fs.readFile(htmlFilePath, 'utf8');
          
          // HTMLのscriptタグを置換
          // <script defer src="bundle.js"></script> または <script src="bundle.js"></script> のパターンに対応
          const originalHtml = html;
          html = html.replace(
            /<script[^>]*src=["'](?:\.\/)?bundle\.js["'][^>]*><\/script>/g,
            `<script>\n${bundleContent}\n</script>`
          );
          
          // 変更があった場合のみ保存
          if (html !== originalHtml) {
            await fs.writeFile(htmlFilePath, html, 'utf8');
            console.log('✓ bundle.jsをindex.htmlに内包しました');
            
            // bundle.jsファイルを削除
            await fs.unlink(bundleFilePath);
            console.log('✓ bundle.jsファイルを削除しました（HTMLに内包済み）');
          }
        } catch (err) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      } catch (error) {
        console.error('InlineBundlePlugin エラー:', error.message);
      }
    });
  }
}

export default {
  mode: 'production',
  entry: './src/ui/main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'docs'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
    new InlineBundlePlugin(),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    compress: true,
    port: 8080,
    open: true,
  },
};
