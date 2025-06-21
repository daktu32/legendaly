# Legendaly 日本語版 🧙‍♂️

![Legendaly](assets/banner.png)

**Legendaly** はターミナル上で動作する名言ジェネレーターです。OpenAI GPT-4 を利用し、架空のキャラクターのセリフを自動生成します。生成された名言はタイプライター風に表示され、徐々に霧のように消えていきます。

## 特徴

- AI によるキャラクター付き名言生成
- 複数の名言を一度に取得して効率化
- タイプライターアニメーションの速度調整
- 日本語の全角文字も美しくフェードアウト
- 表示間隔を設定してループ再生
- "cyberpunk" トーンではグリッチ演出
- テーマやフォントを自由に変更可能
- 生成中は洗練されたロードアニメーション
- 終了時に "To Be Continued..." メッセージ
- 7言語対応（`LANGUAGE` 変数で切替）
- 言語リソースは `locales/` フォルダに配置
- ログは `echoes/` ディレクトリに整理保存
- **NEW**: 設定値の自動検証と警告
- **NEW**: リトライ機能付きエラーハンドリング
- **NEW**: 10MB で自動ログローテーション、30日でクリーンアップ
- **NEW**: モジュール構造で保守性向上

## インストール

### グローバルインストール（推奨）

```bash
# npmからグローバルインストール
npm install -g legendaly

# またはソースからインストール
git clone https://github.com/yourusername/legendaly.git
cd legendaly
npm install
npm link
```

### ローカルインストール

```bash
# クローンしてインストール
git clone https://github.com/yourusername/legendaly.git
cd legendaly
npm install
```

### 必要要件

1. **Node.js**: バージョン 16.0.0 以上
2. **OpenAI API キー**: 名言生成に必須
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
3. **オプション依存関係**（ビジュアル効果の向上）:
   - **figlet**: ASCIIアートテキスト表示
     ```bash
     # macOS
     brew install figlet
     
     # Linux
     sudo apt-get install figlet
     ```
   - **lolcat**: 虹色テキスト
     ```bash
     gem install lolcat
     ```

## 使い方

![Demo](assets/demo.gif)

### グローバルインストールの場合
```bash
# 名言を生成
legendaly

# ヘルプを表示
legendaly --help

# インタラクティブモード
legendaly --interactive
```

### ローカルインストールの場合
```bash
node src/legendaly.js
```

`.env` ファイルを作成して下記の環境変数を設定するとカスタマイズできます。

### 主要設定
- `TONE` – 名言の雰囲気 (デフォルト: `epic`)
- `MODEL` – 使用する OpenAI モデル (デフォルト: `gpt-4o-mini`)
- `QUOTE_COUNT` – 起動時に取得する名言数 (デフォルト: `25`、1-1000)
- `FETCH_INTERVAL` – 名言の表示間隔秒数 (デフォルト: `1`、1-300)
- `LANGUAGE` – 出力言語 (デフォルト: `ja`)
- `OPENAI_CLIENT_PATH` – OpenAI クライアントへのパス

### 表示設定
- `FIGLET_FONT` – ヘッダーに使用するフォント (デフォルト: `slant`)
- `TYPE_SPEED` – 文字の表示速度ミリ秒 (デフォルト: `40`)
- `DISPLAY_TIME` – 名言を表示する時間ミリ秒 (デフォルト: `2000`)
- `FADE_STEPS` – フェードアウトのステップ数 (デフォルト: `8`)
- `FADE_DELAY` – フェード間の遅延ミリ秒 (デフォルト: `100`)

### 追加設定
- `TONES` – 複数トーンをカンマ区切りで指定
- `CATEGORY` – 名言のカテゴリを限定
- `USER_PROMPT` – 追加のプロンプト文
- `MIN_RATING` – 表示する最低評価 (デフォルト: `0`)
- `DISPLAY_STYLE` – 表示スタイルを変更
- `AUDIO_FILE` – 再生するサウンドファイル
- `NOTIFY` – デスクトップ通知を有効化 (`true`/`false`)
- `VISUAL_NOTIFY` – ターミナル通知を有効化 (`true`/`false`)
- `DISABLE_SOUND` – 通知音を無効化 (`true`/`false`)
- `FLASH_SCREEN` – 通知時に画面をフラッシュ (`true`/`false`)
- `INTERACTIVE` – 対話モードを有効にする
- `VERBOSE` – 詳細ログを出力

### 例
```bash
# 英語の禅モードで生成
LANGUAGE=en TONE=zen node legendaly.js
```

```bash
# サイバーパンクテーマ
TONE=cyberpunk FIGLET_FONT=banner3-D node legendaly.js
```

**注意**: 無効な設定値を入力すると警告が表示され、デフォルト値が使用されます。

## プロジェクト構成
```text
legendaly/
├── legendaly.js         # メインエントリ
├── config.js            # 設定管理
├── ui.js                # UIユーティリティ
├── lib/                 # ロジックや表示制御
├── locales/             # 言語リソース
├── echoes/              # セッションログ
└── test/                # テストスイート
```

## ログ管理
生成された名言は `legendaly.log` に追記され、`echoes/` にもセッション別ログが保存されます。サイズが10MBを超えると自動でローテーションされ、30日後に古いログが削除されます。

## ライセンス

MIT License
