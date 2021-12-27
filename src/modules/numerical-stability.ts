/* Patch: fixes a few numerical stability issues in the game.
 */

import { settings } from '../saved-data';
import { rewriteCode } from '../util';

/* Computes a monotonic, numerically stable formula
 * for the number of heavenly chips gained by ascending.
 */
export function stableHeavenlyChipGains() {
    let f = Game.cookiesReset;
    let c = Game.cookiesEarned;
    let a = Math.cbrt((f+c)/1e12);
    let b = Math.cbrt(f/1e12);
    /* let vanillaFormula = Math.floor(a) - Math.floor(b); // not used directly
     * Vanilla Cookie Clicker actually uses Math.pow((f+c)/1e12, 1/Game.HCfactor).
     * Since Game.HCfactor is always 3,
     * we can replace Math.pow with Math.cbrt, which is more precise.
     * So the truncatedVanillaFormula below already has less numerical innacuracy.
     *
     * The downside is that if Orteil changes Game.HCfactor to anything different from 3
     * the formula below cannot be used anymore.
     */
    let approximation = c/1e12/(a*a + a*b + b*b);
    /* The approximation above is mathematically equivalent to a-b,
     * and it is numerically stable.
     * We just need to floor it to guarantee it is a lower bound.
     */
    approximation = Math.floor(approximation);
    let truncatedVanillaFormula = Math.min(Math.floor(a), 2**53) - Math.floor(b);
    /* If a < 2**53, we want to use the vanilla formula.
     * If b > 2**53, we want to use the numerically stable approximation.
     * If we have b < 2**53 < a, we still want to use the numerically stable approximation,
     * but simply using an 'if' might make the formula non-monotonic.
     * Returning the maximum between approximation and truncatedVanillaFormula fits the bill:
     * if b >= 2**53 then truncatedVanillaFormula <= 0 so the value equals approximation.
     * if a <= 2**53 then truncatedVanillaFormula = vanillaFormula >= approximation,
     * because there is no loss of precision here.
     * And finally,
     * both approximation and truncatedVanillaFormula are monotonic (with fixed b),
     * so their maximum is also monotonic.
     */
    return Math.max(approximation, truncatedVanillaFormula);
}

export function injectNumericallyStableFormulaForHeavenlyChipGains() {
    if(!settings.numericallyStableHeavenlyChipGains) return;

    Game.Logic = rewriteCode(Game.Logic,
        'var ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);',
        'var ascendNowToGet = Spice.stableHeavenlyChipGains(); // Spiced Cookies injection\n'
    );
    Game.EarnHeavenlyChips = rewriteCode(Game.EarnHeavenlyChips,
        'prestige>Game.prestige',
        'Spice.stableHeavenlyChipGains() > 0'
    );
    Game.EarnHeavenlyChips = rewriteCode(Game.EarnHeavenlyChips,
        'var prestigeDifference=prestige-Game.prestige;',
        'var prestigeDifference = Spice.stableHeavenlyChipGains(); // Spiced Cookies injection\n'
    );
}
