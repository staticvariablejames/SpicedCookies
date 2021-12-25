/* Tests the debug upgrade "Transcendent Debugging".
 *
 * The tooltip for the upgrade is tested in tooltips.test.ts.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('Transcendent debugging', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('is not active by default', async ({ page }) => {
        await page.evaluate(() => Game.Upgrades['Perfect idling'].toggle());
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate()});
        expect(await page.evaluate(() => Game.Has('Perfect idling'))).toBeFalsy();
    });

    test('works as intended', async ({ page }) => {
        await page.evaluate(() => Game.Upgrades['Perfect idling'].toggle());
        await page.evaluate(() => Game.Upgrades['Omniscient day traders'].toggle());
        await page.evaluate(() => Game.Upgrades['Transcendent debugging'].toggle());
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate()});
        expect(await page.evaluate(() => Game.Has('Perfect idling'))).toBeTruthy();
        expect(await page.evaluate(() => Game.Has('Omniscient day traders'))).toBeTruthy();
        expect(await page.evaluate(() => Game.Has('Transcendent debugging'))).toBeTruthy();
    });

    // Constructs the screenshots for README.md
    test('has a nice display', async ({ page }) => {
        /* Setting the viewport thin and tall makes the screenshot shorter
         * and makes sure the debug upgrade is always in view.
         */
        await page.setViewportSize({width: 800, height: 900});
        await page.evaluate(() => Game.Upgrades['Perfect idling'].toggle());
        await page.evaluate(() => Game.Upgrades['Omniscient day traders'].toggle());
        await page.evaluate(() => Game.Upgrades['Transcendent debugging'].toggle());
        await page.click('text=Stats');
        await page.evaluate(() => Game.CloseNotes());

        // Brittle selectors... We also have to use page.$ because of duplicate selectors
        let upgradeBanner = await page.$('text=Upgrades');
        let transcendentDebugging = await page.$('.listing.crateBox div:nth-child(3)');

        let titleBB = await upgradeBanner.boundingBox();
        let upgradeBB = await transcendentDebugging.boundingBox();
        // Make sure both the title and the debug upgrade appear in the screenshot
        let x = Math.min(titleBB.x, upgradeBB.x);
        let y = Math.min(titleBB.y, upgradeBB.y);
        let width =  Math.max( titleBB.width + titleBB.x - x,  upgradeBB.width + upgradeBB.x - x);
        let height = Math.max(titleBB.height + titleBB.y - y, upgradeBB.height + upgradeBB.y - y);

        expect(await page.screenshot({clip:{x, y, width, height}})).toMatchSnapshot('transcendent-debugging-example.png');
    });
});
