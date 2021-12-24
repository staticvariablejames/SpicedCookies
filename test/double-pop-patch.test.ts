/* Test the patch for the double-pop bug.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('GFD delay patch', () => {
    /* Since this bug is time-sensitive, we have to run the whole test inside a page.evaluate.
     * The following function is the one run,
     * returning some data about the run.
     */
    let testBug = () => {
        // @ts-ignore: Game.shimmer does exist, it is a bug on @types/cookieclicker
        let gc = new Game.shimmer('golden');
        let exceptionWasThrown = false;
        gc.force = 'cookie storm drop';
        gc.pop();
        Math.seedrandom('test'); // Guarantees next pop is a Frenzy
        try {
            gc.pop();
        } catch (e) {
            exceptionWasThrown = true;
            // An exception is thrown when the game tries to remove the shimmer node twice
        }
        return {
            exceptionWasThrown,
            frenzyInBuffs: 'Frenzy' in Game.buffs,
        };
    };

    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page);
        expect(await page.evaluate(testBug)).toEqual({
            exceptionWasThrown: true,
            frenzyInBuffs: true,
        });
    });

    test('works', async ({ page }) => {
        await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.click('text=Options');
        await page.click('#SpiceButtonpatchDoublePop');
        await page.click('text=Options');
        expect(await page.evaluate(testBug)).toEqual({
            exceptionWasThrown: false,
            frenzyInBuffs: false,
        });
    });
});
