/* Tests the ability to change permanent upgrade slots in the middle of an ascension.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

let saveGame = {
    prefs: {
        particles: false,
        numbers: false,
        milk: false,
    },
    permanentUpgrades: [
        "Break the fifth wall",
        "Kitten analysts",
        "Universal idling",
        "Fortune #103",
        "Kitten executives",
    ],
};

/* The snapshot for Firefox is somewhat bugged.
 * It seems that Playwright somehow scrolls up the entire game,
 * rather than just the middle portion,
 * when trying to move the Permanent Upgrade Slot I icon into view.
 * Until they fix it on their side,
 * we'll keep using the glitched snapshot as the ground truth,
 * so that at least we have some stability.
 */
test('Permanent upgrade slots can be changed in the middle of an ascension', async ({ page }) => {
    await setupCookieClickerPage(page, {saveGame});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    // @ts-ignore: Typo on @types/cookieclicker
    await page.evaluate(() => Game.RuinTheFun(1));

    let pu1index = 6; // Manual inspection; might have to be recalculated if the game updates
    await page.evaluate(() => Game.CloseNotes());
    await page.click('text=Stats');
    await page.click(`#menu >> text=PrestigePrestige >> .listing div:nth-child(${pu1index})`);
    await page.evaluate(() => CConnoisseur.clearNewsTickerText());
    let gameViewport = await page.locator('#game');
    expect(await gameViewport.screenshot()).toMatchSnapshot('changing-permanent-upgrade-slot.png');

    await page.click('#upgradeForPermanent0');
    await page.click('text=Confirm');
    expect(await page.evaluate(() => Game.permanentUpgrades[0])).toEqual(0);
});
