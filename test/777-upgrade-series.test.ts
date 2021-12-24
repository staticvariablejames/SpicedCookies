/* Tests the modifications to the 777 series of upgrades.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage } from 'cookie-connoisseur';

let saveGameWithActivePrestige = {
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
    await loadSpicedCookies(page, saveGameWithActivePrestige);

    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01**2, 10);

    await page.evaluate('Spice.settings.buff777upgrades = true'); // TODO: type-check
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02, 10);

    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01*1.02*1.04, 10);
    await page.evaluate('Spice.settings.buff777upgrades = false'); // TODO: type-check
    expect(await page.evaluate(() => Game.GetHeavenlyMultiplier())).toBeCloseTo(1.01**3, 10);
});

test('777-series of upgrades buff GC lifetime and effect duration', async ({ page }) => {
    await loadSpicedCookies(page, saveGameWithActivePrestige);
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
    await loadSpicedCookies(page, saveGameWithActivePrestige);
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

let saveGameWithPrestigeLevels = {
    prefs: {
        showBackupWarning: false,
    },
    lumps: 1,
    lumpsTotal: 1,
    cookiesReset: 8e8**3*1.00000001e12, // 800_000_002 prestige levels
    cookiesEarned: 800_777_779**3*1.0000000000001e12 - 8e8**3*1.00000001e12, // 777_777 levels
    ownedUpgrades: [
        'Legacy',
        'Heavenly luck',
        'Lasting fortune',
        'Decisive fate',
    ],
};

test('777-series of upgrades may be unlocked based on prestige gain', async ({ page }) => {
    await loadSpicedCookies(page, saveGameWithPrestigeLevels);

    // Testing the test
    expect(await page.evaluate(() => Game.prestige)).toEqual(800_000_002);
    await page.evaluate(() => Game.CloseNotes());
    await page.click('text=Options');
    await page.click('#SpiceButtonsimplify777upgradeAcquisition');
    await page.click('text=Options');

    await page.evaluate(() => CConnoisseur.ascend());
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade411'))).toBeTruthy();
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade412'))).toBeTruthy();
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade413'))).toBeTruthy();
    await page.evaluate(() => CConnoisseur.reincarnate());
    await page.evaluate(() => CConnoisseur.ascend());
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade411'))).toBeFalsy();
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade412'))).toBeFalsy();
    expect(await page.evaluate(() => document.getElementById('heavenlyUpgrade413'))).toBeFalsy();
    await page.evaluate(() => CConnoisseur.reincarnate());
});

test('First extra 777-upgrade unlocks based on prestige gain', async ({ page }) => {
    await loadSpicedCookies(page, {
        ...saveGameWithPrestigeLevels,
        cookiesReset: 1e12 + 1, // One prestige level
        cookiesEarned: (777_777_777_777_777 + 1)**3 * 1e12, // 777_777_777_777_777 prestige levels
    });

    // TODO: type-check
    expect(await page.evaluate('Spice.stableHeavenlyChipGains()')).toEqual(777_777_777_777_777);
    // It should work regardless of the setting
    expect(await page.evaluate('Spice.settings.simplify777upgradeAcquisition')).toBeFalsy();

    await page.click('text=Options');
    await page.evaluate(() => Game.CloseNotes());
    await page.click('#SpiceButtonextra777seriesUpgrades');
    await page.click('text=Options');

    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());
    await page.evaluate(() => CConnoisseur.ascend());

    expect(await page.evaluate(() => {
        let luckyTallyDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky tally'].id;
        return document.getElementById(luckyTallyDivId);
    })).toBeTruthy(); // The upgrade unlocks

    await page.evaluate(() => CConnoisseur.reincarnate());
    await page.evaluate(() => CConnoisseur.ascend());

    expect(await page.evaluate(() => {
        let luckyTallyDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky tally'].id;
        return document.getElementById(luckyTallyDivId);
    })).toBeFalsy(); // The upgrade locks again
});

test('Second extra 777-upgrade unlocks based on prestige gain', async ({ page }) => {
    await loadSpicedCookies(page, {
        ...saveGameWithPrestigeLevels,
        cookiesReset: 1e12 + 1, // One prestige level
        cookiesEarned: (777_777_777_777_777 + 1)**3 * 1e12, // 777_777_777_777_777 prestige levels
    });

    await page.click('text=Options');
    await page.evaluate(() => Game.CloseNotes());
    await page.click('#SpiceButtonextra777seriesUpgrades');
    await page.click('text=Options');

    await page.evaluate(() => Game.Upgrades['Lucky payout'].earn());
    await page.evaluate(() => Game.Upgrades['Lucky tally'].earn());
    await page.evaluate(() => CConnoisseur.ascend());

    expect(await page.evaluate(() => {
        let luckyValueDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky value'].id;
        return document.getElementById(luckyValueDivId);
    })).toBeTruthy(); // The upgrade unlocks

    await page.evaluate(() => CConnoisseur.reincarnate());
    await page.evaluate(() => CConnoisseur.ascend());

    expect(await page.evaluate(() => {
        let luckyValueDivId = 'heavenlyUpgrade' + Game.Upgrades['Lucky value'].id;
        return document.getElementById(luckyValueDivId);
    })).toBeFalsy(); // The upgrade locks again
});
