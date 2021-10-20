/* Test the numerically stable formula for heavenly chip gains.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

async function loadSpicedCookies(page: Page, saveGame: object) {
    await setupCookieClickerPage(page, {saveGame});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

let trickySaveGame = {
    cookiesReset: 1e75,
    cookiesEarned: 3.001e42 * 1e12,
    /* This save game has 1e75 cookies, which amounts for exactly 1e21 prestige levels.
     * The next prestige level happens at (1e21+1)**3 * 1e12 cookies,
     * which is (1e63 + 3e42 + 3e21 + 1)*1e12.
     * So ascending in this save game should award one extra Game.reset.
     */
};

test.describe('Numerical stability', () => {
    test('relies on verified assumptions', async ({ page }) => {
        await setupCookieClickerPage(page);
        // The formula assumes that HCfactor equals 3; it will fail badly otherwise
        expect(await page.evaluate(() => Game.HCfactor)).toEqual(3);
    });

    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame: trickySaveGame});
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        expect(await page.evaluate(() => Game.resets)).toBe(0);
    });

    test('is not active by default', async ({ page }) => {
        await loadSpicedCookies(page, trickySaveGame);
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        expect(await page.evaluate(() => Game.resets)).toBe(0);
    });

    test('grants extra resets when it should', async ({ page }) => {
        await loadSpicedCookies(page, trickySaveGame);
        await page.click('text=Options');
        await page.click('#SpiceButtonnumericallyStableHeavenlyChipGains');
        await page.click('text=Options');
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        expect(await page.evaluate(() => Game.resets)).toBe(1);
    });

    test('does not affect regular ascensions', async ({ page }) => {
        await setupCookieClickerPage(page); // No save game
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
        await page.click('text=Options');
        await page.click('#SpiceButtonnumericallyStableHeavenlyChipGains');
        await page.click('text=Options');
        await page.evaluate(() => Game.Earn(1e12));
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        expect(await page.evaluate(() => Game.resets)).toBe(1);

        await page.evaluate(() => Game.Earn(6.9e12)); // Not enough for another heavenly chip
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        expect(await page.evaluate(() => Game.resets)).toBe(1);
    });
});
