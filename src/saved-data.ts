/* This file contains the objects storing the settings, saveGame and sessionData,
 * and the code that handles the settings submenu in Options.
 *
 * The saveGame object is reset on a wipe save,
 * whereas the settings object is not.
 * The sessionData object contains info that must persist for longer than a function call,
 * but need not be stored in the saveGame.
 */

export let settings = { // default settings
    displayStockDelta: true,
    saveStockMarketHistory: true,
    tallyOnlyStockMarketProfits: true,
    awardAchievementsAcrossAscensions: false,
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
    simplify777upgradeAcquisition: false,
    extra777seriesUpgrades: false,
    patchGFDDelay: false,
    patchSeasonsAffectingFtHoF: false,
    grimoireSpellCastAnimations: false,
    patchDoublePop: false,
};

function makeDefaultSaveGame() {
    return {
        stockMarketHistory: [] as number[][],
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

export let saveGame = makeDefaultSaveGame();

/* Resets the save game to the default value.
 */
export function resetSaveGame() {
    saveGame = makeDefaultSaveGame();
}

export let sessionData = {
    ownedDebugUpgrades: [] as string[],
    pantheonSwapsPatched: false,
    backupsThisSession: 0,
    seasonsFtHoFpatched: false,
    canvas: (null as unknown) as HTMLCanvasElement,
    ctx: (null as unknown) as CanvasRenderingContext2D, // Context of the canvas above
    drawingCallbacks: [] as (() => void)[], // See the Grimoire animations module
    doublePopPatched: false,
};

/* Copies the given settings object to Spice.settings,
 * enforcing that the objects have their appropriate types.
 */
export function copySettings(newSettings: Record<string, unknown>) {
    if(!newSettings) return;
    let key: keyof typeof settings;
    for(key in settings) {
        if(!(key in newSettings)) continue;
        // @ts-ignore: Type 'number' is not assignable to type 'never'.
        if(typeof settings[key] == 'number') settings[key] = Number(newSettings[key]);
        // @ts-ignore: Type 'boolean' is not assignable to type 'never'.
        if(typeof settings[key] == 'boolean') settings[key] = Boolean(newSettings[key]);
    }
}

// Same, but for Spice.saveGame
export function copySaveGame(newSaveGame: Record<string, unknown>) {
    if(!newSaveGame) return;
    let key: keyof typeof saveGame;
    for(key in saveGame) {
        if(!(key in newSaveGame)) continue;
        // @ts-ignore: Type 'number' is not assignable to type 'never'.
        if(typeof saveGame[key] == 'number') saveGame[key] = Number(newSaveGame[key]);
        // @ts-ignore: Type 'boolean' is not assignable to type 'never'.
        if(typeof saveGame[key] == 'boolean') saveGame[key] = Boolean(newSaveGame[key]);
    }

    // Special handling for stockMarketHistory
    key = 'stockMarketHistory';
    if(key in newSaveGame && Array.isArray(newSaveGame[key])) {
        let newHistory = newSaveGame[key] as Array<number[]>;
        saveGame.stockMarketHistory = [];
        for(let i = 0; i < newHistory.length; i++) {
            saveGame[key][i] = [];
            if(!Array.isArray(newHistory[i])) continue;
            for(let j = 0; j < newHistory[i].length; j++)
                saveGame[key][i][j] = Number(newHistory[i][j]);
        }
    }
}
