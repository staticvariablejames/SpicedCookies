/* Test the feature that warns if spending sugar lumps would hurt Sugar baking
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('Warning about Sugar baking overspending', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page, {
            saveGame: {
                lumps: 100,
                lumpsTotal: 100,
                buildings: {
                    'Cursor': {
                        amount: 1,
                        level: 19,
                    },
                    'Grandma': {
                        amount: 1,
                    },
                },
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('by coloring the lump number red', async ({ page }) => {
        await page.evaluate(() => Game.Upgrades['Sugar baking'].earn());
        let divLumps = await page.locator('#lumps'); // Lump icon
        let divLumpsAmount = await page.locator('#lumpsAmount'); // Lump number
        let clip = {
            x: (await divLumps.boundingBox()).x,
            y: (await divLumps.boundingBox()).y,
            height: (await divLumps.boundingBox()).height,
            width: (await divLumpsAmount.boundingBox()).x - (await divLumps.boundingBox()).x
                + (await divLumpsAmount.boundingBox()).width + 5,
        };
        expect(await page.screenshot({clip})).toMatchSnapshot('lump-number-blue-if-100-or-over.png');

        await page.click('text=lvl 0');

        // Recompute width
        clip.width = (await divLumpsAmount.boundingBox()).x - (await divLumps.boundingBox()).x
                + (await divLumpsAmount.boundingBox()).width + 5,
        expect(await page.screenshot({clip})).toMatchSnapshot('lump-number-red-if-under-100.png');
    });

    test('by warning on the confirmation prompt', async ({ page }) => {
        await page.evaluate(() => Game.Upgrades['Sugar baking'].earn());
        await page.evaluate(() => Game.CloseNotes());
        await page.click('text=Options');
        await page.click('text=Lump confirmation');
        await page.click('text=Options');
        await page.click('text=lvl 19');

        let promptHandle = await page.locator('#prompt');
        expect(await promptHandle.screenshot()).toMatchSnapshot('sugar-baking-warning-on-lump-confirmation.png');

        // Test we're not messing up with the prompt
        await page.click('text=Yes');
        expect(await page.evaluate(() => Game.Objects['Cursor'].level)).toEqual(20);
    });
});
