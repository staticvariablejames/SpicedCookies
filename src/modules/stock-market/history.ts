/* Saving the stock market history.
 */

import { settings, saveGame } from '../../saved-data';
import { stockMarketGoodsCount } from './util';

export function saveStockMarketHistory() {
    // Executed when saving the game
    saveGame.stockMarketHistory = [];
    if(!settings.saveStockMarketHistory) return;
    for(let i = 0; i < stockMarketGoodsCount(); i++) {
        saveGame.stockMarketHistory[i] = Game.Objects['Bank'].minigame.goodsById[i].vals;
    }
}

export function loadStockMarketHistory() {
    // Executed when loading the save game
    if(!settings.saveStockMarketHistory) return;
    if(!saveGame.stockMarketHistory) return;
    if(saveGame.stockMarketHistory.length === 0) return;
    if(saveGame.stockMarketHistory[0].length < 1) return;
    for(let i = 0; i < stockMarketGoodsCount(); i++) {
        if(i in saveGame.stockMarketHistory)
            Game.Objects['Bank'].minigame.goodsById[i].vals = saveGame.stockMarketHistory[i];
        // Spice.saveGame.stockMarketHistory[i] won't exist if e.g. loading a pre-idleverses save
    }
}

/* There is no need to do anything when ascending or wiping the save,
 * because Game.Objects.Bank.minigame.goodsById[i].vals gets wiped out by the game itself.
 */
