/* Paraphernalia to construct the Spiced Cookies section in the Options menu.
 */

import { settings } from './saved-data';
import { name } from './mod';

/* Callback for Spice.makeButton
 * It is important that the functions onFunction and offFunction
 * are called only after the appropriate setting is toggled.
 */
export function toggleSetting(
    buttonId: string,
    settingName: keyof typeof settings, // TODO: add typings so it accepts only boolean settings
    onText: string,
    offText: string,
    onFunction?: () => void,
    offFunction?: () => void,
) {
    settings[settingName] = !settings[settingName];
    let element = document.getElementById(buttonId)!;
    if(settings[settingName]) {
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

export function escapeQuotes(str:string) {
    /* Escape things for makeButton purposes.
     * Painful trial and error suggests we have to quote it twice.
     * TODO figure out why.
     */
    return str.replace(/'/g, '&amp;apos;')
              .replace(/"/g, '&amp;quot;');
}

export function makeButton(
    settingName: keyof typeof settings,
    onText: string,
    offText: string,
    onFunctionName?: string,
    offFunctionName?: string
): string
{
    let set = settings[settingName];
    let buttonId = "SpiceButton" + settingName;
    let onclick = `Spice.toggleSetting('${buttonId}', '${settingName}', \
        '${escapeQuotes(onText)}', '${escapeQuotes(offText)}', \
        ${onFunctionName}, ${offFunctionName} \
    )`;
    return `<a id="${buttonId}" class="option${set? "" : " off"}" 
            onclick="${onclick};">
            ${set? onText : offText}
            </a>`;
}

export function customOptionsMenu() {
    let menuStr = "";
    menuStr += '<div class="listing">' + 
        makeButton('displayStockDelta',
            'Display stock market deltas', 'Hide stock market deltas',
            'Spice.updateStockMarketRowsVisibility', 'Spice.updateStockMarketRowsVisibility'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('saveStockMarketHistory',
            'Save the stock market value history', 'Don\'t save stock market value history'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('tallyOnlyStockMarketProfits',
            'Tally only stock market profits', 'Tally both profits and losses',
            'Spice.updateProfitTallyDisplay', 'Spice.updateProfitTallyDisplay'
        ) + '<label>Whether to include or not negative profits in the across-ascensions stock market tally</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('awardAchievementsAcrossAscensions',
            'Award achievements based on all-time statistics', 'Award achievements based on current ascension statistics only',
            'Spice.checkAcrossAscensionsAchievements'
        ) + '<label>Whether to award achievements related to popping wrinklers, finding reindeer, hand-making cookies, and stock market profits based on the statistics amassed across ascensions, or on the statistics of this ascension only</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('extraAchievementsAcrossAscensions',
            'Create new achievements related to across-ascensions progress',
            'Don\'t create new achievements related to across-ascensions progress',
            'Spice.createAchievementsForProgressAcrossAscensions',
        ) + '<label>Whether to create two achievements for popping wrinklers and clicking reindeers (NOTE: you must refresh your page after disabling this option)</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('extraStockMarketAchievements',
            'Create three new achievements for the stock market',
            'Don\'t create new achievements for the stock market',
            'Spice.createStockMarketAchievements',
        ) + '<label>Whether to create two achievements for popping wrinklers and clicking reindeers (NOTE: you must refresh your page after disabling this option)</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('numericallyStableHeavenlyChipGains',
            'Use numerically stable formula for heavenly chip gains',
            'Use vanilla formula for heavenly chip gains',
            'Spice.injectNumericallyStableFormulaForHeavenlyChipGains',
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('autohideSeasonalBiscuitsTooltip',
            'Automatically hide extra season switcher tooltips if all upgrades were purchased',
            'Always display the "You\'ve unlocked..." line in season switcher biscuits',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('patchDiscrepancy',
            'Fix imprecision in lump times computation',
            'Don\'t patch lump times computation',
            'Spice.patchDiscrepancy'
        ) +
        '<label>Patches the discrepancy so it is always zero; ' +
            'see the Choose Your Own Lump mod for details ' +
            '(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('warnLessThan100Lumps',
            'Warn if overspending lumps hurts Sugar baking',
            'Ignore lump overspending for Sugar baking purposes',
            'Spice.updateLumpCountColor',
            'Spice.updateLumpCountColor'
        ) +
        '<label>If Sugar baking is purchased, ' +
            'the lump count becomes red if less than 100 lumps are available.</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('patchPantheonSwaps',
            'Patch Pantheon swap bug',
            'Don\'t patch the Pantheon',
            'Spice.patchPantheonSwaps'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('achievementsForBackingUp',
            'Create achievements for backing up the game save',
            'Don\'t create new achievements for backing up the save',
            'Spice.createAchievementsForBackingUp'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('patchSugarFrenzyPersistence',
            'Patch Sugar frenzy not disappearing when activated with a single lump',
            'Don\'t patch Sugar frenzy',
            'Spice.patchSugarFrenzyUnwantedPersistence'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('buff777upgrades',
            'Buff the 777-series of upgrades',
            'Don\'t buff the 777-series of upgrades',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('simplify777upgradeAcquisition',
            'Unlock the 777-series of upgrades based on prestige gain',
            'Unlock the 777-series of upgrades based on current prestige',
            'Spice.replace777seriesAcquisitionRestrictions',
            'Spice.replace777seriesAcquisitionRestrictions' // Called on both cases
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('extra777seriesUpgrades',
            'Create two new heavenly upgrades for the 777-series of upgrades',
            'Don\'t extend the 777-series of upgrades',
            'Spice.createExtra777seriesUpgrades'
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('patchGFDDelay',
            'Patch the delay from Gambler\'s Fever Dream',
            'Don\'t patch the delay in Gambler\'s Fever Dream',
            'Spice.patchGFDDelay'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('patchSeasonsAffectingFtHoF',
            'Disable seasons affecting the outcome of Force the Hand of Fate',
            'Keep seasons affecting the outcome of Force the Hand of Fate',
            'Spice.patchSeasonsAffectingFtHoF'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    menuStr += '<div class="listing">' +
        makeButton('grimoireSpellCastAnimations',
            'Spice up the Grimoire spell casting animations',
            'Use Vanilla Grimoire spell casting animations',
        ) + '</div>';

    menuStr += '<div class="listing">' +
        makeButton('patchDoublePop',
            'Patch double-popping shimmers',
            'Don\'t patch shimmer double-popping',
            'Spice.patchDoublePop'
        ) +
        '<label>(NOTE: you must refresh your page after disabling this option)' +
        '</label></div>';

    CCSE.AppendCollapsibleOptionsMenu(name, menuStr);
}
