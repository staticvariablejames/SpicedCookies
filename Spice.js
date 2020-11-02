// SPDX-License-Identifier: GPL-3.0-or-later

var Spice = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// Spice.launch is at the end of this file.
Spice.name = "Spiced Cookies";
Spice.version = "0.2.2"; // Semantic versioning
Spice.GameVersion = "2.031";
Spice.CCSEVersion = "2.020";

/* Injects or modifies the given function.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 * The altered function is returned.
 */
Spice.rewriteCode = function(targetFunction, pattern, replacement) {
    let code = targetFunction.toString();
    let newCode = code.replace(pattern, replacement);
    return (new Function('return ' + newCode))();
}

/* Both settings and saveGame are stored in the CCSE.config,
 * but the save game is reset on a wipeSave whereas the settings are not.
 */
Spice.settings = { // default settings
    displayStockDelta: true,
    saveStockMarketHistory: true,
    tallyOnlyStockMarketProfits: true,
    awardAchievementsAcrossAscensions: true,
    extraAchievementsAcrossAscensions: false,
    extraStockMarketAchievements: false,
    numericallyStableHeavenlyChipGains: false,
    autohideSeasonalBiscuitsTooltip: true,
};

Spice.defaultSaveGame = function() {
    return {
        stockMarketHistory: [],
        bigCookieClicksPreviousAscensions: 0,
        wrinklersPoppedPreviousAscensions: 0,
        reindeerClickedPreviousAscensions: 0,
        handmadeCookiesPreviousAscensions: 0,
        stockMarketProfitsPreviousAscensions: 0,
    };
}
Spice.saveGame = Spice.defaultSaveGame();

/************************************************
 * Module: display deltas of stock market goods *
 ************************************************/

Spice.stockMarketGoodsCount = function() {
    if(Game.Objects['Bank'].minigame)
        return Game.Objects['Bank'].minigame.goodsById.length;
    else
        return 0;
    /* The functions below iterate through all possible good ids.
     * If the goods count equals zero, the functions have no effect.
     * This disable the functions and prevents errors if the market hasn't loaded yet.
     */
}

/* The first time this function is called with a given ID,
 * it creates a row with the text "delta: --" below the row with the value of the good,
 * and returns the div that points to the "--" part of the row.
 * Subsequent calls only returns the created div.
 */
Spice.stockMarketDeltaRow = function(stockId) {
    let div = document.getElementById('stockMarketDelta-' + stockId);
    if(div) return div;

    let upperBox = document.getElementById('bankGood-' + stockId).firstChild;
    let valueDiv = document.getElementById('bankGood-' + stockId + '-val').parentNode;
    let deltaDiv = upperBox.insertBefore(document.createElement("div"), valueDiv.nextSibling);

    // Copy the style from the other div, because assigning quantileDiv.style don't work
    for(let key in valueDiv.style) {
        deltaDiv.style[key] = valueDiv.style[key];
    }

    deltaDiv.innerHTML = 'delta: <div id="stockMarketDelta-' + stockId + '" ' +
        'style="display:inline; font-weight:bold;">0</div>';

    return document.getElementById('stockMarketDelta-' + stockId);
}

/* Updates the text inside the row created by Spice.createStockMarketDeltaRows.
 * This is pushed to Game.customMinigame.Bank.tick.
 */
Spice.updateStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let div = Spice.stockMarketDeltaRow(i);
        if(div) {
            div.innerHTML = Math.floor(1000*Game.Objects['Bank'].minigame.goodsById[i].d)/1000;
        }
    }
}

// Show the delta rows
Spice.enableStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let deltaDiv = Spice.stockMarketDeltaRow(i).parentNode;
        deltaDiv.style.display = "block";
    }
}

// Hide the delta rows
Spice.disableStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let deltaDiv = Spice.stockMarketDeltaRow(i).parentNode;
        deltaDiv.style.display = "none";
    }
}

/*****************************************
 * Module: save the stock market history *
 *****************************************/

Spice.saveStockMarketHistory = function() {
    // Executed when saving the game
    Spice.saveGame.stockMarketHistory = [];
    if(!Spice.settings.saveStockMarketHistory) return;
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        Spice.saveGame.stockMarketHistory[i] = Game.Objects['Bank'].minigame.goodsById[i].vals;
    }
}

Spice.loadStockMarketHistory = function() {
    // Executed when loading the save game
    if(!Spice.settings.saveStockMarketHistory) return;
    if(!Spice.saveGame.stockMarketHistory) return;
    if(Spice.saveGame.stockMarketHistory.length === 0) return;
    if(Spice.saveGame.stockMarketHistory[0].length < 1) return;
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        if(i in Spice.saveGame.stockMarketHistory)
            Game.Objects['Bank'].minigame.goodsById[i].vals = Spice.saveGame.stockMarketHistory[i];
        // Spice.saveGame.stockMarketHistory[i] won't exist if e.g. loading a pre-idleverses save
    }
}

/* There is no need to do anything when ascending or wiping the save,
 * because Game.Objects.Bank.minigame.goodsById[i].vals gets wiped out by the game itself.
 */



/***************************************************
 * Module: track more statistics across ascensions *
 ***************************************************
 *
 * These statistics are already tracked by the vanilla game,
 * but they get wiped out after ascending.
 * We store the value of these statistics for the _previous_ ascensions only.
 * The across-ascension statistics for the current ascension needs to be computed every time.
 * This guarantees that,
 * if someone loads the mod after, say, popping 100 wrinklers,
 * these 100 wrinklers will be accounted for by this mod,
 * even though the mod was not being used while those wrinklers were popped.
 */

Spice.updateAcrossAscensionStatistics = function() {
    // This function is pushed to Game.customAscend
    Spice.saveGame.bigCookieClicksPreviousAscensions += Game.cookieClicks;
    Spice.saveGame.wrinklersPoppedPreviousAscensions += Game.wrinklersPopped;
    Spice.saveGame.reindeerClickedPreviousAscensions += Game.reindeerClicked;
    Spice.saveGame.handmadeCookiesPreviousAscensions += Game.handmadeCookies;
}

/* Returns the first div of the line (in the status menu) that contains the given text
 * Returns undefined if no such div is found
 */
Spice.locateStatsMenuElement = function(text) {
    for(div of document.querySelectorAll("#menu div.subsection div.listing")) {
        if(div.textContent.indexOf(text) !== -1)
            return div;
    }
    return undefined;
}

Spice.displayAcrossAscensionStatistics = function() {
    // This is pushed to Game.customStatsMenu
    let div = undefined;
    div = Spice.locateStatsMenuElement('Cookie clicks');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.cookieClicks + Spice.saveGame.bigCookieClicksPreviousAscensions) +
        ')</small>';

    div = Spice.locateStatsMenuElement('Wrinklers popped');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.wrinklersPopped + Spice.saveGame.wrinklersPoppedPreviousAscensions) +
        ')</small>';

    div = Spice.locateStatsMenuElement('Reindeer found');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.reindeerClicked + Spice.saveGame.reindeerClickedPreviousAscensions) +
        ')</small>';

    div = Spice.locateStatsMenuElement('Hand-made cookies');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.handmadeCookies + Spice.saveGame.handmadeCookiesPreviousAscensions) +
        ')</small>';
}



/********************************************************
 * Module: Tally stock market profits across ascensions *
 ********************************************************
 * This module could be merged with the "track statistics across ascensions" one,
 * but since they share pretty much no common code
 * (and we need to do more work to honor tallyOnlyStockMarketProfits)
 * I decided to split them.
 */

Spice.effectiveStockMarketTally = function() {
    // across-ascensions profit tally, but respecting settings.tallyOnlyStockMarketProfits
    if(!Game.Objects['Bank'].minigame) return 0;

    let profit = Game.Objects['Bank'].minigame.profit;
    if(Spice.settings.tallyOnlyStockMarketProfits)
        return Spice.saveGame.stockMarketProfitsPreviousAscensions + (profit > 0 ? profit : 0);
    else
        return Spice.saveGame.stockMarketProfitsPreviousAscensions + profit;
}

Spice.updateAcrossAscensionsStockMarketTallying = function() {
    Spice.saveGame.stockMarketProfitsPreviousAscensions = Spice.effectiveStockMarketTally();
}

/* Adds the "(all time : $???)" text to the bank minigame.
 * Executed when the bank minigame loads.
 */
Spice.createProfitTallyDiv = function() {
    document.getElementById('bankBalance').outerHTML +=
        ' (all time : <span id="bankTally">$-</span>)';
    Spice.updateProfitTallyDisplay();
}

Spice.updateProfitTallyDisplay = function() {
    // Executed on every buy/sell good
    let tally = Spice.effectiveStockMarketTally();
    let tallyDiv = document.getElementById('bankTally');
    if(tallyDiv) {
        tallyDiv.innerHTML = (tally<0 ? '-$' : '$') + Beautify(Math.abs(tally));
    }
}



/*************************************************************
 * Module: Award achievements for across-ascensions progress *
 *************************************************************
 * The hard-work of this module is pushing the following function to the appropriate places.
 */

Spice.checkWrinklersPoppedAcrossAscensionsAchievements = function() {
    // Pushed to Game.customWrinklerPop
    let wrinklersPopped = Game.wrinklersPopped + Spice.saveGame.wrinklersPoppedPreviousAscensions;
    if(Spice.settings.awardAchievementsAcrossAscensions) {
        if(wrinklersPopped>=1) Game.Win('Itchscratcher');
        if(wrinklersPopped>=50) Game.Win('Wrinklesquisher');
        if(wrinklersPopped>=200) Game.Win('Moistburster');
    }

    if(Spice.settings.extraAchievementsAcrossAscensions) { // next module
        if(wrinklersPopped>=1000) Game.Win('Parasitesmasher');
    }
}

Spice.checkReindeerClickedAcrossAscensionsAchievements = function() {
    // Pushed to Game.customShimmerTypes.reindeer.popFunc
    let reindeerClicked = Game.reindeerClicked + Spice.saveGame.reindeerClickedPreviousAscensions;
    if(Spice.settings.awardAchievementsAcrossAscensions) {
        if(reindeerClicked>=1) Game.Win('Oh deer');
        if(reindeerClicked>=50) Game.Win('Sleigh of hand');
        if(reindeerClicked>=200) Game.Win('Reindeer sleigher');
    }

    if(Spice.settings.extraAchievementsAcrossAscensions) {
        if(reindeerClicked>=1000) Game.Win('A sleightly longer grind');
    }
}

Spice.checkHandmadeCookiesAcrossAscensionsAchievements = function() {
    // Pushed to Game.customCookieClicks, which (surprisingly) is a vanilla hook
    let handmadeCookies = Game.handmadeCookies + Spice.saveGame.handmadeCookiesPreviousAscensions;

    if(Spice.settings.awardAchievementsAcrossAscensions) {
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

Spice.checkStockMarketTallyAchievements = function() {
    // Pushed to Game.customMinigame['Bank'].buyGood and sellGood
    if(!Game.Objects['Bank'].minigame) return; // safeguarding

    if(Spice.settings.awardAchievementsAcrossAscensions) {
        if(Spice.effectiveStockMarketTally() >= 10e6) Game.Win('Liquid assets');
        if(Spice.effectiveStockMarketTally() >= 3600*24*365) Game.Win('Gaseous assets');
    }

    if(Spice.settings.extraStockMarketAchievements) {
        profit = Game.Objects['Bank'].minigame.profit;
        if(profit >= 1e6) Game.Win('Who wants to be a millionaire?');

        let noStocks = true;
        for(good of Game.Objects['Bank'].minigame.goodsById) {
            if(good.stock > 0) noStocks = false;
        }
        if(noStocks && profit <= -1e6) Game.Win('Failing on purpose');

        if(profit <= -3600*24*365) Game.Win('Solid assets');
    }
}

Spice.checkAcrossAscensionsAchievements = function() {
    // Invoked when toggling the option
    Spice.checkWrinklersPoppedAcrossAscensionsAchievements();
    Spice.checkReindeerClickedAcrossAscensionsAchievements();
    Spice.checkHandmadeCookiesAcrossAscensionsAchievements();
    Spice.checkStockMarketTallyAchievements();
}



/******************************
 * Module: extra achievements *
 ******************************/

Spice.createAchievementsForProgressAcrossAscensions = function() {
    let last, adjacent;

    if(!('Parasitesmasher' in Game.Achievements)) { // Makes this function idempotent
        adjacent = Game.Achievements['Moistburster'];
        last = CCSE.NewAchievement('Parasitesmasher',
            'Burst <b>1000 wrinklers</b> in total.',
            adjacent.icon);
        last.order = adjacent.order + 1e-5;
    }
    Spice.checkWrinklersPoppedAcrossAscensionsAchievements();

    if(!('A sleightly longer grind' in Game.Achievements)) {
        adjacent = Game.Achievements['Reindeer sleigher'];
        last = CCSE.NewAchievement('A sleightly longer grind',
            'Pop <b>1000 reindeer</b> in total.',
            adjacent.icon);
        last.order = adjacent.order + 1e-5;
    }
    Spice.checkReindeerClickedAcrossAscensionsAchievements();
}

Spice.createStockMarketAchievements = function() {
    let last, adjacent;

    if(!('Who wants to be a millionaire?' in Game.Achievements)) {
        adjacent = Game.Achievements['Buy buy buy'];
        last = CCSE.NewAchievement('Who wants to be a millionaire?',
            'Have your stock market profits surpass <b>$1 million</b> in a single ascension.',
            adjacent.icon);
        last.order = adjacent.order + 1e-5;

        last = CCSE.NewAchievement('Failing on purpose',
            '<b>Go below -$1 million</b> in stock market profits and have no goods in stock during an ascension.<q>I did not burn a thousand cookies, I simply discovered a thousand ways of how not to bake cookies!<br />[Thomas Edison\'s grandmother, probably]</q>',
            adjacent.icon);
        last.order = adjacent.order + 2e-5;

        last = CCSE.NewAchievement('Solid assets',
            '<b>Go below -$31.536 million</b> in stock market profits in a single ascension.',
            Game.Achievements['Liquid assets'].icon);
        last.order = adjacent.order + 3e-5; // just for definiteness; they aren't sorted together
        last.pool = 'shadow';
    }

    Spice.checkStockMarketTallyAchievements();
}



/*******************************
 * Module: numerical stability *
 *******************************/

/* Computes a numerically stable lower bound for the number of heavenly chips gained by ascending.
 *
 * Let f be the number of cookies forfeited by ascending so far,
 * and c be the number of cookies baked in this ascension.
 * The the vanilla formula for the number of heavenly chips that will be gained is
 *      floor(cbrt(f+c)/1000) - floor(cbrt(f)/1000))
 * This function computes
 *      floor(cbrt(f+c)/1000 - cbrt(f)/1000)
 * which is a lower bound for the formula above
 * (but can be computed with significantly less loss due to numerical imprecision)
 * and returns the maximum between it and the vanilla formula.
 */
Spice.additionalHeavenlyChips = function() {
    let f = Game.cookiesReset;
    let c = Game.cookiesEarned;
    let a = Math.cbrt((f+c)/1e12);
    let b = Math.cbrt(f/1e12);
    let approximation = c/1e12/(a*a + a*b + b*b);
    /* The approximation is mathematically equivalent to
     *      cbrt(f+c)/1000 - cbrt(f)/1000
     * and it is numerically stable.
     * We just need to floor it to guarantee it is a lower bound.
     */
    let correctFormula = Math.floor(a) - Math.floor(b); // numerically unstable
    return Math.max(Math.floor(approximation), correctFormula);
}

Spice.injectNumericallyPreciseFormulaForHeavenlyChipGains = function() {
    Game.Logic = Spice.rewriteCode(Game.Logic,
        'var ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);',
        `$&
        // Spiced Cookies modification
        if(Spice.settings.numericallyStableHeavenlyChipGains) {
            ascendNowToGet = Spice.additionalHeavenlyChips();
        }`
    );
    Game.EarnHeavenlyChips = Spice.rewriteCode(Game.EarnHeavenlyChips,
        'prestige>Game.prestige',
        `prestige>Game.prestige || (Spice.settings.numericallyStableHeavenlyChipGains && Spice.additionalHeavenlyChips() > 0)`
    );
    Game.EarnHeavenlyChips = Spice.rewriteCode(Game.EarnHeavenlyChips,
        'var prestigeDifference=prestige-Game.prestige;',
        `$&
        // Spiced Cookies modification
        if(Spice.settings.numericallyStableHeavenlyChipGains) {
            prestigeDifference = Spice.additionalHeavenlyChips();
        }`
    );
}



/********************************************
 * Module: Permanent upgrade slot selection *
 ********************************************/

Spice.allowPermanentUpgradeSlotSelectionWithinAscension = function() {
    // Pushed to Game.customStatsMenu.push
    for(div of document.querySelectorAll('div.crate.upgrade.heavenly')) {
        /* This is a kludge
         * We iterate through all the "crates" displayed under the list of prestige upgrades,
         * looking for the ones which mention Game.UpgradesById[264] in their onmouseover attribute.
         *
         * TODO: Find better way of handling this.
         * This is brittle, difficult to test automatically,
         * and prone to breakage if the game updates.
         */
        let str = div.attributes.onmouseover.nodeValue;
        let makeCallback = function(slot) {
            return function() {
                Game.AssignPermanentSlot(slot);
                Game.UpdateMenu(); // Not instantaneous but better than not having it
            }
        }
        if(str.includes("Game.UpgradesById[264]")) div.onclick = makeCallback(0);
        if(str.includes("Game.UpgradesById[265]")) div.onclick = makeCallback(1);
        if(str.includes("Game.UpgradesById[266]")) div.onclick = makeCallback(2);
        if(str.includes("Game.UpgradesById[267]")) div.onclick = makeCallback(3);
        if(str.includes("Game.UpgradesById[268]")) div.onclick = makeCallback(4);
    }
}



/*******************************************************
 * Module: better tooltip for season-switching cookies *
 *******************************************************/

Spice.pushSeasonalCookieTooltips = function() {
    let seasonalReplacer = function(desc, upgradeNames, replacementStr) {
        let unlocked = 0;
        let bought = 0;
        let total = 0;
        for(let name of upgradeNames) {
            total++;
            if(Game.Upgrades[name].unlocked) unlocked++;
            if(Game.Upgrades[name].bought) bought++;
        }
        if(Spice.settings.autohideSeasonalBiscuitsTooltip && bought == total)
            return desc;
        return desc.replace(replacementStr, `${replacementStr}<div class="line"></div>` +
            `You've unlocked <b>${unlocked}/${total}</b> ${replacementStr}`);
    }
    Game.customUpgrades['Bunny biscuit'].descFunc.push(function(me, desc) {
        return seasonalReplacer(desc, Game.easterEggs, "eggs.");
    });

    Game.customUpgrades['Festive biscuit'].descFunc.push(function(me, desc) {
        desc = seasonalReplacer(desc, Game.santaDrops, "of Santa's gifts.");
        desc = seasonalReplacer(desc, Game.reindeerDrops, "reindeer cookies.");
        return desc;
    });

    Game.customUpgrades['Ghostly biscuit'].descFunc.push(function(me, desc) {
        return seasonalReplacer(desc, Game.halloweenDrops, "halloween cookies.");
    });

    Game.customUpgrades['Lovesick biscuit'].descFunc.push(function(me, desc) {
        return seasonalReplacer(desc, Game.heartDrops, "heart biscuits.");
    });
    // This could have been a single function
}



/******************
 * User Interface *
 ******************/

/* Copies the given settings object to Spice.settings,
 * enforcing that the objects have their appropriate types.
 */
Spice.copySettings = function(settings) {
    if(!settings) return;
    let numericSettings = [];
    let booleanSettings = [
        'displayStockDelta',
        'saveStockMarketHistory',
        'tallyOnlyStockMarketProfits',
        'awardAchievementsAcrossAscensions',
        'extraAchievementsAcrossAscensions',
        'extraStockMarketAchievements',
        'numericallyStableHeavenlyChipGains',
        'autohideSeasonalBiscuitsTooltip',
    ];

    for(key of numericSettings) {
        if(key in settings) Spice.settings[key] = Number(settings[key]);
    }
    for(key of booleanSettings) {
        if(key in settings) Spice.settings[key] = Boolean(settings[key]);
    }
}

// Same, but for Spice.saveGame
Spice.copySaveGame = function(saveGame) {
    if(!saveGame) return;
    let numericData = [
        'bigCookieClicksPreviousAscensions',
        'wrinklersPoppedPreviousAscensions',
        'reindeerClickedPreviousAscensions',
        'handmadeCookiesPreviousAscensions',
        'stockMarketProfitsPreviousAscensions',
    ];
    let numberMatrixData = ['stockMarketHistory'];

    for(key of numericData) {
        if(key in saveGame) Spice.saveGame[key] = Number(saveGame[key]);
    }

    for(key of numberMatrixData) {
        if(!(key in saveGame && Array.isArray(saveGame[key]))) continue;
        Spice.saveGame[key] = [];
        for(i in saveGame[key]) {
            Spice.saveGame[key][i] = [];
            for(j in saveGame[key][i])
                Spice.saveGame[key][i][j] = Number(saveGame[key][i][j]);
        }
    }
}

// Callback for Spice.makeButton
Spice.toggleSetting = function(buttonId, settingName, onText, offText, onFunction, offFunction) {
    Spice.settings[settingName] = !Spice.settings[settingName];
    let element = document.getElementById(buttonId);
    if(Spice.settings[settingName]) {
        element.classList.remove("off");
        element.innerHTML = onText;
        if(onFunction) onFunction();
    } else {
        element.classList.add("off");
        element.innerHTML = offText;
        if(offFunction) offFunction();
    }
    PlaySound('snd/tick.mp3');
}

Spice.escapeQuotes = function(string) {
    /* Escape things for makeButton purposes.
     * Painful trial and error suggests we have to quote it twice.
     * TODO figure out why.
     */
    return string.replaceAll("'", '&amp;apos;')
                 .replaceAll('"', '&amp;quot;');
}

Spice.makeButton = function(settingName, onText, offText, onFunctionName, offFunctionName) {
    let set = Spice.settings[settingName];
    let buttonId = "SpiceButton" + settingName;
    let onclick = `Spice.toggleSetting('${buttonId}', '${settingName}', \
        '${Spice.escapeQuotes(onText)}', '${Spice.escapeQuotes(offText)}', \
        ${onFunctionName}, ${offFunctionName} \
    )`;
    return `<a id="${buttonId}" class="option${set? "" : " off"}" 
            onclick="${onclick};">
            ${set? onText : offText}
            </a>`;
}

Spice.customOptionsMenu = function() {
    let menuStr = "";
    menuStr += '<div class="listing">' + 
        Spice.makeButton('displayStockDelta',
            'Display stock market deltas', 'Hide stock market deltas',
            'Spice.enableStockMarketDeltaRows', 'Spice.disableStockMarketDeltaRows'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('saveStockMarketHistory',
            'Save the stock market value history', 'Don\'t save stock market value history'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('tallyOnlyStockMarketProfits',
            'Tally only stock market profits', 'Tally both profits and losses',
            'Spice.updateProfitTallyDisplay', 'Spice.updateProfitTallyDisplay'
        ) + '<label>Whether to include or not negative profits in the across-ascensions stock market tally</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('awardAchievementsAcrossAscensions',
            'Award achievements based on all-time statistics', 'Award achievements based on current ascension statistics only',
            'Spice.checkAcrossAscensionsAchievements'
        ) + '<label>Whether to award achievements related to popping wrinklers, finding reindeer, hand-making cookies, and stock market profits based on the statistics amassed across ascensions, or on the statistics of this ascension only</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('extraAchievementsAcrossAscensions',
            'Create new achievements related to across-ascensions progress',
            'Don\'t create new achievements related to across-ascensions progress',
            'Spice.createAchievementsForProgressAcrossAscensions',
        ) + '<label>Whether to create two achievements for popping wrinklers and clicking reindeers (NOTE: you must refresh your page after disabling this option)</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('extraStockMarketAchievements',
            'Create three new achievements for the stock market',
            'Don\'t create new achievements for the stock market',
            'Spice.createStockMarketAchievements',
        ) + '<label>Whether to create two achievements for popping wrinklers and clicking reindeers (NOTE: you must refresh your page after disabling this option)</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('numericallyStableHeavenlyChipGains',
            'Use numerically stable formula for heavenly chip gains',
            'Use vanilla formula for heavenly chip gains',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('autohideSeasonalBiscuitsTooltip',
            'Automatically hide extra season switcher tooltips if all upgrades were purchased',
            'Always display the "You\'ve unlocked..." line in season switcher biscuits',
        ) + '</div>';

    CCSE.AppendCollapsibleOptionsMenu(Spice.name, menuStr);
}

Spice.load = function() {
    // Pull the save from CCSE
    if(CCSE.config.OtherMods.Spice) {
        Spice.copySettings(CCSE.config.OtherMods.Spice.settings);
        Spice.copySaveGame(CCSE.config.OtherMods.Spice.saveGame);

        if (CCSE.config.OtherMods.Spice.version != Spice.version) {
            l('logButton').classList.add('hasUpdate');
        }
    }

    // Run the load save functions
    if(Spice.settings.displayStockDelta) Spice.enableStockMarketDeltaRows();
    else Spice.disableStockMarketDeltaRows();

    Spice.loadStockMarketHistory();

    // Update displays
    Spice.updateProfitTallyDisplay();
}

Spice.save = function() {
    // Run the save game functions
    Spice.saveStockMarketHistory();

    // Push the save to CSSE
    CCSE.config.OtherMods.Spice = {
        settings: Spice.settings,
        saveGame: Spice.saveGame,
        version: Spice.version,
    };
}

Spice.addVersionHistory = function() {
    // Run on Spice.launch()
    str = `
    <div class="listing">
        <a href="https://github.com/staticvariablejames/SpicedCookies" target="blank">Spiced Cookies</a>
        is a collection of small modifications to Cookie Clicker,
        adding a bit of spice to your gameplay.
    </div>

    <div class="listing">
        Every single feature can be either ignored or disabled in the settings,
        and most of them start disabled by default.
    </div>

    <div class="subsection update small"><div class="title">2020-01-01 - Vanilla update!</div>
        <div class="listing">&bull; Update to Cookie Clicker v2.031</div>
    </div>

    <div class="subsection update small"><div class="title">2020-10-31 - UI niceties</div>
        <div class="listing">&bull; Numerically stable formula for heavenly chip gains (disabled by default)</div>
        <div class="listing">&bull; Permanent upgrade slots can be chosen during an ascension (non-disableable)</div>
        <div class="listing">&bull; Season switcher tooltips says how many seasonal upgrades were unlocked (non-disableable)</div>
    </div>

    <div class="subsection update small"><div class="title">2020-10-23 - alpha release</div>
        <div class="listing">&bull; Save the history of stock market prices (enabled by default)</div>
        <div class="listing">&bull; Display the delta of stock market goods (enabled by default)</div>
        <div class="listing">&bull; Track more statistics across ascensions (non-disableable)</div>
        <div class="listing">&bull; Merciful Market Profit Tallying (enabled by default)</div>
        <div class="listing">&bull; Across-ascensions progress unlocks achievements (enabled by default)</div>
        <div class="listing">&bull; Two extra achievements for popping wrinklers and clicking reindeer (disabled by default)</div>
        <div class="listing">&bull; Three extra stock market achievements (disabled by default)</div>
    </div>

    `;
    Game.customInfoMenu.push(function(){
        CCSE.PrependCollapsibleInfoMenu(Spice.name, str);
    });
}

Spice.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(Spice.name, Spice.version, Spice.GameVersion, Spice.CCSEVersion)) {
        Spice.isLoaded = true;
        return;
    }

    // Options menu
    Game.customOptionsMenu.push(Spice.customOptionsMenu);

    // Info menu
    Spice.addVersionHistory();

    // Hard reset: replace Spice.saveGame with the default savegame
    Game.customReset.push(function(hard) {
        if(hard) {
            Spice.saveGame = Spice.defaultSaveGame();

            /* On a hard reset, Game.Objects.Bank.minigame.launch gets executed
             * before we have the chance to overwrite Spice.saveGame,
             * so Spice.updateProfitTallyDisplay is ran with old data by Spice.createProfitTallyDiv.
             * Hence we have to run it again here.
             */
            Spice.updateProfitTallyDisplay();
        }
    });

    // Ascension
    Game.customAscend.push(Spice.updateAcrossAscensionStatistics);
    Game.customAscend.push(Spice.updateAcrossAscensionsStockMarketTallying);

    // Reincarnate
    Game.customReincarnate.push(Spice.updateProfitTallyDisplay)

    // Wrinklers
    Game.customWrinklerPop.push(Spice.checkWrinklersPoppedAcrossAscensionsAchievements);

    // Reindeer
    Game.customShimmerTypes['reindeer'].popFunc.push(Spice.checkReindeerClickedAcrossAscensionsAchievements);

    // Big cookie clicks
    Game.registerHook('click', Spice.checkHandmadeCookiesAcrossAscensionsAchievements);

    // Stock Market
    CCSE.MinigameReplacer(function() {
        Spice.updateStockMarketDeltaRows();
        Spice.createProfitTallyDiv();
    }, 'Bank');

    /* The functions inside Game.customMinigame['Bank']
     * are only created by CCSE when the minigame launches,
     * so there is no guarantee they will exist right now.
     * We thus have to create them ourselves.
     */

    if(!Game.customMinigame['Bank'].tick) Game.customMinigame['Bank'].tick = [];
    Game.customMinigame['Bank'].tick.push(Spice.updateStockMarketDeltaRows);

    if(!Game.customMinigame['Bank'].buyGood) Game.customMinigame['Bank'].buyGood = [];
    Game.customMinigame['Bank'].buyGood.push(Spice.updateProfitTallyDisplay);
    Game.customMinigame['Bank'].buyGood.push(Spice.checkStockMarketTallyAchievements);

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(Spice.updateProfitTallyDisplay);
    Game.customMinigame['Bank'].sellGood.push(Spice.checkStockMarketTallyAchievements);

    // Statistics
    Game.customStatsMenu.push(Spice.allowPermanentUpgradeSlotSelectionWithinAscension);
    Game.customStatsMenu.push(Spice.displayAcrossAscensionStatistics);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(Spice.name, Spice.version);
    });

    // Tooltips
    Spice.pushSeasonalCookieTooltips();

    // Code injections
    Spice.injectNumericallyPreciseFormulaForHeavenlyChipGains();

    CCSE.customSave.push(Spice.save);
    CCSE.customLoad.push(Spice.load);
    Spice.load();
    Spice.isLoaded = true;
}

// Code copied from CCSE's documentation
if(!Spice.isLoaded){
	if(CCSE && CCSE.isLoaded){
		Spice.launch();
	}
	else{
		if(!CCSE) var CCSE = {};
		if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(Spice.launch);
	}
}
