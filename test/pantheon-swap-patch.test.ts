/* Test the patch for the Pantheon roster-slot swap.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

let saveGame = {
    prefs: {
        showBackupWarning: false,
    },
    buildings: {
        'Temple': {
            amount: 1,
            level: 1,
            minigame: {
                diamondSlot: 'asceticism', // God ID 0
                rubySlot: 'decadence', // God ID 1
                jadeSlot: 'ruin', // God ID 2
                onMinigame: true,
            },
        },
    },
};

test.describe('Pantheon swap patch', () => {
    test('works', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);

        await page.click('text=Options');
        await page.click('#SpiceButtonpatchPantheonSwaps');
        await page.click('text=Options');

        let minigameHandle = await page.evaluateHandle(() => Game.Objects['Temple'].minigame);
        expect(await minigameHandle.evaluate(M => Boolean(M))).toBeTruthy();
        expect(await minigameHandle.evaluate(M => M.slot[0])).toBe(0);
        expect(await minigameHandle.evaluate(M => M.slot[1])).toBe(1);
        expect(await minigameHandle.evaluate(M => M.slot[2])).toBe(2);

        await minigameHandle.evaluate(M => M.slotGod(M.godsById[3], 0));
        await minigameHandle.evaluate(M => M.slotGod(M.godsById[4], 0));
        await minigameHandle.evaluate(M => M.slotGod(M.godsById[2], 1));

        expect(await minigameHandle.evaluate(M => -1 in M.slot)).toBe(false);
        expect(await minigameHandle.evaluate(M => M.slot[0])).toBe(4);
        expect(await minigameHandle.evaluate(M => M.slot[1])).toBe(2);
        expect(await minigameHandle.evaluate(M => M.slot[2])).toBe(1);

        // TODO: replace == with ===
        expect(await minigameHandle.evaluate(M => M.godsById[0].slot == -1)).toBeTruthy();
        expect(await minigameHandle.evaluate(M => M.godsById[1].slot == 2)).toBeTruthy();
        expect(await minigameHandle.evaluate(M => M.godsById[2].slot == 1)).toBeTruthy();
        expect(await minigameHandle.evaluate(M => M.godsById[3].slot == -1)).toBeTruthy();
        expect(await minigameHandle.evaluate(M => M.godsById[4].slot == 0)).toBeTruthy();
    });

    test('is not present in the vanilla game', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame});
        await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Temple']));
        let minusOneIndex = await page.evaluate(() => {
            let M = Game.Objects['Temple'].minigame;
            M.slotGod(M.godsById[3], 0);
            return -1 in M.slot;
        });
        expect(minusOneIndex).toBeTruthy();
    });
});
