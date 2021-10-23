/* Tests the changes to the  tooltip for the season switchers.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

/* Constructs the fancy screenshot for the README.md.
 *
 * Implementation note:
 *
 * Due to <https://github.com/microsoft/playwright/issues/4295>,
 * there is a discrepancy between the screenshots taken headless and headful.
 * In particular,
 * there's an ugly empty row (of the width of the scroll bar).
 *
 * Until the issue is fixed on Playwright's side,
 * the "wrong" image (with the empty row) is defined as the ground truth,
 * at least making the tests consistent.
 */
test('It reminds about the unpurchased Chocolate egg', async ({ page }) => {
    await setupCookieClickerPage(page, {saveGame: {
        cookies: 1e12,
        cookiesEarned: 1e12, // Displays the building names and icons without the fade animation
        ownedUpgrades: [
            'Season switcher',
        ],
        unlockedUpgrades: [
            'Festive biscuit',
            'Ghostly biscuit',
            'Lovesick biscuit',
            'Fool\'s biscuit',
            'Bunny biscuit',
        ],
    }});
    await page.evaluate(() => {
        // Grab all easter eggs
        for(let upgradeName of Game.easterEggs) {
            Game.Upgrades[upgradeName].toggle();
            Game.Upgrades[upgradeName].unlocked = 1;
        }
        // Unearn Chocolate egg
        Game.Upgrades['Chocolate egg'].toggle();

        // Grab cookies, so that only the Chocolate egg shows up in the store
        for(let upgrade of Game.cookieUpgrades) {
            if(upgrade.basePrice < 1e15) {
                upgrade.toggle();
            }
        }
    });
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

    await page.evaluate(() => Game.CloseNotes());
    await page.hover('#upgrade4'); // Hover the bunny biscuit

    let tooltip = await page.locator('#tooltip');
    let upgrades = await page.locator('#upgrades');
    let tooltipBB = await tooltip.boundingBox();
    let upgradesBB = await upgrades.boundingBox();
    // Make sure both the tooltip and the upgrades section of the store appear in the screenshot
    let x = Math.min(tooltipBB.x, upgradesBB.x);
    let y = Math.min(tooltipBB.y, upgradesBB.y);
    let width =  Math.max( tooltipBB.width + tooltipBB.x - x,  upgradesBB.width + upgradesBB.x - x);
    let height = Math.max(tooltipBB.height + tooltipBB.y - y, upgradesBB.height + upgradesBB.y - y);

    expect(await page.screenshot({clip:{x, y, width, height}})).toMatchSnapshot('unlocked-seasonal-upgrades-tooltip.png');
});
