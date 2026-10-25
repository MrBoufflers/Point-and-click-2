# Isao & Elea — notes pour Claude

Jeu point-and-click pour deux enfants non-lecteurs (Isao 5 ans, Elea 4 ans), un seul téléphone, en coopération.
Vite + TypeScript, SVG, sans framework. Voir le README pour l'architecture.

## Règles à respecter

- **Nouveau chapitre = l'ajouter au menu parent « Aller au chapitre »** :
  1. une ligne dans `data/settings.json` → `"chapters"` (`id`, `name` affiché, `start`) ;
  2. la fonction de départ correspondante dans `chapterStarts` (`src/main.ts`) ;
  3. penser aussi à la liste « Tableau précis » (`boardNames` dans `src/main.ts`) et au numéro de tableau sauvegardé (`prefs.board`).
- Aucune valeur de jeu en dur : positions, phrases, délais, listes → fichiers de `data/`.
- Toute cible tactile ≥ 80 px CSS (géré par `Input`), aucun son d'erreur, aucune pénalité, l'aide de Lumi finit toujours par débloquer.
- Les lieux rejouables tirent leur contenu au hasard (`src/engine/places/generators.ts`) en évitant le tirage précédent.
- Textes en français, à voix haute (les enfants ne lisent pas) ; les écrans parent peuvent contenir du texte.

## Vérifier avant de pousser

- `npm run build` (inclut `tsc`).
- Tester dans Chromium headless (Playwright déjà installé) avec une fausse `speechSynthesis` et des délais d'aide raccourcis.
- Pousser sur `main` : GitHub Pages se met à jour tout seul (https://mrboufflers.github.io/Point-and-click-2/).
