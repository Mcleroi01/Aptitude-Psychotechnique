export const siteConfig = {
  name: "BCC Psychotechnique",
  shortName: "Psychotechnique",
  description:
    "Plateforme indépendante de préparation aux tests psychotechniques numériques : entraînement par catégorie, méthodes rapides et examens blancs chronométrés.",
  disclaimer:
    "Plateforme indépendante de préparation. Elle n'est ni affiliée, ni approuvée, ni gérée par la Banque Centrale du Congo.",
} as const;

/** Format de référence des examens blancs (modifiable depuis l'administration). */
export const DEFAULT_EXAM = {
  questionCount: 15,
  durationSeconds: 15 * 60,
} as const;
