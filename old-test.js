// SPDX-License-Identifier: GPL-3.0-or-later
// See https://github.com/staticvariablejames/CCtest

function testImplicitAssumptions() {
    console.assert(!Game.prefs.popup); // Used to simplify message in Spice.init
}
testImplicitAssumptions();

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
