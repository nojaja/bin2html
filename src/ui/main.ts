/**
 * メインUIスクリプト
 */

import './styles.css';
import { HtmlGenerator } from '../HtmlGenerator';

// DOMの初期化
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
    const zipFileInput = document.getElementById('zipFile') as HTMLInputElement;
    const pngFileInput = document.getElementById('pngFile') as HTMLInputElement;
    const filenameInput = document.getElementById('filename') as HTMLInputElement;
    const loadingElement = document.getElementById('loading') as HTMLDivElement;

    generateBtn.addEventListener('click', () => {
        void (async () => {
            try {
                // 入力検証
                if (!zipFileInput.files || zipFileInput.files.length === 0) {
                    alert('ZIPファイルを選択してください');
                    return;
                }
                if (!pngFileInput.files || pngFileInput.files.length === 0) {
                    alert('PNGファイルを選択してください');
                    return;
                }
                if (!filenameInput.value.trim()) {
                    alert('ファイル名を入力してください');
                    return;
                }

                // ローディング表示
                loadingElement.classList.remove('hidden');
                generateBtn.disabled = true;

                const zipFile = zipFileInput.files[0];
                const pngFile = pngFileInput.files[0];
                const filename = filenameInput.value.trim();

                // ファイルをBase64に変換
                const zipBase64 = await fileToBase64(zipFile);
                const pngBase64 = await fileToBase64(pngFile);

                // HTML生成
                const generator = new HtmlGenerator();
                const html = generator.generateHtml(zipBase64, pngBase64, filename);

                // HTMLファイルとしてダウンロード
                downloadHtml(html, filename);

                alert('HTMLファイルの生成が完了しました！');
            } catch (error) {
                console.error('エラー:', error);
                alert('エラーが発生しました: ' + (error as Error).message);
            } finally {
                // ローディング非表示
                loadingElement.classList.add('hidden');
                generateBtn.disabled = false;
            }
        })();
    });
});

/**
 * ファイルをBase64文字列に変換
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * HTMLをファイルとしてダウンロード
 */
function downloadHtml(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
