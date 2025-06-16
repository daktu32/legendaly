# Legendaly - 使い方ガイド

## はじめに

Legendalyは、ターミナル上で動作するAI駆動の名言生成ツールです。OpenAI GPT-4を使用して架空の名言を生成し、タイプライター風のアニメーションで表示します。名言は一定時間表示された後、フェードアウトし、次の名言に移ります。

## 基本的な使い方

```bash
# 基本実行
node legendaly.js

# グローバルインストール後の実行
legendaly
```

## 環境変数による設定

Legendalyは多数の環境変数を通じて動作をカスタマイズできます。`.env`ファイルを作成するか、コマンドライン実行時に指定します。

### 主要設定

| 環境変数 | 説明 | デフォルト値 |
|---------|------|-------------|
| `TONE` | 生成される名言の雰囲気 | `epic` |
| `MODEL` | 使用するOpenAIモデル（`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`） | `gpt-4o-mini` |
| `QUOTE_COUNT` | 起動時に取得する名言の数（1-1000） | `25` |
| `FETCH_INTERVAL` | 名言の表示間隔（秒）（1-300） | `1` |
| `LANGUAGE` | 出力言語 | `ja` |
| `OPENAI_CLIENT_PATH` | OpenAIクライアントモジュールへのパス | `~/.config/common/openaiClients.js` |

### 表示設定

| 環境変数 | 説明 | デフォルト値 |
|---------|------|-------------|
| `FIGLET_FONT` | タイトル表示に使用するASCIIアートフォント | `slant` |
| `TYPE_SPEED` | 文字表示速度（ミリ秒）（1-1000） | `40` |
| `DISPLAY_TIME` | 名言表示時間（ミリ秒）（100-60000） | `2000` |
| `FADE_STEPS` | フェードアウトのステップ数（1-50） | `8` |
| `FADE_DELAY` | フェードステップ間の遅延（ミリ秒）（10-5000） | `100` |

### 追加設定

| 環境変数 | 説明 | デフォルト値 |
|---------|------|-------------|
| `TONES` | カンマ区切りで複数トーンを組み合わせ | `epic` |
| `CATEGORY` | 名言のカテゴリを指定 | (空) |
| `USER_PROMPT` | 追加のカスタムプロンプト | (空) |
| `MIN_RATING` | 表示する最低評価（0-5） | `0` |
| `DISPLAY_STYLE` | 表示スタイル | `standard` |
| `AUDIO_FILE` | 再生する音声ファイル | (空) |
| `NOTIFY` | デスクトップ通知を有効化 (`true`/`false`) | `false` |
| `VISUAL_NOTIFY` | 端末上の視覚通知を有効化 (`true`/`false`) | `false` |
| `DISABLE_SOUND` | 通知音を無効化 (`true`/`false`) | `false` |
| `FLASH_SCREEN` | 通知時に画面を点滅 (`true`/`false`) | `false` |
| `INTERACTIVE` | 対話モードを有効にする (`true`/`false`) | `false` |
| `VERBOSE` | 詳細ログを表示 (`true`/`false`) | `false` |

**注意**: 範囲外の値を設定すると、警告メッセージが表示され、デフォルト値が使用されます。

## トーン設定

`TONE`環境変数で名言の雰囲気を変更できます：

- `epic`: 壮大で英雄的な名言（デフォルト）
- `cyberpunk`: サイバーパンク的な未来的名言（グリッチエフェクト付き）
- `mellow`: 穏やかで落ち着いた名言
- `retro`: レトロな雰囲気の名言
- `neon`: 鮮やかでネオン調の名言
- `zen`: 禅的で哲学的な名言

## 言語設定

`LANGUAGE`環境変数で出力言語を変更できます：

- `ja`: 日本語（デフォルト）
- `en`: 英語
- `zh`: 中国語
- `ko`: 韓国語
- `fr`: フランス語
- `es`: スペイン語
- `de`: ドイツ語

例：
```bash
# 英語で名言を生成
LANGUAGE=en node legendaly.js

# フランス語でサイバーパンク調の名言
LANGUAGE=fr TONE=cyberpunk node legendaly.js
```

言語リソースは `locales/` ディレクトリに整理されており、追加や修正は対応するファイルだけを編集すれば反映されます。

## OpenAIクライアント設定

`OPENAI_CLIENT_PATH` 環境変数で使用する OpenAI クライアントモジュールのパスを変更できます。
デフォルトは `~/.config/common/openaiClients.js` です。

## 表示フォント

`figlet -l`コマンドで利用可能なフォント一覧を確認できます。一部のおすすめフォント：

- `slant`: デフォルトのスラント体
- `big`: 大きなサイズの標準フォント
- `banner`: バナー風の大きなフォント
- `doom`: ゲーム風のフォント
- `standard`: 標準的なASCIIアート
- `small`: 小さめのフォント
- `mini`: 最小サイズのフォント

## 応用例

### サイバーパンク設定

```bash
TONE=cyberpunk FIGLET_FONT=doom TYPE_SPEED=20 node legendaly.js
```

### 禅モード（ゆっくりとした表示）

```bash
TONE=zen FIGLET_FONT=small TYPE_SPEED=80 DISPLAY_TIME=4000 FADE_STEPS=10 FADE_DELAY=150 node legendaly.js
```

### 名言ストリーム（高速切り替え）

```bash
QUOTE_COUNT=50 TYPE_SPEED=15 DISPLAY_TIME=1500 FETCH_INTERVAL=2 node legendaly.js
```

### インタラクティブモード
```bash
INTERACTIVE=true node legendaly.js
```
表示後に1～5を入力して評価したり、`f`キーでお気に入り登録ができます。

## 名言のログ

生成されたすべての名言は`legendaly.log`ファイルに記録されます：

```
[2077] ネオ・シルバーハンド『サイバーナイト2099』：「電子の海に溺れるとき、我々は真の自由を見つける」 (tone: cyberpunk, lang: ja, time: 2024-01-15T12:30:45.123Z)
[1692] エスメラルダ・ウィンドウォーカー『砂漠の預言者』：「砂の記憶は風よりも長く続く」 (tone: epic, lang: ja, time: 2024-01-15T12:30:48.456Z)
```

さらに、セッションごとの名言は`echoes/`ディレクトリに保存されます：
```
echoes/20240115123045123-cyberpunk-ja.echoes
```

### ログ管理機能

- **自動ログローテーション**: `legendaly.log`が10MBを超えると、タイムスタンプ付きでバックアップされます
- **自動クリーンアップ**: 30日以上経過したechoesファイルは起動時に自動削除されます
- **セッション管理**: 各実行セッションごとに独立したechoesファイルが作成されます

## API利用について

Legendalyは1回のAPI呼び出しで複数の名言を生成することで、API利用を効率化しています。`QUOTE_COUNT`を調整することで、API呼び出し頻度とコストを制御できます。

- 低い値（例：10）: 少ないAPI使用量、短時間実行向け
- 高い値（例：100）: 1回のAPI呼び出しで多くの名言を取得、長時間実行向け

### エラーハンドリング

Legendalyは堅牢なエラーハンドリング機能を備えています：

- **自動リトライ**: API呼び出しが失敗した場合、最大3回まで自動的にリトライします（指数バックオフ）
- **エラー別メッセージ**: 
  - ネットワーク接続エラー
  - APIキー認証エラー（401）
  - レート制限エラー（429）
  - その他の予期せぬエラー
- **グレースフルな継続**: エラーが発生しても、適切なメッセージを表示して動作を継続します

OpenAIのAPI使用量と料金については、[OpenAIの価格ページ](https://openai.com/pricing)を参照してください。 
