/* Creates a few extra achievements for across-ascensions progress.
 *
 * These achievements are awarded by src/modules/award-achievements-across-ascensions.ts.
 */

import { settings } from '../saved-data';
import { checkWrinklersPoppedAcrossAscensionsAchievements, checkReindeerClickedAcrossAscensionsAchievements } from './award-achievements-across-ascensions';

export function createAchievementsForProgressAcrossAscensions() {
    // This function is run on load and on settings toggle
    if(!settings.extraAchievementsAcrossAscensions) return;

    let last, adjacent;

    if(!('Parasitesmasher' in Game.Achievements)) { // Makes this function idempotent
        adjacent = Game.Achievements['Moistburster' as any];
        last = CCSE.NewAchievement('Parasitesmasher',
            'Burst <b>1000 wrinklers</b> in total.',
            adjacent.icon);
        last.order = adjacent.order + 1e-5;
    }
    checkWrinklersPoppedAcrossAscensionsAchievements();

    if(!('A sleightly longer grind' in Game.Achievements)) {
        adjacent = Game.Achievements['Reindeer sleigher' as any];
        last = CCSE.NewAchievement('A sleightly longer grind',
            'Pop <b>1000 reindeer</b> in total.',
            adjacent.icon);
        last.order = adjacent.order + 1e-5;
    }
    checkReindeerClickedAcrossAscensionsAchievements();
}
