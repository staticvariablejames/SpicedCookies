/* Achievements for backing up the save.
 */

import { settings, saveGame, sessionData } from '../saved-data';
import { icons } from '../icon-list';
import { rewriteCode } from '../util';

export function createAchievementsForBackingUp() {
    // This function is run on load and on setting toggle
    if(!settings.achievementsForBackingUp) return;
    if('Archivist' in Game.Achievements) return; // Make this function idempotent

    let last;
    last = CCSE.NewAchievement('Archivist',
        `Back up your save file.
        <q>Future me will be thankful.</q>`,
        icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie' as any].order + 1;

    last = CCSE.NewAchievement('Diligent archivist',
        `Back up your save file in <b>30 distinct days</b>.
        <q>Thank you, past me!</q>`,
        icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie' as any].order + 1.1;

    last = CCSE.NewAchievement('Paranoid archivist',
        'Back up your save file <b>30 times in a single session</b>.',
        icons.floppyDisk
    );
    last.order = Game.Achievements['You win a cookie' as any].order + 1.2;
    last.pool = 'shadow';
}

export function exportSaveCallback() {
    // Calls to this function are injected by Spice.injectCallbackOnExportSave
    saveGame.numberOfBackups++;
    sessionData.backupsThisSession++;

    if(Date.now() > saveGame.lastValidBackupDate + 18*3600*1000) {
        saveGame.lastValidBackupDate = Date.now();
        saveGame.numberOfValidBackups++;
    }

    if(settings.achievementsForBackingUp) {
        Game.Win('Archivist');
        if(saveGame.numberOfValidBackups >= 30) Game.Win('Diligent archivist');
        if(sessionData.backupsThisSession >= 30) Game.Win('Paranoid archivist');
    }
}

export function injectCallbackOnExportSave() {
    // This function is run on load
    Game.ExportSave = rewriteCode(Game.ExportSave,
        '{',
        '{Spice.exportSaveCallback(); // Spiced Cookies modification\n'
    );
    Game.FileSave = rewriteCode(Game.FileSave,
        '{',
        '{Spice.exportSaveCallback(); // Spiced Cookies modification\n'
    );
}

export function displayBackupStatistics() {
    // Pushed to Game.customStatsMenu
    if(saveGame.numberOfBackups > 0) {
        CCSE.AppendStatsSpecial(
            `<div class="listing">
                <b>Number of backups:</b>
                ${Beautify(saveGame.numberOfBackups)}
            </div>`
        );
    }
    if(saveGame.numberOfValidBackups > 0) {
        let s = saveGame.numberOfValidBackups > 1 ? 's' : '';
        CCSE.AppendStatsSpecial(
            `<div class="listing">
                <b>Number of days you backed up your save:</b>
                ${saveGame.numberOfValidBackups} day${s}
            </div>`
        );
    }
}
