# Legendaly Demo Recording Guide

このガイドでは、Legendalyのターミナル出力をGIFアニメーションとして録画し、READMEに埋め込む方法を説明します。

## 必要なツール

- `asciinema`: ターミナルセッションの録画
- `agg`: asciinema録画をGIFに変換

両方とも既にインストール済みです。

## 録画方法

### 方法1: 自動録画スクリプト使用

```bash
./scripts/record_demos.sh
```

このスクリプトは以下のデモを録画できます：
1. 基本的な日本語デモ（デフォルト設定）
2. 英語禅モード
3. サイバーパンクテーマ
4. 高速タイピング + カスタムフォント
5. 複数トーン組み合わせ
6. 全てのデモ

### 方法2: クイック録画

```bash
./scripts/quick_record.sh [出力名] [秒数] [環境変数...]
```

例：
```bash
# 基本録画（15秒）
./scripts/quick_record.sh my_demo 15

# 英語禅モード（20秒）
./scripts/quick_record.sh en_zen_demo 20 LANGUAGE=en TONE=zen

# サイバーパンクテーマ（25秒）
./scripts/quick_record.sh cyberpunk_demo 25 TONE=cyberpunk FIGLET_FONT=banner3-D
```

### 方法3: 手動録画

```bash
# 録画開始
asciinema rec assets/my_demo.cast

# Legendalyを実行（別ターミナルまたは同じターミナルで）
node legendaly.js

# 録画停止（Ctrl+C）

# GIFに変換
agg --theme monokai --font-size 14 --cols 100 --rows 25 assets/my_demo.cast assets/my_demo.gif

# 中間ファイル削除
rm assets/my_demo.cast
```

## GIF設定の調整

`agg`コマンドのオプション：

- `--theme`: カラーテーマ（monokai, dracula, solarized-dark等）
- `--font-size`: フォントサイズ（12-18推奨）
- `--cols`: 列数（80-120推奨）
- `--rows`: 行数（20-30推奨）
- `--speed`: 再生速度（0.5-2.0）

## README更新

### 英語版 README.md

現在の`![Demo](assets/demo.gif)`を以下のように更新：

```markdown
## Usage

![Basic Demo](assets/demo_basic_ja.gif)

```bash
node legendaly.js
```

### Examples

```bash
# Generate quotes in English with a zen atmosphere
LANGUAGE=en TONE=zen node legendaly.js
```

![English Zen Demo](assets/demo_en_zen.gif)

```bash
# Use cyberpunk theme with futuristic fonts
TONE=cyberpunk FIGLET_FONT=banner3-D node legendaly.js
```

![Cyberpunk Demo](assets/demo_cyberpunk.gif)
```

### 日本語版 README_ja.md

現在の`![Demo](assets/demo.gif)`を以下のように更新：

```markdown
## 使い方

![基本デモ](assets/demo_basic_ja.gif)

```bash
node legendaly.js
```

### 例

```bash
# 英語の禅モードで生成
LANGUAGE=en TONE=zen node legendaly.js
```

![英語禅モードデモ](assets/demo_en_zen.gif)

```bash
# サイバーパンクテーマ
TONE=cyberpunk FIGLET_FONT=banner3-D node legendaly.js
```

![サイバーパンクデモ](assets/demo_cyberpunk.gif)
```

## 推奨デモシナリオ

1. **基本デモ** (`demo_basic_ja.gif`): デフォルト設定、15秒
2. **英語禅モード** (`demo_en_zen.gif`): `LANGUAGE=en TONE=zen`、15秒
3. **サイバーパンク** (`demo_cyberpunk.gif`): `TONE=cyberpunk FIGLET_FONT=banner3-D`、15秒
4. **高速タイピング** (`demo_fast_typing.gif`): `TYPE_SPEED=10 FADE_STEPS=12`、15秒
5. **マルチトーン** (`demo_multi_tone.gif`): `TONES=epic,zen LANGUAGE=en`、15秒

## ファイルサイズ最適化

GIFファイルが大きすぎる場合：

1. 録画時間を短縮（10-15秒推奨）
2. フレームレートを下げる（`--speed 0.8`）
3. 解像度を下げる（`--cols 80 --rows 20`）
4. 外部ツールで圧縮（gifsicle等）

```bash
# gifsicleでの圧縮例
brew install gifsicle
gifsicle -O3 --colors 256 input.gif -o output.gif
```

## トラブルシューティング

### 録画が開始されない
- OpenAI API キーが設定されているか確認
- `~/.config/common/openaiClients.js`が存在するか確認

### GIFが大きすぎる
- 録画時間を短縮
- 解像度を下げる
- 圧縮ツールを使用

### 文字が読みにくい
- フォントサイズを上げる（`--font-size 16`）
- テーマを変更（`--theme solarized-light`）
- 背景色を調整
