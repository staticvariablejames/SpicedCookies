// SPDX-License-Identifier: GPL-3.0-or-later
// See https://github.com/staticvariablejames/CCtest

function testImplicitAssumptions() {
    console.assert(Game.HCfactor == 3); // Assumed by the numerically stable heavenly chips formula
    console.assert(!Game.prefs.popup); // Used to simplify message in Spice.init
}
testImplicitAssumptions();

async function testStockMarketRows() {
    Util.wipeSave("with minigames");
    await Util.waitMinigame('Bank');

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

    // Test that disabling the option stays on load
    Spice.settings.displayStockDelta = false;
    let save = Game.WriteSave(1);
    Game.LoadSave(save);
    console.assert(stockDiv.clientHeight === heightWithoutDelta);

    Spice.settings.displayStockDelta = true;
    save = Game.WriteSave(1);
    Game.LoadSave(save);
    console.assert(stockDiv.clientHeight === heightWithDelta);

    // Test debug upgrade
    Game.Upgrades['Omniscient day traders'].buy();
    let heightWithBoth = stockDiv.clientHeight;
    console.assert(heightWithDelta < heightWithBoth);

    save = Game.WriteSave(1);
    Game.Upgrades['Omniscient day traders'].toggle();
    console.assert(stockDiv.clientHeight === heightWithDelta);

    Game.LoadSave(save);
    console.assert(stockDiv.clientHeight === heightWithBoth);

    Util.Ascend(); Util.Reincarnate(); // Ascending removes the upgrade
    console.assert(!Game.Has('Omniscient day traders'));
    Game.Objects.Bank.getFree(1); Game.Objects.Bank.switchMinigame(true);
    stockDiv.style.display = "inline-block"; // Force the good to be displayed
    console.assert(stockDiv.clientHeight === heightWithDelta);

    console.log('Finished testStockMarketRows()');
}

async function testStockMarketHistory() {
    Util.wipeSave("with minigames");
    await Util.waitMinigame('Bank');

    // Right now, the stock market has 16 minutes of history
    let saveGame = Game.WriteSave(1);

    Game.Objects.Bank.minigame.tick();
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 18);
    Util.wipeSave("with minigames");
    Game.LoadSave(saveGame);
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);

    Game.Objects.Bank.minigame.tick();
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 18);
    Game.LoadSave(saveGame);
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);

    // Test disabling the function
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonsaveStockMarketHistory').click();
    saveGame = Game.WriteSave(1);
    Game.LoadSave(saveGame);
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 2);

    // Enable it again
    document.getElementById('SpiceButtonsaveStockMarketHistory').click();


    // Tick a few times, we want to make sure it resets on ascension
    for(let i = 0; i < 15; i++) Game.Objects.Bank.minigame.tick();
    Util.Ascend(); Util.Reincarnate();

    Game.Objects.Bank.getFree(1); // Unlock the minigame
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);

    // Make sure loading the mod with an existing save does not break it
    Spice.saveGame = Spice.defaultSaveGame();
    Spice.loadStockMarketHistory(); // Pretend we just ran Game.LoadMod('Spice.js')
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 17);
    Game.Objects.Bank.minigame.tick();
    console.assert(Game.Objects.Bank.minigame.goodsById[0].vals.length === 18);

    // Make sure loading the mod with an old version does not break it
    Util.wipeSave('with minigames');
    let original = Spice.stockMarketGoodsCount;
    Spice.stockMarketGoodsCount = () => 15; // fool saveStockMarketHistory
    save = Game.WriteSave(1);
    Spice.stockMarketGoodsCount = original;
    Game.LoadSave(save);
    Game.Objects.Bank.minigame.tick(); // Should not throw any exceptions
    console.log('Finished testStockMarketHistory()');
}

function testAcrossAscensionsStatistics() {
    Util.wipeSave();
    Game.Earn(1e9); // Unlock sugar lumps, which unlocks the 'Special' section of the stats menu
    document.getElementById('statsButton').click();
    console.assert(document.getElementById('menu').textContent.indexOf("Special") !== -1);

    Game.cookieClicks = 5;
    Game.wrinklersPopped = 7;
    Game.reindeerClicked = 13;
    Game.handmadeCookies = 19;
    Game.UpdateMenu();

    console.assert(document.getElementById('menu').textContent.indexOf("Cookie clicks : 5 (all time : 5)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Wrinklers popped : 7 (all time : 7)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Reindeer found : 13 (all time : 13)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Hand-made cookies : 19 (all time : 19)") !== -1);

    Util.Ascend(); Util.Reincarnate();

    console.assert(Spice.saveGame.bigCookieClicksPreviousAscensions === 5);
    console.assert(Spice.saveGame.wrinklersPoppedPreviousAscensions === 7);
    console.assert(Spice.saveGame.reindeerClickedPreviousAscensions === 13);
    console.assert(Spice.saveGame.handmadeCookiesPreviousAscensions === 19);

    Game.cookieClicks = 1000;
    Game.wrinklersPopped = 3000;
    Game.reindeerClicked = 1700;
    Game.handmadeCookies = 2300;
    Game.UpdateMenu();
    console.assert(document.getElementById('menu').textContent.indexOf("Cookie clicks : 1,000 (all time : 1,005)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Wrinklers popped : 3,000 (all time : 3,007)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Reindeer found : 1,700 (all time : 1,713)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Hand-made cookies : 2,300 (all time : 2,319)") !== -1);

    let saveGame = Game.WriteSave(1);
    Spice.saveGame = Spice.defaultSaveGame(); // Wipe save data
    Spice.saveGame.bigCookieClicksPreviousAscensions = 55;
    Spice.saveGame.wrinklersPoppedPreviousAscensions = 77;
    Spice.saveGame.reindeerClickedPreviousAscensions = 133;
    Spice.saveGame.handmadeCookiesPreviousAscensions = 199;
    Util.wipeSave();
    console.assert(Spice.saveGame.bigCookieClicksPreviousAscensions === 0);
    console.assert(Spice.saveGame.wrinklersPoppedPreviousAscensions === 0);
    console.assert(Spice.saveGame.reindeerClickedPreviousAscensions === 0);
    console.assert(Spice.saveGame.handmadeCookiesPreviousAscensions === 0);
    Game.LoadSave(saveGame);
    Game.UpdateMenu();
    console.assert(document.getElementById('menu').textContent.indexOf("Cookie clicks : 1,000 (all time : 1,005)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Wrinklers popped : 3,000 (all time : 3,007)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Reindeer found : 1,700 (all time : 1,713)") !== -1);
    console.assert(document.getElementById('menu').textContent.indexOf("Hand-made cookies : 2,300 (all time : 2,319)") !== -1);

    console.log("Finished testAcrossAscensionsStatistics()");
}

async function testStockMarketTallying() {
    Util.wipeSave("with minigames");

    await Util.waitMinigame('Bank');

    Game.Objects.Bank.switchMinigame(true); // Show the minigame
    let profitRow = document.getElementById('bankTally').parentNode;

    Game.Objects.Bank.minigame.profit = -10;
    Spice.updateProfitTallyDisplay();
    console.assert(profitRow.textContent.indexOf("all time : $0") !== -1);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtontallyOnlyStockMarketProfits').click();
    document.getElementById('prefsButton').click();
    console.assert(profitRow.textContent.indexOf("all time : -$10") !== -1);

    Game.Objects.Bank.minigame.profit = 50;
    Spice.updateProfitTallyDisplay();
    console.assert(profitRow.textContent.indexOf("all time : $50") !== -1);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtontallyOnlyStockMarketProfits').click();
    document.getElementById('prefsButton').click();
    console.assert(profitRow.textContent.indexOf("all time : $50") !== -1);

    Util.Ascend();
    console.assert(Spice.saveGame.stockMarketProfitsPreviousAscensions === 50);
    Util.Reincarnate();

    Game.Objects.Bank.getFree(1);
    Game.Objects.Bank.minigame.profit = -15;
    Spice.settings.tallyOnlyStockMarketProfits = true; // no need to check toggles anymore
    Spice.updateProfitTallyDisplay();
    console.assert(profitRow.textContent.indexOf("all time : $50") !== -1);
    Spice.settings.tallyOnlyStockMarketProfits = false;
    Spice.updateProfitTallyDisplay();
    console.assert(profitRow.textContent.indexOf("all time : $35") !== -1);

    Util.Ascend();
    console.assert(Spice.saveGame.stockMarketProfitsPreviousAscensions === 35);
    Util.Reincarnate();

    Game.Objects.Bank.minigame.profit = -10;
    Spice.settings.tallyOnlyStockMarketProfits = true;
    Spice.updateProfitTallyDisplay();
    console.assert(profitRow.textContent.indexOf("all time : $35") !== -1);

    Util.Ascend();
    console.assert(Spice.saveGame.stockMarketProfitsPreviousAscensions === 35);
    Util.Reincarnate();

    let saveGame = Game.WriteSave(1);
    Util.wipeSave();

    /* Wiping the save re-runs Game.Objects.Bank.minigame.launch,
     * which repopulates the bank minigame div.
     * So we have to run the line below again. */
    profitRow = document.getElementById('bankTally').parentNode;
    console.assert(profitRow.textContent.indexOf("all time : $0") !== -1);
    Game.LoadSave(saveGame);
    console.assert(profitRow.textContent.indexOf("all time : $35") !== -1);

    /* I don't think the situation below will ever happen,
     * because Spice.updateProfitTallyDisplay should be called every time the profit changes,
     * but just in case.
     */
    Game.Objects.Bank.minigame.profit = 30;
    Util.Ascend(); Util.Reincarnate();
    console.assert(Spice.saveGame.stockMarketProfitsPreviousAscensions === 65);
    console.assert(profitRow.textContent.indexOf("all time : $65") !== -1);

    console.log("Finished testStockMarketTallying()");
}

async function testAcrossAscensionsAchievements() {
    Util.wipeSave('with minigames'); Util.startGrandmapocalypse();
    Spice.settings.awardAchievementsAcrossAscensions = false;

    Spice.saveGame.wrinklersPoppedPreviousAscensions = 49;
    Spice.saveGame.reindeerClickedPreviousAscensions = 49;
    Spice.saveGame.handmadeCookiesPreviousAscensions = 999;
    Spice.saveGame.stockMarketProfitsPreviousAscensions = 16e6;

    Util.spawnAndPopWrinkler();
    console.assert(!Game.HasAchiev('Wrinklesquisher'));

    Util.spawnReindeer().pop();
    console.assert(!Game.HasAchiev('Sleigh of hand'));

    Util.clickBigCookie();
    console.assert(!Game.HasAchiev('Clicktastic'));

    await Util.waitMinigame('Bank');

    Game.Objects['Bank'].minigame.goodsById[3].stock = 1;
    Game.Objects['Bank'].minigame.goodsById[3].val = 16e6;
    Game.Objects['Bank'].minigame.sellGood(3, 1)
    console.assert(!Game.HasAchiev('Gaseous assets'));

    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonawardAchievementsAcrossAscensions').click();
    document.getElementById('prefsButton').click();

    console.assert(Game.HasAchiev('Wrinklesquisher'));
    console.assert(Game.HasAchiev('Sleigh of hand'));
    console.assert(Game.HasAchiev('Clicktastic'));
    console.assert(Game.HasAchiev('Liquid assets'));

    // Now try again, but with the setting being true
    Util.wipeSave('with minigames'); Util.startGrandmapocalypse();
    Spice.settings.awardAchievementsAcrossAscensions = true;

    Spice.saveGame.wrinklersPoppedPreviousAscensions = 49;
    Spice.saveGame.reindeerClickedPreviousAscensions = 49;
    Spice.saveGame.handmadeCookiesPreviousAscensions = 999;
    Spice.saveGame.stockMarketProfitsPreviousAscensions = 16e6;

    console.assert(!Game.HasAchiev('Wrinklesquisher'));
    console.assert(!Game.HasAchiev('Sleigh of hand'));
    console.assert(!Game.HasAchiev('Clicktastic'));
    console.assert(!Game.HasAchiev('Liquid assets'));

    Util.spawnAndPopWrinkler();
    console.assert(Game.HasAchiev('Wrinklesquisher'));

    Util.spawnReindeer().pop();
    console.assert(Game.HasAchiev('Sleigh of hand'));

    Util.clickBigCookie();
    console.assert(Game.HasAchiev('Clicktastic'));

    Game.Objects['Bank'].minigame.goodsById[3].stock = 1;
    Game.Objects['Bank'].minigame.goodsById[3].val = 16e6;
    Game.Objects['Bank'].minigame.sellGood(3, 1)
    console.assert(Game.HasAchiev('Liquid assets'));

    console.log("Finished testAcrossAscensionsAchievements()");
}

function testAcrossAscensionsExtraAchievements() {
    Util.wipeSave(); Util.startGrandmapocalypse();
    Spice.settings.awardAchievementsAcrossAscensions = false; // Things should work even in this case

    Spice.saveGame.wrinklersPoppedPreviousAscensions = 999;
    Spice.saveGame.reindeerClickedPreviousAscensions = 999;

    Util.spawnAndPopWrinkler();
    console.assert(!Game.HasAchiev('Parasitesmasher'));

    Util.spawnReindeer().pop();
    console.assert(!Game.HasAchiev('A sleightly longer grind'));

    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonextraAchievementsAcrossAscensions').click();
    document.getElementById('prefsButton').click();

    console.assert(Game.HasAchiev('Parasitesmasher'));
    console.assert(Game.HasAchiev('A sleightly longer grind'));

    // Now try again, but with the setting being true
    Util.wipeSave('with minigames'); Util.startGrandmapocalypse();
    Spice.settings.awardAchievementsAcrossAscensions = true;

    Spice.saveGame.wrinklersPoppedPreviousAscensions = 999;
    Spice.saveGame.reindeerClickedPreviousAscensions = 999;

    console.assert(!Game.HasAchiev('Parasitesmasher'));
    console.assert(!Game.HasAchiev('A sleightly longer grind'));

    Util.spawnAndPopWrinkler();
    console.assert(Game.HasAchiev('Parasitesmasher'));

    Util.spawnReindeer().pop();
    console.assert(Game.HasAchiev('A sleightly longer grind'));

    console.log("Finished testAcrossAscensionsExtraAchievements()");
}

async function testStockMarketAchievements() {
    Util.wipeSave("with minigames");
    await Util.waitMinigame('Bank');

    Game.Objects['Bank'].minigame.profit = 1e6 + 1;
    Game.Objects['Bank'].minigame.goodsById[3].stock = 1;
    Game.Objects['Bank'].minigame.sellGood(3, 1)
    console.assert(!Game.HasAchiev('Who wants to be a millionaire?'));

    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonextraStockMarketAchievements').click();
    document.getElementById('prefsButton').click();
    console.assert(Game.HasAchiev('Who wants to be a millionaire?'));

    Util.wipeSave('with minigames');
    console.assert(!Game.HasAchiev('Who wants to be a millionaire?'));
    Game.Objects['Bank'].minigame.profit = 1e6 + 1;
    Game.Objects['Bank'].minigame.goodsById[3].stock = 1;
    Game.Objects['Bank'].minigame.sellGood(3, 1);
    console.assert(Game.HasAchiev('Who wants to be a millionaire?'));

    Game.Objects['Bank'].minigame.goodsById[3].stock = 3;
    Game.Objects['Bank'].minigame.sellGood(3, 1);
    console.assert(!Game.HasAchiev('Failing on purpose'));
    Game.Objects['Bank'].minigame.goodsById[3].val = 50; // for definiteness
    Game.Objects['Bank'].minigame.profit = -2e6;
    Game.Objects['Bank'].minigame.sellGood(3, 1);
    console.assert(!Game.HasAchiev('Failing on purpose'));
    Game.Objects['Bank'].minigame.sellGood(3, 1);
    console.assert(Game.HasAchiev('Failing on purpose'));

    console.assert(!Game.HasAchiev('Solid assets'));
    Game.Objects['Bank'].minigame.profit = -32e6;
    Game.Objects['Bank'].minigame.buyGood(4, 1);
    console.assert(Game.HasAchiev('Solid assets')); // even while having stock

    console.log("Finished testStockMarketAchievements()");
}

function testAchievementCreation() {
    // This test must be run in isolation
    console.assert(!('Parasitesmasher' in Game.Achievements));
    console.assert(!('Who wants to be a millionaire?' in Game.Achievements));

    // Pretend we are loading a complete save
    Spice.loadObject({
        version: Spice.version,
        settings: {
            extraAchievementsAcrossAscensions: true,
            extraStockMarketAchievements: true,
            achievementsForBackingUp: true,
        }
    });

    console.assert('Parasitesmasher' in Game.Achievements);
    console.assert('Who wants to be a millionaire?' in Game.Achievements);
    console.assert('Archivist' in Game.Achievements);

    console.log("Finished testAchievementCreation()");
}

function testHeavenlyChipsNumericalPrecision() {
    // First show the vanilla formula is bad
    Util.wipeSave();
    Game.Earn(1e75); // One sextillion (1e21) heavenly chips
    Util.Ascend(); Util.Reincarnate();

    // Next prestige level happens at (1e63 + 3e42 + 3e21 + 1)*1e12
    Game.Earn(3.001e42*1e12); // Enough for a heavenly chip
    let saveGame = Game.WriteSave(1);

    Util.Ascend(); Util.Reincarnate();
    console.assert(Game.resets == 1); // Precision loss

    Game.LoadSave(saveGame);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonnumericallyStableHeavenlyChipGains').click();
    document.getElementById('prefsButton').click();
    Util.Ascend(); Util.Reincarnate();
    console.assert(Game.resets == 2); // No precision loss here

    // Make sure we didn't mess up regular ascension
    Util.wipeSave();
    Game.Earn(1e12);
    Util.Ascend(); Util.Reincarnate();
    console.assert(Game.resets == 1);

    Game.Earn(6.9e12); // Not enough for another chip
    Util.Ascend(); Util.Reincarnate();
    console.assert(Game.resets == 1);

    console.log("Finished testHeavenlyChipsNumericalPrecision()");
}

function testSeasonalCookieTooltips() {
    Util.wipeSave();
    let desc = "";

    Game.Upgrades[Game.easterEggs[0]].unlock();
    Game.Upgrades[Game.easterEggs[1]].unlock();
    Game.Upgrades[Game.easterEggs[2]].unlock();
    Game.Upgrades[Game.easterEggs[3]].earn();
    Game.Upgrades[Game.easterEggs[4]].earn();
    desc = Game.Upgrades['Bunny biscuit'].descFunc();
    console.assert(desc.includes("5/" + Game.easterEggs.length));

    Game.Upgrades[Game.santaDrops[0]].unlock();
    Game.Upgrades[Game.santaDrops[1]].unlock();
    Game.Upgrades[Game.santaDrops[2]].earn();
    Game.Upgrades[Game.reindeerDrops[0]].unlock();
    Game.Upgrades[Game.reindeerDrops[1]].unlock();
    Game.Upgrades[Game.reindeerDrops[2]].unlock();
    Game.Upgrades[Game.reindeerDrops[3]].unlock();
    Game.Upgrades[Game.reindeerDrops[4]].earn();
    Game.Upgrades[Game.reindeerDrops[5]].earn();
    Game.Upgrades[Game.reindeerDrops[6]].earn();
    desc = Game.Upgrades['Festive biscuit'].descFunc();
    console.assert(desc.includes("3/" + Game.santaDrops.length));
    console.assert(desc.includes("7/" + Game.reindeerDrops.length));

    Game.Upgrades[Game.halloweenDrops[0]].unlock();
    Game.Upgrades[Game.halloweenDrops[1]].earn();
    desc = Game.Upgrades['Ghostly biscuit'].descFunc();
    console.assert(desc.includes("1/" + Game.halloweenDrops.length));

    Game.Upgrades[Game.heartDrops[0]].unlock();
    Game.Upgrades[Game.heartDrops[1]].earn();
    Game.Upgrades[Game.heartDrops[2]].earn();
    desc = Game.Upgrades['Lovesick biscuit'].descFunc();
    console.assert(desc.includes("3/" + Game.heartDrops.length));

    // Test that earning everything does not change the line
    let text = Game.easterEggs.length + "/" + Game.easterEggs.length;
    for(let name of Game.easterEggs) Game.Upgrades[name].unlock();
    desc = Game.Upgrades['Bunny biscuit'].descFunc();
    console.assert(Array.from(desc.matchAll(text)).length == 1);

    // Test that unlocking everything does change the line
    for(let name of Game.easterEggs) Game.Upgrades[name].earn();
    desc = Game.Upgrades['Bunny biscuit'].descFunc();
    console.assert(Array.from(desc.matchAll(text)).length == 1);

    // Test that the setting is respected
    Spice.settings.autohideSeasonalBiscuitsTooltip = false;
    desc = Game.Upgrades['Bunny biscuit'].descFunc();
    console.assert(Array.from(desc.matchAll(text)).length == 2);

    console.log("Finished testSeasonalCookieTooltips()");
}

function testTranscendentDebugging() {
    Util.wipeSave();
    Game.Upgrades['Perfect idling'].earn();
    Util.Ascend(); Util.Reincarnate();
    console.assert(!Game.Has('Perfect idling'));

    Game.Upgrades['Perfect idling'].earn();
    Game.Upgrades['Transcendent debugging'].earn();
    Util.Ascend(); Util.Reincarnate();
    console.assert(Game.Has('Perfect idling'));
    console.assert(Game.Has('Transcendent debugging'));

    console.log("Finished testTranscendentDebugging()");
}

function testDiscrepancyPatch() {
    /* One nasty effect of the lack of proper Date.now() mocking
     * is that this test only passes within an hour of loading page.
     */
    Util.wipeSave();
    Game.Earn(1e12); Game.doLumps(); // Unlock lumps
    Game.lumpT = Util.defaultMockedDate;
    console.assert(Game.lumpsTotal === 0);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchDiscrepancy').click();
    document.getElementById('prefsButton').click();

    let save = Game.WriteSave(1);

    Util.mockedDate += 25*3600*1000;
    for(let i = 0; i < 100; i++) { // The Vanilla is time-sensitive, this patch should not be
        Game.LoadSave(save);
        console.assert(Game.lumpT === Util.defaultMockedDate + 24*3600*1000);
    }

    Util.mockedDate += 24*3600*1000;
    Game.doLumps();
    console.assert(Game.lumpT === Util.defaultMockedDate + 2*24*3600*1000);

    Util.mockedDate += 22*3600*1000 + 1;
    Game.doLumps();
    console.assert(Game.lumpT === Util.defaultMockedDate + 2*24*3600*1000);
    Game.clickLump();
    console.assert(Game.lumpT < Util.defaultMockedDate + 3*24*3600*1000);
    console.assert(Game.lumpT > Util.mockedDate);

    console.log("Finished testDiscrepancyPatch()");
}

async function testPantheonSlotSwapFix() {
    Util.wipeSave('with minigames');

    await Util.waitMinigame('Temple');
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchPantheonSwaps').click();
    document.getElementById('prefsButton').click();

    let M = Game.Objects['Temple'].minigame;
    M.slotGod(M.godsById[0], 0);
    M.slotGod(M.godsById[1], 1);
    M.slotGod(M.godsById[2], 2);
    M.swaps = 3;
    console.assert(M.slotGod(M.godsById[3], 0) != false);
    console.assert(M.slotGod(M.godsById[4], 0) != false);
    console.assert(M.slotGod(M.godsById[2], 1) != false);
    console.assert(!(-1 in M.slot));
    console.assert(M.slot[0] === 4);
    console.assert(M.slot[1] === 2);
    console.assert(M.slot[2] === 1);
    console.assert(M.godsById[0].slot === -1);
    console.assert(M.godsById[1].slot === 2);
    console.assert(M.godsById[2].slot === 1);
    console.assert(M.godsById[3].slot === -1);
    console.assert(M.godsById[4].slot === 0);

    console.log('Finished testPantheonSlotSwapFix()');
}

function testAchievementsForBackingUp() {
    Util.wipeSave();
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonachievementsForBackingUp').click();

    let exportSave = function() {
        Game.ExportSave();
        let save = document.getElementById('textareaPrompt').textContent;
        document.getElementById('promptOption0').click();
        return save;
    }

    let save = exportSave();
    console.assert(Game.HasAchiev('Archivist'));
    console.assert(Spice.saveGame.numberOfBackups === 1);
    Game.LoadSave(save);
    console.assert(Game.HasAchiev('Archivist'));
    console.assert(Spice.saveGame.numberOfBackups === 1);

    console.assert(Spice.saveGame.numberOfValidBackups === 1);
    save = exportSave();
    console.assert(Spice.saveGame.numberOfBackups === 2);
    console.assert(Spice.saveGame.numberOfValidBackups === 1);

    Util.mockedDate += 3600*1000;
    save = exportSave();
    Util.mockedDate += 3600*1000;
    save = exportSave();
    console.assert(Spice.saveGame.numberOfValidBackups === 1);
    console.assert(Spice.saveGame.numberOfBackups === 4);

    Util.mockedDate += 18*3600*1000;
    save = exportSave();
    console.assert(Spice.saveGame.numberOfBackups === 5);
    console.assert(Spice.saveGame.numberOfValidBackups === 2);
    Game.LoadSave(save);
    console.assert(Spice.saveGame.numberOfBackups === 5);
    console.assert(Spice.saveGame.numberOfValidBackups === 2);

    Util.mockedDate += 20*3600*1000;
    exportSave(); // Discard this save
    Game.LoadSave(save);
    console.assert(Spice.saveGame.numberOfBackups === 5);
    console.assert(Spice.saveGame.numberOfValidBackups === 2);
    save = exportSave();
    console.assert(Spice.saveGame.numberOfBackups === 6);
    console.assert(Spice.saveGame.numberOfValidBackups === 3);

    Spice.saveGame.numberOfValidBackups = 29; // Speeding things up
    save = exportSave();
    console.assert(Spice.saveGame.numberOfValidBackups === 29); // No time changes
    console.assert(!Game.HasAchiev('Diligent archivist'));

    Util.mockedDate += 20*3600*1000;
    save = exportSave();
    console.assert(Spice.saveGame.numberOfValidBackups === 30);
    console.assert(Game.HasAchiev('Diligent archivist'));
    Game.LoadSave(save);
    console.assert(Game.HasAchiev('Diligent archivist'));

    console.assert(Spice.sessionData.backupsThisSession === 9);
    save = exportSave();
    Game.LoadSave(save);
    console.assert(Spice.sessionData.backupsThisSession === 10);
    exportSave(); // Discard the save
    Game.LoadSave(save);
    console.assert(Spice.sessionData.backupsThisSession === 11);

    Util.wipeSave(); // Wiping save does not change the settings
    console.assert(Spice.saveGame.numberOfBackups === 0); // Properly wiped out
    console.assert(Spice.sessionData.backupsThisSession === 11); // Survives even across wipe saves
    exportSave(); // Discard the save
    console.assert(Spice.sessionData.backupsThisSession === 12);
    Game.LoadSave(save);
    console.assert(Spice.sessionData.backupsThisSession === 12);

    console.assert(!Game.HasAchiev('Paranoid archivist'));
    Spice.sessionData.backupsThisSession = 29;
    save = exportSave();
    console.assert(Game.HasAchiev('Paranoid archivist'));
    Game.LoadSave(save);
    console.assert(Game.HasAchiev('Paranoid archivist'));

    Util.wipeSave();
    save = exportSave();
    console.assert(Game.HasAchiev('Paranoid archivist'));

    console.log("Finished testAchievementsForBackingUp()");
}

function testSugarFrenzyPatch() {
    Util.wipeSave();
    Game.Earn(1e9); // Unlock lumps
    Game.Upgrades['Sugar craving'].earn();
    Util.Ascend(); Util.Reincarnate();
    Game.lumps = 1;
    Game.Upgrades['Sugar frenzy'].click();
    console.assert(Game.Upgrades['Sugar frenzy'].bought == 0); // Check it is still present

    Game.lumps = 1;
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchSugarFrenzyPersistence').click();
    Game.Upgrades['Sugar frenzy'].click();
    console.assert(Game.Upgrades['Sugar frenzy'].bought == 1); // Check the patch works

    console.log("Finished testSugarFrenzyPatch()");
}

function test777buffs() {
    let unlockHC = function() {
        Game.Upgrades['Heavenly chip secret'].earn();
        Game.Upgrades['Heavenly cookie stand'].earn();
        Game.Upgrades['Heavenly bakery'].earn();
        Game.Upgrades['Heavenly confectionery'].earn();
        Game.Upgrades['Heavenly key'].earn();
    }
    Util.wipeSave();

    unlockHC();
    Game.Upgrades['Lucky digit'].earn();
    Game.Upgrades['Lucky number'].earn();

    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01**2));
    Spice.settings.buff777upgrades = true;
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01*1.02));

    Game.Upgrades['Lucky payout'].earn();
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01*1.02*1.04));
    Spice.settings.buff777upgrades = false;
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01**3));

    let gc = new Game.shimmer('golden');
    console.assert(approx(gc.dur, 13*1.01**3));
    gc.force = 'multiply cookies'; gc.pop(); // Safely getting rid of the golden cookie

    Spice.settings.buff777upgrades = true;
    gc = new Game.shimmer('golden');
    console.assert(approx(gc.dur, 13*1.01*1.02*1.04));

    gc.force = 'frenzy'; gc.pop();
    console.assert(Game.buffs.Frenzy.maxTime == Math.ceil(77*1.01*1.02*1.04)*Game.fps);

    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonextra777seriesUpgrades').click();
    document.getElementById('prefsButton').click();

    Game.Upgrades['Lucky tally'].earn();
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01*1.02*1.04*1.08));
    Game.Upgrades['Lucky value'].earn();
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01*1.02*1.04*1.08*1.16));

    Spice.settings.buff777upgrades = false;
    console.assert(approx(Game.GetHeavenlyMultiplier(), 1.01**5));

    console.log("Finished test777buffs()");
}

function test777acquisition() {
    let earnHCUpgrades = function() {
        Game.Upgrades['Legacy'].earn();
        Game.Upgrades['Heavenly luck'].earn();
        Game.Upgrades['Lasting fortune'].earn();
        Game.Upgrades['Decisive fate'].earn();
    }

    Util.wipeSave();
    earnHCUpgrades();
    Game.Earn(8e8**3*1.00000001e12); // 800_000_002 prestige levels
    Util.Ascend(); Util.Reincarnate();
    Game.Earn(800_777_779**3*1.0000000000001e12 - 8e8**3*1.00000001e12); // another 777_777 levels

    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonsimplify777upgradeAcquisition').click();
    document.getElementById('prefsButton').click();
    let save = Game.WriteSave(1);
    Util.Ascend();
    console.assert(document.getElementById('heavenlyUpgrade411') != null);
    console.assert(document.getElementById('heavenlyUpgrade412') != null);
    console.assert(document.getElementById('heavenlyUpgrade413') != null);
    Util.Reincarnate();
    Util.Ascend();
    console.assert(document.getElementById('heavenlyUpgrade411') == null);
    console.assert(document.getElementById('heavenlyUpgrade412') == null);
    console.assert(document.getElementById('heavenlyUpgrade413') == null);
    Util.Reincarnate();

    Util.wipeSave();
    earnHCUpgrades();
    Game.Upgrades['Lucky payout'].earn();

    console.assert(Spice.settings.simplify777upgradeAcquisition == true);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonextra777seriesUpgrades').click();
    document.getElementById('prefsButton').click();
    Game.Earn(1e12+1); // One prestige level
    Util.Ascend();
    Util.Reincarnate();
    Game.Earn( (777_777_777_777_777 + 1)**3 * 1e12 ); // 777_777_777_777_777 prestige levels
    console.assert(Spice.stableHeavenlyChipGains() == 777_777_777_777_777);

    save = Game.WriteSave(1);
    let luckyTallyDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky tally'].id;
    Util.Ascend();
    console.assert(document.getElementById(luckyTallyDivId) != null); // It is unlocking
    console.log(luckyTallyDivId);

    Util.Reincarnate();
    Game.LoadSave(save);
    Game.Upgrades['Lucky tally'].earn();
    Util.Ascend();
    let luckyValueDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky value'].id;
    console.assert(document.getElementById(luckyValueDivId) != null); // It is unlocking

    Util.Reincarnate();
    Util.Ascend();
    console.assert(document.getElementById(luckyValueDivId) == null); // It is also locking

    Util.Reincarnate();
    Game.LoadSave(save);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonsimplify777upgradeAcquisition').click();
    document.getElementById('prefsButton').click();
    console.assert(Spice.settings.simplify777upgradeAcquisition == false);
    Util.Ascend();
    console.assert(document.getElementById(luckyTallyDivId) != null); // It still unlocks
    Util.Reincarnate();

    console.log("Finished test777acquisition()");
}

function testHeavenlyBackdoor() {
    Util.wipeSave();
    Game.Upgrades['Heavenly backdoor'].earn();
    Util.Ascend();
    console.assert(document.getElementById('heavenlyUpgrade181') != null);
    Util.Reincarnate();
    Util.Ascend();
    console.assert(document.getElementById('heavenlyUpgrade181') == null); // lost the upgrade
    Util.Reincarnate();

    console.log("Finished testHeavenlyBackdoor()");
}

async function testGFDDelayPatch() {
    Util.wipeSave('with minigames');
    Game.seed = 'aaaaa';

    await Util.waitMinigame('Wizard tower');

    Game.Objects['Wizard tower'].minigame.magic = 50;
    let save = Game.WriteSave(1);

    document.getElementById('grimoireSpell6').click(); // cast GFD, get FtHoF
    console.assert(Game.Objects['Wizard tower'].minigame.magic == 45);
    await Util.waitPredicate(() => Math.floor(Game.Objects['Wizard tower'].minigame.magic) != 45);
    console.assert(Math.floor(Game.Objects['Wizard tower'].minigame.magic) == 25);
    console.assert(Game.shimmers.length == 1);
    console.assert(Game.shimmers[0].force == 'clot');
    // This is the same as backfiring FtHoF with one spell cast

    // Patch, and check the patch works:
    Game.LoadSave(save);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchGFDDelay').click();
    document.getElementById('prefsButton').click();
    document.getElementById('grimoireSpell6').click(); // cast GFD, get FtHoF
    console.assert(Game.Objects['Wizard tower'].minigame.magic == 25); // Instantaneous
    console.assert(Game.shimmers.length == 1);
    console.assert(Game.shimmers[0].force == 'cookie storm drop');
    // This is the same as succeeding FtHoF with zero spells cast

    console.log("Finished testGFDDelayPatch()");
}

async function testSeasonsAffectingFtHoFPatch() {
    Util.wipeSave('with minigames');
    Game.seed = 'aaaaa';
    await Util.waitMinigame('Wizard tower');
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchGFDDelay').click();
    document.getElementById('prefsButton').click(); // Easier testing

    let save = Game.WriteSave(1); // Same setup as testGFDDelayPatch

    let testFtHoF = function() {
        Game.Objects['Wizard tower'].minigame.magic = 50;
        document.getElementById('grimoireSpell1').click(); // cast FtHoF
        console.assert(Game.shimmers[0].force == 'cookie storm drop');

        Game.Objects['Wizard tower'].minigame.magic = 50;
        Game.Objects['Wizard tower'].minigame.spellsCastTotal = 5;
        Game.killShimmers();
        document.getElementById('grimoireSpell1').click();
        console.assert(Game.shimmers[0].force == 'clot');
    };
    testFtHoF();

    // Same results if we do patch FtHoF
    Game.LoadSave(save);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchSeasonsAffectingFtHoF').click();
    document.getElementById('prefsButton').click();
    save = Game.WriteSave(1);

    testFtHoF();

    // Same results if we change seasons
    Game.LoadSave(save);
    Game.season = 'valentines';
    testFtHoF();

    // Same results after wiping the save
    Util.wipeSave('with minigames');
    Game.seed = 'aaaaa';
    testFtHoF();

    console.log("Finished testSeasonsAffectingFtHoFPatch()");
}

function testDoublePop() {
    Util.wipeSave();

    // First demonstrate the bug
    let gc = new Game.shimmer('golden');
    gc.force = 'cookie storm drop';
    gc.pop();
    console.assert(Game.buffs.Frenzy == undefined);
    Math.seedrandom('test'); // Guarantees next pop is a Frenzy
    try {
        gc.pop();
    } catch (e) {
        // An exception is thrown when the game tries to remove the shimmer node twice
    }
    console.assert(Game.buffs.Frenzy != undefined); // A buff is generated nonetheless

    Util.wipeSave();
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchDoublePop').click();
    document.getElementById('prefsButton').click();

    gc = new Game.shimmer('golden'); // Same setup
    gc.force = 'cookie storm drop';
    gc.pop();
    Math.seedrandom('test');
    gc.pop();
    console.assert(Game.buffs.Frenzy == undefined); // Second pop has no effect
}
