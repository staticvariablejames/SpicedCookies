/* Spiced Cookies tracks a few statistics across ascensions.
 * This file tests that it actually does this.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

let saveWithCustomStatistics: string; // Set in 'custom statistics are preserved across ascensions'

test.describe('Custom statistics', () => {
    async function setup(page: Page) {
        page = await setupCookieClickerPage(page, {saveGame: {
            lumps: 1,
            lumpsTotal: 1, // Unlocks the "Special" section in the statistics menu
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    };

    test('Self-test: unlocks the "Special" section it the stats menu', async ({ page }) => {
        await setup(page);
        await page.click('text=Stats');
        await expect(await page.locator('#menu')).toContainText("Special");
    });

    test('are preserved across ascensions', async ({ page }) => {
        await setup(page);
        await page.evaluate(() => {
            Game.cookieClicks = 5;
            Game.wrinklersPopped = 7;
            Game.reindeerClicked = 13;
            Game.handmadeCookies = 19;
        });

        await page.click('text=Stats');
        let menu = await page.locator('#menu');

        await expect(menu).toContainText("Special");
        await expect(menu).toContainText("Cookie clicks : 5 (all time : 5)");
        await expect(menu).toContainText("Wrinklers popped : 7 (all time : 7)");
        await expect(menu).toContainText("Reindeer found : 13 (all time : 13)");
        await expect(menu).toContainText("Hand-made cookies : 19 (all time : 19)");

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});

        expect(await page.evaluate('Spice.saveGame.bigCookieClicksPreviousAscensions')).toEqual(5);
        expect(await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions')).toEqual(7);
        expect(await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions')).toEqual(13);
        expect(await page.evaluate('Spice.saveGame.handmadeCookiesPreviousAscensions')).toEqual(19);

        await page.evaluate(() => {
            Game.cookieClicks = 1000;
            Game.wrinklersPopped = 3000;
            Game.reindeerClicked = 1700;
            Game.handmadeCookies = 2300;
        });

        // Save the save for other tests
        saveWithCustomStatistics = await page.evaluate(() => Game.WriteSave(1));

        await page.click('text=Stats'); await page.click('text=Stats'); // Force the menu to update
        await expect(menu).toContainText("Cookie clicks : 1,000 (all time : 1,005)");
        await expect(menu).toContainText("Wrinklers popped : 3,000 (all time : 3,007)");
        await expect(menu).toContainText("Reindeer found : 1,700 (all time : 1,713)");
        await expect(menu).toContainText("Hand-made cookies : 2,300 (all time : 2,319)");
    });

    test('are erased on wipe save', async ({ page }) => {
        await setup(page);
        await page.evaluate('Spice.saveGame.bigCookieClicksPreviousAscensions = 55');
        await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions = 77');
        await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions = 133');
        await page.evaluate('Spice.saveGame.handmadeCookiesPreviousAscensions = 199');
        await page.evaluate(() => Game.HardReset(2));
        expect(await page.evaluate('Spice.saveGame.bigCookieClicksPreviousAscensions')).toEqual(0);
        expect(await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions')).toEqual(0);
        expect(await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions')).toEqual(0);
        expect(await page.evaluate('Spice.saveGame.handmadeCookiesPreviousAscensions')).toEqual(0);
    });

    test('can be recovered from imported save file', async ({ page }) => {
        await setup(page);
        await page.evaluate(s => Game.LoadSave(s), saveWithCustomStatistics);

        await page.click('text=Stats');
        let menu = await page.locator('#menu');
        await expect(menu).toContainText("Cookie clicks : 1,000 (all time : 1,005)");
        await expect(menu).toContainText("Wrinklers popped : 3,000 (all time : 3,007)");
        await expect(menu).toContainText("Reindeer found : 1,700 (all time : 1,713)");
        await expect(menu).toContainText("Hand-made cookies : 2,300 (all time : 2,319)");
    });

    test('can be recovered from save file in the localStorage', async ({ page }) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithCustomStatistics});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.click('text=Stats');
        let menu = await page.locator('#menu');
        await expect(menu).toContainText("Cookie clicks : 1,000 (all time : 1,005)");
        await expect(menu).toContainText("Wrinklers popped : 3,000 (all time : 3,007)");
        await expect(menu).toContainText("Reindeer found : 1,700 (all time : 1,713)");
        await expect(menu).toContainText("Hand-made cookies : 2,300 (all time : 2,319)");
    });
});
