/* Creates a few extra stock market achievements.
 */

import { settings } from '../../saved-data';
import { checkStockMarketTallyAchievements } from '../award-achievements-across-ascensions';

export function createStockMarketAchievements() {
    // This function is run on load and on settings toggle
    if(!settings.extraStockMarketAchievements) return;

    let last, adjacent;

    if(!('Who wants to be a millionaire?' in Game.Achievements)) {
        adjacent = Game.Achievements['Buy buy buy' as any];
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
            Game.Achievements['Liquid assets' as any].icon);
        last.order = adjacent.order + 3e-5; // just for definiteness; they aren't sorted together
        last.pool = 'shadow';
    }

    checkStockMarketTallyAchievements();
}
