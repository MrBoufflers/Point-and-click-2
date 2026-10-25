# Isao & Elea : la Porte des 5 gemmes — POC

Jeu point-and-click pour deux enfants non-lecteurs qui jouent ensemble sur un seul téléphone.
Ce POC contient un seul tableau : **la forêt enchantée (gemme rouge)**.

## Lancer

```bash
npm install
npm run dev -- --host     # puis ouvrir l'adresse « Network » affichée sur le téléphone (même Wi-Fi)
npm run build             # site statique dans dist/ (déployable tel quel, chemins relatifs)
npm run preview           # sert dist/ sur le réseau local
```

- `?debug=1` : dessine les zones tactiles avec leur taille réelle en px CSS (vert = au moins 80 px, gris = inactive) et l'état courant de la machine à états.
- `?scene=autre_scene.json` : charge un autre fichier de scène placé dans `data/`.

Sur iPhone, couper le mode silencieux (interrupteur latéral) : sinon les sons Web Audio sont muets.

## Données (aucune valeur de jeu dans le code)

Les fichiers de `data/` sont lus au démarrage (`fetch`), pas compilés : en dev la page se recharge quand on les modifie,
et après `npm run build` on peut encore les éditer directement dans `dist/data/`.

| Fichier | Contenu |
| --- | --- |
| `data/scene_forest.json` | positions des champignons, du panier, de la gemme, de Lumi, décor, éléments vivants, consignes, délais d'aide |
| `data/settings.json` | ordre de passage par défaut, joueurs (initiale, couleur, côté), voix (vitesse, volume, bornes), taille mini des cibles, réglages du toucher à deux |

Points utiles de `scene_forest.json` :

- `hint_delays_s` : `[répéter la consigne, Lumi volette près de la cible, Lumi se pose et la cible scintille]`.
- `auto_solve_after_s` : si toujours rien, Lumi fait l'action elle-même (« Je vais t'aider ! »). Le tableau se termine donc toujours, même sans aucun toucher.
- `prompt` / `success_line` acceptent un texte simple ou un texte par joueur (`{"elea": "...", "isao": "..."}`), utilisé quand le parent inverse l'ordre de passage.
- `choose_number` : la bonne réponse vient du tour précédent (`answer_from: "previous_turn_count"`). Si on change le nombre de champignons rouges, penser à adapter `choices` et `success_line` (si la bonne réponse n'est pas dans `choices`, le jeu propose automatiquement n-1, n, n+1).
- `ambient_hotspots[].reaction` : `fly_away_and_back` (oiseau), `shiver` (buisson), `blink` (hibou), `bloom` (fleur).

## Déroulé

Machine à états explicite dans `src/engine/sceneRunner.ts` :
`intro → elea_turn → isao_turn → gem_appears → celebration → end` (les noms des tours suivent le joueur actif).

- **Cibles** : au moins 80 × 80 px CSS à l'écran réel ; zone invisible = dessin agrandi de 25 %, recalculée à chaque toucher à partir de la taille rendue. Si deux zones se chevauchent, la cible dont le centre est le plus proche gagne.
- **Erreurs** : aucun son d'erreur ni pénalité (le mauvais champignon fait « pouic » et dodeline, le mauvais panneau tremble et Lumi compte avec l'enfant).
- **Gemme** : deux doigts (deux `pointerId`) dans une fenêtre de 600 ms déclenchent la fête ; un seul doigt aussi, après 2 s d'appui ou au 2e tap.
- **Bouton oreille** (en haut à droite) : répète la dernière consigne en coupant la phrase en cours.
- **Réglages parent** : appui long de 3 s sur l'engrenage (en haut à gauche). Ordre de passage, volume et vitesse de la voix, recommencer. Enregistrés dans `localStorage`.

## Architecture

```
src/
  main.ts              démarrage, écran « ▶ », déverrouillage audio (même geste), HUD, réglages parent
  settings.ts          chargement JSON + préférences localStorage (try/catch)
  types.ts             format des fichiers de données
  engine/
    sceneRunner.ts     machine à états d'un tableau + aide progressive
    turns/             un module par type de tour (find_objects, choose_number)
    gemTouch.ts        la gemme à toucher à deux
    hints.ts           minuteries d'aide progressive
    voice.ts           file de phrases (speechSynthesis), jamais deux voix en même temps
    sfx.ts             sons synthétisés Web Audio
    input.ts           Pointer Events, zones agrandies, mode debug
    clock.ts           minuteries annulées d'un coup au « recommencer »
  render/              SVG provisoire : forêt, champignons, Lumi, panier, panneaux, gemmes, portraits, décor vivant, confettis
data/
```

Pour ajouter un type de tour : créer `src/engine/turns/monType.ts` (interface `Turn` de `turns/types.ts`) et l'enregistrer dans `turns/index.ts`.
