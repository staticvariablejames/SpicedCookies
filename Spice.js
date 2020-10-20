// SPDX-License-Identifier: GPL-3.0-or-later

var Spice = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// Spice.launch is at the end of this file.
Spice.name = "Spiced Cookies";
Spice.version = "0.0.0"; // Semantic versioning
Spice.GameVersion = "2.029";
Spice.CCSEVersion = "2.018";

/* Injects or modifies the function with the given name.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 */
Spice.rewriteCode = function(functionName, pattern, replacement) {
    let code = eval(functionName + ".toString()");
    let newCode = code.replace(pattern, replacement);
    eval(functionName + " = " + newCode);
}

/* Both settings and saveGame are stored in the CCSE save,
 * but the save game is reset on a wipeSave whereas the settings are not.
 */
Spice.settings = { // default settings
    displayStockDelta: true,
    saveStockMarketHistory: true,
    tallyOnlyStockMarketProfits: true,
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
        Game.Objects['Bank'].minigame.goodsById[i].vals = Spice.saveGame.stockMarketHistory[i];
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
}

Spice.makeButton = function(settingName, onText, offText, onFunctionName, offFunctionName) {
    let set = Spice.settings[settingName];
    onText = onText.replace(/'/,'\\\''); // escape single quotes
    offText = offText.replace(/'/,'\\\'');
    let buttonId = "SpiceButton" + settingName;
    let onclick = `Spice.toggleSetting('${buttonId}', '${settingName}',
        '${onText}', '${offText}',
        ${onFunctionName}, ${offFunctionName}
    )`;
    return `<a id="${buttonId}" class="option${set? "" : " off"}" 
            onclick="${onclick};PlaySound('snd/tick.mp3');">
            ${set? onText : offText}
            </a>`;
}

Spice.customOptionsMenu = function() {
    let menuStr = "";
    menuStr += '<div class="listing">' + 
                Spice.makeButton('displayStockDelta',
                    'Display stock market deltas', 'Hide stock market deltas',
                    'Spice.enableStockMarketDeltaRows', 'Spice.disableStockMarketDeltaRows'
                ) + '</div>' +
                '<div class="listing">' +
                Spice.makeButton('saveStockMarketHistory',
                    'Save the stock market value history', 'Don\'t save stock market value history'
                ) + '</div>' +
                '<div class="listing">' +
                Spice.makeButton('tallyOnlyStockMarketProfits',
                    'Tally only stock market profits', 'Tally both profits and losses',
                    'Spice.updateProfitTallyDisplay', 'Spice.updateProfitTallyDisplay'
                ) + '<label>Whether to include or not negative profits in the across-ascensions stock market tally</label></div>' +
                '</div>';
    CCSE.AppendCollapsibleOptionsMenu(Spice.name, menuStr);
}

Spice.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(Spice.name, Spice.version, Spice.GameVersion, Spice.CCSEVersion)) {
        Spice.isLoaded = true;
        return;
    }

    // Options menu
    Game.customOptionsMenu.push(Spice.customOptionsMenu);

    // Save/reload
    CCSE.customSave.push(function() {
        // Run the save game functions
        Spice.saveStockMarketHistory();

        // Push the save to CSSE
        CCSE.save.OtherMods.Spice = {
            settings: Spice.settings,
            saveGame: Spice.saveGame,
        };
    });

    let loadSave = function() {
        // Pull the save from CCSE
        if(CCSE.save.OtherMods.Spice) {
            Spice.copySettings(CCSE.save.OtherMods.Spice.settings);
            Spice.copySaveGame(CCSE.save.OtherMods.Spice.saveGame);
        }

        // Run the load save functions
        if(Spice.settings.displayStockDelta) Spice.enableStockMarketDeltaRows();
        else Spice.disableStockMarketDeltaRows();

        Spice.loadStockMarketHistory();

        // Update displays
        Spice.updateProfitTallyDisplay();
    }
    CCSE.customLoad.push(loadSave);
    // We manually call loadSave() at the end of initialization

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

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(Spice.updateProfitTallyDisplay);

    // Statistics
    Game.customStatsMenu.push(Spice.displayAcrossAscensionStatistics);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(Spice.name, Spice.version);
    });

    loadSave();
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
