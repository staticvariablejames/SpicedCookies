// SPDX-License-Identifier: GPL-3.0-or-later

let Spice = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

Spice.name = "Spiced Cookies";
Spice.version = "0.5.6"; // Semantic versioning
Spice.GameVersion = "2.031";
Spice.CCSEVersion = "2.025";

/* rewriteCode(targetFunction, pattern1, replacement1, pattern2, replacement2, ...)
 *
 * Rewrites the source code of the target function,
 * according to the provided list of pattern and replacements.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 * The altered function is returned.
 */
Spice.rewriteCode = function(targetFunction, ...args) {
    let code = targetFunction.toString();
    let patterns =     args.filter( (_, i) => i % 2 == 0 );
    let replacements = args.filter( (_, i) => i % 2 == 1 );
    for(let i = 0; i < replacements.length; i++) {
        code = code.replace(patterns[i], replacements[i]);
    }
    return (new Function('return ' + code))();
}

/* rewriteMinigameCode(buildingName, targetFunction, pattern1, replacement1, ...)
 *
 * Same as above, but tailored to replacing code in a minigame function.
 *
 * Each minigame lives inside an object that has an attribute named 'M' pointing to 'this'.
 * Minigame functions use that variable instead of 'this',
 * so if we rewrite code we have to supply that variable again.
 * That's why we need a separate function.
 */
Spice.rewriteMinigameCode = function(buildingName, targetFunction, ...args) {
    let code = targetFunction.toString();
    let patterns =     args.filter( (_, i) => i % 2 == 0 );
    let replacements = args.filter( (_, i) => i % 2 == 1 );
    for(let i = 0; i < replacements.length; i++) {
        code = code.replace(patterns[i], replacements[i]);
    }
    let M = Game.Objects[buildingName].minigame;
    return (new Function('M', 'return ' + code))(M);
}

// Icons
Spice.iconsURL = 'https://staticvariablejames.github.io/SpicedCookies/img/icons.png';
Spice.icons = {};
Spice.icons.floppyDisk = [0, 0, Spice.iconsURL];

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
    achievementsForBackingUp: false,
    patchSugarFrenzyPersistence: false,
    buff777upgrades: false,
    simplify777upgradeAquisition: false,
    extra777seriesUpgrades: false,
    patchGFDDelay: false,
    patchSeasonsAffectingFtHoF: false,
    grimoireSpellCastAnimations: false,
    patchDoublePop: false,
};

Spice.defaultSaveGame = function() {
    return {
        stockMarketHistory: [],
        bigCookieClicksPreviousAscensions: 0,
        wrinklersPoppedPreviousAscensions: 0,
        reindeerClickedPreviousAscensions: 0,
        handmadeCookiesPreviousAscensions: 0,
        stockMarketProfitsPreviousAscensions: 0,
        numberOfBackups: 0,
        numberOfValidBackups: 0, // "Valid" is for "Dilligent archivist" purposes
        lastValidBackupDate: 0,
    };
}
Spice.saveGame = Spice.defaultSaveGame();

/* Used to store data that needs to persist beyond a function call,
 * but does not need to be put in the save game data.
 */
Spice.sessionData = {
    ownedDebugUpgrades: [],
    pantheonSwapsPatched: false,
    backupsThisSession: 0,
    seasonsFtHoFpatched: false,
    canvas: null,
    ctx: null, // Context of the canvas above
    drawingCallbacks: [], // See the Grimoire animations module
    doublePopPatched: false,
};


/* A "safe version" of Game.Has,
 * that fails gracefully if `what` is not a member Game.Upgrades.
 */
Spice.Has = function(what) {
    return what in Game.Upgrades && Game.Has(what);
}



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
        if(Spice.Has('Omniscient day traders')) modeDiv.style.display = "block";
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
    // This function is run on load and on settings toggle
    if(!Spice.settings.extraAchievementsAcrossAscensions) return;

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
    // This function is run on load and on settings toggle
    if(!Spice.settings.extraStockMarketAchievements) return;

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

/* Computes a monotonic, numerically stable formula
 * for the number of heavenly chips gained by ascending.
 */
Spice.stableHeavenlyChipGains = function() {
    let f = Game.cookiesReset;
    let c = Game.cookiesEarned;
    let a = Math.cbrt((f+c)/1e12);
    let b = Math.cbrt(f/1e12);
    /* let vanillaFormula = Math.floor(a) - Math.floor(b); // not used directly
     * Vanilla Cookie Clicker actually uses Math.pow((f+c)/1e12, 1/Game.HCfactor).
     * Since Game.HCfactor is always 3,
     * we can replace Math.pow with Math.cbrt, which is more precise.
     * So the truncatedVanillaFormula below already has less numerical innacuracy.
     *
     * The downside is that if Orteil changes Game.HCfactor to anything different from 3
     * the formula below cannot be used anymore.
     */
    let approximation = c/1e12/(a*a + a*b + b*b);
    /* The approximation above is mathematically equivalent to a-b,
     * and it is numerically stable.
     * We just need to floor it to guarantee it is a lower bound.
     */
    approximation = Math.floor(approximation);
    let truncatedVanillaFormula = Math.min(Math.floor(a), 2**53) - Math.floor(b);
    /* If a < 2**53, we want to use the vanilla formula.
     * If b > 2**53, we want to use the numerically stable approximation.
     * If we have b < 2**53 < a, we still want to use the numerically stable approximation,
     * but simply using an 'if' might make the formula non-monotonic.
     * Returning the maximum between approximation and truncatedVanillaFormula fits the bill:
     * if b >= 2**53 then truncatedVanillaFormula <= 0 so the value equals approximation.
     * if a <= 2**53 then truncatedVanillaFormula = vanillaFormula >= approximation,
     * because there is no loss of precision here.
     * And finally,
     * both approximation and truncatedVanillaFormula are monotonic (with fixed b),
     * so their maximum is also monotonic.
     */
    return Math.max(approximation, truncatedVanillaFormula);
}

Spice.injectNumericallyStableFormulaForHeavenlyChipGains = function() {
    if(!Spice.settings.numericallyStableHeavenlyChipGains) return;

    Game.Logic = Spice.rewriteCode(Game.Logic,
        'var ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);',
        'var ascendNowToGet = Spice.stableHeavenlyChipGains(); // Spiced Cookies injection\n'
    );
    Game.EarnHeavenlyChips = Spice.rewriteCode(Game.EarnHeavenlyChips,
        'prestige>Game.prestige',
        'Spice.stableHeavenlyChipGains() > 0'
    );
    Game.EarnHeavenlyChips = Spice.rewriteCode(Game.EarnHeavenlyChips,
        'var prestigeDifference=prestige-Game.prestige;',
        'var prestigeDifference = Spice.stableHeavenlyChipGains(); // Spiced Cookies injection\n'
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
                let confirmButton = document.getElementById('promptOption0'); // another kludge
                confirmButton.addEventListener('click', Game.UpdateMenu);
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
    Spice.sessionData.ownedDebugUpgrades = [];
    /* There is no need to save this permanently
     * because games can't be saved while in the ascension menu.
     */

    if(!Spice.Has('Transcendent debugging')) return;

    for(i in Game.Upgrades) {
        if(Game.Upgrades[i].pool == 'debug' && Game.Upgrades[i].bought)
            Spice.sessionData.ownedDebugUpgrades.push(i);
    }
}

Spice.restoreDebugUpgrades = function() {
    // Executed on reincarnate
    for(i of Spice.sessionData.ownedDebugUpgrades) {
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
    return Spice.settings.warnLessThan100Lumps && Spice.Has('Sugar baking') && lumps < 100;
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
    // This function is run on save game load, minigame load, and settings toggle
    if(!Spice.settings.patchPantheonSwaps) return;
    if(!Game.Objects['Temple'].minigame) return; // It will be run again on minigame load
    if(Spice.sessionData.pantheonSwapsPatched) return;
    Spice.sessionData.pantheonSwapsPatched = true;

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



/************************************************
 * Module: Achievements for backing up the save *
 ************************************************/

Spice.createAchievementsForBackingUp = function() {
    // This function is run on load and on setting toggle
    if(!Spice.settings.achievementsForBackingUp) return;
    if('Archivist' in Game.Achievements) return; // Make this function idempotent

    let last;
    last = CCSE.NewAchievement('Archivist',
        `Back up your save file.
        <q>Future me will be thankful.</q>`,
        Spice.icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie'].order + 1;

    last = CCSE.NewAchievement('Diligent archivist',
        `Back up your save file in <b>30 distinct days</b>.
        <q>Thank you, past me!</q>`,
        Spice.icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie'].order + 1.1;

    last = CCSE.NewAchievement('Paranoid archivist',
        'Back up your save file <b>30 times in a single session</b>.',
        Spice.icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie'].order + 1.2;
    last.pool = 'shadow';
}

Spice.exportSaveCallback = function() {
    // Calls to this function are injected by Spice.injectCallbackOnExportSave
    Spice.saveGame.numberOfBackups++;

    if(Date.now() > Spice.saveGame.lastValidBackupDate + 18*3600*1000) {
        Spice.saveGame.lastValidBackupDate = Date.now();
        Spice.saveGame.numberOfValidBackups++;
    }

    if(Spice.settings.achievementsForBackingUp) {
        Game.Win('Archivist');

        if(Spice.saveGame.numberOfValidBackups >= 30) Game.Win('Diligent archivist');

        Spice.sessionData.backupsThisSession++;
        if(Spice.sessionData.backupsThisSession >= 30) Game.Win('Paranoid archivist');
    }
}

Spice.injectCallbackOnExportSave = function() {
    // This function is run on load
    Game.ExportSave = Spice.rewriteCode(Game.ExportSave,
        '{',
        '{Spice.exportSaveCallback(); // Spiced Cookies modification\n'
    );
    Game.FileSave = Spice.rewriteCode(Game.FileSave,
        '{',
        '{Spice.exportSaveCallback(); // Spiced Cookies modification\n'
    );
}

Spice.displayBackupStatistics = function() {
    // Pushed to Game.customStatsMenu
    if(Spice.saveGame.numberOfBackups > 0) {
        CCSE.AppendStatsSpecial(
            `<div class="listing">
                <b>Number of backups:</b>
                ${Beautify(Spice.saveGame.numberOfBackups)}
            </div>`
        );
    }
    if(Spice.saveGame.numberOfValidBackups > 0) {
        let s = Spice.saveGame.numberOfValidBackups > 1 ? 's' : '';
        CCSE.AppendStatsSpecial(
            `<div class="listing">
                <b>Number of days you backed up your save:</b>
                ${Spice.saveGame.numberOfValidBackups} day${s}
            </div>`
        );
    }
}



/*******************************************
 * Module: visual bug on building specials *
 *******************************************/

Spice.patchBuildingSpecialsVisualGlitch = function() {
    // Called on load
    Game.buffTypesByName['building buff'].func
        = Spice.rewriteCode(Game.buffTypesByName['building buff'].func,
            /Math.ceil/g,
            'Math.round'
        );
    Game.buffTypesByName['building debuff'].func
        = Spice.rewriteCode(Game.buffTypesByName['building debuff'].func,
            /Math.ceil/g,
            'Math.round'
        );
}



/*************************************************************************
 * Module: Fix Sugar Frenzy not disappearing if player has only one lump *
 *************************************************************************
 * Cookie Clicker does not save directly whether Sugar frenzy was already activated or not;
 * instead,
 * it relies on non-toggle upgrades being able to be purchased only once per ascension
 * to prevent it from being activated twice
 * (similarly to the Chocolate egg).
 *
 * For some reason,
 * Orteil put the code for activating Sugar frenzy inside the clickFunction method
 * (instead of putting it inside the buyFunction method).
 * As a result,
 * if the player activates Sugar frenzy while having just a single lump,
 * it will first decrement the lump count,
 * and then run the code for removing the upgrade from the store.
 * However, at this point, Game.Upgrades['Sugar frenzy'].canBuy() returns false,
 * so the game does not remove the upgrade from the store.
 *
 * The easiest way of fixing it is to marking Sugar frenzy as bought in the clickFunction.
 * This is still a kludge,
 * because we are not decoupling the check with the activation,
 * but it is the fastest way of fixing the bug.
 *
 * As explained in Spice.injectWarningIntoLumpConfirmationTooltip,
 * that code is not accessible for injection,
 * so we have to replace it completely.
 *
 * As a side-effect,
 * this extends that patch to Sugar frenzy too!
 */

Spice.patchSugarFrenzyUnwantedPersistence = function() {
    if(!Spice.settings.patchSugarFrenzyPersistence) return;

    Game.Upgrades['Sugar frenzy'].clickFunction = function() {
        return Game.spendLump(1, 'activate the sugar frenzy', function() {
			Game.Upgrades['Sugar frenzy'].buy(1);
			Game.Upgrades['Sugar frenzy'].bought = 1;
			Game.upgradesToRebuild = 1;

			buff=Game.gainBuff('sugar frenzy',60*60,3);
			Game.Notify('Sugar frenzy!','CpS x3 for 1 hour!',[29,14]);
        })();
    }
}



/*******************************************
 * Module: 777-series of heavenly upgrades *
 *******************************************/


Spice.multiplierBuff777UpgradeSeries = function() {
    /* Pushed to Game.customHeavenlyMultiplier,
     * Game.customShimmerTypes['golden'].durationMult,
     * and Game.customShimmerTypes['golden'].customEffectDurMod.
     */
    let mult = 1;
    if(Spice.settings.buff777upgrades) {
        if(Spice.Has('Lucky number')) mult *= 1.02/1.01;
        if(Spice.Has('Lucky payout')) mult *= 1.04/1.01;
        if(Spice.Has('Lucky tally')) mult *= 1.08;
        if(Spice.Has('Lucky value')) mult *= 1.16;
    } else {
        if(Spice.Has('Lucky tally')) mult *= 1.01;
        if(Spice.Has('Lucky value')) mult *= 1.01;
    }
    return mult;
}

Spice.replace777seriesAcquisitionRestrictions = function() {
    // Called on load and on toggle
    if(Spice.settings.simplify777upgradeAcquisition) {
        for(let name of ['Lucky digit', 'Lucky number', 'Lucky payout']) {
            let upgrade = Game.Upgrades[name];
            upgrade.showIf = Spice.rewriteCode(upgrade.showIf,
                'Math.ceil\(Game.prestige\)', 'Spice.stableHeavenlyChipGains()'
            );
        }
    } else { // Undo
        for(let name of ['Lucky digit', 'Lucky number', 'Lucky payout']) {
            let upgrade = Game.Upgrades[name];
            upgrade.showIf = Spice.rewriteCode(upgrade.showIf,
                'Spice.stableHeavenlyChipGains\(\)', 'Math.ceil(Game.prestige)'
            );
        }
    }
}

Spice.push777seriesTooltips = function() {
    // This function is called on load
    Game.customUpgrades['Lucky digit'].descFunc.push(function(me, desc) {
        if(Spice.settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
    Game.customUpgrades['Lucky number'].descFunc.push(function(me, desc) {
        if(Spice.settings.buff777upgrades) {
            desc = desc.replace(/1%/g, '2%');
        }
        if(Spice.settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
    Game.customUpgrades['Lucky payout'].descFunc.push(function(me, desc) {
        if(Spice.settings.buff777upgrades) {
            return desc.replace(/1%/g, '4%');
        }
        if(Spice.settings.simplify777upgradeAcquisition) {
            desc = desc.replace('prestige level ends in', 'gained prestige level ends in');
        }
        return desc;
    });
}

Spice.createExtra777seriesUpgrades = function() {
    // Called on load and on settings toggle
    if(!Spice.settings.extra777seriesUpgrades) return;
    if('Lucky tally' in Game.Upgrades) return; // Idempotency

    let previous0 = Game.Upgrades['Lucky number'];
    let previous1 = Game.Upgrades['Lucky payout'];
    let deltaX = (previous1.posX - previous0.posX)*0.75;
    let deltaY = (previous1.posY - previous0.posY)*0.75;

    let last;
    last = CCSE.NewHeavenlyUpgrade('Lucky tally', 'why BeautifyInText, Orteil?',
        777_777_777_777,
        previous1.icon,
        previous1.posX + deltaX, previous1.posY + deltaY,
        ['Lucky payout']
    );
    last.descFunc = function() {
        let p = Spice.buff777upgrades ? 1 : 8; // Percentage
        return `<b>+${p}%</b> prestige level effect on CpS.<br>
        <b>+${p}%</b> golden cookie effect duration.<br>
        <b>+${p}%</b> golden cookie lifespan.
        <q>This upgrade only exists due to a stroke of luck.
            It's stealth abilities can hardly be surpassed.
            it only appears when your gained prestige level ends in 7,777,777,777.
        </q>`;
    }
    last.showIf = function(){
        return Spice.stableHeavenlyChipGains() % 10_000_000_000 == 7_777_777_777;
    }
    last.order = previous1.order + 0.001;

    last = CCSE.NewHeavenlyUpgrade('Lucky value', 'why BeautifyInText, Orteil?',
        77_777_777_777_777_777,
        previous1.icon,
        previous1.posX + 2*deltaX, previous1.posY + 2*deltaY,
        ['Lucky tally']
    );
    last.descFunc = function() {
        let p = Spice.buff777upgrades ? 1 : 16; // Percentage
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
        return Spice.stableHeavenlyChipGains() % 1_000_000_000_000_000 == 777_777_777_777_777;
    }
}



/*******************************************
 * Module: Heavenly Backdoor debug upgrade *
 *******************************************/

Spice.createHeavenlyBackdoorDebugUpgrade = function() {
    // Run on init; contains injections
    if('Heavenly backdoor' in Game.Upgrades) return; // Make this function indempotent

    let upgrade = CCSE.NewUpgrade('Heavenly backdoor',
        'Remove restrictions for purchasing heavenly upgrades' +
        '<q>I\'m in.</q>',
        7, [15, 7]
    );
    upgrade.order = Game.Upgrades['A really good guide book'].order + 0.003;
    upgrade.pool = 'debug';

    Game.BuildAscendTree = Spice.rewriteCode(Game.BuildAscendTree,
        'me.canBePurchased=1',
        "$&;\nif(Spice.Has('Heavenly backdoor')) continue; // Spiced Cookies injection\n"
    );
}



/*************************************
 * Module: Patch GFD's casting delay *
 *************************************/

Spice.patchGFDDelay = function() {
    // This function is run on save game load, minigame load, and settings toggle
    if(!Spice.settings.patchGFDDelay) return;
    if(!Game.Objects['Wizard tower'].minigame) return; // Run again on minigame load

    // Replacements make this function inherently idempotent

    let spell = Game.Objects['Wizard tower'].minigame.spells['gambler\'s fever dream'];
    spell.win = Spice.rewriteMinigameCode('Wizard tower',
        spell.win,
        'setTimeout(function(spell,cost,seed)',
        /* There are two calls to setTimeout, we only want to overwrite the first.
         * We could rely on the substitution order,
         * but this also makes this function idempotent without extra work. */
        `let callRightAway = function(f, ignored) {f();}; // Spiced cookies patch
        callRightAway(function(spell,cost,seed)`
    );
    spell.win = Spice.rewriteMinigameCode('Wizard tower',
        spell.win,
        "' magic...</div>',Game.mouseX,Game.mouseY",
        "' magic...</div>',Game.mouseX,Game.mouseY-50"
        // Both GFD and the chosen spell have popup messages; this makes sure they don't overlap
    );
}



/*****************************************
 * Module: patch seasons affecting FtHoF *
 *****************************************/

Spice.patchSeasonsAffectingFtHoF = function() {
    // This function is run on save load, minigame load, and settings toggle
    if(!Spice.settings.patchSeasonsAffectingFtHoF) return;
    if(!Game.Objects['Wizard tower'].minigame) return;
    if(Spice.sessionData.seasonsFtHoFpatched) return;
    Spice.sessionData.seasonsFtHoFpatched = true;
    let spell = Game.Objects['Wizard tower'].minigame.spells['hand of fate'];

    spell.win = Spice.rewriteMinigameCode('Wizard tower', spell.win,
        "var newShimmer=new Game.shimmer('golden',{noWrath:true});",
        "Math.random(); Math.random(); // Spiced cookies patch\n"
        /* Keeping these two Math.random calls guarantee that the FtHoF outcome with the patch
         * matches the out-of-season outcome witohut the patch.
         * This keeps planners working,
         * and prevent players from using this patch to scum another FtHoF outcome.
         */
    ,
        "newShimmer.force=choose(choices);",
        "let force = choose(choices); let sizeMult; // Spiced Cookies patch \n"
    ,
        "newShimmer.force=='cookie storm drop'",
        "force=='cookie storm drop'"
    ,
        "newShimmer.sizeMult=Math.random()*0.75+0.25;",
        "sizeMult=Math.random()*0.75+0.25;"
    ,
        /}$/,
        `let newShimmer = new Game.shimmer('golden',{noWrath:true}); // Spiced cookies patch
        newShimmer.force = force;
        if(sizeMult) newShimmer.sizeMult = sizeMult;
        }`
    );

    spell.fail = Spice.rewriteMinigameCode('Wizard tower', spell.fail,
        "var newShimmer=new Game.shimmer('golden',{wrath:true});",
        "Math.random(); Math.random(); // Spiced cookies patch\n"
    ,
        "newShimmer.force=choose(choices);",
        "let force = choose(choices); // Spiced Cookies patch \n"
    ,
        /}$/,
        `let newShimmer = new Game.shimmer('golden',{wrath:true}); // Spiced cookies patch
        newShimmer.force = force;
        }`
    );

}



/*******************************
 * Module: grimoire animations *
 *******************************
 *
 * Architecture of this module:
 *
 * When the mod loads, it runs Spice.createCanvas,
 * which creates a canvas covering the entire game area.
 * This canvas sits in front of the game area,
 * but let any pointer events pass through.
 *
 * The main drawing loop is coordinated by Spice.sessionData.drawingCallbacks.
 * Each function in that array is executed once per "drawing tick",
 * and removed from the array once it returns a falsy value.
 * This allows short-lived animations to be created by pushing a closure to that array,
 * and the closure is automatically removed once it returns false.
 *
 * The convenience functions below
 * generate and push closures to Spice.sessionData.drawingCallbacks
 * for doing several tasks.
 *
 * Spice.sessionData.drawingCallbacks is automatically erased on load and ascension.
 */

Spice.createCanvas = function() {
    // This function is run on mod load
    Spice.sessionData.canvas = document.createElement('canvas');
    document.body.prepend(Spice.sessionData.canvas);

    let setDimensions = function() {
        Spice.sessionData.canvas.width = window.innerWidth;
        Spice.sessionData.canvas.height = window.innerHeight - 2; // FIXME
    };
    setDimensions();
    window.addEventListener('resize', setDimensions);

    Spice.sessionData.canvas.style.position = 'absolute';
    Spice.sessionData.canvas.style.zIndex = 100000000000000000000; // FIXME
    Spice.sessionData.canvas.style.pointerEvents = 'none';

    Spice.sessionData.ctx = Spice.sessionData.canvas.getContext('2d');
}

Spice.clearCanvas = function() {
    Spice.sessionData.ctx.clearRect(0, 0,
        Spice.sessionData.canvas.width, Spice.sessionData.canvas.height
    );
}

Spice.clearCanvasCallbacks = function() {
    // Ran on ascension
    Spice.sessionData.drawingCallbacks = [];
}

Spice.drawCanvas = function() {
    // This is pushed to the game's "logic" hook
    Spice.clearCanvas();

    Spice.sessionData.drawingCallbacks = Spice.sessionData.drawingCallbacks.filter(
        callback => callback()
    );
}

/* Example of an animation callback generator:
 * it draws a circle with the given a center and a radius,
 * shrinking the radius one unit per game tick.
 */
Spice.animateShrinkingCircle = function(centerX, centerY, radius) {
    let startT = Game.T;
    Spice.sessionData.drawingCallbacks.push(() => {
        Spice.sessionData.ctx.beginPath();
        Spice.sessionData.ctx.arc(centerX, centerY, radius + startT - Game.T, 0, 2*Math.PI);
        Spice.sessionData.ctx.fill();
        return Game.T <= startT + radius - 1;
    });
}

Spice.animateGFD = function(targetId) {
    let gfdId = Game.Objects['Wizard tower'].minigame.spells['gambler\'s fever dream'].id;
    let arc = 6;
    let decay = 30;
    let direction = Math.random() < 0.5; // Above or below the spell buttons
    let sourceRect = document.getElementById('grimoireSpell' + gfdId).getBoundingClientRect();
    let targetRect = document.getElementById('grimoireSpell' + targetId).getBoundingClientRect();
    let sourceX = (sourceRect.left + sourceRect.right)/2;
    let sourceY = (direction ^ (targetId > gfdId)) ? sourceRect.bottom : sourceRect.top;
    let targetX = (targetRect.left + targetRect.right)/2;
    let targetY = (direction ^ (targetId > gfdId)) ? targetRect.bottom : targetRect.top;
    let centerX = (sourceX + targetX)/2;
    let centerY = (sourceY + targetY)/2;

    let startT = Game.T;
    let radius = Math.hypot(sourceX - targetX, sourceY - targetY)/2;
    let startAngle = Math.atan2(sourceY - targetY, sourceX - targetX);

    Spice.sessionData.drawingCallbacks.push(() => {
        let t = Game.T - startT;
        let endAngle = startAngle + (direction ? Math.PI : -Math.PI);
        if(t < arc) {
            endAngle = startAngle + t/arc * (direction ? Math.PI : -Math.PI);
        }
        let alpha = t < arc ? 1 : 1 - (t-arc)/decay;
        Spice.sessionData.ctx.strokeStyle = `rgba(0, 200, 0, ${alpha})`;
        Spice.sessionData.ctx.lineWidth = 5;
        Spice.sessionData.ctx.beginPath();
        Spice.sessionData.ctx.arc(centerX, centerY, radius, startAngle, endAngle, !direction);
        Spice.sessionData.ctx.stroke();

        return t <= arc + decay;
    });
}

Spice.injectGrimoireAnimations = function() {
    // Called on minigame load
    let M = Game.Objects['Wizard tower'].minigame;
    if(!M) return; // safeguard; should never happen
    M.castSpell = Spice.rewriteMinigameCode('Wizard tower', M.castSpell,
        'Game.SparkleAt',
        `if(! Spice.settings.grimoireSpellCastAnimations) Game.SparkleAt`
    );

    M.spells['gambler\'s fever dream'].win = Spice.rewriteMinigameCode('Wizard tower',
        M.spells['gambler\'s fever dream'].win,
        'var out=M.castSpell',
        `if(Spice.settings.grimoireSpellCastAnimations) { // Spiced cookies injection
            Spice.animateGFD(spell.id);
        }
        $&`
    );
}



/****************************
 * Module: double-pop patch *
 ****************************/

Spice.patchDoublePop = function() {
    // This function is run on save game load and settings toggle
    if(!Spice.settings.patchDoublePop) return;
    if(Spice.sessionData.doublePopPatched) return;
    Game.shimmer.prototype.pop = Spice.rewriteCode(Game.shimmer.prototype.pop,
        '{',
        '{if (this.l.parentNode == null) return; // Spiced cookies patch\n'
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
        'achievementsForBackingUp',
        'patchSugarFrenzyPersistence',
        'buff777upgrades',
        'simplify777upgradeAcquisition',
        'extra777seriesUpgrades',
        'patchGFDDelay',
        'patchSeasonsAffectingFtHoF',
        'grimoireSpellCastAnimations',
        'patchDoublePop',
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
        'numberOfBackups',
        'numberOfValidBackups',
        'lastValidBackupDate',
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
            'Spice.injectNumericallyStableFormulaForHeavenlyChipGains',
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

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

    menuStr += '<div class="listing">' +
        Spice.makeButton('achievementsForBackingUp',
            'Create achievements for backing up the game save',
            'Don\'t create new achievements for backing up the save',
            'Spice.createAchievementsForBackingUp'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchSugarFrenzyPersistence',
            'Patch Sugar frenzy not disappearing when activated with a single lump',
            'Don\'t patch Sugar frenzy',
            'Spice.patchSugarFrenzyUnwantedPersistence'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('buff777upgrades',
            'Buff the 777-series of upgrades',
            'Don\'t buff the 777-series of upgrades',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('simplify777upgradeAcquisition',
            'Unlock the 777-series of upgrades based on prestige gain',
            'Unlock the 777-series of upgrades based on current prestige',
            'Spice.replace777seriesAcquisitionRestrictions',
            'Spice.replace777seriesAcquisitionRestrictions' // Called on both cases
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('extra777seriesUpgrades',
            'Create two new heavenly upgrades for the 777-series of upgrades',
            'Don\'t extend the 777-series of upgrades',
            'Spice.createExtra777seriesUpgrades'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchGFDDelay',
            'Patch the delay from Gambler\'s Fever Dream',
            'Don\'t patch the delay in Gambler\'s Fever Dream',
            'Spice.patchGFDDelay'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchSeasonsAffectingFtHoF',
            'Disable seasons affecting the outcome of Force the Hand of Fate',
            'Keep seasons affecting the outcome of Force the Hand of Fate',
            'Spice.patchSeasonsAffectingFtHoF'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('grimoireSpellCastAnimations',
            'Spice up the Grimoire spell casting animations',
            'Use Vanilla Grimoire spell casting animations',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        Spice.makeButton('patchDoublePop',
            'Patch double-popping shimmers',
            'Don\'t patch shimmer double-popping',
            'Spice.patchDoublePop'
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

    <div class="subsection update small"><div class="title">2021-09-02 - Yet another changeless upgrade</div>
        <div class="listing">&bull; Update to use CCSE 2.023.</div>
    </div>

    <div class="subsection update small"><div class="title">2021-07-14 - Still no changes</div>
        <div class="listing">&bull; Internal change:
        set the flag \`Spice.isLoaded\` to true when the mod is loaded.
    </div>

    <div class="subsection update small"><div class="title">2021-03-27 - No changes</div>
        <div class="listing">&bull; Update to use CCSE 2.023.</div>
    </div>

    <div class="subsection update small"><div class="title">2021-01-30 - Oops</div>
        <div class="listing">&bull; Bugfix:
            The setting for adding two new 777-series of upgrades was not being saved.</div>
    </div>

    <div class="subsection update small"><div class="title">2020-12-23 - Can I Has a Bugfix</div>
        <div class="listing">&bull; Bugfix:
            Spiced Cookies could crash the game during challenge runs.</div>
    </div>

    <div class="subsection update small"><div class="title">2020-12-12 - Pop a Patch</div>
        <div class="listing">&bull; Patch vanilla bug:
            Shimmers may be popped twice.</div>
    </div>

    <div class="subsection update"><div class="title">2020-12-11 - Bugfixes galore</div>
        <div class="listing">&bull; Patch vanilla bug:
            Cookie Clicker sometimes display a slightly wrong buff for building specials.</div>
        <div class="listing">&bull; Patch vanilla bug:
            Sugar frenzy can sometimes be used several times in an ascension.</div>
        <div class="listing">&bull; Patch vanilla bug:
            remove the delay in Gambler's Fever Dream.</div>
        <div class="listing">&bull; Patch vanilla bug:
            Easter/Valentine's affect outcome of Force the Hand of Fate.</div>
        <div class="listing">&bull; New animation for Gambler's Fever Dream!</div>
        <div class="listing">&bull; The numerically stable formula for heavenly chip gains
            is now "smoother".</div>
        <div class="listing">&bull; New debug upgrade:
            Heavenly backdoor (bypass requirements for unlocking heavenly upgrades).</div>
        <div class="listing">&bull; The 777-series of upgrades
            can optionally be unlocked based on prestige gain,
            rather than current prestige level.</div>
        <div class="listing">&bull; The 777-series of upgrades
            can optionally be buffed to +1%, +2%, +4% instead of +1%, +1%, +1%.</div>
        <div class="listing">&bull; Two new heavenly upgrades for the 777-series.</div>
        <div class="listing">&bull; Bug fix:
            Changing permanent upgrade slots used to take a few seconds to update visually.</div>
    </div>

    <div class="subsection update"><div class="title">2020-12-03 - Memory aids</div>
        <div class="listing">&bull; Lump count is colored red if smaller than 100
            and Sugar baking is present (enabled by default)</div>
        <div class="listing">&bull; Patch vanilla bug in the pantheon (disabled by default)</div>
        <div class="listing">&bull; Clarify that Holobore is affected by wrath cookies too
            (non-disableable)</div>
        <div class="listing">&bull; Record the number of times the game was backed up
            (non-disableable)</div>
        <div class="listing">&bull; Three new achievements for backing up the save game
            (disabled by default)</div>
        <div class="listing">&bull; Bug fix: opted-in achievements were not being created
            after loading a save game.</div>
    </div>

    <div class="subsection update"><div class="title">2020-11-06 - Debugging discrepancies</div>
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

    <div class="subsection update"><div class="title">2020-10-31 - UI niceties</div>
        <div class="listing">&bull; Numerically stable formula for heavenly chip gains (disabled by default)</div>
        <div class="listing">&bull; Permanent upgrade slots can be chosen during an ascension (non-disableable)</div>
        <div class="listing">&bull; Season switcher tooltips says how many seasonal upgrades were unlocked (non-disableable)</div>
    </div>

    <div class="subsection update"><div class="title">2020-10-23 - alpha release</div>
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

    /* A few modules (namely, achievements and vanilla bugfixes)
     * are only run if the player explicitly asks for it,
     * so we must run the corrseponding functions here.
     *
     * The check for the corresponding setting happens inside the function itself,
     * so there is no need for 'if's here.
     */

    // Achievements
    Spice.createAchievementsForProgressAcrossAscensions();
    Spice.createStockMarketAchievements();
    Spice.createAchievementsForBackingUp();

    // Upgrades
    Spice.createExtra777seriesUpgrades();

    // Conditional code injections
    Spice.replace777seriesAcquisitionRestrictions();

    // Patches
    Spice.injectNumericallyStableFormulaForHeavenlyChipGains();
    Spice.patchDiscrepancy();
    Spice.patchPantheonSwaps();
    Spice.patchSugarFrenzyUnwantedPersistence();
    Spice.patchGFDDelay();
    Spice.patchSeasonsAffectingFtHoF();
    Spice.patchDoublePop();
}

Spice.init = function() {
    Spice.isLoaded = true;

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

    // Generate the canvas
    Spice.createCanvas();
    Game.registerHook('logic', Spice.drawCanvas);

    // Ascension
    Game.customAscend.push(Spice.updateAcrossAscensionsStatistics);
    Game.customAscend.push(Spice.updateAcrossAscensionsStockMarketTallying);
    Game.customAscend.push(Spice.saveCurrentDebugUpgrades);
    Game.customAscend.push(Spice.clearCanvasCallbacks);

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

    // Grimoire
    CCSE.MinigameReplacer(function() {
        Spice.patchGFDDelay();
        Spice.injectGrimoireAnimations();
    }, 'Wizard tower');

    // Effect multipliers
    Game.customHeavenlyMultiplier.push(Spice.multiplierBuff777UpgradeSeries);
    Game.customShimmerTypes['golden'].durationMult.push(Spice.multiplierBuff777UpgradeSeries);
    Game.customShimmerTypes['golden'].customEffectDurMod.push(Spice.multiplierBuff777UpgradeSeries);

    // Statistics
    Game.customStatsMenu.push(Spice.allowPermanentUpgradeSlotSelectionWithinAscension);
    Game.customStatsMenu.push(Spice.displayAcrossAscensionsStatistics);
    Game.customStatsMenu.push(Spice.displayBackupStatistics);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(Spice.name, Spice.version);
    });

    // Tooltips
    Spice.pushSeasonalCookieTooltips();
    Spice.push777seriesTooltips();

    // Lumps
    Game.customDoLumps.push(Spice.updateLumpCountColor)
    Game.customLumpTooltip.unshift(Spice.warnfulLumpTooltip);
    // Calling unshift instead of push avoids order dependence with respect to CYOL

    // Upgrades
    Spice.createStockMarketModeDebugUpgrade();
    Game.customUpgrades['Omniscient day traders'].toggle.push(Spice.updateStockMarketRowsVisibility);

    Spice.createPermanentDebugUpgradesUpgrade();
    Spice.createHeavenlyBackdoorDebugUpgrade(); // Contains a code injection

    // Code injections
    Spice.injectWarningIntoLumpConfirmationTooltip();
    Spice.injectCallbackOnExportSave();
    Spice.patchBuildingSpecialsVisualGlitch();

    // Legacy data, was previously stored in CCSE.config.OtherMods
    if(CCSE.config.OtherMods.Spice) {
        Spice.loadObject(CCSE.config.OtherMods.Spice);
        delete CCSE.config.OtherMods.Spice; // be a good citizen and not bloat CCSE's save object
    }

    /* Klattmose's mods and Cookie Clicker itself
     * nest notifications like this in the 'else' branch of a `if(Game.prefs.popup)` conditional.
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
