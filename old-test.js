// SPDX-License-Identifier: GPL-3.0-or-later
// See https://github.com/staticvariablejames/CCtest

function testImplicitAssumptions() {
    console.assert(!Game.prefs.popup); // Used to simplify message in Spice.init
}
testImplicitAssumptions();

async function testSeasonsAffectingFtHoFPatch() {
    Util.wipeSave('with minigames');
    Game.seed = 'aaaaa';
    await Util.waitMinigame('Wizard tower');
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchGFDDelay').click();
    document.getElementById('prefsButton').click(); // Easier testing

    let save = Game.WriteSave(1); // Same setup as testGFDDelayPatch

    let testFtHoF = function() {
        Game.Objects['Wizard tower'].minigame.magic = 50;
        document.getElementById('grimoireSpell1').click(); // cast FtHoF
        console.assert(Game.shimmers[0].force == 'cookie storm drop');

        Game.Objects['Wizard tower'].minigame.magic = 50;
        Game.Objects['Wizard tower'].minigame.spellsCastTotal = 5;
        Game.killShimmers();
        document.getElementById('grimoireSpell1').click();
        console.assert(Game.shimmers[0].force == 'clot');
    };
    testFtHoF();

    // Same results if we do patch FtHoF
    Game.LoadSave(save);
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchSeasonsAffectingFtHoF').click();
    document.getElementById('prefsButton').click();
    save = Game.WriteSave(1);

    testFtHoF();

    // Same results if we change seasons
    Game.LoadSave(save);
    Game.season = 'valentines';
    testFtHoF();

    // Same results after wiping the save
    Util.wipeSave('with minigames');
    Game.seed = 'aaaaa';
    testFtHoF();

    console.log("Finished testSeasonsAffectingFtHoFPatch()");
}

function testDoublePop() {
    Util.wipeSave();

    // First demonstrate the bug
    let gc = new Game.shimmer('golden');
    gc.force = 'cookie storm drop';
    gc.pop();
    console.assert(Game.buffs.Frenzy == undefined);
    Math.seedrandom('test'); // Guarantees next pop is a Frenzy
    try {
        gc.pop();
    } catch (e) {
        // An exception is thrown when the game tries to remove the shimmer node twice
    }
    console.assert(Game.buffs.Frenzy != undefined); // A buff is generated nonetheless

    Util.wipeSave();
    document.getElementById('prefsButton').click();
    document.getElementById('SpiceButtonpatchDoublePop').click();
    document.getElementById('prefsButton').click();

    gc = new Game.shimmer('golden'); // Same setup
    gc.force = 'cookie storm drop';
    gc.pop();
    Math.seedrandom('test');
    gc.pop();
    console.assert(Game.buffs.Frenzy == undefined); // Second pop has no effect
}
