/* Patch seasons affecting the outcomes of FtHoF.
 */

import { settings, sessionData } from '../saved-data';
import { rewriteMinigameCode } from '../util';

export function patchSeasonsAffectingFtHoF() {
    // This function is run on save load, minigame load, and settings toggle
    if(!settings.patchSeasonsAffectingFtHoF) return;
    if(!Game.Objects['Wizard tower'].minigame) return;
    if(sessionData.seasonsFtHoFpatched) return;
    sessionData.seasonsFtHoFpatched = true;
    let spell = Game.Objects['Wizard tower'].minigame.spells['hand of fate'];

    spell.win = rewriteMinigameCode('Wizard tower', spell.win,
        "var newShimmer=new Game.shimmer('golden',{noWrath:true});",
        "Math.random(); Math.random(); // Spiced cookies patch\n"
        /* Keeping these two Math.random calls guarantee that the FtHoF outcome with the patch
         * matches the out-of-season outcome witohut the patch.
         * This keeps planners working,
         * and prevent players from using this patch to scum another FtHoF outcome.
         */
    ,
        "newShimmer.force=choose(choices);",
        "let force = choose(choices); let sizeMult; // Spiced Cookies patch \n"
    ,
        "newShimmer.force=='cookie storm drop'",
        "force=='cookie storm drop'"
    ,
        "newShimmer.sizeMult=Math.random()*0.75+0.25;",
        "sizeMult=Math.random()*0.75+0.25;"
    ,
        /}$/,
        `let newShimmer = new Game.shimmer('golden',{noWrath:true}); // Spiced cookies patch
        newShimmer.force = force;
        if(sizeMult) newShimmer.sizeMult = sizeMult;
        }`
    );

    spell.fail = rewriteMinigameCode('Wizard tower', spell.fail!,
        "var newShimmer=new Game.shimmer('golden',{wrath:true});",
        "Math.random(); Math.random(); // Spiced cookies patch\n"
    ,
        "newShimmer.force=choose(choices);",
        "let force = choose(choices); // Spiced Cookies patch \n"
    ,
        /}$/,
        `let newShimmer = new Game.shimmer('golden',{wrath:true}); // Spiced cookies patch
        newShimmer.force = force;
        }`
    );
}
