/* This file makes sure that CCSE loads,
 * that Spice is available as a global object,
 * and `Game.registerMod`s it.
 */
import * as Spice from './index';

declare global {
    interface Window {
        Spice: typeof Spice;
    }   
}

window.Spice = Spice;

if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

if(!Spice.isLoaded){
    let id = 'Spiced cookies';
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod(id, Spice);
    }   
    else {
        if(!window.CCSE) window.CCSE = ({} as typeof CCSE);
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = []; 
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameVersion(Spice.name, Spice.version, Spice.GameVersion)) {
                Game.registerMod(id, Spice);
            }
        });
    }   
}
