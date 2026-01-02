---
name: completion-mandatory-quality-gates
description: 作業完了時に必ず品質ゲートを全通過させるためのSkill。ビルド・依存関係チェック・テスト・Lintを例外なく実行し、設定変更や除外を禁止する。
license: MIT
compatibility: Agent Skills format (agentskills.io) および GitHub Copilot / Claude / Codex に対応
metadata:
  author: nojaja
  version: "1.0.0"
allowed-tools: Read Write Bash
---

# 作業完了時の強制品質ゲート Skill

本Skillは、作業完了タイミングで必ず以下の品質ゲートを**設定変更・除外なし**で実行し、全て成功させることをエージェントに強制します。いずれかをスキップ・省略・設定変更することを禁止します。

## 必須実行コマンド（順不同可、全て成功が条件）
- `npm run build`
- `npm run depcruise`
- `npm run test`
- `npm run lint`

## 運用ルール
- 各ゲートの設定を変更してはならない（閾値・対象・オプションの調整禁止）。
- いかなる理由でも実行対象からの除外・スキップを禁止する。
- 実行結果は成功が確認できるまで対応を継続し、失敗時は設定を変えずに修正して再実行する。
- 作業完了の宣言は、上記4コマンドが全て成功した後のみ行うこと。
