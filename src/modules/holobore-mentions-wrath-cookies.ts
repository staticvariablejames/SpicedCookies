/* Mention Wrath cookies in Holobore's Description.
 */

export function mentionWrathCookiesInHolobore() {
    // This function is run on minigame load
    if(!Game.Objects['Temple'].minigame) return;
    Game.Objects['Temple'].minigame.gods['asceticism'].descAfter =
        Game.Objects['Temple'].minigame.gods['asceticism'].descAfter!.replace(
            'golden cookie', 'golden or wrath cookie'
        );
}
