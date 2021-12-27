/* Warn about spending lumps if they would bring the total down to below 100,
 * which reduces effectiveness of Sugar baking.
 */

import { settings } from '../saved-data';
import { rewriteCode, Has } from '../util';

export function shouldWarnAboutTooFewLumps(lumps: number = Game.lumps) {
    return settings.warnLessThan100Lumps && Has('Sugar baking') && lumps < 100;
}

// Colors the lump number red if there are too few lumps
export function updateLumpCountColor() {
    // Pushed to Game.customDoLumps
    if(shouldWarnAboutTooFewLumps()) {
        document.getElementById('lumpsAmount')!.style.color = "red";
    } else {
        document.getElementById('lumpsAmount')!.style.color = "";
    }
}

export function warnfulLumpTooltip(str: string) {
    /* Pushed to Game.customLumpTooltip
     * Actually we "unshift" it to Game.customLumpTooltip
     * This makes sure that, regardless of whether this mod or CYOL gets loaded first,
     * the warning from this mod is shown above the wall of predictions from CYOL.
     */
    if(shouldWarnAboutTooFewLumps()) {
        str += '<div class="line"></div>';
        str += '<div style="text-align:center">' +
                    '<div style="color:red; display:inline-block">Warning:</div>' +
                    ' too few sugar lumps, Sugar baking is not maxed out!' +
                '</div>';
    }
    return str;
}

export function injectWarningIntoLumpConfirmationTooltip() {
    let pattern = "'?</div>'";
    let replacement = `'?</div>' + ( // Spiced cookies modification
            Spice.shouldWarnAboutTooFewLumps(Game.lumps-n)?
                '<div>This will bring your sugar lumps down' +
                    (Game.lumps >= 100 ? ' to below 100, ' : ', ') +
                    'undermining Sugar baking' +
                '</div>'
            :'')
        `;
    /* This one is a pain...
     * Game.spendLump is not a regular function, but a factory:
     * calling it returns a function which should be used as a callback
     * that will do the task of opening the prompt and calling the given callback.
     * However,
     * in almost all places that spendLump is used,
     * the returned function is used directly (like `Game.spendLump(args)()`)
     * rather than stored for later call.
     * So rewriting `Game.spendLump` itself is enough for most cases:
     */
    Game.spendLump = rewriteCode(Game.spendLump, pattern, replacement);
    /* The only exception is Game.Upgrades['Sugar frenzy'].clickFunction.
     * Since one of the arguments is an anonymous function,
     * short of copy-pasting Orteil's code here
     * (which would be terrible for compatibility with other mods)
     * we simply cannot modify that function.
     *
     * Since this is a confirmation prompt,
     * I expect most players to know what they are doing when they activate Sugar frenzy,
     * so it should not be a huge loss.
     */
}
