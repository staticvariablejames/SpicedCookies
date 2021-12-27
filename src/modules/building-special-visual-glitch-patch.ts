/* Patches the visual glitch on the building special tooltips.
 */

import { rewriteCode } from '../util';

export function patchBuildingSpecialsVisualGlitch() {
    // Called on load
    Game.buffTypesByName['building buff'].func
        = rewriteCode(Game.buffTypesByName['building buff'].func,
            /Math.ceil/g,
            'Math.round'
        );
    Game.buffTypesByName['building debuff'].func
        = rewriteCode(Game.buffTypesByName['building debuff'].func,
            /Math.ceil/g,
            'Math.round'
        );
}
