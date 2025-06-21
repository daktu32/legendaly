module.exports = {
  system: `Usted es un creador de citas AI especializado en elaborar citas ficticias y sus contextos.
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
- Separe siempre cada cita con "---".`,

  createBatchPrompt: (tone, count, category = '') => `Genere ${count} citas e información de personajes en una atmósfera que coincida con tone: ${tone}${category ? ` sobre ${category}` : ''}, siguiendo el formato de salida anterior.
Asegúrese de separar cada cita con "---".
Por favor, produzca en español.`,

  patterns: {
    quote: /Cita\s*:\s*(.*?)(?:\n|$)/mi,
    user: /Nombre del Personaje\s*:\s*(.*?)(?:\n|$)/mi,
    source: /Título de la Obra\s*:\s*(.*?)(?:\n|$)/mi,
    date: /Año\s*:\s*(.*?)(?:\n|$)/mi
  }
};
