/* Stock Market-related features.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCMarketStock, CCPageOptions, CCSave } from 'cookie-connoisseur';

async function loadSpicedCookies(page: Page) {
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

test.describe('Stock market panel,', () => {
    test.beforeEach(async ({ page }) => {
        let saveGame = {
            prefs: {
                showBackupWarning: false,
            },
            buildings: {
                'Bank': {
                    amount: 685,
                    level: 1,
                    minigame: {
                        goods: {
                            'SUG': {
                                val: 21.72,
                                d: -0.75,
                                mode: 'slow rise',
                                dur: 389,
                            },
                        },
                    },
                },
            },
        };
        page = await setupCookieClickerPage(page, {saveGame});
        await loadSpicedCookies(page);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    });

    test('displays the delta row by default', async ({ page }) => {
        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('can toggle the delta row', async ({ page }) => {
        await page.click('text=Options');
        await page.click('#SpiceButtondisplayStockDelta');
        await page.click('text=Options');

        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithoutDelta.png');

        await page.click('text=Options');
        await page.click('#SpiceButtondisplayStockDelta');
        await page.click('text=Options');
        /* Uses the same snapshot file as before, as it must be the same.
         * The fact that Playwright tests run in sequence within the same file
         * makes sure that this is not a race condition.
         */
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('toggles the delta row accordingly on load', async ({ page }) => {
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));

        let nativeSaveWithDelta = CCSave.toNativeSave(save);
        (save.modSaveData['Spiced cookies'] as any).settings.displayStockDelta = false;
        let nativeSaveWithoutDelta = CCSave.toNativeSave(save);

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithoutDelta);
        await page.evaluate(() => Game.CloseNotes());
        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithoutDelta.png');

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithDelta);
        await page.evaluate(() => Game.CloseNotes());
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('mode row is toggled with Qmniscient day traders', async ({ page }) => {
        expect(await page.evaluate(() => Game.Upgrades['Omniscient day traders'].toggle()));
        expect(
            await page.evaluate(() => Game.Upgrades['Omniscient day traders'].bought)
        ).toBeTruthy();

        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithMode.png');

        expect(await page.evaluate(() => Game.Upgrades['Omniscient day traders'].toggle()));
        expect(
            await page.evaluate(() => Game.Upgrades['Omniscient day traders'].bought)
        ).toBeFalsy();
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });

    test('mode row visibility is saved and restored correctly', async ({ page }) => {
        let bankGoodPanel = await page.$('#bankGood-3');
        let nativeSaveWithDeltaOnly = await page.evaluate(() => Game.WriteSave(1));

        expect(await page.evaluate(() => Game.Upgrades['Omniscient day traders'].toggle()));
        let nativeSaveWithMode = await page.evaluate(() => Game.WriteSave(1));

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithDeltaOnly);
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');

        await page.evaluate(s => Game.LoadSave(s), nativeSaveWithMode);
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithMode.png');
    });

    test('mode row deactivates itself when ascending', async ({ page }) => {
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate()});

        // Reassign the SUG data so it is the same as before
        await page.evaluate(mode => {
            Game.Objects['Bank'].getFree(685);
            Game.Objects['Bank'].minigame.goods['Bank'].val = 21.72;
            Game.Objects['Bank'].minigame.goods['Bank'].vals[0] = 21.72;
            Game.Objects['Bank'].minigame.goods['Bank'].vals[1] = 21.72+0.75;
            Game.Objects['Bank'].minigame.goods['Bank'].d = -0.75;
            Game.Objects['Bank'].minigame.goods['Bank'].mode = mode;
            Game.Objects['Bank'].minigame.goods['Bank'].dur = 389;
            Game.Objects['Bank'].switchMinigame(1);
        }, CCMarketStock.ModesByName['slow rise']);
        await page.evaluate(() => CConnoisseur.redrawMarketMinigame());
        // We have to call this one manually because it is not tied to M.draw()
        await page.evaluate('Spice.updateStockMarketRows()');

        let bankGoodPanel = await page.$('#bankGood-3');
        expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithDelta.png');
    });
});

test.describe('Stock market history', () => {
    let saveWithBanks = CCSave.fromObject({
        buildings: {
            'Bank': {
                amount: 1,
                level: 1,
            },
        },
    });

    let saveWithHistory: string; // Created on the first test

    async function historyLength(page: Page) {
        return await page.evaluate(() => Game.Objects['Bank'].minigame.goods['Bank'].vals.length);
    }

    test('gets saved and restored on load', async ({ page }) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithBanks});
        await loadSpicedCookies(page);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));

        // A loaded save has only two ticks available, so we tick a few times to generate history
        for(let i = 0; i < 10; i++) {
            await page.evaluate(() => Game.Objects['Bank'].minigame.tick());
        }

        expect(await historyLength(page)).toEqual(12);

        saveWithHistory = await page.evaluate(() => Game.WriteSave(1));

        await page.evaluate(() => Game.Objects['Bank'].minigame.tick());
        expect(await historyLength(page)).toEqual(13);

        await page.evaluate(s => Game.LoadSave(s), saveWithHistory);
        expect(await historyLength(page)).toEqual(12);
    });

    test('gets loaded from local storage', async ({ page }) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithHistory});
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
        await loadSpicedCookies(page);

        expect(await historyLength(page)).toEqual(12);
    });

    test('gets loaded from save', async ({ page }) => {
        page = await setupCookieClickerPage(page);
        await loadSpicedCookies(page);

        // Even if the minigame hasn't loaded yet
        expect(await page.evaluate(() => Game.isMinigameReady(Game.Objects['Bank']))).toBeFalsy();

        await page.evaluate(s => Game.LoadSave(s), saveWithHistory);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
        expect(await historyLength(page)).toEqual(12);
    });

    test('does not get saved if told not to', async ({ page }) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithBanks});
        await loadSpicedCookies(page);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));

        for(let i = 0; i < 10; i++) {
            await page.evaluate(() => Game.Objects['Bank'].minigame.tick());
        }

        await page.evaluate(() => Game.CloseNotes());
        await page.click('text=Options');
        await page.click('#SpiceButtonsaveStockMarketHistory');
        await page.click('text=Options');

        let saveWithoutHistory = await page.evaluate(() => Game.WriteSave(1));

        await page.evaluate(s => Game.LoadSave(s), saveWithoutHistory);
        expect(await historyLength(page)).toEqual(2);
    });

    test('properly resets on ascension', async ({ page }) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithBanks});
        await loadSpicedCookies(page);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));

        for(let i = 0; i < 30; i++) {
            await page.evaluate(() => Game.Objects['Bank'].minigame.tick());
        }

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate()});
        // There should be 17 data points, from the autogenerated ticks
        expect(await historyLength(page)).toEqual(17);
    });

    test('can be loaded from older versions with less buildings', async ({ page }) => {
        // First, doctor the save to look like an old-version save
        let save = CCSave.fromNativeSave(saveWithHistory);
        (save.modSaveData['Spiced cookies'] as any).saveGame.stockMarketHistory.length--;

        page = await setupCookieClickerPage(page, {saveGame: save});
        await loadSpicedCookies(page);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));

        expect(await historyLength(page)).toEqual(12);
        // But idleverses have the default 2 data points
        expect(await page.evaluate(() => {
            return Game.Objects['Bank'].minigame.goods['Idleverse'].vals.length;
        })).toEqual(2);
    });
});

test.describe('Stock market profits', () => {
    async function setup(page: Page, profit: number = 50) {
        page = await setupCookieClickerPage(page, {saveGame: {
            prefs: {
                showBackupWarning: false,
            },
            buildings: {
                'Bank': {
                    level: 1,
                    amount: 1,
                    minigame: {
                        profit,
                    },
                },
            },
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    };

    test('are tracked across ascensions', async ({ page }) => {
        await setup(page, 50);
        /* Due to the way that the profits row is constructed,
         * the code below captures the entire row.
         */
        let profitsRow = await page.locator('text=Profits');

        await expect(profitsRow).toContainText('all time : $50');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        // Prepare a stock sell
        await page.evaluate(() => {
            Game.Objects['Bank'].getFree(1);
            Game.Objects['Bank'].minigame.goods['Bank'].val = 10;
            Game.Objects['Bank'].minigame.goods['Bank'].stock = 1;
            Game.Objects['Bank'].switchMinigame(1);
            Game.CloseNotes();
        });
        await page.click('#bankGood-3 >> text="All"');
        await expect(profitsRow).toContainText('all time : $60');
    });

    test('by default are not deducted when negative', async ({ page }) => {
        await setup(page, -15);
        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : $0');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        await page.evaluate(() => {Game.Objects['Bank'].getFree(1);});
        await expect(profitsRow).toContainText('all time : $0');

        await page.evaluate(() => {
            Game.Objects['Bank'].minigame.profit = 50;
            CConnoisseur.ascend();
            CConnoisseur.reincarnate();
            Game.Objects['Bank'].getFree(1);
            Game.Objects['Bank'].switchMinigame(1);
            Game.Earn(1e30);
            Game.CloseNotes();
        });
        await expect(profitsRow).toContainText('all time : $50');
        await page.click('#bankGood-3 >> text="Max"');
        expect(await page.evaluate(() => Game.Objects['Bank'].minigame.profit)).toBeLessThan(0);
        await expect(profitsRow).toContainText('all time : $50');
    });

    test('can be set to deduct when negative', async ({ page }) => {
        await setup(page, -15);
        await page.click('text=Options');
        await page.evaluate(() => Game.CloseNotes());
        await page.click('#SpiceButtontallyOnlyStockMarketProfits');
        await page.click('text=Options');

        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : -$15');

        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        await page.evaluate(() => {Game.Objects['Bank'].getFree(1);});
        await expect(profitsRow).toContainText('all time : -$15');

        await page.evaluate(() => {
            Game.Objects['Bank'].minigame.profit = 50;
            CConnoisseur.ascend();
            CConnoisseur.reincarnate();
            Game.Objects['Bank'].getFree(10);
            Game.Objects['Bank'].switchMinigame(1);
            Game.Objects['Bank'].minigame.goods['Bank'].val = 1;
            Game.Earn(1e30);
            Game.CloseNotes();
        });
        await expect(profitsRow).toContainText('all time : $35');
        await page.click('#bankGood-3 >> text="Max"'); // Purchase 20 stocks, at 20% markup
        expect(await page.evaluate(() => Game.Objects['Bank'].minigame.profit)).toBeLessThan(0);
        await expect(profitsRow).toContainText('all time : $11');
    });

    test('is erased with a wipe save', async ({ page }) => {
        await setup(page, 35);
        await page.evaluate(() => {CConnoisseur.ascend(); CConnoisseur.reincarnate();});
        let profitsRow = await page.locator('text=Profits');
        await expect(profitsRow).toContainText('all time : $35');
        await page.evaluate(() => Game.HardReset(2));
        await expect(profitsRow).toContainText('all time : $0');
    });
});
