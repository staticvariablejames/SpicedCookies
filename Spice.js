// SPDX-License-Identifier: GPL-3.0-or-later

var Spice = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// Spice.launch is at the end of this file.
Spice.name = "Spiced Cookies";
Spice.version = "0.0.0"; // Semantic versioning
Spice.GameVersion = "2.029";
Spice.CCSEVersion = "2.017";

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
};

Spice.defaultSaveGameObject = function() {
    return {
        stockMarketHistory: [],
    };
}
Spice.saveGame = Spice.defaultSaveGameObject();

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

/* Creates the rows that display the deltas for the stock market goods.
 * Each box has the text "delta: " followed by a div with id `stockMarketDelta-${id}`
 */
Spice.createStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let upperBox = document.getElementById('bankGood-' + i).firstChild;
        let valueDiv = document.getElementById('bankGood-' + i + '-val').parentNode;
        let deltaDiv = upperBox.insertBefore(document.createElement("div"), valueDiv.nextSibling);

        // Copy the style from the other div, because assigning quantileDiv.style don't work
        for(let key in valueDiv.style) {
            deltaDiv.style[key] = valueDiv.style[key];
        }

        deltaDiv.innerHTML = 'delta: <div id="stockMarketDelta-' + i + '" ' +
            'style="display:inline; font-weight:bold;">0</div>';
    }
    Spice.updateStockMarketDeltaRows();
}

/* Updates the text inside the row created by Spice.createStockMarketDeltaRows.
 * This is pushed to Game.customMinigame.Bank.tick.
 */
Spice.updateStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let div = document.getElementById('stockMarketDelta-' + i);
        if(div) {
            div.innerHTML = Math.floor(1000*Game.Objects['Bank'].minigame.goodsById[i].d)/1000;
        }
    }
}

// Show the delta rows
Spice.enableStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let deltaDiv = document.getElementById('stockMarketDelta-' + i).parentNode;
        deltaDiv.style.display = "block";
    }
}

// Hide the delta rows
Spice.disableStockMarketDeltaRows = function() {
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        let deltaDiv = document.getElementById('stockMarketDelta-' + i).parentNode;
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
    for(let i = 0; i < Spice.stockMarketGoodsCount(); i++) {
        Game.Objects['Bank'].minigame.goodsById[i].vals = Spice.saveGame.stockMarketHistory[i];
    }
}

/* There is no need to do anything when ascending or wiping the save,
 * because Game.Objects.Bank.minigame.goodsById[i].vals gets wiped out by the game itself.
 */

/******************
 * User Interface *
 ******************/

/* Copies the given settings object to Spice.settings,
 * enforcing that the objects have their appropriate types.
 */
Spice.copySettings = function(settings) {
    if(!settings) return;
    let numericSettings = [];
    let booleanSettings = ['displayStockDelta'];

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
    let numberMatrixSettings = ['stockMarketHistory'];

    for(key of numberMatrixSettings) {
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
                ) +
                '</div>';
    CCSE.AppendCollapsibleOptionsMenu(Spice.name, menuStr);
}

Spice.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(Spice.name, Spice.version, Spice.GameVersion, Spice.CCSEVersion)) {
        Spice.isLoaded = true;
        return;
    }

    CCSE.customSave.push(function() {
        // Run the save game functions
        Spice.saveStockMarketHistory();

        // Push the save to CSSE
        CCSE.save.OtherMods.Spice = {
            settings: Spice.settings,
            saveGame: Spice.saveGame,
        };
    });

    // Stock Market
    CCSE.MinigameReplacer(function() {
        Spice.createStockMarketDeltaRows();

        Game.customMinigame['Bank'].tick.push(Spice.updateStockMarketDeltaRows);
    }, 'Bank');

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
    }
    loadSave();
    CCSE.customLoad.push(loadSave);

    Game.customOptionsMenu.push(Spice.customOptionsMenu);

    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(Spice.name, Spice.version);
    });
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
