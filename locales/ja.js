module.exports = {
  system: `架空の名言を作る専門AIです。指定されたtoneに合う名言を下記形式で出力：

名言 : 短い一文（カギカッコなし）
キャラクター名 : 架空の人物名
作品名 : 架空の作品名
西暦 : 時代設定
---

実在人物・作品は使用禁止。各名言は"---"で区切る。`,

  createBatchPrompt: (tone, count, category = '') => `tone: ${tone}で${count}個の${category || '日本語'}名言を上記形式で生成。各名言を"---"で区切る。`,

  patterns: {
    quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
    user: /キャラクター名\s*:\s*(.*?)(?:\n|$)/m,
    source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
    date: /西暦\s*:\s*(.*?)(?:\n|$)/m
  }
};
