---
name: define-task
description: electrairの①作業定義を作る手順。開発計画、作業範囲、完成条件、分割案を整理して人間確認へ提示するときに使う。
---

# define-task

プロジェクトルートを基準にパスを解決し、AGENTS.md、docs/development-workflow.md、docs/tasks/README.md、対象作業記録を読む。手順から仕様や承認を新設・上書きしない。結果は対象作業記録へ残す。

## 手順

1. docs/prototype-handoff.md、docs/specs/README.mdと必要な仕様、docs/adr/README.mdを読む。
2. docs/tasks/template.mdから作業記録を作り、目的、範囲、対象外、P番号、仮置き、分割・依存関係を整理する。全体の承認単位と機能単位の実装作業を区別する。期限は設けない。
3. 既存の決定を再利用し、矛盾・重要な未決定事項には選択肢・推奨案・影響を添える。
4. 作業一覧を更新し、①の確認対象の版と判断点を人間に提示する。承認前に②以降を開始しない。
5. 実際の回答を対象版・日付・判断者と記録する。設計の承認も得たとは扱わない。

成果物は作業定義・開発順序・①の確認資料とする。
