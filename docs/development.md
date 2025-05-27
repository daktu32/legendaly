# Legendaly - 開発者ガイド

## アーキテクチャ概要

Legendalyは以下のコンポーネントで構成されています：

1. **設定管理**: 環境変数とデフォルト値の管理
2. **API連携**: OpenAI GPT-4との通信
3. **テキスト生成**: 複数の名言を一括生成
4. **表示エンジン**: タイプライター効果とフェードアウト処理
5. **メインループ**: 名言の循環表示

## コードの構成

```
legendaly.js             # メインスクリプト
package.json             # 依存関係と設定
.env                     # 環境変数（任意）
legendaly.log            # 生成された名言のログ
```

## 主要な関数

### `generateBatchQuotes(count)`

一度のAPI呼び出しで複数の名言を生成します。

```javascript
async function generateBatchQuotes(count) {
  // OpenAI APIを呼び出し、結果をパース
  // 各名言は "---" で区切られる
}
```

### `typeOut(lines, delay, topOffset)`

タイプライター風に文字を表示します。

```javascript
async function typeOut(lines, delay, topOffset) {
  // 1文字ずつ表示
  // サイバーパンクモードではグリッチ効果も適用
}
```

### `fadeOutFullwidth(lines, topOffset, steps, stepDelay)`

日本語の全角文字にも対応したフェードアウト効果を適用します。

```javascript
async function fadeOutFullwidth(lines, topOffset, steps, stepDelay) {
  // 文字を徐々に空白に置き換えて消していく
}
```

### `mainLoop()`

アプリケーションのメインループです。

```javascript
async function mainLoop() {
  // 最初に指定した数の名言を取得
  // 名言を循環表示
}
```

## カスタマイズガイド

### 新しいトーンの追加

`colorToneMap`オブジェクトに新しいトーンを追加できます：

```javascript
const colorToneMap = {
  existing_tone: '...',
  new_tone: '--freq=0.X --spread=Y.Z',
};
```

### プロンプトのカスタマイズ

システムロールとユーザープロンプトを修正することで、生成される名言の特性を変更できます：

```javascript
const role = `...`;
function createBatchPrompt(count) {
  return `...`;
}
```

### 出力フォーマットの変更

名言の表示形式やログ形式は以下の部分で変更できます：

```javascript
return [
  `  --- ${quote}`,
  `     　　${displayUser}『${source}』 ${date}`
];
```

## パフォーマンス最適化

### API使用量の最適化

- `QUOTE_COUNT`を適切な値に設定（推奨: 25〜100）
- 長時間実行する場合は大きな値を設定
- テスト時は小さな値を使用

### メモリ使用量

一度に多くの名言を取得すると、メモリ使用量が増加します。リソースの制約がある環境では、`QUOTE_COUNT`を小さくしてください。

## 依存関係

- **openai**: OpenAI API連携
- **dotenv**: 環境変数の管理
- **is-fullwidth-code-point**: 全角文字の判定
- **figlet**: ASCIIアート生成
- **lolcat**: カラフルなテキスト表示

## トラブルシューティング

### OpenAI API関連の問題

APIキーが正しく設定されていることを確認してください。また、APIのレート制限や使用量制限に注意してください。

### 表示の問題

ターミナルの文字コードや表示幅の設定によっては、フェードアウト効果が正しく表示されないことがあります。その場合は、`FADE_STEPS`や`FADE_DELAY`を調整してみてください。

### パフォーマンスの問題

多くの名言を取得すると起動時間が長くなることがあります。開発時は`QUOTE_COUNT`を小さくして起動を高速化できます。 