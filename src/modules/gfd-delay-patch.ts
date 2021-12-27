/* Patch GFD's casting delay.
 */

import { settings } from '../saved-data';
import { rewriteMinigameCode } from '../util';

export function patchGFDDelay() {
    // This function is run on save game load, minigame load, and settings toggle
    if(!settings.patchGFDDelay) return;
    if(!Game.Objects['Wizard tower'].minigame) return; // Run again on minigame load

    // Replacements make this function inherently idempotent

    let spell = Game.Objects['Wizard tower'].minigame.spells['gambler\'s fever dream'];
    spell.win = rewriteMinigameCode('Wizard tower',
        spell.win,
        'setTimeout(function(spell,cost,seed)',
        /* There are two calls to setTimeout, we only want to overwrite the first.
         * We could rely on the substitution order,
         * but this also makes this function idempotent without extra work. */
        `let callRightAway = function(f, ignored) {f();}; // Spiced cookies patch
        callRightAway(function(spell,cost,seed)`
    );
    spell.win = rewriteMinigameCode('Wizard tower',
        spell.win,
        "' magic...</div>',Game.mouseX,Game.mouseY",
        "' magic...</div>',Game.mouseX,Game.mouseY-50"
        // Both GFD and the chosen spell have popup messages; this makes sure they don't overlap
    );
}
