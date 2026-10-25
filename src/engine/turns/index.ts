import { createChooseNumber } from './chooseNumber';
import { createFindObjects } from './findObjects';
import type { TurnFactory } from './types';

/** Types de tour reconnus dans les fichiers de scène. */
export const TURN_TYPES: Record<string, TurnFactory> = {
  find_objects: createFindObjects,
  choose_number: createChooseNumber,
};
