/* Spiced Cookies modifies a few achievements to be awarded with across-ascension progress,
 * and adds a few related achievements as well.
 * This file tests these achievements.
 *
 * The additional achievements for the stock market are tested in stock-market.test.ts.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('Across-ascensions achievements', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame: {
            lumps: 1,
            lumpsTotal: 1,
            buildings: {
                'Bank': {
                    level: 1,
                    amount: 1,
                    minigame: {
                        goods: {
                            'SUG': {
                                stock: 1,
                                val: 16e6,
                            },
                        },
                    },
                },
            },
        }});

        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.evaluate(() => CConnoisseur.startGrandmapocalypse());
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.evaluate('Spice.saveGame.awardAchievementsAcrossAscensions = false');
        await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions = 49');
        await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions = 49');
        await page.evaluate('Spice.saveGame.handmadeCookiesPreviousAscensions = 999');
        await page.evaluate('Spice.saveGame.stockMarketProfitsPreviousAscensions = 16e6');
    });

    test('are not awarded by default', async ({ page }) => {
        let setting = await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions');
        expect(setting).toBe(false);

        await page.evaluate(() => CConnoisseur.popWrinkler(CConnoisseur.spawnWrinkler()));
        expect(await page.evaluate(() => Game.HasAchiev('Wrinklesquisher'))).toBeFalsy();

        await page.evaluate(() => CConnoisseur.spawnReindeer().pop(null as any));
        expect(await page.evaluate(() => Game.HasAchiev('Sleigh of hand'))).toBeFalsy();

        await page.evaluate(() => CConnoisseur.clickBigCookie());
        expect(await page.evaluate(() => Game.HasAchiev('Clicktastic'))).toBeFalsy();

        // Sells the single stock of sugar for $16 million
        await page.evaluate(() => Game.Objects['Bank'].minigame.sellGood(3, 1));
        expect(await page.evaluate(() => Game.HasAchiev('Gaseous assets'))).toBeFalsy();
    });

    test('are awarded if the setting is on', async ({ page }) => {
        await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions = true;');
        let setting = await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions');
        expect(setting).toBe(true);

        await page.evaluate(() => CConnoisseur.popWrinkler(CConnoisseur.spawnWrinkler()));
        expect(await page.evaluate(() => Game.HasAchiev('Wrinklesquisher'))).toBeTruthy();

        await page.evaluate(() => CConnoisseur.spawnReindeer().pop(null as any));
        expect(await page.evaluate(() => Game.HasAchiev('Sleigh of hand'))).toBeTruthy();

        await page.evaluate(() => CConnoisseur.clickBigCookie());
        expect(await page.evaluate(() => Game.HasAchiev('Clicktastic'))).toBeTruthy();

        await page.evaluate(() => Game.Objects['Bank'].minigame.sellGood(3, 1));
        expect(await page.evaluate(() => Game.HasAchiev('Gaseous assets'))).toBeTruthy();
    });

    test('are awarded if the setting is toggled', async ({ page }) => {
        await page.evaluate(() => CConnoisseur.popWrinkler(CConnoisseur.spawnWrinkler()));
        await page.evaluate(() => CConnoisseur.spawnReindeer().pop(null as any));
        await page.evaluate(() => CConnoisseur.clickBigCookie());
        await page.evaluate(() => Game.Objects['Bank'].minigame.sellGood(3, 1));

        expect(await page.evaluate(() => Game.HasAchiev('Wrinklesquisher'))).toBeFalsy();
        expect(await page.evaluate(() => Game.HasAchiev('Sleigh of hand'))).toBeFalsy();
        expect(await page.evaluate(() => Game.HasAchiev('Clicktastic'))).toBeFalsy();
        expect(await page.evaluate(() => Game.HasAchiev('Gaseous assets'))).toBeFalsy();

        await page.click('text=Options');
        await page.click('#SpiceButtonawardAchievementsAcrossAscensions');
        await page.click('text=Options');
        let setting = await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions');
        expect(setting).toBe(true);

        expect(await page.evaluate(() => Game.HasAchiev('Wrinklesquisher'))).toBeTruthy();
        expect(await page.evaluate(() => Game.HasAchiev('Sleigh of hand'))).toBeTruthy();
        expect(await page.evaluate(() => Game.HasAchiev('Clicktastic'))).toBeTruthy();
        expect(await page.evaluate(() => Game.HasAchiev('Gaseous assets'))).toBeTruthy();
    });
});

test.describe('New across-ascensions achievements', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('are created when the button is toggled', async ({ page }) => {
        expect(await page.evaluate(() => 'Parasitesmasher' in Game.Achievements)).toBe(false);
        expect(await page.evaluate(() => 'A sleightly longer grind' in Game.Achievements)).toBe(false);
        await page.click('text=Options');
        await page.click('#SpiceButtonextraAchievementsAcrossAscensions');
        expect(await page.evaluate(() => 'Parasitesmasher' in Game.Achievements)).toBe(true);
        expect(await page.evaluate(() => 'A sleightly longer grind' in Game.Achievements)).toBe(true);
        await page.close();
    });

    test('are awarded when the button is toggled', async ({ page }) => {
        await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions = 1000');
        await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions = 1000');
        await page.click('text=Options');
        await page.click('#SpiceButtonextraAchievementsAcrossAscensions');
        expect(await page.evaluate(() => Game.HasAchiev('Parasitesmasher'))).toBeTruthy();
        expect(await page.evaluate(() => Game.HasAchiev('A sleightly longer grind'))).toBeTruthy();
        await page.close();
    });

    test('are awarded when the threshold is reached', async ({ page }) => {
        let setting = await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions');
        expect(setting).toBe(false); // Things should work even with the setting above being false

        await page.evaluate(() => CConnoisseur.startGrandmapocalypse());
        await page.evaluate('Spice.saveGame.wrinklersPoppedPreviousAscensions = 999');
        await page.evaluate('Spice.saveGame.reindeerClickedPreviousAscensions = 999');
        await page.click('text=Options');
        await page.click('#SpiceButtonextraAchievementsAcrossAscensions');
        expect(await page.evaluate(() => Game.HasAchiev('Parasitesmasher'))).toBeFalsy();
        expect(await page.evaluate(() => Game.HasAchiev('A sleightly longer grind'))).toBeFalsy();
        await page.evaluate(() => CConnoisseur.popWrinkler(CConnoisseur.spawnWrinkler()));
        await page.evaluate(() => CConnoisseur.spawnReindeer().pop(null as any));
        expect(await page.evaluate(() => Game.HasAchiev('Parasitesmasher'))).toBeTruthy();
        expect(await page.evaluate(() => Game.HasAchiev('A sleightly longer grind'))).toBeTruthy();

        setting = await page.evaluate('Spice.settings.awardAchievementsAcrossAscensions');
        expect(setting).toBe(false); // This setting should not have been changed
        await page.close();
    });
});
