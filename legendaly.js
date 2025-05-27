#!/usr/bin/env node

const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
require('dotenv').config();
const openai = require(path.join(os.homedir(), '.config', 'common', 'openaiClients.js'));
const isFullwidth = require('is-fullwidth-code-point').default;

const tone = process.env.TONE || 'epic';
const interval = Number(process.env.FETCH_INTERVAL || 3);
const quoteCount = Number(process.env.QUOTE_COUNT || 100); // 取得する名言の数
const typeSpeed = Number(process.env.TYPE_SPEED || 40); // 文字表示の速度（ミリ秒）
const fadeSteps = Number(process.env.FADE_STEPS || 8); // フェードアウトのステップ数
const fadeDelay = Number(process.env.FADE_DELAY || 100); // フェードアウトの遅延時間（ミリ秒）
const displayTime = Number(process.env.DISPLAY_TIME || 2000); // 表示時間（ミリ秒）
const language = process.env.LANGUAGE || 'ja'; // 出力言語（デフォルトは日本語）
const colorToneMap = {
  cyberpunk: '--freq=0.9 --spread=2.5 --seed 42',
  mellow: '--freq=0.2 --spread=3.0',
  retro: '--freq=0.5 --spread=2.0',
  neon: '--freq=1.0 --spread=3.5',
  epic: '--freq=0.8 --spread=2.0 --seed 17',
  zen: '--freq=0.15 --spread=3.0',
  default: ''
};
const lolcatArgs = colorToneMap[tone] || '';
const figletFont = process.env.FIGLET_FONT || 'slant';
const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs}`;
const logPath = path.join(__dirname, 'legendaly.log');
const model = process.env.MODEL || "gpt-4o";

// 言語に応じたシステムロールを生成する関数
function createSystemRole() {
  const roleInstructions = {
    'ja': `
あなたは創作された名言とその文脈を専門に捏造する、AI名言作家です。
tone（雰囲気）に合った世界観・口調で、創作された複数の名言とその背景情報を作ってください。
各名言は以下の厳格な形式に従ってください：

名言 : （カギカッコなしの短い一文）
キャラクター名 : （名言を言った架空の人物の名前）
作品名 : （そのキャラクターが登場する架空の作品名）
西暦 : （作品の時代設定。tone と矛盾のない時代を使うこと）
---

注意点：
- 実在の人物や作品は使用しないでください。
- 「架空の」「発言者」などの説明的な語句は含めないでください。
- 名言にはカギカッコをつけないでください。
- 各名言の最後に必ず "---" を入れて区切ってください。
`,
    'en': `
You are an AI quote creator specializing in crafting fictional quotes and their contexts.
Create multiple quotes and their background information with the tone and world-view matching the specified tone.
Each quote should follow this strict format:

Quote : (a short sentence without quotation marks)
Character Name : (name of a fictional character who said the quote)
Work Title : (name of the fictional work where the character appears)
Year : (the time period setting of the work, consistent with the tone)
---

Notes:
- Do not use real people or works.
- Do not include explanatory phrases like "fictional" or "speaker".
- Do not use quotation marks for quotes.
- Always separate each quote with "---".
`,
    'zh': `
您是一位专门创作虚构名言及其背景的AI名言作家。
请按照指定的tone（氛围）创作多个名言及其背景信息，使其符合相应的世界观和语调。
每个名言必须遵循以下严格格式：

名言 : （不带引号的简短句子）
角色名 : （说出该名言的虚构人物名称）
作品名 : （该角色出现的虚构作品名称）
年代 : （作品的时代背景，与tone保持一致）
---

注意事项：
- 不要使用真实存在的人物或作品。
- 不要包含"虚构的"、"发言者"等解释性词语。
- 名言不要使用引号。
- 每个名言后必须使用"---"进行分隔。
`,
    'ko': `
당신은 허구의 명언과 그 맥락을 전문적으로 창작하는 AI 명언 작가입니다.
지정된 tone(분위기)에 맞는 세계관과 어조로 여러 명언과 그 배경 정보를 창작해 주세요.
각 명언은 다음과 같은 엄격한 형식을 따라야 합니다:

명언 : (따옴표 없는 짧은 문장)
캐릭터 이름 : (명언을 말한 허구의 인물 이름)
작품명 : (해당 캐릭터가 등장하는 허구의 작품명)
연도 : (작품의 시대 설정, tone과 일치하도록)
---

주의사항:
- 실존하는 인물이나 작품을 사용하지 마세요.
- "허구의", "화자" 등의 설명적 어구를 포함하지 마세요.
- 명언에 따옴표를 사용하지 마세요.
- 각 명언 뒤에 반드시 "---"로 구분해 주세요.
`,
    'fr': `
Vous êtes un créateur de citations AI spécialisé dans l'élaboration de citations fictives et de leurs contextes.
Créez plusieurs citations et leurs informations de fond avec le ton et la vision du monde correspondant au tone spécifié.
Chaque citation doit suivre ce format strict:

Citation : (une phrase courte sans guillemets)
Nom du Personnage : (nom d'un personnage fictif qui a dit la citation)
Titre de l'Œuvre : (nom de l'œuvre fictive où apparaît le personnage)
Année : (la période temporelle de l'œuvre, cohérente avec le ton)
---

Remarques:
- N'utilisez pas de personnes ou d'œuvres réelles.
- N'incluez pas de phrases explicatives comme "fictif" ou "locuteur".
- N'utilisez pas de guillemets pour les citations.
- Séparez toujours chaque citation par "---".
`,
    'es': `
Usted es un creador de citas AI especializado en elaborar citas ficticias y sus contextos.
Cree múltiples citas y su información de fondo con el tono y la visión del mundo que coincida con el tone especificado.
Cada cita debe seguir este formato estricto:

Cita : (una frase corta sin comillas)
Nombre del Personaje : (nombre de un personaje ficticio que dijo la cita)
Título de la Obra : (nombre de la obra ficticia donde aparece el personaje)
Año : (el período de tiempo de la obra, coherente con el tono)
---

Notas:
- No use personas u obras reales.
- No incluya frases explicativas como "ficticio" o "hablante".
- No use comillas para las citas.
- Separe siempre cada cita con "---".
`,
    'de': `
Sie sind ein KI-Zitat-Ersteller, der sich auf die Erstellung fiktiver Zitate und deren Kontexte spezialisiert hat.
Erstellen Sie mehrere Zitate und deren Hintergrundinformationen mit dem Ton und der Weltanschauung, die dem angegebenen tone entsprechen.
Jedes Zitat sollte diesem strengen Format folgen:

Zitat : (ein kurzer Satz ohne Anführungszeichen)
Charaktername : (Name einer fiktiven Figur, die das Zitat gesagt hat)
Werktitel : (Name des fiktiven Werks, in dem die Figur vorkommt)
Jahr : (die zeitliche Einordnung des Werks, konsistent mit dem Ton)
---

Hinweise:
- Verwenden Sie keine realen Personen oder Werke.
- Verwenden Sie keine erklärenden Phrasen wie "fiktiv" oder "Sprecher".
- Verwenden Sie keine Anführungszeichen für Zitate.
- Trennen Sie jedes Zitat immer mit "---".
`
  };
  
  // 指定された言語のロールがある場合はそれを使用、なければデフォルト（日本語）を使用
  return roleInstructions[language] || roleInstructions['ja'];
}

// システムロールを言語に応じて生成
const role = createSystemRole();

// 複数の名言を一度に生成するプロンプト
function createBatchPrompt(count) {
  const langInstructions = {
    'ja': `tone: ${tone} に合う雰囲気で、上記の出力形式に沿って ${count} 個の名言とキャラクター情報を生成してください。
各名言の最後に必ず "---" を入れて区切ってください。
言語は日本語で出力してください。`,
    'en': `Please generate ${count} quotes and character information in the atmosphere matching tone: ${tone}, following the output format above.
Be sure to separate each quote with "---".
Please output in English.`,
    'zh': `请按照符合tone: ${tone}的氛围，按照上述输出格式生成${count}个名言和角色信息。
请确保每个名言后面都有 "---" 作为分隔符。
请用中文输出。`,
    'ko': `tone: ${tone}에 맞는 분위기로, 위의 출력 형식에 따라 ${count}개의 명언과 캐릭터 정보를 생성해 주세요.
각 명언 뒤에 반드시 "---"를 넣어 구분해 주세요.
한국어로 출력해 주세요.`,
    'fr': `Générez ${count} citations et informations sur les personnages dans une atmosphère correspondant au tone: ${tone}, en suivant le format de sortie ci-dessus.
Assurez-vous de séparer chaque citation par "---".
Veuillez produire en français.`,
    'es': `Genere ${count} citas e información de personajes en una atmósfera que coincida con tone: ${tone}, siguiendo el formato de salida anterior.
Asegúrese de separar cada cita con "---".
Por favor, produzca en español.`,
    'de': `Bitte generieren Sie ${count} Zitate und Charakterinformationen in einer Atmosphäre, die zu tone: ${tone} passt, gemäß dem obigen Ausgabeformat.
Achten Sie darauf, jedes Zitat mit "---" zu trennen.
Bitte in Deutsch ausgeben.`,
  };

  // 指定された言語のプロンプトがある場合はそれを使用、なければデフォルト（日本語）を使用
  return langInstructions[language] || langInstructions['ja'];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function glitchText(text, intensity = 0.2) {
  const noiseChars = ['#', '%', '*', 'ﾐ', 'ﾅ', 'ｱ', 'ﾓ'];
  return text.split('').map(char =>
    Math.random() < intensity ? noiseChars[Math.floor(Math.random() * noiseChars.length)] : char
  ).join('');
}

async function typeOut(lines, delay = 40, topOffset = 9) {
  // linesがundefinedの場合は空の配列に設定
  if (!lines) {
    console.error('Warning: Tried to display undefined lines');
    lines = [
      '  --- Error: Unable to parse quote properly',
      '     　　System『Legendaly』 ' + new Date().toISOString().split("T")[0]
    ];
  }

  // 表示領域をクリア
  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }

  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    if (tone === 'cyberpunk') {
      for (let f = 0; f < 3; f++) {
        readline.cursorTo(process.stdout, 0, topOffset + i);
        process.stdout.write(glitchText(line));
        await sleep(80);
      }
    }

    for (const char of line) {
      process.stdout.write(char);
      await sleep(delay);
    }
  }
}

async function fadeOutFullwidth(lines, topOffset = 9, steps = 6, stepDelay = 120) {
  // linesがundefinedの場合は空の配列に設定
  if (!lines) {
    console.error('Warning: Tried to fade undefined lines');
    return;
  }
  
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        const fade = Math.random() < step / steps;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay);
  }
  
  // 最後に完全に消去するための処理を追加
  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }
}

// 1回のAPI呼び出しで複数の名言をまとめて生成
async function generateBatchQuotes(count) {
  try {
    const res = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: role },
        { role: "user", content: createBatchPrompt(count) }
      ]
    });

    const output = res.choices[0].message.content.trim();
    
    // 出力を "---" で分割して複数の名言に分ける
    const quoteBlocks = output.split(/\s*---\s*/).filter(block => block.trim() !== '');
    const quotes = [];
    
    for (const block of quoteBlocks) {
      // 各言語のフォーマットに対応するための正規表現パターン
      const patterns = {
        // 日本語パターン
        ja: {
          quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
          user: /キャラクター名\s*:\s*(.*?)(?:\n|$)/m,
          source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
          date: /西暦\s*:\s*(.*?)(?:\n|$)/m
        },
        // 英語パターン
        en: {
          quote: /Quote\s*:\s*(.*?)(?:\n|$)/mi,
          user: /Character Name\s*:\s*(.*?)(?:\n|$)/mi,
          source: /Work Title\s*:\s*(.*?)(?:\n|$)/mi,
          date: /Year\s*:\s*(.*?)(?:\n|$)/mi
        },
        // 中国語パターン
        zh: {
          quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
          user: /角色名\s*:\s*(.*?)(?:\n|$)/m,
          source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
          date: /年代\s*:\s*(.*?)(?:\n|$)/m
        },
        // 韓国語パターン
        ko: {
          quote: /명언\s*:\s*(.*?)(?:\n|$)/m,
          user: /캐릭터 이름\s*:\s*(.*?)(?:\n|$)/m,
          source: /작품명\s*:\s*(.*?)(?:\n|$)/m,
          date: /연도\s*:\s*(.*?)(?:\n|$)/m
        },
        // フランス語パターン
        fr: {
          quote: /Citation\s*:\s*(.*?)(?:\n|$)/mi,
          user: /Nom du Personnage\s*:\s*(.*?)(?:\n|$)/mi,
          source: /Titre de l['']Œuvre\s*:\s*(.*?)(?:\n|$)/mi,
          date: /Année\s*:\s*(.*?)(?:\n|$)/mi
        },
        // スペイン語パターン
        es: {
          quote: /Cita\s*:\s*(.*?)(?:\n|$)/mi,
          user: /Nombre del Personaje\s*:\s*(.*?)(?:\n|$)/mi,
          source: /Título de la Obra\s*:\s*(.*?)(?:\n|$)/mi,
          date: /Año\s*:\s*(.*?)(?:\n|$)/mi
        },
        // ドイツ語パターン
        de: {
          quote: /Zitat\s*:\s*(.*?)(?:\n|$)/mi,
          user: /Charaktername\s*:\s*(.*?)(?:\n|$)/mi,
          source: /Werktitel\s*:\s*(.*?)(?:\n|$)/mi,
          date: /Jahr\s*:\s*(.*?)(?:\n|$)/mi
        }
      };
      
      // 選択された言語のパターンを使用（見つからない場合は全パターンを試す）
      let patternSet = patterns[language];
      let quoteMatch = null;
      let userMatch = null;
      let sourceMatch = null;
      let dateMatch = null;
      
      // 選択された言語のパターンで検索
      if (patternSet) {
        quoteMatch = block.match(patternSet.quote);
        userMatch = block.match(patternSet.user);
        sourceMatch = block.match(patternSet.source);
        dateMatch = block.match(patternSet.date);
      }
      
      // 見つからなかった場合は、全言語のパターンを試す
      if (!quoteMatch) {
        for (const lang in patterns) {
          patternSet = patterns[lang];
          quoteMatch = block.match(patternSet.quote);
          if (quoteMatch) {
            userMatch = block.match(patternSet.user);
            sourceMatch = block.match(patternSet.source);
            dateMatch = block.match(patternSet.date);
            break;
          }
        }
      }

      if (quoteMatch) {
        const quote = quoteMatch ? quoteMatch[1].trim() : '（名言取得失敗）';
        const displayUser = userMatch ? userMatch[1].trim() : 'Unknown';
        const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
        const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];

        const logLine = `[${date}] ${displayUser}『${source}』：「${quote}」\n`;
        fs.appendFileSync(logPath, logLine);

        quotes.push([
          `  --- ${quote}`,
          `     　　${displayUser}『${source}』 ${date}`
        ]);
      }
    }
    
    return quotes;
    
  } catch (err) {
    console.error('OpenAI API request failed:', err);
    // エラー時は少なくとも1つのダミー名言を返す
    return [
      [
        '  --- Error fetching quotes',
        `     　　Unknown『Unknown』 ${new Date().toISOString().split("T")[0]}`
      ]
    ];
  }
}

// 複数の名言を一度に生成する関数（互換性のため残す）
async function generateMultipleQuotes(count) {
  // バッチ処理で一度に取得
  return generateBatchQuotes(Math.min(count, 25)); // APIの制限を考慮して上限を設ける
}

async function mainLoop() {
  console.clear();
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Creating mystical wisdom with AI...\n\n");

  const topOffset = 9;
  
  // 名言取得開始のメッセージを表示
  console.log(`Fetching ${Math.min(quoteCount, 25)} quotes in a single request...`);
  
  // 最初に指定した件数分の名言を一気に取得
  const allQuotes = await generateBatchQuotes(Math.min(quoteCount, 25)); // APIの制限を考慮して上限を設ける
  
  // 取得完了後、画面をクリアして再度タイトルを表示
  console.clear();
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Creating mystical wisdom with AI...\n\n");
  
  // 取得した名言をループして表示
  let quoteIndex = 0;
  
  while (true) {
    // 表示エリアをクリア
    for (let i = 0; i < 5; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    const currentQuote = allQuotes[quoteIndex];
    await typeOut(currentQuote, typeSpeed, topOffset);
    await sleep(displayTime);
    await fadeOutFullwidth(currentQuote, topOffset, fadeSteps, fadeDelay);
    
    // 次の名言へ
    quoteIndex = (quoteIndex + 1) % allQuotes.length;
    
    await sleep(interval * 1000);
  }
}

mainLoop();
