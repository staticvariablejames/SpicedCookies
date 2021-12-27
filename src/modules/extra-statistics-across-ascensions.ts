/* Tracks more statistics across ascensions.
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

import { saveGame } from '../saved-data';

export function updateAcrossAscensionsStatistics() {
    // This function is pushed to Game.customAscend
    saveGame.bigCookieClicksPreviousAscensions += Game.cookieClicks;
    saveGame.wrinklersPoppedPreviousAscensions += Game.wrinklersPopped;
    saveGame.reindeerClickedPreviousAscensions += Game.reindeerClicked;
    saveGame.handmadeCookiesPreviousAscensions += Game.handmadeCookies;
}

/* Returns the first div of the line (in the status menu) that contains the given text
 * Returns undefined if no such div is found
 */
function locateStatsMenuElement(text: string) {
    for(let div of document.querySelectorAll("#menu div.subsection div.listing")) {
        if(div.textContent!.indexOf(text) !== -1)
            return div as HTMLDivElement;
    }
    return undefined;
}

export function displayAcrossAscensionsStatistics() {
    // This is pushed to Game.customStatsMenu
    let div = undefined;
    div = locateStatsMenuElement('Cookie clicks');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.cookieClicks + saveGame.bigCookieClicksPreviousAscensions) +
        ')</small>';

    div = locateStatsMenuElement('Wrinklers popped');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.wrinklersPopped + saveGame.wrinklersPoppedPreviousAscensions) +
        ')</small>';

    div = locateStatsMenuElement('Reindeer found');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.reindeerClicked + saveGame.reindeerClickedPreviousAscensions) +
        ')</small>';

    div = locateStatsMenuElement('Hand-made cookies');
    if(div) div.innerHTML += ' <small>(all time : ' +
        Beautify(Game.handmadeCookies + saveGame.handmadeCookiesPreviousAscensions) +
        ')</small>';
}
