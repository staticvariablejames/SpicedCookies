/* Tallying stock market profits across ascensions.
 *
 * This module could be merged with the "track statistics across ascensions" one,
 * but since they share pretty much no common code
 * (and we need to do more work to honor tallyOnlyStockMarketProfits)
 * I decided to split them.
 */

import { settings, saveGame } from '../../saved-data';

export function effectiveStockMarketTally() {
    // across-ascensions profit tally, but respecting settings.tallyOnlyStockMarketProfits
    if(!Game.Objects['Bank'].minigame) return 0;

    let profit = Game.Objects['Bank'].minigame.profit;
    if(settings.tallyOnlyStockMarketProfits)
        return saveGame.stockMarketProfitsPreviousAscensions + (profit > 0 ? profit : 0);
    else
        return saveGame.stockMarketProfitsPreviousAscensions + profit;
}

export function updateAcrossAscensionsStockMarketTallying() {
    saveGame.stockMarketProfitsPreviousAscensions = effectiveStockMarketTally();
}

/* Adds the "(all time : $???)" text to the bank minigame.
 * Executed when the bank minigame loads.
 */
export function createProfitTallyDiv() {
    document.getElementById('bankBalance')!.outerHTML +=
        ' (all time : <span id="bankTally">$-</span>)';
    updateProfitTallyDisplay();
}

export function updateProfitTallyDisplay() {
    // Executed on every buy/sell good
    let tally = effectiveStockMarketTally();
    let tallyDiv = document.getElementById('bankTally');
    if(tallyDiv) {
        tallyDiv.innerHTML = (tally < 0 ? '-$' : '$') + Beautify(Math.abs(tally));
    }
}
