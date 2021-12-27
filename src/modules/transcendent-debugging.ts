/* Module: Debug upgrade which makes debug upgrades permanent.
 */

import { sessionData } from '../saved-data';
import { Has } from '../util';

export function createPermanentDebugUpgradesUpgrade() {
    // Run on init
    if('Transcendent debugging' in Game.Upgrades) return;
    let upgrade = CCSE.NewUpgrade('Transcendent debugging',
        'Debug upgrades persist across ascensions.' +
            '<q>Like Permanent upgrade slots, but for debug upgrades!</q>',
        7, [10, 31]
    );
    upgrade.order = Game.Upgrades['A really good guide book'].order + 0.002;
    upgrade.pool = 'debug';
}

export function saveCurrentDebugUpgrades() {
    // Executed on ascension
    sessionData.ownedDebugUpgrades = [];
    /* There is no need to save this permanently
     * because games can't be saved while in the ascension menu.
     */

    if(!Has('Transcendent debugging')) return;

    for(let i in Game.Upgrades) {
        if(Game.Upgrades[i].pool == 'debug' && Game.Upgrades[i].bought)
            sessionData.ownedDebugUpgrades.push(i);
    }
}

export function restoreDebugUpgrades() {
    // Executed on reincarnate
    for(let i of sessionData.ownedDebugUpgrades) {
        Game.Upgrades[i]!.earn();
    }
}
