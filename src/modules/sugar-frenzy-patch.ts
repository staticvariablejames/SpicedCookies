/* Fix Sugar Frenzy not disappearing if player has only one lump *
 */

import { settings } from '../saved-data';

/* Cookie Clicker does not save directly whether Sugar frenzy was already activated or not;
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
 * As explained in injectWarningIntoLumpConfirmationTooltip,
 * that code is not accessible for injection,
 * so we have to replace it completely.
 *
 * As a side-effect,
 * this extends that patch to Sugar frenzy too!
 */
export function patchSugarFrenzyUnwantedPersistence() {
    if(!settings.patchSugarFrenzyPersistence) return;

    Game.Upgrades['Sugar frenzy'].clickFunction = function() {
        return Game.spendLump(1, 'activate the sugar frenzy', function() {
			Game.Upgrades['Sugar frenzy'].buy(1);
			Game.Upgrades['Sugar frenzy'].bought = 1;
			Game.upgradesToRebuild = 1;

			Game.gainBuff('sugar frenzy',60*60,3);
			Game.Notify('Sugar frenzy!','CpS x3 for 1 hour!',[29,14]);
        })() == undefined;
    }
}
