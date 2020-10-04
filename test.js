// SPDX-License-Identifier: GPL-3.0-or-later
// See https://github.com/staticvariablejames/CCtest

function testStockMarketDelta() {
    Util.wipeSave();

    Game.Earn(1e9);
    Game.harvestLumps(10);
    Game.Objects.Bank.getFree(1);
    Game.Objects.Bank.levelUp(); // Unlock the minigame

    // Continue the test after the minigame is unloaded
    CCSE.MinigameReplacer(function() {
        Game.Objects.Bank.switchMinigame(true); // Show the minigame
        let stockDiv = document.getElementById('bankGood-3');
        stockDiv.style.display = "inline-block"; // Force the good to be displayed
        let heightWithDelta = stockDiv.clientHeight;

        // Test we can disable the option
        document.getElementById('prefsButton').click();
        document.getElementById('SpiceButtondisplayStockDelta').click();
        document.getElementById('prefsButton').click();

        let heightWithoutDelta = stockDiv.clientHeight;
        console.assert(heightWithoutDelta < heightWithDelta);

        // Test we can enable it again
        document.getElementById('prefsButton').click();
        document.getElementById('SpiceButtondisplayStockDelta').click();
        document.getElementById('prefsButton').click();
        console.assert(stockDiv.clientHeight === heightWithDelta);

        console.log('Finished testStockMarketDelta()');
    }, 'Bank');
}

function testStockMarketHistory() {
    Util.wipeSave();
    Game.Earn(1e9);
    Game.harvestLumps(10);
    Game.Objects.Bank.getFree(1);
    Game.Objects.Bank.levelUp(); // Unlock the minigame

    // Continue the test after the minigame is unloaded
    CCSE.MinigameReplacer(function() {
        // Right now, the stock market has 16 minutes of history
        let ccseSave = CCSE.WriteSave(1);
        let vanillaSave = Game.WriteSave(1);

        console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);
        Game.LoadSave(vanillaSave);
        console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 2);
        CCSE.LoadSave(ccseSave);
        console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);
    }, 'Bank');
}
