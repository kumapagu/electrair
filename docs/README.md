# electrair ドキュメント一覧

更新日：2026年11月20日（日本時間）

## 読み方と正本

入口は[AGENTS.md](../AGENTS.md)。開始時は開発フロー・作業一覧・目的と範囲を確認し、必要な仕様とADRだけを追加で読む。

| 資料 | 管理する内容 |
| --- | --- |
| [開発フロー](development-workflow.md) | 工程、確認、判断権限、完了条件 |
| [引継ぎ資料](prototype-handoff.md) | 目的、H01〜H03、対象範囲、技術構成、利用者検証 |
| [仕様一覧](specs/README.md) | 振る舞いとP01〜P14 |
| [初回プロトタイプ設計案](specs/prototype-design.md) | ②確認用のルール、導線、データ、代表画面、検証分担 |
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

初回プロトタイプ v0.1.0 は⑧の最終レビューで採用。操作手順、iPhone Safari実機の未確認項目、次の利用者検証は[作業記録](tasks/T002-prototype.md)を参照。

## 開発・確認環境

確認時の環境はmacOS、Node.js 24.22.3、pnpm 11.25.0。主な依存はReact 19.3.1、Vite 7.3.8、TypeScript 5.9.3、Tailwind CSS 4.3.5、Storybook 10.6.7。[依存の固定版](../pnpm-lock.yaml)

Node.jsとpnpmが利用できるシェルで、プロジェクトのルートから実行する。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

起動後、同じMacで[プロトタイプ](http://127.0.0.1:5173/)を開く。割当・報告・写真はこのブラウザのIndexedDBに保存される。「サンプルを初期化」から確認を経て、架空の初期データに戻せる。

```sh
pnpm typecheck
pnpm test
pnpm build
STORYBOOK_DISABLE_TELEMETRY=1 pnpm storybook --host 127.0.0.1 --ci --no-open
STORYBOOK_DISABLE_TELEMETRY=1 pnpm build-storybook
```

Storybook実行中は[共通部品の見本](http://127.0.0.1:6006/)を開ける。Storybookを起動したターミナルは起動中の表示になるため、ビルドは別ターミナルで実行する。静的チェックはTypeScriptの型・未使用の検出を含む。テストはNode.jsのテストランナーと開発用のfake-indexeddb 6.2.8を使う。

### iPhoneからのアクセス手順案

MacとiPhoneを同じWi-Fiにつなぎ、Mac側のローカル起動を `pnpm dev --host 0.0.0.0 --port 5173 --strictPort` に切り替える。iPhone Safariで `http://<MacのLAN内IPアドレス>:5173/` を開く。Wi-Fiに接続したMacのIPアドレスはシステム設定のネットワーク画面で確認できる。このLAN接続とiPhone Safariの操作は未確認。
