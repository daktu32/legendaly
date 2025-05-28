module.exports = {
  system: `Vous êtes un créateur de citations AI spécialisé dans l'élaboration de citations fictives et de leurs contextes.
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
- Séparez toujours chaque citation par "---".`,

  createBatchPrompt: (tone, count) => `Générez ${count} citations et informations sur les personnages dans une atmosphère correspondant au tone: ${tone}, en suivant le format de sortie ci-dessus.
Assurez-vous de séparer chaque citation par "---".
Veuillez produire en français.`,

  patterns: {
    quote: /Citation\s*:\s*(.*?)(?:\n|$)/mi,
    user: /Nom du Personnage\s*:\s*(.*?)(?:\n|$)/mi,
    source: /Titre de l['']Œuvre\s*:\s*(.*?)(?:\n|$)/mi,
    date: /Année\s*:\s*(.*?)(?:\n|$)/mi
  }
};
