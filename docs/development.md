# Legendaly - 開発者ガイド

## アーキテクチャ概要

Legendalyは以下のコンポーネントで構成されています：

1. **設定管理**: `config.js`による環境変数の集中管理とバリデーション
2. **API連携**: OpenAI GPT-4との通信（自動リトライ機能付き）
3. **テキスト生成**: `lib/quotes.js`による複数の名言を一括生成
4. **表示エンジン**: `lib/animation.js`によるタイプライター効果とフェードアウト処理
5. **ログ管理**: `lib/logger.js`によるログローテーションと自動クリーンアップ
6. **メインループ**: 名言の循環表示とエラーハンドリング

## コードの構成

```
legendaly.js             # メインエントリーポイント
config.js                # 設定管理とバリデーション
ui.js                    # UIユーティリティ関数
lib/
  ├── quotes.js          # 名言生成ロジック（リトライ機能付き）
  ├── logger.js          # ログ管理（ローテーション、クリーンアップ）
  └── animation.js       # アニメーション表示処理
locales/                 # 言語リソース
echoes/                  # セッション別の名言ログ
test/                    # テストスイート
  ├── config.test.js     # 設定バリデーションのテスト
  ├── quotes.test.js     # 名言生成とエラーハンドリングのテスト
  └── logger.test.js     # ログ管理機能のテスト
```

## 主要な関数

### 設定管理（config.js）

#### `validateNumber(value, min, max, defaultValue, name)`
数値型の環境変数をバリデーションします。

```javascript
function validateNumber(value, min, max, defaultValue, name) {
  // 数値チェックと範囲チェック
  // 無効な値の場合は警告を表示してデフォルト値を返す
}
```

#### `validateString(value, allowedValues, defaultValue, name)`
文字列型の環境変数をバリデーションします。

```javascript
function validateString(value, allowedValues, defaultValue, name) {
  // 許可された値のリストと照合
  // 無効な値の場合は警告を表示してデフォルト値を返す
}
```

### 名言生成（lib/quotes.js）

#### `callOpenAIWithRetry(openai, model, messages, maxRetries, initialDelay)`
API呼び出しを自動リトライ機能付きで実行します。

```javascript
async function callOpenAIWithRetry(openai, model, messages, maxRetries = 3, initialDelay = 1000) {
  // 指数バックオフでリトライ
  // 401, 403エラーはリトライしない
}
```

#### `generateBatchQuotes(openai, model, role, createBatchPrompt, allPatterns, language, tone, logPath, echoesPath, count)`
一度のAPI呼び出しで複数の名言を生成します。

```javascript
async function generateBatchQuotes(...) {
  // OpenAI APIを呼び出し、結果をパース
  // 各名言は "---" で区切られる
  // エラー時は適切なメッセージを返す
}
```

### ログ管理（lib/logger.js）

#### `rotateLogIfNeeded(logPath, maxSizeBytes)`
ログファイルのサイズをチェックし、必要に応じてローテーションします。

```javascript
function rotateLogIfNeeded(logPath, maxSizeBytes = 10 * 1024 * 1024) {
  // 10MBを超えたらタイムスタンプ付きでバックアップ
}
```

#### `cleanOldLogs(logDir, daysToKeep)`
古いログファイルを自動削除します。

```javascript
function cleanOldLogs(logDir, daysToKeep = 30) {
  // 30日以上経過したファイルを削除
}
```

### アニメーション表示（lib/animation.js）

#### `displayHeader(figletFont, lolcatArgs)`
タイトルヘッダーを表示します。

#### `displayQuoteLoop(quotes, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, topOffset)`
名言を循環表示するメインループです。

#### `setupSignalHandlers(showCursor)`
Ctrl+Cなどのシグナルハンドリングを設定します。

## エラーハンドリング

### API呼び出しのエラー処理

Legendalyは以下のエラーを適切に処理します：

1. **ネットワークエラー** (ENOTFOUND, ECONNREFUSED)
   - メッセージ: "ネットワーク接続を確認してください"

2. **認証エラー** (401)
   - メッセージ: "OpenAI APIキーを確認してください"
   - リトライなし

3. **レート制限** (429)
   - メッセージ: "APIレート制限に達しました"
   - 自動リトライあり

4. **その他のエラー**
   - メッセージ: "予期せぬエラーが発生しました"
   - 自動リトライあり

### プロセス終了時の処理

- カーソルの表示を確実に復元
- "To Be Continued..." メッセージの表示
- リソースの適切なクリーンアップ

## カスタマイズガイド

### 新しいトーンの追加

1. `config.js`の`colorToneMap`に新しいトーンを追加：
```javascript
const colorToneMap = {
  existing_tone: '...',
  new_tone: '--freq=0.X --spread=Y.Z',
};
```

2. `config.js`の`supportedTones`配列に追加：
```javascript
const supportedTones = ['epic', 'cyberpunk', ..., 'new_tone'];
```

### 新しい言語の追加

1. `locales/`ディレクトリに新しい言語ファイルを作成
2. 必要なパターンとプロンプトを定義
3. `config.js`の`supportedLanguages`に追加

### プロンプトのカスタマイズ

各言語ファイルの`system`と`createBatchPrompt`を修正：

```javascript
module.exports = {
  system: `カスタムシステムプロンプト...`,
  createBatchPrompt: (tone, count) => `カスタムユーザープロンプト...`,
  patterns: { ... }
};
```

## パフォーマンス最適化

### API使用量の最適化

- `QUOTE_COUNT`を適切な値に設定（推奨: 25〜100）
- 長時間実行する場合は大きな値を設定
- テスト時は小さな値を使用

### メモリ使用量

- 一度に多くの名言を取得すると、メモリ使用量が増加
- リソースの制約がある環境では、`QUOTE_COUNT`を小さく設定
- ログローテーション機能により、ログファイルの肥大化を防止

## 依存関係

- **openai**: OpenAI API連携
- **dotenv**: 環境変数の管理
- **is-fullwidth-code-point**: 全角文字の判定
- **figlet**: ASCIIアート生成（外部コマンド）
- **lolcat**: カラフルなテキスト表示（外部コマンド）

## テスト

```bash
npm test
```

テストカバレッジ：
- 設定バリデーション
- API呼び出しとリトライロジック
- エラーハンドリング
- ログ管理機能
- 各言語のパース処理

## トラブルシューティング

### 設定値バリデーションエラー

無効な設定値を指定した場合、警告メッセージが表示されデフォルト値が使用されます。
有効な値の範囲はREADMEまたは`docs/usage.md`を参照してください。

### OpenAI API関連の問題

1. APIキーが正しく設定されていることを確認
2. APIのレート制限や使用量制限に注意
3. ネットワーク接続を確認
4. 自動リトライが機能しているか確認（最大3回）

### 表示の問題

ターミナルの文字コードや表示幅の設定によっては、フェードアウト効果が正しく表示されないことがあります：
- `FADE_STEPS`や`FADE_DELAY`を調整
- ターミナルのフォント設定を確認
- Unicode対応を確認

### ログファイルの問題

- `legendaly.log`が10MBを超えると自動的にローテーション
- 30日以上古いechoesファイルは自動削除
- 手動でクリーンアップする場合は`echoes/`ディレクトリを確認

### パフォーマンスの問題

- 多くの名言を取得すると起動時間が長くなる
- 開発時は`QUOTE_COUNT`を小さく（例: 10）設定
- API呼び出しのタイムアウトは自動リトライで対処