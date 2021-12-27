/* Patch pantheon swaps.
 */

import { settings, sessionData } from '../saved-data';
import { rewriteMinigameCode } from '../util';

export function patchPantheonSwaps() {
    // This function is run on save game load, minigame load, and settings toggle
    if(!settings.patchPantheonSwaps) return;
    if(!Game.Objects['Temple'].minigame) return; // It will be run again on minigame load
    if(sessionData.pantheonSwapsPatched) return;
    sessionData.pantheonSwapsPatched = true;

    Game.Objects['Temple'].minigame.slotGod = rewriteMinigameCode('Temple',
        Game.Objects['Temple'].minigame.slotGod,
        'M.slot[god.slot]=M.slot[slot];',
        'if(god.slot != -1) $& // Spiced cookies patch'
    );
}
