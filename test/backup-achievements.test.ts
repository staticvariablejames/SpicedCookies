/* Achievements for backing up the save game.
 */

import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

async function loadSpicedCookies(page: Page) {
    await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
}

function makeSave(backups: number, validBackups: number) {
    return {
        modSaveData: {
            'Spiced cookies': {
                saveGame: {
                    numberOfBackups: backups,
                    numberOfValidBackups: validBackups,
                },
            },
        },
    };
}

test.describe('Backup counter', () => {
    test('increments only when manually exporting save', async ({ page }) => {
        await loadSpicedCookies(page);
        let save = await page.evaluate(() => Game.WriteSave(1));
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(0, 0));

        await page.click('text=Options');
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(1, 1));
        await page.click('text="All done!"');

        save = await page.evaluate(() => Game.WriteSave(1));
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(1, 1));

        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(2, 1));
    });

    test('increments when saving to file', async ({ browser }) => {
        let page = await browser.newPage({acceptDownloads: true});
        await loadSpicedCookies(page);
        let save: string = await new Promise(async resolve => {
            await page.on('download', async download => {
                let stream = await download.createReadStream();
                if(!stream) {
                    resolve('');
                } else {
                    let chunks: Buffer[] = [];
                    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                }
            });
            await page.click('text=Options');
            await page.click('text=Save to file');
        });
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(1, 1));

        await page.close();
    });

    test('increments the daily counter only after 18 hours', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.click('text=Options');

        await page.click('a:has-text("Export save")');
        let save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(1, 1));

        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(2, 1));

        // Advance 12h
        await page.evaluate(() => CConnoisseur.mockedDate += 12 * 3600 * 1000);
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(3, 1));

        // Advance 6h+1min
        await page.evaluate(() => CConnoisseur.mockedDate += (6 * 3600 + 60) * 1000);
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(4, 2));

        // Advance 1min
        await page.evaluate(() => CConnoisseur.mockedDate += 60 * 1000);
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(5, 2));

        // Advance 24h
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(CCSave.fromNativeSave(save)).toMatchObject(makeSave(6, 3));
    });

    test('increments the paranoia counter even across ascensions', async ({ page }) => {
        await loadSpicedCookies(page);
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(0);
        await page.evaluate(() => Game.WriteSave(1));
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(0);
        await page.click('text=Options');

        await page.click('a:has-text("Export save")');
        await page.click('text="All done!"');
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(1);

        await page.click('a:has-text("Export save")');
        await page.click('text="All done!"');
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(2);

        // Advance 24h
        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.click('a:has-text("Export save")');
        await page.click('text="All done!"');
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(3);

        // Wipe save
        await page.evaluate(() => Game.HardReset(2));
        await page.click('a:has-text("Export save")');
        await page.click('text="All done!"');
        expect(await page.evaluate('Spice.sessionData.backupsThisSession')).toBe(4);
    });
});

test.describe('Backup achievements', () => {
    test('are created when the button is toggled', async ({ page }) => {
        await loadSpicedCookies(page);
        expect(await page.evaluate(() => 'Archivist' in Game.Achievements)).toBe(false);
        await page.click('text=Options');
        await page.click('#SpiceButtonachievementsForBackingUp');
        expect(await page.evaluate(() => 'Archivist' in Game.Achievements)).toBe(true);
    });

    test('are created on initialization if set', async ({ page }) => {
        await setupCookieClickerPage(page, {saveGame: {
            modSaveData: {
                'Spiced cookies': {
                    settings: {
                        achievementsForBackingUp: true,
                    },
                },
            },
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
        await page.waitForFunction(() => 'Spiced cookies' in Game.mods);
        expect(await page.evaluate(() => 'Archivist' in Game.Achievements)).toBe(true);
    });

    test('are awarded both on the current save and the created save', async ({ page }) => {
        await loadSpicedCookies(page);
        await page.click('text=Options');
        await page.click('#SpiceButtonachievementsForBackingUp');

        await page.click('a:has-text("Export save")');
        let save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(await page.evaluate(() => Game.HasAchiev('Archivist'))).toBeTruthy();
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.HasAchiev('Archivist'))).toBeTruthy();

        await page.evaluate(() => CConnoisseur.mockedDate += 24 * 3600 * 1000);
        await page.evaluate('Spice.saveGame.numberOfValidBackups = 29');
        expect(await page.evaluate(() => Game.HasAchiev('Diligent archivist'))).toBeFalsy();
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(await page.evaluate(() => Game.HasAchiev('Diligent archivist'))).toBeTruthy();
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.HasAchiev('Diligent archivist'))).toBeTruthy();

        await page.evaluate('Spice.sessionData.backupsThisSession = 29');
        expect(await page.evaluate(() => Game.HasAchiev('Paranoid archivist'))).toBeFalsy();
        await page.click('a:has-text("Export save")');
        save = await page.textContent('#textareaPrompt');
        await page.click('text="All done!"');
        expect(await page.evaluate(() => Game.HasAchiev('Paranoid archivist'))).toBeTruthy();
        await page.evaluate(s => Game.LoadSave(s), save);
        expect(await page.evaluate(() => Game.HasAchiev('Paranoid archivist'))).toBeTruthy();
    });
});
