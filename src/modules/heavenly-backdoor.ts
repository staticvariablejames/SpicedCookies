/* Heavenly Backdoor debug upgrade.
 */

import { rewriteCode } from '../util';

export function createHeavenlyBackdoorDebugUpgrade() {
    // Run on init; contains injections
    if('Heavenly backdoor' in Game.Upgrades) return; // Make this function indempotent

    let upgrade = CCSE.NewUpgrade('Heavenly backdoor',
        'Remove restrictions for purchasing heavenly upgrades' +
        '<q>I\'m in.</q>',
        7, [15, 7]
    );
    upgrade.order = Game.Upgrades['A really good guide book'].order + 0.003;
    upgrade.pool = 'debug';

    Game.BuildAscendTree = rewriteCode(Game.BuildAscendTree,
        'me.canBePurchased=1',
        "$&;\nif(Spice.Has('Heavenly backdoor')) continue; // Spiced Cookies injection\n"
    );
}
