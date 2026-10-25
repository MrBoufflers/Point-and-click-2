# Isao & Elea : la Porte des 5 gemmes — POC

Jeu point-and-click pour deux enfants non-lecteurs qui jouent ensemble sur un seul téléphone.

**En ligne : https://mrboufflers.github.io/Point-and-click-2/** (mis à jour automatiquement à chaque push sur `main`).

## Niveau 1

| # | Tableau | Notion | Tour 1 | Tour 2 |
| --- | --- | --- | --- | --- |
| 1 | Forêt enchantée (rouge) | couleurs, quantités | trouver les 3 champignons rouges | combien de champignons ? |
| 2 | Rivière (orange) | formes | trouver les 3 pierres rondes pour traverser | quelle pierre rentre dans le trou ? |
| 3 | Grotte (jaune) | lettres | trouver les E, comme Elea | trouver les I, comme Isao |
| 4 | Prairie (verte) | motifs | quelle fleur vient après ? | quelle forme vient après ? |
| 5 | Montagne (bleue) | quantités | attraper exactement 2 étoiles | combien d'oiseaux ? |
| 6 | La Porte des 5 gemmes | coopération | les gemmes vont dans la porte, on la touche à deux | |

Entre deux tableaux, une grosse flèche permet de continuer. La progression est gardée sur l'appareil :
« ▶ » reprend au dernier tableau commencé, et après la Porte la partie suivante repart du début.

## Lancer

```bash
npm install
npm run dev -- --host     # puis ouvrir l'adresse « Network » affichée sur le téléphone (même Wi-Fi)
npm run build             # site statique dans dist/ (déployable tel quel, chemins relatifs)
npm run preview           # sert dist/ sur le réseau local
```

- `?debug=1` : dessine les zones tactiles avec leur taille réelle en px CSS (vert = au moins 80 px, gris = inactive) et l'état courant de la machine à états.
- `?scene=scene_cave.json` : joue un seul tableau (utile pour tester).

Sur iPhone, couper le mode silencieux (interrupteur latéral) : sinon les sons Web Audio sont muets.

## Données (aucune valeur de jeu dans le code)

Les fichiers de `data/` sont lus au démarrage (`fetch`), pas compilés : en dev la page se recharge quand on les modifie,
et après `npm run build` on peut encore les éditer directement dans `dist/data/`.

| Fichier | Contenu |
| --- | --- |
| `data/level_1.json` | ordre des tableaux, phrases communes (compter, « Je vais t'aider ! »...), la Porte finale |
| `data/scene_*.json` | un fichier par tableau : décor, objets, consignes, délais d'aide, éléments vivants |
| `data/settings.json` | ordre de passage par défaut, joueurs (initiale, couleur, côté), voix (vitesse, volume, bornes), taille mini des cibles, réglages du toucher à deux |

Points utiles de `scene_forest.json` :

- `hint_delays_s` : `[répéter la consigne, Lumi volette près de la cible, Lumi se pose et la cible scintille]`.
- `auto_solve_after_s` : si toujours rien, Lumi fait l'action elle-même (« Je vais t'aider ! »). Le tableau se termine donc toujours, même sans aucun toucher.
- `prompt` / `success_line` acceptent un texte simple ou un texte par joueur (`{"elea": "...", "isao": "..."}`), utilisé quand le parent inverse l'ordre de passage.
- `choose_number` : la bonne réponse vient du tour précédent (`answer_from: "previous_turn_count"`). Si on change le nombre de champignons rouges, penser à adapter `choices` et `success_line` (si la bonne réponse n'est pas dans `choices`, le jeu propose automatiquement n-1, n, n+1).
- `by_player` : remplace des champs du tour selon qui le joue (dans la grotte, chacun cherche l'initiale de son prénom).
- `backdrop` : `forest`, `river`, `cave`, `meadow`, `mountain`.
- `ambient_hotspots[].reaction` : `fly_away_and_back` (oiseau), `shiver` (buisson), `blink` (hibou), `bloom` (fleur),
  `jump` (grenouille), `splash` (poisson), `flutter` (papillon), `flap` (chauve-souris), `shine` (cristal),
  `hide` (escargot), `puff` (nuage), `wobble` (bonhomme de neige).

Types de tour :

- `find_objects` : trouver des objets (`object_kind` : `mushroom`, `shape`, `letter`, `flower`, `star`...). `need` = combien en prendre ;
  `collect` = `basket` (panier ou bocal), `slots` (vers des positions données) ou `glow` (restent sur place) ;
  `show_from_start: false` et `hide_after: true` pour enchaîner deux recherches au même endroit.
- `choose_number` : choisir le bon panneau. La réponse vient du tour précédent (`previous_turn_count`) ou d'objets à compter (`count_items`).
- `choose_one` : compléter une suite ou un trou (`display` avec un élément `missing`) parmi des `choices`. En cas d'erreur, Lumi relit la suite (champ `say` de chaque élément).

## Déroulé

Machine à états explicite dans `src/engine/sceneRunner.ts` :
`intro → elea_turn → isao_turn → gem_appears → celebration → end` (les noms des tours suivent le joueur actif).

- **Cibles** : au moins 80 × 80 px CSS à l'écran réel ; zone invisible = dessin agrandi de 25 %, recalculée à chaque toucher à partir de la taille rendue. Si deux zones se chevauchent, la cible dont le centre est le plus proche gagne.
- **Erreurs** : aucun son d'erreur ni pénalité (le mauvais champignon fait « pouic » et dodeline, le mauvais panneau tremble et Lumi compte avec l'enfant).
- **Gemme** : deux doigts (deux `pointerId`) dans une fenêtre de 600 ms déclenchent la fête ; un seul doigt aussi, après 2 s d'appui ou au 2e tap.
- **Bouton oreille** (en haut à droite) : répète la dernière consigne en coupant la phrase en cours.
- **Réglages parent** : appui long de 3 s sur l'engrenage (en haut à gauche). Ordre de passage, choix du tableau, volume et vitesse de la voix, recommencer. Enregistrés dans `localStorage`.

## Architecture

```
src/
  main.ts              démarrage, écran « ▶ », déverrouillage audio (même geste), HUD, réglages parent
  settings.ts          chargement JSON + préférences localStorage (try/catch)
  types.ts             format des fichiers de données
  engine/
    sceneRunner.ts     machine à états d'un tableau + aide progressive
    turns/             un module par type de tour (find_objects, choose_number, choose_one)
    gemTouch.ts        la gemme à toucher à deux
    twoTouch.ts        détection « touchez tous les deux » (gemme et Porte)
    finale.ts          la Porte des 5 gemmes
    hints.ts           minuteries d'aide progressive
    voice.ts           file de phrases (speechSynthesis), jamais deux voix en même temps
    sfx.ts             sons synthétisés Web Audio
    input.ts           Pointer Events, zones agrandies, mode debug
    clock.ts           minuteries annulées d'un coup au « recommencer »
  render/              SVG provisoire : décors, objets d'énigme, Lumi, panier, panneaux, gemmes, portraits, décor vivant, confettis
data/
```

Pour ajouter un type de tour : créer `src/engine/turns/monType.ts` (interface `Turn` de `turns/types.ts`) et l'enregistrer dans `turns/index.ts`.
