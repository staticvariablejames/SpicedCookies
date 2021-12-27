/* Displays two extra rows in the panel of each stock in the stock market:
 * one for the stock delta, and another for the stock mode.
 */

import { settings } from '../../saved-data';
import { Has } from '../../util';
import { stockMarketGoodsCount } from './util';

/* The first time this function is called with a given ID,
 * it creates a row with the text "delta: --" below the row with the value of the good,
 * and returns the div that points to the "--" part of the row.
 * Subsequent calls only returns the created div.
 */
export function stockMarketDeltaRow(stockId: number) {
    let div = document.getElementById('stockMarketDelta-' + stockId) as HTMLDivElement | null;
    if(div) return div;

    let upperBox = document.getElementById('bankGood-' + stockId)!.firstChild as HTMLDivElement;
    let valueDiv = document.getElementById('bankGood-' + stockId + '-val')!.parentNode as HTMLDivElement;
    let deltaDiv = upperBox.insertBefore(document.createElement("div"), valueDiv.nextSibling);

    /* Manually copy the style from the other div.
     *
     * valueDiv.style is a weird object...
     * it technically is a map between CSS properties and their values,
     * but the object itself behaves like a list of all properties that are actually set.
     * So a simple "for(let i = 0; i < style.length; i++) {style[i]}"
     * iterates through all keys of the map that are actually set.
     * Then we can use destinationStyle.setProperty(key, originStyle.getProperty(key))
     * to actually do the copying.
     */
    for(let keyIndex = 0; keyIndex < valueDiv.style.length; keyIndex++) {
        let key = valueDiv.style[keyIndex];
        deltaDiv.style.setProperty(key, valueDiv.style.getPropertyValue(key));
    }

    deltaDiv.innerHTML = 'delta: <div id="stockMarketDelta-' + stockId + '" ' +
        'style="display:inline; font-weight:bold;">0</div>';

    return document.getElementById('stockMarketDelta-' + stockId) as HTMLDivElement;
}

/* Similar as above, but with the text "mode: --" instead.
 * The div is placed above the div above.
 */
export function stockMarketModeRow(stockId: number) {
    let div = document.getElementById('stockMarketMode-' + stockId) as HTMLDivElement | null;
    if(div) return div;

    let upperBox = document.getElementById('bankGood-' + stockId)!.firstChild as HTMLDivElement;
    let deltaDiv = stockMarketDeltaRow(stockId).parentNode as HTMLDivElement;
    let modeDiv = upperBox.insertBefore(document.createElement("div"), deltaDiv);
    for(let keyIndex = 0; keyIndex < deltaDiv.style.length; keyIndex++) {
        let key = deltaDiv.style[keyIndex];
        modeDiv.style.setProperty(key, deltaDiv.style.getPropertyValue(key));
    }
    modeDiv.style.display = 'none'; // Mode rows are hidden by default

    modeDiv.innerHTML = 'mode: <div id="stockMarketMode-' + stockId + '" ' +
        'style="display:inline; font-weight:bold;">--</div>';

    return document.getElementById('stockMarketMode-' + stockId) as HTMLDivElement;
}

const stockMarketModeNames = ['stable','slow rise','slow fall','fast rise','fast fall','chaotic'];

/* Updates the text inside the delta and mode rows created by the functions above.
 * This is pushed to Game.customMinigame.Bank.tick,
 * and run on Spice.load.
 *
 * We have to run this on load because Cookie Clicker first resets the minigame,
 * making it simulate 15 ticks of a brand new market (for no apparent reason),
 * then loads the minigame save on top of it, without ticking again.
 * Without this we'd display the delta of that "phantom" market.
 */
export function updateStockMarketRows() {
    for(let i = 0; i < stockMarketGoodsCount(); i++) {
        let stock = Game.Objects['Bank'].minigame.goodsById[i];
        let deltaRow = stockMarketDeltaRow(i);
        if(deltaRow) {
            deltaRow.innerHTML = String(Math.floor(1000*stock.d)/1000);
        }
        let modeRow = stockMarketModeRow(i);
        if(modeRow) {
            modeRow.innerHTML = stockMarketModeNames[stock.mode] + ' (' + stock.dur + ')';
        }
    }
}

/* Show and hide the two extra rows created for the stock market.
 * The delta rows are hidden/shown according to Spice.settings.displayStockDelta,
 * the mode rows are hidden/shown according to Game.Has('Omniscient day traders').
 *
 * This function must be called in a few places:
 * - On loading save game
 * - After purchasing/toggling Omniscient day traders
 * - After toggling Spice.settings.displayStockDelta
 * - After ascending (because we lose Omniscient day traders on ascension)
 */
export function updateStockMarketRowsVisibility() {
    for(let i = 0; i < stockMarketGoodsCount(); i++) {
        let deltaDiv = stockMarketDeltaRow(i).parentNode as HTMLDivElement;
        let modeDiv = stockMarketModeRow(i).parentNode as HTMLDivElement;
        if(settings.displayStockDelta) deltaDiv.style.display = "block";
        else deltaDiv.style.display = "none";
        if(Has('Omniscient day traders')) modeDiv.style.display = "block";
        else modeDiv.style.display = "none";
    }
}

export function createStockMarketModeDebugUpgrade() {
    // Run on init
    if('Omniscient day traders' in Game.Upgrades) return;
    let upgrade = CCSE.NewUpgrade('Omniscient day traders',
        'Stock modes are visible in the stock market.' +
            '<q>No time for flavor text, pay attention to your stocks!</q>',
        7,
        Game.Achievements['Buy buy buy' as any].icon
    );

    // https://github.com/klattmose/klattmose.github.io/issues/42
    upgrade.buyFunction = updateStockMarketRowsVisibility;

    upgrade.order = Game.Upgrades['A really good guide book'].order + 0.001;
    upgrade.pool = 'debug';
}
