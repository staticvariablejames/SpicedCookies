/* Tests the changes to the tooltip for the season switchers.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage } from 'cookie-connoisseur';

async function loadSpicedCookies(page: Page) {
    await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

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

test.describe('Tooltips for season switches mention unlocked upgrades', () => {
    test('during Christmas', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.evaluate(() => {
            Game.Upgrades[Game.santaDrops[0]].unlocked = 1;
            Game.Upgrades[Game.santaDrops[1]].unlocked = 1;
            Game.Upgrades[Game.santaDrops[2]].unlocked = 1;
            Game.Upgrades[Game.santaDrops[3]].unlocked = 1;
            Game.Upgrades[Game.santaDrops[4]].earn();
            Game.Upgrades[Game.santaDrops[5]].earn();
            Game.Upgrades[Game.santaDrops[6]].earn();
            Game.Upgrades[Game.reindeerDrops[0]].unlocked = 1;
            Game.Upgrades[Game.reindeerDrops[1]].unlocked = 1;
            Game.Upgrades[Game.reindeerDrops[2]].earn();
        });

        let santaDropsCount = await page.evaluate(() => Game.santaDrops.length);
        let reindeerDropsCount = await page.evaluate(() => Game.reindeerDrops.length);
        expect(await page.evaluate(() => Game.Upgrades['Festive biscuit'].descFunc())).toEqual(
            expect.stringContaining(`You've unlocked <b>7/${santaDropsCount}</b> of Santa's gifts`)
        );
        expect(await page.evaluate(() => Game.Upgrades['Festive biscuit'].descFunc())).toEqual(
            expect.stringContaining(`You've unlocked <b>3/${reindeerDropsCount}</b> reindeer cookies`)
        );
    });

    test('during Halloween', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.evaluate(() => {
            Game.Upgrades[Game.halloweenDrops[0]].unlocked = 1;
            Game.Upgrades[Game.halloweenDrops[1]].earn();
        });

        let halloweenCookiesCount = await page.evaluate(() => Game.halloweenDrops.length);
        expect(await page.evaluate(() => Game.Upgrades['Ghostly biscuit'].descFunc())).toEqual(
            expect.stringContaining(`You've unlocked <b>2/${halloweenCookiesCount}</b> halloween cookies`)
        );
    });

    test('during Easter', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.evaluate(() => {
            Game.Upgrades[Game.easterEggs[0]].unlocked = 1;
            Game.Upgrades[Game.easterEggs[1]].unlocked = 1;
            Game.Upgrades[Game.easterEggs[2]].unlocked = 1;
            Game.Upgrades[Game.easterEggs[3]].earn();
            Game.Upgrades[Game.easterEggs[4]].earn();
        });
        let eggCount = await page.evaluate(() => Game.easterEggs.length);
        expect(await page.evaluate(() => Game.Upgrades['Bunny biscuit'].descFunc())).toEqual(
            expect.stringContaining(`You've unlocked <b>5/${eggCount}</b> eggs`)
        );
    });

    test('during Valentines', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.evaluate(() => {
            Game.Upgrades[Game.heartDrops[0]].unlocked = 1;
            Game.Upgrades[Game.heartDrops[1]].unlocked = 1;
            Game.Upgrades[Game.heartDrops[2]].earn();
        });

        let heartsCount = await page.evaluate(() => Game.heartDrops.length);
        expect(await page.evaluate(() => Game.Upgrades['Lovesick biscuit'].descFunc())).toEqual(
            expect.stringContaining(`You've unlocked <b>3/${heartsCount}</b> heart biscuits`)
        );
    });
});
