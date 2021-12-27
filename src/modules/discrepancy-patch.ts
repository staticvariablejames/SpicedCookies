/* Discrepancy patch.
 */

import { settings } from '../saved-data';
import { rewriteCode } from '../util';

/* Patches the discrepancy.
 * For ease of use, this function bails out if Spice.settings.patchDiscrepancy is false,
 * so it is safe to call this function at all times.
 *
 * Conversely, Spice.settings.patchDiscrepancy must be set to true before running this function,
 * but the callback Spice.toggleSetting takes care of that.
 */
export function patchDiscrepancy() {
    // This function is run on init and on load
    if(!settings.patchDiscrepancy) return;
    /* Since Orteil's code is sensitive to timing issues,
     * patching it changes the behavior of game loads,
     * so I think it is safer to leave it as an explicit opt-in feature.
     */

    Game.loadLumps = rewriteCode(Game.loadLumps,
        'Game.lumpT=Date.now()-(age-amount*Game.lumpOverripeAge);',
        '// Game.lumpT += amount*Game.lumpOverripeAge; // Spiced cookies patch'
    );
    // We shift the responsibility of updating Game.lumpT to Game.harvestLumps
    Game.harvestLumps = rewriteCode(Game.harvestLumps,
        'Game.lumpT=Date.now();',
        `let harvestedAmount = Math.floor((Date.now() - Game.lumpT)/Game.lumpOverripeAge);
        if(harvestedAmount > 0) {
            Game.lumpT += Game.lumpOverripeAge * harvestedAmount;
        } // Spiced cookies patch
    `);
    // Now we have to patch clickLump, because harvestLumps wouldn't change lump time in this case
    Game.clickLump = rewriteCode(Game.clickLump,
        /Game.computeLumpType\(\);/g,
        `Game.lumpT = Date.now(); // Spiced cookies patch
        Game.computeLumpType();
    `);
}
