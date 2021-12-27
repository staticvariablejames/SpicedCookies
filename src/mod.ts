/* Defines the metadata used e.g. in `Game.registerMod`.
 */

import * as package_json from '../package.json';

export const name = "Spiced Cookies";
export const version = package_json.version;
export const GameVersion = "2.031";
export const CCSEVersion = "2.031";
export let isLoaded = false;

import { settings, saveGame, copySettings, copySaveGame, resetSaveGame } from './saved-data';

import { loadStockMarketHistory, saveStockMarketHistory } from './modules/stock-market/history';
import {
    updateStockMarketRows,
    updateStockMarketRowsVisibility,
    createStockMarketModeDebugUpgrade,
} from './modules/stock-market/extra-rows';
import { createStockMarketAchievements } from './modules/stock-market/extra-achievements';
import {
    createProfitTallyDiv,
    updateProfitTallyDisplay,
    updateAcrossAscensionsStockMarketTallying,
} from './modules/stock-market/across-ascensions-tally';

import {
    updateAcrossAscensionsStatistics,
    displayAcrossAscensionsStatistics,
} from './modules/extra-statistics-across-ascensions';
import { createAchievementsForProgressAcrossAscensions } from './modules/extra-achievements-across-ascensions';
import {
    createAchievementsForBackingUp,
    displayBackupStatistics,
    injectCallbackOnExportSave,
} from './modules/achievements-for-backups';
import {
    createExtra777seriesUpgrades,
    replace777seriesAcquisitionRestrictions,
    multiplierBuff777UpgradeSeries,
    push777seriesTooltips,
} from './modules/777-series-of-upgrades';
import { injectNumericallyStableFormulaForHeavenlyChipGains } from './modules/numerical-stability';
import {
    createPermanentDebugUpgradesUpgrade,
    saveCurrentDebugUpgrades,
    restoreDebugUpgrades,
} from './modules/transcendent-debugging';
import {
    checkWrinklersPoppedAcrossAscensionsAchievements,
    checkReindeerClickedAcrossAscensionsAchievements,
    checkHandmadeCookiesAcrossAscensionsAchievements,
    checkStockMarketTallyAchievements,
} from './modules/award-achievements-across-ascensions';
import { mentionWrathCookiesInHolobore } from './modules/holobore-mentions-wrath-cookies';
import { allowPermanentUpgradeSlotSelectionWithinAscension } from './modules/select-permanent-upgrade-slot';
import { pushSeasonalCookieTooltips } from './modules/seasonal-cookies-tooltip';
import {
    updateLumpCountColor,
    warnfulLumpTooltip,
    injectWarningIntoLumpConfirmationTooltip,
} from './modules/warn-sugar-baking-overspending';
import { createHeavenlyBackdoorDebugUpgrade } from './modules/heavenly-backdoor';

import { patchDiscrepancy } from './modules/discrepancy-patch';
import { patchPantheonSwaps } from './modules/pantheon-swap-patch';
import { patchSugarFrenzyUnwantedPersistence } from './modules/sugar-frenzy-patch';
import { patchGFDDelay } from './modules/gfd-delay-patch';
import { patchSeasonsAffectingFtHoF } from './modules/fthof-season-patch';
import { patchDoublePop } from './modules/double-pop-patch';
import { patchBuildingSpecialsVisualGlitch } from './modules/building-special-visual-glitch-patch';

import { customOptionsMenu } from './options-menu';
import { addVersionHistory } from './append-version-history';

import {
    createCanvas,
    drawCanvas,
    clearCanvasCallbacks,
    injectGrimoireAnimations,
} from './modules/grimoire-animations';


export function save() {
    // Run the save game functions
    saveStockMarketHistory();

    return JSON.stringify({settings, saveGame, version});
}

export function load(str: string) {
    let obj = JSON.parse(str);
    loadObject(obj);
}

function loadObject(obj: Record<string, unknown>) {
    copySettings(obj.settings as any);
    copySaveGame(obj.saveGame as any);

    if(obj.version != version) { // Update!
        if(!document.getElementById('logButton')!.classList.contains('hasUpdate')) {
            // CC was not updated, only the mod
            document.getElementById('checkForUpdate')!.textContent = "New mod update!";
            // NOTE: this might conflict with other mods
        }
        document.getElementById('logButton')!.classList.add('hasUpdate');
    }

    updateStockMarketRows();
    updateStockMarketRowsVisibility();
    loadStockMarketHistory();
    updateProfitTallyDisplay();

    /* A few modules (namely, achievements and vanilla bugfixes)
     * are only run if the player explicitly asks for it,
     * so we must run the corrseponding functions here.
     *
     * The check for the corresponding setting happens inside the function itself,
     * so there is no need for 'if's here.
     */

    // Achievements
    createAchievementsForProgressAcrossAscensions();
    createStockMarketAchievements();
    createAchievementsForBackingUp();

    // Upgrades
    createExtra777seriesUpgrades();

    // Conditional code injections
    replace777seriesAcquisitionRestrictions();

    // Patches
    injectNumericallyStableFormulaForHeavenlyChipGains();
    patchDiscrepancy();
    patchPantheonSwaps();
    patchSugarFrenzyUnwantedPersistence();
    patchGFDDelay();
    patchSeasonsAffectingFtHoF();
    patchDoublePop();
}

export function init() {
    isLoaded = true;

    // Options menu
    Game.customOptionsMenu.push(customOptionsMenu);

    // Info menu
    addVersionHistory();

    // Hard reset: replace Spice.saveGame with the default savegame
    Game.customReset.push(function(hard: boolean) {
        if(hard) {
            resetSaveGame();

            /* On a hard reset, Game.Objects.Bank.minigame.launch gets executed
             * before we have the chance to overwrite Spice.saveGame,
             * so Spice.updateProfitTallyDisplay is ran with old data by Spice.createProfitTallyDiv.
             * Hence we have to run it again here.
             */
            updateProfitTallyDisplay();
        }
    });

    // Generate the canvas
    createCanvas();
    Game.registerHook('logic', drawCanvas);

    // Ascension
    Game.customAscend.push(updateAcrossAscensionsStatistics);
    Game.customAscend.push(updateAcrossAscensionsStockMarketTallying);
    Game.customAscend.push(saveCurrentDebugUpgrades);
    Game.customAscend.push(clearCanvasCallbacks);

    // Reincarnate
    Game.registerHook('reincarnate', updateProfitTallyDisplay)
    Game.registerHook('reincarnate', updateStockMarketRowsVisibility);
    Game.registerHook('reincarnate', restoreDebugUpgrades);

    // Wrinklers
    Game.customWrinklerPop.push(checkWrinklersPoppedAcrossAscensionsAchievements);

    // Reindeer
    Game.customShimmerTypes['reindeer'].popFunc.push(checkReindeerClickedAcrossAscensionsAchievements);

    // Big cookie clicks
    Game.registerHook('click', checkHandmadeCookiesAcrossAscensionsAchievements);

    // Stock Market
    CCSE.MinigameReplacer(function() {
        updateStockMarketRows();
        createProfitTallyDiv();
        loadStockMarketHistory();
    }, 'Bank');

    /* The functions inside Game.customMinigame['Bank']
     * are only created by CCSE when the minigame launches,
     * so there is no guarantee they will exist right now.
     * We thus have to create them ourselves.
     */

    if(!Game.customMinigame['Bank'].tick) Game.customMinigame['Bank'].tick = [];
    Game.customMinigame['Bank'].tick.push(updateStockMarketRows);

    if(!Game.customMinigame['Bank'].buyGood) Game.customMinigame['Bank'].buyGood = [];
    Game.customMinigame['Bank'].buyGood.push(updateProfitTallyDisplay);
    Game.customMinigame['Bank'].buyGood.push(checkStockMarketTallyAchievements);

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(updateProfitTallyDisplay);
    Game.customMinigame['Bank'].sellGood.push(checkStockMarketTallyAchievements);

    // Pantheon
    CCSE.MinigameReplacer(function() {
        patchPantheonSwaps();
        mentionWrathCookiesInHolobore();
    }, 'Temple');

    // Grimoire
    CCSE.MinigameReplacer(function() {
        patchGFDDelay();
        injectGrimoireAnimations();
    }, 'Wizard tower');

    // Effect multipliers
    Game.customHeavenlyMultiplier.push(multiplierBuff777UpgradeSeries);
    Game.customShimmerTypes['golden'].durationMult.push(multiplierBuff777UpgradeSeries);
    Game.customShimmerTypes['golden'].customEffectDurMod.push(multiplierBuff777UpgradeSeries);

    // Statistics
    Game.customStatsMenu.push(allowPermanentUpgradeSlotSelectionWithinAscension);
    Game.customStatsMenu.push(displayAcrossAscensionsStatistics);
    Game.customStatsMenu.push(displayBackupStatistics);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(name, version);
    });

    // Tooltips
    pushSeasonalCookieTooltips();
    push777seriesTooltips();

    // Lumps
    Game.customDoLumps.push(updateLumpCountColor)
    Game.customLumpTooltip.unshift(warnfulLumpTooltip);
    // Calling unshift instead of push avoids order dependence with respect to CYOL

    // Upgrades
    createStockMarketModeDebugUpgrade();
    Game.customUpgrades['Omniscient day traders'].toggle.push(updateStockMarketRowsVisibility);

    createPermanentDebugUpgradesUpgrade();
    createHeavenlyBackdoorDebugUpgrade(); // Contains a code injection

    // Code injections
    injectWarningIntoLumpConfirmationTooltip();
    injectCallbackOnExportSave();
    patchBuildingSpecialsVisualGlitch();

    // Legacy data, was previously stored in CCSE.config.OtherMods
    if(CCSE.config.OtherMods.Spice) {
        loadObject(CCSE.config.OtherMods.Spice);
        delete CCSE.config.OtherMods.Spice; // be a good citizen and not bloat CCSE's save object
    }

    /* Klattmose's mods and Cookie Clicker itself
     * nest notifications like this in the 'else' branch of a `if(Game.prefs.popup)` conditional.
     * However, it seems that this variable is always zero;
     * unless this changes in the future,
     * I will keep calling Game.Notify. */
    Game.Notify('Spiced Cookies loaded!', '', undefined, 1, true);
}
