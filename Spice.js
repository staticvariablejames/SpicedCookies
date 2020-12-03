// SPDX-License-Identifier: GPL-3.0-or-later

let Spice = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

Spice.name = "Spiced Cookies";
Spice.version = "0.3.1"; // Semantic versioning
Spice.GameVersion = "2.031";
Spice.CCSEVersion = "2.021";

/* Injects or modifies the given function.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 * The altered function is returned.
 */
Spice.rewriteCode = function(targetFunction, pattern, replacement) {
    let code = targetFunction.toString();
    let newCode = code.replace(pattern, replacement);
    return (new Function('return ' + newCode))();
}

/* Same as above, but tailored to replacing code in a minigame function.
 *
 * Implementation notes:
 * 1. Each minigame lives inside an object that has an attribute named 'M' pointing to 'this'.
 *    Minigame functions use that variable instead of 'this',
 *    so if we rewrite code we have to supply that variable again.
 * 2. For some reason, CCSE adds a variable named 'objKey' to the closure of every minigame,
 *    so we have to supply that variable too.
 */
Spice.rewriteMinigameCode = function(buildingName, targetFunction, pattern, replacement) {
    let code = targetFunction.toString();
    let newCode = code.replace(pattern, replacement);
    let M = Game.Objects[buildingName].minigame;
    let objKey = buildingName; // CCSE compatibility
    return (new Function('M', 'objKey', 'return ' + newCode))(M, objKey);
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
    patchDiscrepancy: false,
    warnLessThan100Lumps: true,
    patchPantheonSwaps: false,
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

/* Scratchpad used to store data that needs to persist beyond a function call,
 * but does not need to be put in the save game data.
 */
Spice.tmp = {};


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

/* Similar as above, but with the text "mode: --" instead.
 * The div is placed above the div above.
 */
Spice.stockMarketModeRow = function(stockId) {
    let div = document.getElementById('stockMarketMode-' + stockId);
    if(div) return div;

    let upperBox = document.getElementById('bankGood-' + stockId).firstChild;
    let deltaDiv = Spice.stockMarketDeltaRow(stockId).parentNode;
    let modeDiv = upperBox.insertBefore(document.createElement("div"), deltaDiv);
    for(let key in deltaDiv.style) {
        modeDiv.style[key] = deltaDiv.style[key];
    }
    modeDiv.style.display = 'none'; // Mode rows are hidden by default

    modeDiv.innerHTML = 'mode: <div id="stockMarketMode-' + stockId + '" ' +
        'style="display:inline; font-weight:bold;">--</div>';

    return document.getElementById('stockMarketMode-' + stockId);
}

Spice.stockMarketModeNames = ['stable','slow rise','slow fall','fast rise','fast fall','chaotic'];

/* Updates the text inside the delta and mode rows created by the functions above.
 * This is pushed to Game.customMinigame.Bank.tick.
 */
Spice.updateStockMarketRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let stock = Game.Objects['Bank'].minigame.goodsById[i];
        let div = Spice.stockMarketDeltaRow(i);
        if(div) {
            div.innerHTML = Math.floor(1000*stock.d)/1000;
        }
        div = Spice.stockMarketModeRow(i);
        if(div) {
            div.innerHTML = Spice.stockMarketModeNames[stock.mode] + ' (' + stock.dur + ')';
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
Spice.updateStockMarketRowsVisibility = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let deltaDiv = Spice.stockMarketDeltaRow(i).parentNode;
        let modeDiv = Spice.stockMarketModeRow(i).parentNode;
        if(Spice.settings.displayStockDelta) deltaDiv.style.display = "block";
        else deltaDiv.style.display = "none";
        if(Game.Has('Omniscient day traders')) modeDiv.style.display = "block";
        else modeDiv.style.display = "none";
    }
}

Spice.createStockMarketModeDebugUpgrade = function() {
    // Run on init
    if('Omniscient day traders' in Game.Upgrades) return;
    let upgrade = CCSE.NewUpgrade('Omniscient day traders',
        'Stock modes are visible in the stock market.' +
            '<q>No time for flavor text, pay attention to your stocks!</q>',
        7,
        Game.Achievements['Buy buy buy'].icon,
        Spice.updateStockMarketRowsVisibility
    );
    upgrade.order = Game.Upgrades['A really good guide book'].order + 0.001;
    upgrade.pool = 'debug';
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

Spice.updateAcrossAscensionsStatistics = function() {
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

Spice.displayAcrossAscensionsStatistics = function() {
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
            `<b>Go below -$1 million</b> in stock market profits
            and have no goods in stock during an ascension.
            <q>I did not burn a thousand cookies,
                I simply discovered a thousand ways of how not to bake cookies!<br />
                &mdash; Thomas Edison\'s grandmother, probably</q>`,
            adjacent.icon);
        last.order = adjacent.order + 2e-5;
        /* Minor note: there is only one upgrade with an attributed quote,
         * namely, Birthday cookie.
         * The quote is attributed to Orteil himself, and his name is inside the quotation marks.
         * I am replicating the style here
         * (except I'm using an em-dash for clarity).
         * This should be changed if that style changes as well.
         */

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
        let str = div.attributes.onmouseover?.nodeValue ?? ""; // onmouseover might be undefined
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
}

/************************************
 * Module: permanent debug upgrades *
 ************************************/

Spice.createPermanentDebugUpgradesUpgrade = function() {
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

Spice.saveCurrentDebugUpgrades = function() {
    // Executed on ascension
    Spice.tmp.ownedDebugUpgrades = [];
    /* There is no need to save this permanently
     * because games can't be saved while in the ascension menu.
     */

    if(!Game.Has('Transcendent debugging')) return;

    for(i in Game.Upgrades) {
        if(Game.Upgrades[i].pool == 'debug' && Game.Upgrades[i].bought)
            Spice.tmp.ownedDebugUpgrades.push(i);
    }
}

Spice.restoreDebugUpgrades = function() {
    // Executed on reincarnate
    for(i of Spice.tmp.ownedDebugUpgrades) {
        Game.Upgrades[i].earn();
    }
}



/***************************
 * Module: discrepancy fix *
 ***************************/

/* Patches the discrepancy.
 * For ease of use, this function bails out if Spice.settings.patchDiscrepancy is false,
 * so it is safe to call this function at all times.
 *
 * Conversely, Spice.settings.patchDiscrepancy must be set to true before running this function,
 * but the callback Spice.toggleSetting takes care of that.
 */
Spice.patchDiscrepancy = function() {
    // This function is run on init and on load
    if(!Spice.settings.patchDiscrepancy) return;
    /* Since Orteil's code is sensitive to timing issues,
     * patching it changes the behavior of game loads,
     * so I think it is safer to leave it as an explicit opt-in feature.
     */

    Game.loadLumps = Spice.rewriteCode(Game.loadLumps,
        'Game.lumpT=Date.now()-(age-amount*Game.lumpOverripeAge);',
        '// Game.lumpT += amount*Game.lumpOverripeAge; // Spiced cookies patch'
    );
    // We shift the responsibility of updating Game.lumpT to Game.harvestLumps
    Game.harvestLumps = Spice.rewriteCode(Game.harvestLumps,
        'Game.lumpT=Date.now();',
        `let harvestedAmount = Math.floor((Date.now() - Game.lumpT)/Game.lumpOverripeAge);
        if(harvestedAmount > 0) {
            Game.lumpT += Game.lumpOverripeAge * harvestedAmount;
        } // Spiced cookies patch
    `);
    // Now we have to patch clickLump, because harvestLumps wouldn't change lump time in this case
    Game.clickLump = Spice.rewriteCode(Game.clickLump,
        /Game.computeLumpType\(\);/g,
        `Game.lumpT = Date.now(); // Spiced cookies patch
        Game.computeLumpType();
    `);
}



/*********************************************
 * Module: Sugar baking overspending warning *
 *********************************************/

Spice.shouldWarnAboutTooFewLumps = function(lumps = Game.lumps) {
    return Spice.settings.warnLessThan100Lumps && Game.Has('Sugar baking') && lumps < 100;
}

// Colors the lump number red if there are too few lumps
Spice.updateLumpCountColor = function() {
    // Pushed to Game.customDoLumps
    if(Spice.shouldWarnAboutTooFewLumps()) {
        document.getElementById('lumpsAmount').style.color = "red";
    } else {
        document.getElementById('lumpsAmount').style.color = "";
    }
}

Spice.warnfulLumpTooltip = function(str) {
    /* Pushed to Game.customLumpTooltip
     * Actually we "unshift" it to Game.customLumpTooltip
     * This makes sure that, regardless of whether this mod or CYOL gets loaded first,
     * the warning from this mod is shown above the wall of predictions from CYOL.
     */
    if(Spice.shouldWarnAboutTooFewLumps()) {
        str += '<div class="line"></div>';
        str += '<div style="text-align:center">' +
                    '<div style="color:red; display:inline-block">Warning:</div>' +
                    ' too few sugar lumps, Sugar baking is not maxed out!' +
                '</div>';
    }
    return str;
}

Spice.injectWarningIntoLumpConfirmationTooltip = function() {
    pattern = "'?</div>'";
    replacement = `'?</div>' + ( // Spiced cookies modification
            Spice.shouldWarnAboutTooFewLumps(Game.lumps-n)?
                '<div>This will bring your sugar lumps down' +
                    (Game.lumps >= 100 ? ' to below 100, ' : ', ') +
                    'undermining Sugar baking' +
                '</div>'
            :'')
        `;
    /* This one is a pain...
     * Game.spendLump is not a regular function, but a factory:
     * calling it returns a function which should be used as a callback
     * that will do the task of opening the prompt and calling the given callback.
     * However,
     * in almost all places that spendLump is used,
     * the returned function is used directly (like `Game.spendLump(args)()`)
     * rather than stored for later call.
     * So rewriting `Game.spendLump` itself is enough for most cases:
     */
    Game.spendLump = Spice.rewriteCode(Game.spendLump, pattern, replacement);
    /* The only exception is Game.Upgrades['Sugar frenzy'].clickFunction.
     * Since one of the arguments is an anonymous function,
     * short of copy-pasting Orteil's code here
     * (which would be terrible for compatibility with other mods)
     * we simply cannot modify that function.
     *
     * Since this is a helper feature,
     * I expect most players to know what they are doing when they activate Sugar frenzy,
     * so it should not be a huge loss.
     */
}



/********************************
 * Module: patch Pantheon swaps *
 ********************************/

Spice.patchPantheonSwaps = function() {
    // This function is run on init, load and minigame load.
    if(!Spice.settings.patchPantheonSwaps) return;
    if(!Game.Objects['Temple'].minigame) return; // It will be run again on minigame load
    if(Spice.tmp.pantheonSwapsPatched) return;
    Spice.tmp.pantheonSwapsPatched = true;

    Game.Objects['Temple'].minigame.slotGod = Spice.rewriteMinigameCode('Temple',
        Game.Objects['Temple'].minigame.slotGod,
        'M.slot[god.slot]=M.slot[slot];',
        'if(god.slot != -1) $& // Spiced cookies patch'
    );
}



/***********************************************************
 * Module: mention Wrath cookies in Holobore's Description *
 ***********************************************************/

Spice.mentionWrathCookiesInHolobore = function() {
    // This function is run on minigame load
    if(!Game.Objects['Temple'].minigame) return;
    Game.Objects['Temple'].minigame.gods['asceticism'].descAfter =
        Game.Objects['Temple'].minigame.gods['asceticism'].descAfter.replace(
            'golden cookie', 'golden or wrath cookie'
        );
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
        'patchDiscrepancy',
        'warnLessThan100Lumps',
        'patchPantheonSwaps',
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

/* Callback for Spice.makeButton
 * It is important that the functions onFunction and offFunction
 * are called only after the appropriate setting is toggled.
 */
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
            'Spice.updateStockMarketRowsVisibility', 'Spice.updateStockMarketRowsVisibility'
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

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchDiscrepancy',
            'Fix imprecision in lump times computation',
            'Don\'t patch lump times computation',
            'Spice.patchDiscrepancy'
        ) +
        '<label>Patches the discrepancy so it is always zero; ' +
            'see the Choose Your Own Lump mod for details ' +
            '(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('warnLessThan100Lumps',
            'Warn if overspending lumps hurts Sugar baking',
            'Ignore lump overspending for Sugar baking purposes',
            'Spice.updateLumpCountColor',
            'Spice.updateLumpCountColor'
        ) +
        '<label>If Sugar baking is purchased, ' +
            'the lump count becomes red if less than 100 lumps are available.</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchPantheonSwaps',
            'Patch Pantheon swap bug',
            'Don\'t patch the Pantheon',
            'Spice.patchPantheonSwaps'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    CCSE.AppendCollapsibleOptionsMenu(Spice.name, menuStr);
}

Spice.addVersionHistory = function() {
    // Run on Spice.init()
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

    <div class="subsection update small"><div class="title">2020-11-06 - Debugging discrepancies</div>
        <div class="listing">&bull; Display the mode of stock market goods (debug upgrade)</div>
        <div class="listing">&bull; Preserve debug upgrades across ascensions (debug upgrade)</div>
        <div class="listing">&bull; Discrepancy Patch (disabled by default)</div>
    </div>

    <div class="subsection update small"><div class="title">2020-11-03 - Vanilla update (2)!</div>
        <div class="listing">&bull; Uses the new modding API to store data</div>
    </div>

    <div class="subsection update small"><div class="title">2020-11-01 - Vanilla update!</div>
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



/*************************
 * Modding API interface *
 *************************/

Spice.save = function() {
    // Run the save game functions
    Spice.saveStockMarketHistory();

    // Push the save to CSSE
    return JSON.stringify({
        settings: Spice.settings,
        saveGame: Spice.saveGame,
        version: Spice.version,
    });
}

Spice.load = function(str) {
    let obj = JSON.parse(str);
    Spice.loadObject(obj);
}

Spice.loadObject = function(obj) {
    Spice.copySettings(obj.settings);
    Spice.copySaveGame(obj.saveGame);

    if(obj.version != Spice.version) { // Update!
        if(!document.getElementById('logButton').classList.contains('hasUpdate')) {
            // CC was not updated, only the mod
            document.getElementById('checkForUpdate').textContent = "New mod update!";
            // NOTE: this might conflict with other mods
        }
        document.getElementById('logButton').classList.add('hasUpdate');
    }

    Spice.updateStockMarketRowsVisibility();
    Spice.loadStockMarketHistory();
    Spice.updateProfitTallyDisplay();
    Spice.patchDiscrepancy();
    Spice.patchPantheonSwaps();
}

Spice.init = function() {
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
    Game.customAscend.push(Spice.updateAcrossAscensionsStatistics);
    Game.customAscend.push(Spice.updateAcrossAscensionsStockMarketTallying);
    Game.customAscend.push(Spice.saveCurrentDebugUpgrades);

    // Reincarnate
    Game.registerHook('reincarnate', Spice.updateProfitTallyDisplay)
    Game.registerHook('reincarnate', Spice.updateStockMarketRowsVisibility);
    Game.registerHook('reincarnate', Spice.restoreDebugUpgrades);

    // Wrinklers
    Game.customWrinklerPop.push(Spice.checkWrinklersPoppedAcrossAscensionsAchievements);

    // Reindeer
    Game.customShimmerTypes['reindeer'].popFunc.push(Spice.checkReindeerClickedAcrossAscensionsAchievements);

    // Big cookie clicks
    Game.registerHook('click', Spice.checkHandmadeCookiesAcrossAscensionsAchievements);

    // Stock Market
    CCSE.MinigameReplacer(function() {
        Spice.updateStockMarketRows();
        Spice.createProfitTallyDiv();
        Spice.loadStockMarketHistory();
    }, 'Bank');

    /* The functions inside Game.customMinigame['Bank']
     * are only created by CCSE when the minigame launches,
     * so there is no guarantee they will exist right now.
     * We thus have to create them ourselves.
     */

    if(!Game.customMinigame['Bank'].tick) Game.customMinigame['Bank'].tick = [];
    Game.customMinigame['Bank'].tick.push(Spice.updateStockMarketRows);

    if(!Game.customMinigame['Bank'].buyGood) Game.customMinigame['Bank'].buyGood = [];
    Game.customMinigame['Bank'].buyGood.push(Spice.updateProfitTallyDisplay);
    Game.customMinigame['Bank'].buyGood.push(Spice.checkStockMarketTallyAchievements);

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(Spice.updateProfitTallyDisplay);
    Game.customMinigame['Bank'].sellGood.push(Spice.checkStockMarketTallyAchievements);

    // Pantheon
    CCSE.MinigameReplacer(function() {
        Spice.patchPantheonSwaps();
        Spice.mentionWrathCookiesInHolobore();
    }, 'Temple');

    // Statistics
    Game.customStatsMenu.push(Spice.allowPermanentUpgradeSlotSelectionWithinAscension);
    Game.customStatsMenu.push(Spice.displayAcrossAscensionsStatistics);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(Spice.name, Spice.version);
    });

    // Tooltips
    Spice.pushSeasonalCookieTooltips();

    // Lumps
    Game.customDoLumps.push(Spice.updateLumpCountColor)
    Game.customLumpTooltip.unshift(Spice.warnfulLumpTooltip); // unshift avoits conflict with CYOL

    // Upgrades
    Spice.createStockMarketModeDebugUpgrade();
    Game.customUpgrades['Omniscient day traders'].toggle.push(Spice.updateStockMarketRowsVisibility);

    Spice.createPermanentDebugUpgradesUpgrade();

    // Code injections
    Spice.injectNumericallyPreciseFormulaForHeavenlyChipGains();
    Spice.patchDiscrepancy();
    Spice.injectWarningIntoLumpConfirmationTooltip();

    // Legacy data, was previously stored in CCSE.config.OtherMods
    if(CCSE.config.OtherMods.Spice) {
        Spice.loadObject(CCSE.config.OtherMods.Spice);
        delete CCSE.config.OtherMods.Spice; // be a good citizen and not bloat CCSE's save object
    }

    /* Klattmose's mods and Cookie Clickre itself nest notifications like this
     * in the 'else' branch of a `if(Game.prefs.popup)` conditional.
     * However, it seems that this variable is always zero;
     * unless this changes in the future,
     * I will keep calling Game.Notify. */
    Game.Notify('Spiced Cookies loaded!', '', '', 1, 1);
}



/*****************
 * Wait for CCSE *
 *****************/

if(!Spice.isLoaded){
    if(CCSE && CCSE.isLoaded){
        Game.registerMod('Spiced cookies', Spice);
    }
    else {
        if(!CCSE) var CCSE = {};
        if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(function() {
            if(CCSE.ConfirmGameCCSEVersion(Spice.name, Spice.version, Spice.GameVersion, Spice.CCSEVersion)) {
                Game.registerMod('Spiced cookies', Spice);
            }
        });
    }
}
