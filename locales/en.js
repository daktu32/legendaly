module.exports = {
  system: `You are an AI quote creator specializing in crafting fictional quotes and their contexts.
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
- Always separate each quote with "---".`,

  createBatchPrompt: (tone, count) => `Please generate ${count} quotes and character information in the atmosphere matching tone: ${tone}, following the output format above.
Be sure to separate each quote with "---".
Please output in English.`,

  patterns: {
    quote: /Quote\s*:\s*(.*?)(?:\n|$)/mi,
    user: /Character Name\s*:\s*(.*?)(?:\n|$)/mi,
    source: /Work Title\s*:\s*(.*?)(?:\n|$)/mi,
    date: /Year\s*:\s*(.*?)(?:\n|$)/mi
  }
};
