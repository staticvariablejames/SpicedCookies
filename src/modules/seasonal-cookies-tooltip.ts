/* Better tooltip for season-switching cookies.
 */

import { settings } from '../saved-data';

export function pushSeasonalCookieTooltips() {
    let seasonalReplacer = function(desc: string, upgradeNames: string[], replacementStr: string) {
        let unlocked = 0;
        let bought = 0;
        let total = 0;
        for(let name of upgradeNames) {
            total++;
            if(Game.Upgrades[name].unlocked) unlocked++;
            if(Game.Upgrades[name].bought) bought++;
        }
        if(settings.autohideSeasonalBiscuitsTooltip && bought == total)
            return desc;
        return desc.replace(replacementStr, `${replacementStr}<div class="line"></div>` +
            `You've unlocked <b>${unlocked}/${total}</b> ${replacementStr}`);
    }

    Game.customUpgrades['Bunny biscuit'].descFunc.push(function(_me: any, desc: string) {
        return seasonalReplacer(desc, Game.easterEggs, "eggs.");
    });

    Game.customUpgrades['Festive biscuit'].descFunc.push(function(_me: any, desc: string) {
        desc = seasonalReplacer(desc, Game.santaDrops, "of Santa's gifts.");
        desc = seasonalReplacer(desc, Game.reindeerDrops, "reindeer cookies.");
        return desc;
    });

    Game.customUpgrades['Ghostly biscuit'].descFunc.push(function(_me: any, desc: string) {
        return seasonalReplacer(desc, Game.halloweenDrops, "halloween cookies.");
    });

    Game.customUpgrades['Lovesick biscuit'].descFunc.push(function(_me: any, desc: string) {
        return seasonalReplacer(desc, Game.heartDrops, "heart biscuits.");
    });
}
