/* Stock Market-related features
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCMarketStock, CCPageOptions, CCSave } from 'cookie-connoisseur';

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
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
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
