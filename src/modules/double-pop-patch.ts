/* Patches the double-pop bug.
 */

import { settings, sessionData } from '../saved-data';
import { rewriteCode } from '../util';

export function patchDoublePop() {
    // This function is run on save game load and settings toggle
    if(!settings.patchDoublePop) return;
    if(sessionData.doublePopPatched) return;

    // @ts-ignore: Game.shimmer is missing in @types/cookieclicker
    Game.shimmer.prototype.pop = rewriteCode(Game.shimmer.prototype.pop,
        '{',
        '{if (this.l.parentNode == null) return; // Spiced cookies patch\n'
    );
}
