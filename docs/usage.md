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
| `MODEL` | 使用するOpenAIモデル | `gpt-4o` |
| `QUOTE_COUNT` | 起動時に取得する名言の数 | `100` |
| `FETCH_INTERVAL` | 名言の表示間隔（秒） | `3` |

### 表示設定

| 環境変数 | 説明 | デフォルト値 |
|---------|------|-------------|
| `FIGLET_FONT` | タイトル表示に使用するASCIIアートフォント | `slant` |
| `TYPE_SPEED` | 文字表示速度（ミリ秒） | `40` |
| `DISPLAY_TIME` | 名言表示時間（ミリ秒） | `2000` |
| `FADE_STEPS` | フェードアウトのステップ数 | `8` |
| `FADE_DELAY` | フェードステップ間の遅延（ミリ秒） | `100` |

## トーン設定

`TONE`環境変数で名言の雰囲気を変更できます：

- `epic`: 壮大で英雄的な名言（デフォルト）
- `cyberpunk`: サイバーパンク的な未来的名言（グリッチエフェクト付き）
- `mellow`: 穏やかで落ち着いた名言
- `retro`: レトロな雰囲気の名言
- `neon`: 鮮やかでネオン調の名言
- `zen`: 禅的で哲学的な名言

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

## 名言のログ

生成されたすべての名言は`legendaly.log`ファイルに記録されます：

```
[2077] ネオ・シルバーハンド『サイバーナイト2099』：「電子の海に溺れるとき、我々は真の自由を見つける」
[1692] エスメラルダ・ウィンドウォーカー『砂漠の預言者』：「砂の記憶は風よりも長く続く」
```

## API利用について

Legendalyは1回のAPI呼び出しで複数の名言を生成することで、API利用を効率化しています。`QUOTE_COUNT`を調整することで、API呼び出し頻度とコストを制御できます。

- 低い値（例：10）: 少ないAPI使用量、短時間実行向け
- 高い値（例：100）: 1回のAPI呼び出しで多くの名言を取得、長時間実行向け

OpenAIのAPI使用量と料金については、[OpenAIの価格ページ](https://openai.com/pricing)を参照してください。 