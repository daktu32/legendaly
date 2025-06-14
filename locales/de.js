module.exports = {
  system: `Sie sind ein KI-Zitat-Ersteller, der sich auf die Erstellung fiktiver Zitate und deren Kontexte spezialisiert hat.
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
- Trennen Sie jedes Zitat immer mit "---".`,

  createBatchPrompt: (tone, count, category = '') => `Bitte generieren Sie ${count} Zitate und Charakterinformationen in einer Atmosphäre, die zu tone: ${tone}${category ? ` zum Thema ${category}` : ''} passt, gemäß dem obigen Ausgabeformat.
Achten Sie darauf, jedes Zitat mit "---" zu trennen.
Bitte in Deutsch ausgeben.`,

  patterns: {
    quote: /Zitat\s*:\s*(.*?)(?:\n|$)/mi,
    user: /Charaktername\s*:\s*(.*?)(?:\n|$)/mi,
    source: /Werktitel\s*:\s*(.*?)(?:\n|$)/mi,
    date: /Jahr\s*:\s*(.*?)(?:\n|$)/mi
  }
};
