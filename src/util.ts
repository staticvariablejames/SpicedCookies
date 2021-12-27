/* rewriteCode(targetFunction, pattern1, replacement1, pattern2, replacement2, ...)
 *
 * Rewrites the source code of the target function,
 * according to the provided list of pattern and replacements.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 * The altered function is returned.
 */
export function rewriteCode(targetFunction: Function, ...args: (string | RegExp)[]) {
    let code = targetFunction.toString();
    let patterns =     args.filter( (_, i) => i % 2 == 0 );
    let replacements = args.filter( (_, i) => i % 2 == 1 );
    for(let i = 0; i < replacements.length; i++) {
        if(replacements[i] instanceof RegExp) {
            throw new Error(`replacements[${i}] may not be a RegExp`);
            // TODO: improve interface for this function
        }
        else {
            code = code.replace(patterns[i], replacements[i] as string);
        }
    }
    return (new Function('return ' + code))();
}

/* rewriteMinigameCode(buildingName, targetFunction, pattern1, replacement1, ...)
 *
 * Same as above, but tailored to replacing code in a minigame function.
 *
 * Each minigame lives inside an object that has an attribute named 'M' pointing to 'this'.
 * Minigame functions use that variable instead of 'this',
 * so if we rewrite code we have to supply that variable again.
 * That's why we need a separate function.
 */
export function rewriteMinigameCode(buildingName: string, targetFunction: Function, ...args: (string | RegExp)[]) {
    let code = targetFunction.toString();
    let patterns =     args.filter( (_, i) => i % 2 == 0 );
    let replacements = args.filter( (_, i) => i % 2 == 1 );
    for(let i = 0; i < replacements.length; i++) {
        if(replacements[i] instanceof RegExp) {
            throw new Error(`replacements[${i}] may not be a RegExp`);
            // TODO: improve interface for this function
        }
        else {
            code = code.replace(patterns[i], replacements[i] as string);
        }
    }
    let M = Game.Objects[buildingName].minigame;
    return (new Function('M', 'return ' + code))(M);
}

/* A "safe version" of Game.Has,
 * that fails gracefully if `what` is not a member of Game.Upgrades.
 */
export function Has(what: string) {
    return what in Game.Upgrades && Game.Has(what);
}
