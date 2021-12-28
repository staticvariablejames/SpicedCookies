/* Function that creates the version-history-appender in the Info menu.
 */

import { name } from './mod';

export function addVersionHistory() {
    // Run on Spice.init()
    let str = `
    <div class="listing">
        <a href="https://github.com/staticvariablejames/SpicedCookies" target="blank">Spiced Cookies</a>
        is a collection of small modifications to Cookie Clicker,
        adding a bit of spice to your gameplay.
    </div>

    <div class="listing">
        Every single feature can be either ignored or disabled in the settings,
        and most of them start disabled by default.
    </div>

    <div class="subsection update"><div class="title">2021-12-27 - TypeScript!</div>
        <div class="listing">&bull; Fixed: Sometimes,
            the displayed stock market delta would be wrong
            during the first tick after loading a save game.
        </div>
        <div class="listing">&bull; Fixed:
            backup counter for this session wasn't being incremented
            if the backup achievements were disabled.
        </div>
        <div class="listing">&bull; Change:
            Awarding achievements based on across-ascensions progress
            is now disabled by default.
        </div>
        <div class="listing">&bull; Internal:
            ported the test suite to Cokie Connoisseur,
            which makes testing automated and more robust.
            In fact, most of the pictures from README.md
            are automatically generated and tested against :)
        </div>
        <div class="listing">&bull; Internal:
            ported the mod to TypeScript and split the source file in multiple files.
        </div>
    </div>

    <div class="subsection update small"><div class="title">2021-10-04 - The Last Changeless Update</div>
        <div class="listing">&bull; Update to use CCSE 2.031.</div>
        <div class="listing">&bull; The mod won't check the CCSE version anymore.
            Reasoning: currently CCSE updates far more frequently that Choose Your Own Lump,
            and usually in a backwards-compatible manner.
            Not asking CCSE version every time makes the mod a bit more future-proof.
        </div>

    <div class="subsection update small"><div class="title">2021-09-02 - Yet another changeless upgrade</div>
        <div class="listing">&bull; Update to use CCSE 2.025.</div>
    </div>

    <div class="subsection update small"><div class="title">2021-07-14 - Still no changes</div>
        <div class="listing">&bull; Internal change:
        set the flag \`Spice.isLoaded\` to true when the mod is loaded.
    </div>

    <div class="subsection update small"><div class="title">2021-03-27 - No changes</div>
        <div class="listing">&bull; Update to use CCSE 2.023.</div>
    </div>

    <div class="subsection update small"><div class="title">2021-01-30 - Oops</div>
        <div class="listing">&bull; Bugfix:
            The setting for adding two new 777-series of upgrades was not being saved.</div>
    </div>

    <div class="subsection update small"><div class="title">2020-12-23 - Can I Has a Bugfix</div>
        <div class="listing">&bull; Bugfix:
            Spiced Cookies could crash the game during challenge runs.</div>
    </div>

    <div class="subsection update small"><div class="title">2020-12-12 - Pop a Patch</div>
        <div class="listing">&bull; Patch vanilla bug:
            Shimmers may be popped twice.</div>
    </div>

    <div class="subsection update"><div class="title">2020-12-11 - Bugfixes galore</div>
        <div class="listing">&bull; Patch vanilla bug:
            Cookie Clicker sometimes display a slightly wrong buff for building specials.</div>
        <div class="listing">&bull; Patch vanilla bug:
            Sugar frenzy can sometimes be used several times in an ascension.</div>
        <div class="listing">&bull; Patch vanilla bug:
            remove the delay in Gambler's Fever Dream.</div>
        <div class="listing">&bull; Patch vanilla bug:
            Easter/Valentine's affect outcome of Force the Hand of Fate.</div>
        <div class="listing">&bull; New animation for Gambler's Fever Dream!</div>
        <div class="listing">&bull; The numerically stable formula for heavenly chip gains
            is now "smoother".</div>
        <div class="listing">&bull; New debug upgrade:
            Heavenly backdoor (bypass requirements for unlocking heavenly upgrades).</div>
        <div class="listing">&bull; The 777-series of upgrades
            can optionally be unlocked based on prestige gain,
            rather than current prestige level.</div>
        <div class="listing">&bull; The 777-series of upgrades
            can optionally be buffed to +1%, +2%, +4% instead of +1%, +1%, +1%.</div>
        <div class="listing">&bull; Two new heavenly upgrades for the 777-series.</div>
        <div class="listing">&bull; Bug fix:
            Changing permanent upgrade slots used to take a few seconds to update visually.</div>
    </div>

    <div class="subsection update"><div class="title">2020-12-03 - Memory aids</div>
        <div class="listing">&bull; Lump count is colored red if smaller than 100
            and Sugar baking is present (enabled by default)</div>
        <div class="listing">&bull; Patch vanilla bug in the pantheon (disabled by default)</div>
        <div class="listing">&bull; Clarify that Holobore is affected by wrath cookies too
            (non-disableable)</div>
        <div class="listing">&bull; Record the number of times the game was backed up
            (non-disableable)</div>
        <div class="listing">&bull; Three new achievements for backing up the save game
            (disabled by default)</div>
        <div class="listing">&bull; Bug fix: opted-in achievements were not being created
            after loading a save game.</div>
    </div>

    <div class="subsection update"><div class="title">2020-11-06 - Debugging discrepancies</div>
        <div class="listing">&bull; Display the mode of stock market goods (debug upgrade)</div>
        <div class="listing">&bull; Preserve debug upgrades across ascensions (debug upgrade)</div>
        <div class="listing">&bull; Discrepancy Patch (disabled by default)</div>
    </div>

    <div class="subsection update small"><div class="title">2020-11-03 - Vanilla update (2)!</div>
        <div class="listing">&bull; Uses the new modding API to store data</div>
    </div>

    <div class="subsection update small"><div class="title">2020-11-01 - Vanilla update!</div>
        <div class="listing">&bull; Update to Cookie Clicker v2.031</div>
    </div>

    <div class="subsection update"><div class="title">2020-10-31 - UI niceties</div>
        <div class="listing">&bull; Numerically stable formula for heavenly chip gains (disabled by default)</div>
        <div class="listing">&bull; Permanent upgrade slots can be chosen during an ascension (non-disableable)</div>
        <div class="listing">&bull; Season switcher tooltips says how many seasonal upgrades were unlocked (non-disableable)</div>
    </div>

    <div class="subsection update"><div class="title">2020-10-23 - alpha release</div>
        <div class="listing">&bull; Save the history of stock market prices (enabled by default)</div>
        <div class="listing">&bull; Display the delta of stock market goods (enabled by default)</div>
        <div class="listing">&bull; Track more statistics across ascensions (non-disableable)</div>
        <div class="listing">&bull; Merciful Market Profit Tallying (enabled by default)</div>
        <div class="listing">&bull; Across-ascensions progress unlocks achievements (enabled by default)</div>
        <div class="listing">&bull; Two extra achievements for popping wrinklers and clicking reindeer (disabled by default)</div>
        <div class="listing">&bull; Three extra stock market achievements (disabled by default)</div>
    </div>

    `;
    Game.customInfoMenu.push(function(){
        CCSE.PrependCollapsibleInfoMenu(name, str);
    });
}
