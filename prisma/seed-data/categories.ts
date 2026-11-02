export type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  recognitionGuide: string;
  timeManagement: string;
  icon: string;
};

export const categories: CategorySeed[] = [
  {
    name: "Suites numériques",
    slug: "suites-numeriques",
    description: "Trouver le terme manquant ou suivant d'une suite logique de nombres.",
    recognitionGuide:
      "Une liste de nombres avec un terme inconnu. Calculez d'abord les différences entre termes consécutifs ; si elles ne sont pas constantes, calculez les différences secondes ou les rapports.",
    timeManagement: "Visez 30 à 45 s. Si aucun motif n'apparaît après deux essais (différences, rapports), passez et revenez-y.",
    icon: "list-ordered",
  },
  {
    name: "Calcul mental",
    slug: "calcul-mental",
    description: "Opérations rapides sans calculatrice : multiplications, divisions, carrés, décompositions.",
    recognitionGuide:
      "Une opération directe. Cherchez une décomposition simple (×25 = ×100 ÷ 4, ×9 = ×10 − 1) avant de poser le calcul.",
    timeManagement: "Visez 20 à 30 s. Estimez l'ordre de grandeur pour éliminer les réponses impossibles.",
    icon: "brain",
  },
  {
    name: "Raisonnement logique numérique",
    slug: "raisonnement-logique",
    description: "Divisibilité, restes, parité, déductions sur des nombres.",
    recognitionGuide:
      "Des conditions sur un nombre (« reste de », « divisible par », « plus petit entier tel que »). Testez les choix proposés plutôt que de résoudre de façon générale.",
    timeManagement: "Visez 45 s. Tester les réponses une à une est souvent le plus rapide.",
    icon: "puzzle",
  },
  {
    name: "Pourcentages",
    slug: "pourcentages",
    description: "Augmentations, réductions, taux successifs, part d'un total.",
    recognitionGuide:
      "Les mots « augmente de », « baisse de », « % de ». Transformez en coefficient multiplicateur : +15 % → ×1,15 ; −20 % → ×0,8.",
    timeManagement: "Visez 30 à 45 s. Calculez 10 % puis ajustez (5 % = moitié de 10 %).",
    icon: "percent",
  },
  {
    name: "Fractions",
    slug: "fractions",
    description: "Simplification, comparaison et opérations sur les fractions.",
    recognitionGuide:
      "Des parts d'un tout (« les 2/3 de », « il reste le quart »). Ramenez au même dénominateur ou raisonnez sur une quantité de référence.",
    timeManagement: "Visez 45 s. Choisissez une quantité totale pratique (multiple des dénominateurs).",
    icon: "divide",
  },
  {
    name: "Proportions et règle de trois",
    slug: "proportions",
    description: "Proportionnalité simple et composée, prix unitaires, rendements.",
    recognitionGuide:
      "« Au même prix », « à rendement constant », « en combien de temps ». Identifiez si les grandeurs varient dans le même sens (directe) ou en sens inverse.",
    timeManagement: "Visez 45 à 60 s. Passez par l'unité (1 article, 1 machine, 1 heure).",
    icon: "scale",
  },
  {
    name: "Comparaisons numériques",
    slug: "comparaisons",
    description: "Comparer et ordonner des nombres, fractions, décimaux et pourcentages.",
    recognitionGuide:
      "« Quel est le plus grand », « classez ». Convertissez tout dans une même forme (décimal ou pourcentage).",
    timeManagement: "Visez 30 s. Une approximation suffit souvent à départager.",
    icon: "arrow-up-down",
  },
  {
    name: "Problèmes mathématiques",
    slug: "problemes",
    description: "Vitesses, intérêts, âges, partages : problèmes concrets en plusieurs étapes.",
    recognitionGuide:
      "Un énoncé concret avec plusieurs données. Écrivez la formule utile (d = v × t, I = C × t × n) avant de calculer.",
    timeManagement: "Visez 60 s. Posez la formule, puis vérifiez la cohérence de l'ordre de grandeur.",
    icon: "calculator",
  },
];
