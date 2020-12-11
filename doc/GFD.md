Exploits from Gambler's Fever Dream
===================================

Gambler's Fever Dream (GFD)
is a two-phase spell:
1. Invocation of GFD itself
2. Invocation of the spell chosen by GFD (resolution phase).

There is a 1-second delay between the two phases.
Due to the way that the Grimoire is coded,
this delay is the source of exploits,
several of which are described below.


Scrying
-------

Grimoire spells are seeded based on `Game.seed` and number of spells cast
(meaning that the outcome is completely determined by these two variables).
Casting GFD increments the number of spells cast before the chosen spell resolves,
so the chosen spell resolves with the current number of spells cast
rather than the number of spells cast when GFD was initially cast.

For example,
if the number of spells cast is 100 and GFD chooses Force the Hand of Fate (FtHoF),
Phase 1 increases that to 101,
then FtHoF resolves based on `Game.seed` and 101 spells cast,
with the fail probability adjusted to 50%.

However, the resolution phase does _not_ increases the number of spells cast again.
This means that casting FtHoF now also uses `Game.seed` and 101 spells cast.
This gives the player some valuable information:
1. If the GFD-FtHoF succeeded, then the FtHoF will also succeed.
2. If both succeed _or_ both fail,
    then the outcomes of both cases (the golden cookie effect)
    will be the same.

Hence by repeatedly casting GFD until it chooses FtHoF and gives a desirable outcome,
players can know for certain the outcome of the next FtHoF cast,
thus _scrying_ the next outcome of FtHoF.


GFD cancel
----------

GFD has two costs: the cost of GFD itself,
plus half the cost of the chosen spell.
The cost of GFD itself is deducted on phase 1,
but the cost of the chosen spell is only deducted in phase 2,
after the 1-second delay.
Hence,
by saving the game in-between the delay,
the saved game will have the cost of GFD and the number of spells incremented,
but _not_ the cost of the chosen spell nor the effect of the resolution.

This makes it fast to burn though the number of spells cast,
which is useful for players who use planners.


Cast transfer
-------------

To implement the delay on Phase 1,
Cookie Clicker uses an anonymous `setTimeout`,
which is not cleared when a save file is loaded.
This means that the resolution phase of a GFD cast
can be transferred from one save to another.
Since the cost of the spell resolved in phase 2 is determined in Phase 1,
this can be exploited in several ways.

For example,
if the "donor save" attempts to cast a spell that is too costly for the "receiving save",
the cast will fail and the refunding mechanic of GFD will kick in,
refilling the cost of GFD paid in phase 1 by the donor save.
(This is also known as magic transfer).

On the other hand,
if the donor save has very cheap spells,
it is the cheap price which will be used in the receiving save in the resolution phase.
So a spell can be used repeatedly at a lower cost.
