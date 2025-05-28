const test = require('node:test');
const assert = require('node:assert');

const locales = {
  ja: require('../locales/ja'),
  en: require('../locales/en'),
  zh: require('../locales/zh'),
  ko: require('../locales/ko'),
  fr: require('../locales/fr'),
  es: require('../locales/es'),
  de: require('../locales/de')
};

const allPatterns = Object.fromEntries(
  Object.entries(locales).map(([k, v]) => [k, v.patterns])
);

function parseQuotes(output, language) {
  const quoteBlocks = output
    .trim()
    .split(/\s*---\s*/)
    .filter(block => block.trim() !== '');
  const quotes = [];

  for (const block of quoteBlocks) {
    let patternSet = allPatterns[language];
    let quoteMatch = null;
    let userMatch = null;
    let sourceMatch = null;
    let dateMatch = null;

    if (patternSet) {
      quoteMatch = block.match(patternSet.quote);
      userMatch = block.match(patternSet.user);
      sourceMatch = block.match(patternSet.source);
      dateMatch = block.match(patternSet.date);
    }

    if (!quoteMatch) {
      for (const lang in allPatterns) {
        patternSet = allPatterns[lang];
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
      const quote = quoteMatch[1].trim();
      const displayUser = userMatch ? userMatch[1].trim() : 'Unknown';
      const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
      const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
      quotes.push([
        `  --- ${quote}`,
        `     ${displayUser}『${source}』 ${date}`
      ]);
    }
  }

  return quotes;
}

const samples = {
  ja: {
    text: `名言 : 山があるから登るのだ\nキャラクター名 : 佐藤太郎\n作品名 : 山男伝\n西暦 : 1980`,
    expect: [[
      '  --- 山があるから登るのだ',
      '     佐藤太郎『山男伝』 1980'
    ]]
  },
  en: {
    text: `Quote : Seek the truth within\nCharacter Name : John Doe\nWork Title : Epic Adventures\nYear : 3021`,
    expect: [[
      '  --- Seek the truth within',
      '     John Doe『Epic Adventures』 3021'
    ]]
  },
  zh: {
    text: `名言 : 知識即力量\n角色名 : 李华\n作品名 : 未來編年史\n年代 : 2050`,
    expect: [[
      '  --- 知識即力量',
      '     李华『未來編年史』 2050'
    ]]
  },
  ko: {
    text: `명언 : 지혜는 힘이다\n캐릭터 이름 : 박지민\n작품명 : 미래 연대기\n연도 : 2045`,
    expect: [[
      '  --- 지혜는 힘이다',
      '     박지민『미래 연대기』 2045'
    ]]
  },
  fr: {
    text: `Citation : La connaissance est un pouvoir\nNom du Personnage : Jean Dupont\nTitre de l'Œuvre : Chroniques du Futur\nAnnée : 2100`,
    expect: [[
      '  --- La connaissance est un pouvoir',
      "     Jean Dupont『Chroniques du Futur』 2100"
    ]]
  },
  es: {
    text: `Cita : El conocimiento es poder\nNombre del Personaje : Juan Pérez\nTítulo de la Obra : Crónicas del Futuro\nAño : 2100`,
    expect: [[
      '  --- El conocimiento es poder',
      '     Juan Pérez『Crónicas del Futuro』 2100'
    ]]
  },
  de: {
    text: `Zitat : Wissen ist Macht\nCharaktername : Hans Müller\nWerktitel : Zukunftschroniken\nJahr : 2100`,
    expect: [[
      '  --- Wissen ist Macht',
      '     Hans Müller『Zukunftschroniken』 2100'
    ]]
  }
};

for (const [lang, { text, expect }] of Object.entries(samples)) {
  test(`parse sample output (${lang})`, () => {
    assert.deepStrictEqual(parseQuotes(text, lang), expect);
  });
}

// Ensure multiple blocks are split
const multi = `Quote : Knowledge is power\nCharacter Name : Alice\nWork Title : Future Chronicles\nYear : 2100\n---\nQuote : To live is to learn\nCharacter Name : Bob\nWork Title : Life Lessons\nYear : 2080`;

test('multiple blocks are parsed', () => {
  const result = parseQuotes(multi, 'en');
  assert.deepStrictEqual(result, [
    ['  --- Knowledge is power', '     Alice『Future Chronicles』 2100'],
    ['  --- To live is to learn', '     Bob『Life Lessons』 2080']
  ]);
});
