/* Grimoire animations.
 *
 * Architecture of this module:
 *
 * When the mod loads, it runs Spice.createCanvas,
 * which creates a canvas covering the entire game area.
 * This canvas sits in front of the game area,
 * but let any pointer events pass through.
 *
 * The main drawing loop is coordinated by Spice.sessionData.drawingCallbacks.
 * Each function in that array is executed once per "drawing tick",
 * and removed from the array once it returns a falsy value.
 * This allows short-lived animations to be created by pushing a closure to that array,
 * and the closure is automatically removed once it returns false.
 *
 * The convenience functions below
 * generate and push closures to Spice.sessionData.drawingCallbacks
 * for doing several tasks.
 *
 * Spice.sessionData.drawingCallbacks is automatically erased on load and ascension.
 */

import { sessionData } from '../saved-data';
import { rewriteMinigameCode } from '../util';

export function createCanvas() {
    // This function is run on mod load
    sessionData.canvas = document.createElement('canvas');
    document.body.prepend(sessionData.canvas);

    let setDimensions = function() {
        sessionData.canvas.width = window.innerWidth;
        sessionData.canvas.height = window.innerHeight - 2; // FIXME
    };
    setDimensions();
    window.addEventListener('resize', setDimensions);

    sessionData.canvas.style.position = 'absolute';
    sessionData.canvas.style.zIndex = '100000000000000000000'; // FIXME
    sessionData.canvas.style.pointerEvents = 'none';

    sessionData.ctx = sessionData.canvas.getContext('2d')!;
}

export function clearCanvas() {
    sessionData.ctx.clearRect(0, 0,
        sessionData.canvas.width, sessionData.canvas.height
    );
}

export function clearCanvasCallbacks() {
    // Ran on ascension
    sessionData.drawingCallbacks = [];
}

export function drawCanvas() {
    // This is pushed to the game's "logic" hook
    clearCanvas();

    sessionData.drawingCallbacks = sessionData.drawingCallbacks.filter(
        callback => callback()
    );
}

/* Example of an animation callback generator:
 * it draws a circle with the given a center and a radius,
 * shrinking the radius one unit per game tick.
 */
export function animateShrinkingCircle(centerX: number, centerY: number, radius: number) {
    let startT = Game.T;
    sessionData.drawingCallbacks.push(() => {
        sessionData.ctx.beginPath();
        sessionData.ctx.arc(centerX, centerY, radius + startT - Game.T, 0, 2*Math.PI);
        sessionData.ctx.fill();
        return Game.T <= startT + radius - 1;
    });
}

export function animateGFD(targetId: number) {
    let gfdId = Game.Objects['Wizard tower'].minigame.spells['gambler\'s fever dream'].id;
    let arc = 6;
    let decay = 30;
    let direction = Math.random() < 0.5; // Above or below the spell buttons
    let sourceRect = document.getElementById('grimoireSpell' + gfdId)!.getBoundingClientRect();
    let targetRect = document.getElementById('grimoireSpell' + targetId)!.getBoundingClientRect();
    let sourceX = (sourceRect.left + sourceRect.right)/2;
    let sourceY = (direction !== (targetId > gfdId)) ? sourceRect.bottom : sourceRect.top;
    let targetX = (targetRect.left + targetRect.right)/2;
    let targetY = (direction !== (targetId > gfdId)) ? targetRect.bottom : targetRect.top;
    let centerX = (sourceX + targetX)/2;
    let centerY = (sourceY + targetY)/2;

    let startT = Game.T;
    let radius = Math.hypot(sourceX - targetX, sourceY - targetY)/2;
    let startAngle = Math.atan2(sourceY - targetY, sourceX - targetX);

    sessionData.drawingCallbacks.push(() => {
        let t = Game.T - startT;
        let endAngle = startAngle + (direction ? Math.PI : -Math.PI);
        if(t < arc) {
            endAngle = startAngle + t/arc * (direction ? Math.PI : -Math.PI);
        }
        let alpha = t < arc ? 1 : 1 - (t-arc)/decay;
        sessionData.ctx.strokeStyle = `rgba(0, 200, 0, ${alpha})`;
        sessionData.ctx.lineWidth = 5;
        sessionData.ctx.beginPath();
        sessionData.ctx.arc(centerX, centerY, radius, startAngle, endAngle, !direction);
        sessionData.ctx.stroke();

        return t <= arc + decay;
    });
}

export function injectGrimoireAnimations() {
    // Called on minigame load
    let M = Game.Objects['Wizard tower'].minigame;
    if(!M) return; // safeguard; should never happen
    M.castSpell = rewriteMinigameCode('Wizard tower', M.castSpell,
        'Game.SparkleAt',
        `if(! Spice.settings.grimoireSpellCastAnimations) Game.SparkleAt`
    );

    M.spells['gambler\'s fever dream'].win = rewriteMinigameCode('Wizard tower',
        M.spells['gambler\'s fever dream'].win,
        'var out=M.castSpell',
        `if(Spice.settings.grimoireSpellCastAnimations) { // Spiced cookies injection
            Spice.animateGFD(spell.id);
        }
        $&`
    );
}
