/* Stock Market-related features
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCPageOptions, CCSave } from 'cookie-connoisseur';

test.describe('Stock market panel,', () => {
    test.beforeEach(async ({ page }) => {
        let saveGame = {
            buildings: {
                'Bank': {
                    amount: 685,
                    level: 1,
                    minigame: {
                        goods: {
                            'SUG': {
                                val: 21.72,
                                d: -0.75,
                                mode: 'stable',
                            },
                        },
                    },
                },
            },
        };
        page = await setupCookieClickerPage(page, {saveGame});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('displays the delta row by default', async ({ page }) => {
        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('can toggle the delta row', async ({ page }) => {
        await page.click('text=Options');
        await page.click('#SpiceButtondisplayStockDelta');
        await page.click('text=Options');

        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithoutDelta.png');

        await page.click('text=Options');
        await page.click('#SpiceButtondisplayStockDelta');
        await page.click('text=Options');
        /* Uses the same snapshot file as before, as it must be the same.
         * The fact that Playwright tests run in sequence within the same file
         * makes sure that this is not a race condition.
         */
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('toggles the delta row accordingly on load', async ({ page }) => {
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));

        let nativeSaveWithDelta = CCSave.toNativeSave(save);
        (save.modSaveData['Spiced cookies'] as any).settings.displayStockDelta = false;
        let nativeSaveWithoutDelta = CCSave.toNativeSave(save);

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithoutDelta);
        await page.evaluate(() => Game.CloseNotes());
        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithoutDelta.png');

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithDelta);
        await page.evaluate(() => Game.CloseNotes());
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });
});
