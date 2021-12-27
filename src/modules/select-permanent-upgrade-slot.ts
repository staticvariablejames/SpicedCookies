/* Allows changing the permanent upgrade slot in the middle of an ascension.
 */

export function allowPermanentUpgradeSlotSelectionWithinAscension() {
    // Pushed to Game.customStatsMenu.push
    for(let div of document.querySelectorAll('div.crate.upgrade.heavenly') as NodeListOf<HTMLDivElement>) {
        /* This is a kludge
         * We iterate through all the "crates" displayed under the list of prestige upgrades,
         * looking for the ones which mention Game.UpgradesById[264] in their onmouseover attribute.
         *
         * TODO: Find better way of handling this.
         * This is brittle, difficult to test automatically,
         * and prone to breakage if the game updates.
         */
        let str = div.attributes.getNamedItem('onmouseover')?.nodeValue ?? ""; // onmouseover might be undefined
        let makeCallback = function(slot: number) {
            return function() {
                Game.AssignPermanentSlot(slot);
                let confirmButton = document.getElementById('promptOption0'); // another kludge
                confirmButton!.addEventListener('click', Game.UpdateMenu);
            }
        }
        if(str.includes("Game.UpgradesById[264]")) div.onclick = makeCallback(0);
        if(str.includes("Game.UpgradesById[265]")) div.onclick = makeCallback(1);
        if(str.includes("Game.UpgradesById[266]")) div.onclick = makeCallback(2);
        if(str.includes("Game.UpgradesById[267]")) div.onclick = makeCallback(3);
        if(str.includes("Game.UpgradesById[268]")) div.onclick = makeCallback(4);
    }
}
