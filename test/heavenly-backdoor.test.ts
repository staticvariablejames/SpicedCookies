/* Tests the debug upgrade "Heavenly backdoor".
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('Heavenly backdoor', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('is created by default', async ({ page }) => {
        expect(await page.evaluate(() => 'Heavenly backdoor' in Game.Upgrades)).toBeTruthy();
    });

    test('is not active by default', async ({ page }) => {
        await page.evaluate(() => CConnoisseur.ascend());
        expect(await page.evaluate(() => {
            let luckyDigitDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky digit'].id;
            return document.getElementById(luckyDigitDivId);
        })).toBeFalsy();
    });

    test('works as intended', async ({ page }) => {
        await page.evaluate(() => Game.Upgrades['Heavenly backdoor'].toggle());
        await page.evaluate(() => CConnoisseur.ascend());
        expect(await page.evaluate(() => {
            let luckyDigitDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky digit'].id;
            return document.getElementById(luckyDigitDivId);
        })).toBeTruthy();
    });
});
