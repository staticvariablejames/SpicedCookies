/* Test the patch for Sugar frenzy not disappearing if the player has only one lump.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

let saveGame = {
    prefs: {
        showBackupWarning: false,
    },
    cookies: 1e12,
    cookiesEarned: 1e12,
    lumps: 1,
    lumpsTotal: 1,
    ownedUpgrades: ['Sugar craving'],
};

test.describe('Sugar frenzy patch', () => {
    test('works', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.click('text=Options');
        await page.click('#SpiceButtonpatchSugarFrenzyPersistence');
        await page.click('text=Options');

        await page.click('#upgrade0'); // First upgrade in the store == Sugar frenzy switch

        await page.pause();
        expect(await page.evaluate(() => 'Sugar frenzy' in Game.buffs)).toBe(true);
        expect(await page.evaluate(() => Game.Upgrades['Sugar frenzy'].bought)).toBe(1);
    });

    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.click('#upgrade0');
        expect(await page.evaluate(() => 'Sugar frenzy' in Game.buffs)).toBe(true);
        expect(await page.evaluate(() => Game.Upgrades['Sugar frenzy'].bought)).toBe(0);
    });
});
