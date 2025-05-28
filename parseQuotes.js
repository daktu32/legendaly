// Helper to parse quote blocks without side effects
function parseQuotesFromOutput(output, language) {
  const quoteBlocks = output.split(/\s*---\s*/).filter(block => block.trim() !== '');
  const parsed = [];

  const patterns = {
    ja: {
      quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
      user: /キャラクター名\s*:\s*(.*?)(?:\n|$)/m,
      source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
      date: /西暦\s*:\s*(.*?)(?:\n|$)/m
    },
    en: {
      quote: /Quote\s*:\s*(.*?)(?:\n|$)/mi,
      user: /Character Name\s*:\s*(.*?)(?:\n|$)/mi,
      source: /Work Title\s*:\s*(.*?)(?:\n|$)/mi,
      date: /Year\s*:\s*(.*?)(?:\n|$)/mi
    },
    zh: {
      quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
      user: /角色名\s*:\s*(.*?)(?:\n|$)/m,
      source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
      date: /年代\s*:\s*(.*?)(?:\n|$)/m
    },
    ko: {
      quote: /명언\s*:\s*(.*?)(?:\n|$)/m,
      user: /캐릭터 이름\s*:\s*(.*?)(?:\n|$)/m,
      source: /작품명\s*:\s*(.*?)(?:\n|$)/m,
      date: /연도\s*:\s*(.*?)(?:\n|$)/m
    },
    fr: {
      quote: /Citation\s*:\s*(.*?)(?:\n|$)/mi,
      user: /Nom du Personnage\s*:\s*(.*?)(?:\n|$)/mi,
      source: /Titre de l'Œuvre\s*:\s*(.*?)(?:\n|$)/mi,
      date: /Année\s*:\s*(.*?)(?:\n|$)/mi
    },
    es: {
      quote: /Cita\s*:\s*(.*?)(?:\n|$)/mi,
      user: /Nombre del Personaje\s*:\s*(.*?)(?:\n|$)/mi,
      source: /Título de la Obra\s*:\s*(.*?)(?:\n|$)/mi,
      date: /Año\s*:\s*(.*?)(?:\n|$)/mi
    },
    de: {
      quote: /Zitat\s*:\s*(.*?)(?:\n|$)/mi,
      user: /Charaktername\s*:\s*(.*?)(?:\n|$)/mi,
      source: /Werktitel\s*:\s*(.*?)(?:\n|$)/mi,
      date: /Jahr\s*:\s*(.*?)(?:\n|$)/mi
    }
  };

  for (const block of quoteBlocks) {
    let patternSet = patterns[language];
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

    if (!quoteMatch || !userMatch) {
      for (const lang in patterns) {
        patternSet = patterns[lang];
        quoteMatch = block.match(patternSet.quote);
        userMatch = block.match(patternSet.user);
        sourceMatch = block.match(patternSet.source);
        dateMatch = block.match(patternSet.date);
        if (quoteMatch && userMatch) {
          break;
        }
      }
    }

    if (quoteMatch) {
      parsed.push({
        quote: quoteMatch[1].trim(),
        user: userMatch ? userMatch[1].trim() : 'Unknown',
        source: sourceMatch ? sourceMatch[1].trim() : 'Unknown',
        date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0]
      });
    }
  }

  return parsed;
}

module.exports = parseQuotesFromOutput;
