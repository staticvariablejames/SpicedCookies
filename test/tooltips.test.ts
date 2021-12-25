/* Constructs tooltip screenshots for README.md.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('Correct tooltips', () => {
    test.beforeEach(async ({ page }) => {
        await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
    });

    test('for Omniscient day traders', async ({ page }) => {
        await page.evaluate(() => Game.OpenSesame());
        expect(await page.evaluate(() => 'Omniscient day traders' in Game.Upgrades)).toBeTruthy();
        let tooltip = await page.locator('#tooltip');
        await page.mouse.move(500, 500);
        await page.evaluate(() => Game.tooltip.draw(null,Game.crateTooltip(Game.Upgrades['Omniscient day traders'],'stats'),'left'));
        expect(await tooltip.screenshot()).toMatchSnapshot('omniscient-day-traders-tooltip.png');
    });

    test('for Archivist', async ({ page }) => {
        await page.click('text=Options');
        await page.click('#SpiceButtonachievementsForBackingUp');
        await page.click('text=Options');
        expect(await page.evaluate(() => 'Archivist' in Game.Achievements)).toBeTruthy();
        await page.evaluate(() => Game.Win('Archivist'));
        let tooltip = await page.locator('#tooltip');
        await page.mouse.move(500, 500);
        await page.evaluate(() => Game.tooltip.draw(null,Game.crateTooltip(Game.Achievements['Archivist'],'stats'),'left'));
        expect(await tooltip.screenshot()).toMatchSnapshot('archivist-tooltip.png');
    });
});
