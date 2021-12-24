/* Test the patch which prevents seasons from affecting the outcome of FtHoF.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

let saveGame = {
    seed: 'aaaaa',
    buildings: {
        'Wizard tower': {
            amount: 100,
            level: 1,
            minigame: {
                magic: 50,
                onMinigame: true,
            },
        },
    },
};

test('FtHoF casts a cookie storm drop on seed \'aaaaa\' and no spells cast', async ({ page }) => {
    await setupCookieClickerPage(page, {saveGame});
    await page.click('#grimoireSpell1'); // cast FtHoF
    expect(await page.evaluate(() => Game.shimmers[0]['force'])).toEqual('cookie storm drop');
});

test.describe('GFD delay patch', () => {
    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame, mockedDate: Date.UTC(2020, 1, 13, 12)});
        expect(await page.evaluate(() => Game.baseSeason)).toEqual('valentines');
        await page.click('#grimoireSpell1');
        expect(await page.evaluate(() => Game.shimmers[0]['force'])).toEqual('building special');
    });

    const dates = [
        {season: '',            date: Date.UTC(2020, 8, 13, 12, 26, 40)}, // Default date
        {season: 'halloween',   date: Date.UTC(2020, 9, 30, 12)},
        {season: 'christmas',   date: Date.UTC(2020, 11, 25, 12)},
        {season: 'valentines',  date: Date.UTC(2020, 1, 13, 12)},
        {season: 'fools',       date: Date.UTC(2020, 3, 1, 12)},
        {season: 'easter',      date: Date.UTC(2020, 3, 11, 12)},
    ];

    for(let {season, date} of dates) {
        test(`prevents FtHoF outcomes from changing ${season? `on ${season}`:'outside seasons'}`, async ({ page }) => {
            await setupCookieClickerPage(page, {saveGame, mockedDate: date});
            await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
            await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

            await page.evaluate(() => Game.CloseNotes());
            await page.click('text=Options');
            await page.click('#SpiceButtonpatchSeasonsAffectingFtHoF');
            await page.click('text=Options');

            expect(await page.evaluate(() => Game.baseSeason)).toEqual(season);
            await page.click('#grimoireSpell1'); // cast FtHoF
            expect(await page.evaluate(() => Game.shimmers[0]['force'])).toEqual('cookie storm drop');
        });
    }
});
