/* Test the patch for the GFD delay.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

let saveGame = {
    seed: 'aaaaa',
    buildings: {
        'Wizard tower': {
            amount: 100,
            level: 1,
            minigame: {
                magic: 50,
                onMinigame: true,
            },
        },
    },
};

test.describe('GFD delay patch', () => {
    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.click('#grimoireSpell6'); // cast GFD, get FtHoF
        /* GFD cast costs only 5 magic, it takes another 1.5 seconds to deduct the FtHoF cost.
         * We still need to use Math.floor because math keeps regenerating.
         */
        expect(await page.evaluate(() => Math.floor(Game.Objects['Wizard tower'].minigame.magic))).toEqual(45);
        await page.waitForFunction(() => Game.Objects['Wizard tower'].minigame.magic < 45);

        expect(await page.evaluate(() => Math.floor(Game.Objects['Wizard tower'].minigame.magic))).toEqual(25);

        expect(await page.evaluate(() => Game.shimmers.length)).toEqual(1);
        expect(await page.evaluate(() => Game.shimmers[0]['force'])).toEqual('clot');
        // This is the same as backfiring FtHoF with one spell cast
    });

    test('works', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.evaluate(() => Game.CloseNotes());
        await page.click('text=Options');
        await page.click('#SpiceButtonpatchGFDDelay');
        await page.click('text=Options');

        await page.click('#grimoireSpell6'); // cast GFD, get FtHoF
        // Now the results are essentially instantaneous
        expect(await page.evaluate(() => Math.floor(Game.Objects['Wizard tower'].minigame.magic))).toEqual(25);

        expect(await page.evaluate(() => Game.shimmers.length)).toEqual(1);
        expect(await page.evaluate(() => Game.shimmers[0]['force'])).toEqual('cookie storm drop');
        // This is the same as succeeding FtHoF with zero spells cast
    });
});
