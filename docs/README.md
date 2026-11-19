# electrair ドキュメント一覧

更新日：2026年11月19日（日本時間）

## 読み方と正本

入口は[AGENTS.md](../AGENTS.md)。開始時は開発フロー・作業一覧・目的と範囲を確認し、必要な仕様とADRだけを追加で読む。

| 資料 | 管理する内容 |
| --- | --- |
| [開発フロー](development-workflow.md) | 工程、確認、判断権限、完了条件 |
| [引継ぎ資料](prototype-handoff.md) | 目的、H01〜H03、対象範囲、技術構成、利用者検証 |
| [仕様一覧](specs/README.md) | 振る舞いとP01〜P14 |
| [デザイン方針](design-guidelines.md) | 用語、表示・操作、共通部品、Storybook |
| [作業一覧](tasks/README.md) | 進行状況と各作業の承認・検証・引継ぎ |
| [ADR一覧](adr/README.md) | 重要な設計判断と理由 |

矛盾は新しい日付だけで解決しない。既存の決定・承認対象と根拠を確認し、開発フロー第9節に従って判断する。詳細仕様を引継ぎ資料・作業記録へ複製しない。

## AIの工程別手順

| 工程 | 手順 |
| --- | --- |
| ① 作業定義 | [define-task](../.agents/skills/define-task/SKILL.md) |
| ② 設計 | [design-task](../.agents/skills/design-task/SKILL.md) |
| ③〜⑤ 実装・検証 | [implement-task](../.agents/skills/implement-task/SKILL.md) |
| ⑥ レビュー・修正 | [review-task](../.agents/skills/review-task/SKILL.md) |
| ⑦〜⑧ 最終確認 | [prepare-final-review](../.agents/skills/prepare-final-review/SKILL.md) |

手順はこのプロジェクト内の文書。使用環境で自動検出されない場合も、上記から対象のSKILL.mdを直接読んで適用できる。

## 現在の状態と次の作業

共通ルール・手順・テンプレートと既存仕様の整理を実施。個別開発計画、作業定義・設計の承認、アプリ実装、実機確認は未実施。次は開発計画と①作業定義を用意して提示する。

起動・型確認・Lint・テスト・アプリとStorybookのビルド手順は未整備。環境構築時に採用した実行環境・依存バージョンと、実行確認したコマンドをここへ追記する。
