/* Enhance the 777-series of heavenly upgrades.
 */

import { settings } from '../saved-data';
import { Has, rewriteCode } from '../util';
import { stableHeavenlyChipGains } from './numerical-stability';

export function multiplierBuff777UpgradeSeries() {
    /* Pushed to Game.customHeavenlyMultiplier,
     * Game.customShimmerTypes['golden'].durationMult,
     * and Game.customShimmerTypes['golden'].customEffectDurMod.
     */
    let mult = 1;
    if(settings.buff777upgrades) {
        if(Has('Lucky number')) mult *= 1.02/1.01;
        if(Has('Lucky payout')) mult *= 1.04/1.01;
        if(Has('Lucky tally')) mult *= 1.08;
        if(Has('Lucky value')) mult *= 1.16;
    } else {
        if(Has('Lucky tally')) mult *= 1.01;
        if(Has('Lucky value')) mult *= 1.01;
    }
    return mult;
}

export function replace777seriesAcquisitionRestrictions() {
    // Called on load and on toggle
    if(settings.simplify777upgradeAcquisition) {
        for(let name of ['Lucky digit', 'Lucky number', 'Lucky payout']) {
            let upgrade = Game.Upgrades[name] as Game.HeavenlyUpgrade;
            upgrade.showIf = rewriteCode(upgrade.showIf!,
                'Math.ceil\(Game.prestige\)', 'Spice.stableHeavenlyChipGains()'
            );
        }
    } else { // Undo
        for(let name of ['Lucky digit', 'Lucky number', 'Lucky payout']) {
            let upgrade = Game.Upgrades[name] as Game.HeavenlyUpgrade;
            upgrade.showIf = rewriteCode(upgrade.showIf!,
                'Spice.stableHeavenlyChipGains\(\)', 'Math.ceil(Game.prestige)'
            );
        }
    }
}

export function push777seriesTooltips() {
    // This function is called on load
    Game.customUpgrades['Lucky digit'].descFunc.push(function(_me: any, desc: string) {
        if(settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
    Game.customUpgrades['Lucky number'].descFunc.push(function(_me: any, desc: string) {
        if(settings.buff777upgrades) {
            desc = desc.replace(/1%/g, '2%');
        }
        if(settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
    Game.customUpgrades['Lucky payout'].descFunc.push(function(_me: any, desc: string) {
        if(settings.buff777upgrades) {
            return desc.replace(/1%/g, '4%');
        }
        if(settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
}

export function createExtra777seriesUpgrades() {
    // Called on load and on settings toggle
    if(!settings.extra777seriesUpgrades) return;
    if('Lucky tally' in Game.Upgrades) return; // Idempotency

    let previous0 = Game.Upgrades['Lucky number'] as Game.HeavenlyUpgrade;
    let previous1 = Game.Upgrades['Lucky payout'] as Game.HeavenlyUpgrade;
    let deltaX = (previous1.posX - previous0.posX)*0.75;
    let deltaY = (previous1.posY - previous0.posY)*0.75;

    let last: Game.HeavenlyUpgrade;
    last = CCSE.NewHeavenlyUpgrade('Lucky tally', 'why BeautifyInText, Orteil?',
        777_777_777_777,
        previous1.icon,
        previous1.posX + deltaX, previous1.posY + deltaY,
        ['Lucky payout']
    );
    last.descFunc = function() {
        let p = settings.buff777upgrades ? 1 : 8; // Percentage
        return `<b>+${p}%</b> prestige level effect on CpS.<br>
        <b>+${p}%</b> golden cookie effect duration.<br>
        <b>+${p}%</b> golden cookie lifespan.
        <q>This upgrade only exists due to a stroke of luck.
            It's stealth abilities can hardly be surpassed.
            it only appears when your gained prestige level ends in 7,777,777,777.
        </q>`;
    }
    last.showIf = function(){
        return stableHeavenlyChipGains() % 10_000_000_000 == 7_777_777_777;
    }
    last.order = previous1.order + 0.001;

    last = CCSE.NewHeavenlyUpgrade('Lucky value', 'why BeautifyInText, Orteil?',
        77_777_777_777_777_777,
        previous1.icon,
        previous1.posX + 2*deltaX, previous1.posY + 2*deltaY,
        ['Lucky tally']
    );
    last.descFunc = function() {
        let p = settings.buff777upgrades ? 1 : 16; // Percentage
        return `<b>+${p}%</b> prestige level effect on CpS.<br>
        <b>+${p}%</b> golden cookie effect duration.<br>
        <b>+${p}%</b> golden cookie lifespan.
        <q>This upgrade is the most rare of its kind;
            in fact, it's existence was only revealed through the use of otherworldly means.
            It can only be seen when your gained prestige level ends in 777,777,777,777,777,
            but it will run away if you gain more than 9 quadrillion prestige levels at once.
        </q>`;
    }
    last.order = previous1.order + 0.002;
    last.showIf = function(){
        return stableHeavenlyChipGains() % 1_000_000_000_000_000 == 777_777_777_777_777;
    }
}
