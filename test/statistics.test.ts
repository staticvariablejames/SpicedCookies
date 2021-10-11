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

test.describe('Stock market profits', () => {
    async function setup(page: Page, profit: number = 50) {
        page = await setupCookieClickerPage(page, {saveGame: {
            prefs: {
                showBackupWarning: false,
            },
            buildings: {
                'Bank': {
                    level: 1,
                    amount: 1,
                    minigame: {
                        profit,
                    },
                },
            },
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    };

    test('are tracked across ascensions', async ({ page }) => {
        await setup(page, 50);
        /* Due to the way that the profits row is constructed,
         * the code below captures the entire row.
         */
        let profitsRow = await page.locator('text=Profits');

        await expect(profitsRow).toContainText('all time : $50');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        // Prepare a stock sell
        await page.evaluate(() => {
            Game.Objects['Bank'].getFree(1);
            Game.Objects['Bank'].minigame.goods['Bank'].val = 10;
            Game.Objects['Bank'].minigame.goods['Bank'].stock = 1;
            Game.Objects['Bank'].switchMinigame(1);
            Game.CloseNotes();
        });
        await page.click('#bankGood-3 >> text="All"');
        await expect(profitsRow).toContainText('all time : $60');
    });

    test('by default are not deducted when negative', async ({ page }) => {
        await setup(page, -15);
        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : $0');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        await page.evaluate(() => {Game.Objects['Bank'].getFree(1);});
        await expect(profitsRow).toContainText('all time : $0');

        await page.evaluate(() => {
            Game.Objects['Bank'].minigame.profit = 50;
            CConnoisseur.ascend();
            CConnoisseur.reincarnate();
            Game.Objects['Bank'].getFree(1);
            Game.Objects['Bank'].switchMinigame(1);
            Game.Earn(1e30);
            Game.CloseNotes();
        });
        await expect(profitsRow).toContainText('all time : $50');
        await page.click('#bankGood-3 >> text="Max"');
        expect(await page.evaluate(() => Game.Objects['Bank'].minigame.profit)).toBeLessThan(0);
        await expect(profitsRow).toContainText('all time : $50');
    });

    test('can be set to deduct when negative', async ({ page }) => {
        await setup(page, -15);
        await page.click('text=Options');
        await page.evaluate(() => Game.CloseNotes());
        await page.click('#SpiceButtontallyOnlyStockMarketProfits');
        await page.click('text=Options');

        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : -$15');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        await page.evaluate(() => {Game.Objects['Bank'].getFree(1);});
        await expect(profitsRow).toContainText('all time : -$15');

        await page.evaluate(() => {
            Game.Objects['Bank'].minigame.profit = 50;
            CConnoisseur.ascend();
            CConnoisseur.reincarnate();
            Game.Objects['Bank'].getFree(10);
            Game.Objects['Bank'].switchMinigame(1);
            Game.Objects['Bank'].minigame.goods['Bank'].val = 1;
            Game.Earn(1e30);
            Game.CloseNotes();
        });
        await expect(profitsRow).toContainText('all time : $35');
        await page.click('#bankGood-3 >> text="Max"'); // Purchase 20 stocks, at 20% markup
        expect(await page.evaluate(() => Game.Objects['Bank'].minigame.profit)).toBeLessThan(0);
        await expect(profitsRow).toContainText('all time : $11');
    });

    test('is erased with a wipe save', async ({ page }) => {
        await setup(page, 35);
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : $35');
        await page.evaluate(() => Game.HardReset(2));
        await expect(profitsRow).toContainText('all time : $0');
    });
});
