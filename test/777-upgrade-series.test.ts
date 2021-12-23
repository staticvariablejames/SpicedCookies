/* Tests the modifications to the 777 series of upgrades.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

let saveGame = {
    prefs: {
        showBackupWarning: false,
    },
    ownedUpgrades: [
        'Heavenly chip secret',
        'Heavenly cookie stand',
        'Heavenly bakery',
        'Heavenly confectionery',
        'Heavenly key',
        'Lucky digit',
        'Lucky number',
    ],
};

async function loadSpicedCookies(page: Page, saveGame: object) {
    await setupCookieClickerPage(page, {saveGame});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

test('777-series of upgrades can buff the heavenly multiplier', async ({ page }) => {
    await loadSpicedCookies(page, saveGame);

    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01**2, 10);

    await page.evaluate('Spice.settings.buff777upgrades = true'); // TODO: type-check
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02, 10);

    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02*1.04, 10);
    await page.evaluate('Spice.settings.buff777upgrades = false'); // TODO: type-check
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01**3, 10);
});

test('777-series of upgrades buff GC lifetime and effect duration', async ({ page }) => {
    await loadSpicedCookies(page, saveGame);
    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());

    // @ts-ignore: Game.shimmer does exist, it is a bug on @types/cookieclicker
    let gcHandle = await page.evaluateHandle(() => new Game.shimmer('golden'));
    expect(await gcHandle.evaluate(gc => gc.dur)).toBeCloseTo(13 * 1.01**3, 10);
    gcHandle.evaluate(gc => {gc.force = 'multiply cookies'; gc.pop()});

    await page.evaluate('Spice.settings.buff777upgrades = true'); // TODO: type-check
    // @ts-ignore: Game.shimmer does exist, it is a bug on @types/cookieclicker
    gcHandle = await page.evaluateHandle(() => new Game.shimmer('golden'));
    expect(await gcHandle.evaluate(gc => gc.dur)).toBeCloseTo(13 * 1.01*1.02*1.04, 10);

    gcHandle.evaluate(gc => {gc.force = 'frenzy'; gc.pop()});
    let gameFps = await page.evaluate(() => Game.fps);
    let frenzyBuff = await page.evaluate(() => Game.buffs['Frenzy'].maxTime);
    expect(frenzyBuff).toEqual(Math.ceil(77*1.01*1.02*1.04)*gameFps);
});

test('Extra upgrades in the 777-series also buff the heavenly multiplier', async ({ page }) => {
    await loadSpicedCookies(page, saveGame);
    await page.click('text=Options');
    await page.click('#SpiceButtonextra777seriesUpgrades');
    await page.click('text=Options');
    await page.evaluate('Spice.settings.buff777upgrades = true'); // TODO: type-check

    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());
    await page.evaluate(() => Game.Upgrades['Lucky tally'].earn());
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02*1.04*1.08, 10);
    await page.evaluate(() => Game.Upgrades['Lucky value'].earn());
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02*1.04*1.08*1.16, 10);

    await page.evaluate('Spice.settings.buff777upgrades = false'); // TODO: type-check
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01**5, 10);
});
