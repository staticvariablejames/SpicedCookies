/* Tests the discrepancy patch.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage } from 'cookie-connoisseur';

async function loadSpicedCookies(page: Page) {
    await setupCookieClickerPage(page, {saveGame: {
        cookies: 1e12,
        cookiesEarned: 1e12,
        lumps: 0,
        lumpsTotal: 0,
        lumpT: 1.6e12,
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

test.describe('The lump growth discrepancy', () => {
    test('is not patched by default', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.waitForFunction(() => Game.lumps > 0);
        expect(await page.evaluate(() => Game.lumpT)).toBeGreaterThan(1.6e12 + 24*3600*1000);
    });

    test('is patched for online lumps', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.click('text=Options');
        await page.click('#SpiceButtonpatchDiscrepancy');
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.waitForFunction(() => Game.lumps > 0);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + 24*3600*1000);
    });

    test('is patched for offline lumps', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.click('text=Options');
        await page.click('#SpiceButtonpatchDiscrepancy');
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + 24*3600*1000);

        // Test for more than one day
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + 2*24*3600*1000);
    });

    test('is patched for lumps with fractional growth', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame: {
            cookies: 1e12,
            cookiesEarned: 1e12,
            lumps: 0,
            lumpsTotal: 0,
            lumpT: 1.6e12,
            dragonLevel: 25,
            dragonAura: 17, // Dragon's Curve
            modSaveData: {
                'Spiced cookies': {
                    settings: {
                        patchDiscrepancy: true,
                    },
                },
            },
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        let overripeAge = 23 * 3600*1000 / 1.05 + 3600*1000;

        let save = await page.evaluate(() => Game.WriteSave(1));
        // Test online lumps
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.waitForFunction(() => Game.lumps > 0);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + overripeAge);

        // Test offline lumps
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + overripeAge);

        // Test for more than one day
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.lumpT)).toEqual(1.6e12 + 2*overripeAge);
    });
});
