/* Award achievements for across-ascensions progress.
 *
 * This is a companion of sorts to
 * - src/modules/extra-statistics-across-ascensions.ts,
 * - src/modules/stock-market/across-ascensions-tally.ts,
 * - src/modules/extra-achievements-across-ascensions.ts.
 * We also create a few more achievements.
 *
 * The hard-work of this module is pushing the following function to the appropriate places.
 */

import { settings, saveGame } from '../saved-data';
import { effectiveStockMarketTally } from './stock-market/across-ascensions-tally';

export function checkWrinklersPoppedAcrossAscensionsAchievements() {
    // Pushed to Game.customWrinklerPop
    let wrinklersPopped = Game.wrinklersPopped + saveGame.wrinklersPoppedPreviousAscensions;
    if(settings.awardAchievementsAcrossAscensions) {
        if(wrinklersPopped>=1) Game.Win('Itchscratcher');
        if(wrinklersPopped>=50) Game.Win('Wrinklesquisher');
        if(wrinklersPopped>=200) Game.Win('Moistburster');
    }

    if(settings.extraAchievementsAcrossAscensions) {
        if(wrinklersPopped>=1000) Game.Win('Parasitesmasher');
    }
}

export function checkReindeerClickedAcrossAscensionsAchievements() {
    // Pushed to Game.customShimmerTypes.reindeer.popFunc
    let reindeerClicked = Game.reindeerClicked + saveGame.reindeerClickedPreviousAscensions;
    if(settings.awardAchievementsAcrossAscensions) {
        if(reindeerClicked>=1) Game.Win('Oh deer');
        if(reindeerClicked>=50) Game.Win('Sleigh of hand');
        if(reindeerClicked>=200) Game.Win('Reindeer sleigher');
    }

    if(settings.extraAchievementsAcrossAscensions) {
        if(reindeerClicked>=1000) Game.Win('A sleightly longer grind');
    }
}

export function checkHandmadeCookiesAcrossAscensionsAchievements() {
    // Pushed to Game.customCookieClicks, which (surprisingly) is a vanilla hook
    let handmadeCookies = Game.handmadeCookies + saveGame.handmadeCookiesPreviousAscensions;

    if(settings.awardAchievementsAcrossAscensions) {
        if(handmadeCookies>=1000) Game.Win('Clicktastic');
        if(handmadeCookies>=100000) Game.Win('Clickathlon');
        if(handmadeCookies>=10000000) Game.Win('Clickolympics');
        if(handmadeCookies>=1000000000) Game.Win('Clickorama');
        if(handmadeCookies>=100000000000) Game.Win('Clickasmic');
        if(handmadeCookies>=10000000000000) Game.Win('Clickageddon');
        if(handmadeCookies>=1000000000000000) Game.Win('Clicknarok');
        if(handmadeCookies>=100000000000000000) Game.Win('Clickastrophe');
        if(handmadeCookies>=10000000000000000000) Game.Win('Clickataclysm');
        if(handmadeCookies>=1000000000000000000000) Game.Win('The ultimate clickdown');
        if(handmadeCookies>=100000000000000000000000) Game.Win('All the other kids with the pumped up clicks');
        if(handmadeCookies>=10000000000000000000000000) Game.Win('One...more...click...');
        if(handmadeCookies>=1000000000000000000000000000) Game.Win('Clickety split');
    }
}

export function checkStockMarketTallyAchievements() {
    // Pushed to Game.customMinigame['Bank'].buyGood and sellGood
    if(!Game.Objects['Bank'].minigame) return; // safeguarding

    if(settings.awardAchievementsAcrossAscensions) {
        if(effectiveStockMarketTally() >= 10e6) Game.Win('Liquid assets');
        if(effectiveStockMarketTally() >= 3600*24*365) Game.Win('Gaseous assets');
    }

    if(settings.extraStockMarketAchievements) {
        let profit = Game.Objects['Bank'].minigame.profit;
        if(profit >= 1e6) Game.Win('Who wants to be a millionaire?');

        let noStocks = true;
        for(let good of Game.Objects['Bank'].minigame.goodsById) {
            if(good.stock > 0) noStocks = false;
        }
        if(noStocks && profit <= -1e6) Game.Win('Failing on purpose');

        if(profit <= -3600*24*365) Game.Win('Solid assets');
    }
}

export function checkAcrossAscensionsAchievements() {
    // Invoked when toggling the option
    checkWrinklersPoppedAcrossAscensionsAchievements();
    checkReindeerClickedAcrossAscensionsAchievements();
    checkHandmadeCookiesAcrossAscensionsAchievements();
    checkStockMarketTallyAchievements();
}
