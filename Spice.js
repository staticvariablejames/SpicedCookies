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

Spice.settings = { // default settings
    dummySetting: true,
};

/******************
 * User Interface *
 ******************/

/* Copies the given settings object to Spice.settings,
 * enforcing that the objects have their appropriate types.
 */
Spice.copySettings = function(settings) {
    if(!settings) return;
    let numericSettings = [];
    let booleanSettings = ['dummySetting'];

    for(key of numericSettings) {
        if(key in settings) Spice.settings[key] = Number(settings[key]);
    }
    for(key of booleanSettings) {
        if(key in settings) Spice.settings[key] = Boolean(settings[key]);
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
                Spice.makeButton('dummySetting', 'Dummy Setting ON', 'Dummy Setting OFF') +
                '</div>';
    CCSE.AppendCollapsibleOptionsMenu(Spice.name, menuStr);
}

Spice.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(Spice.name, Spice.version, Spice.GameVersion, Spice.CCSEVersion)) {
        Spice.isLoaded = true;
        return;
    }

    CCSE.customSave.push(function() {
        CCSE.save.OtherMods.Spice = {
            settings: Spice.settings,
        };
    });

    let loadSettings = function() {
        if(CCSE.save.OtherMods.Spice) {
            Spice.copySettings(CCSE.save.OtherMods.Spice.settings);
        }
    }
    loadSettings();
    CCSE.customLoad.push(loadSettings);

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
