Spiced Cookies
==============

Adds a little bit of spice to your Cookie Clicker gameplay.

This is a collection of small modifications to the game Cookie Clicker.
Every single feature can be either ignored or disabled in the settings,
and most of them start disabled by default.

All the features are listed below.


Important note for Backup and Save-scumming
===========================================

This mod uses [Klattmose's CCSE](https://klattmose.github.io/CookieClicker/CCSE-POCs/),
and all extra information stored by this mod
(like the stock market history)
is managed by CCSE.

This means that,
to fully back up your save file,
you need to export the vanilla save
(Options -> General -> Export save)
_and_ the CCSE save
(Options -> CCSE -> Export custom save).

Similarly,
to fully restore your save file,
you need to load the vanilla save and the CCSE save,
_in this order_.
Failure to do so may cause both save games to be out of sync,
so that you will have e.g. stock market values from your current save file
but delta values from the backed up save file.

This also means that,
if, at any moment, you stop using the mod,
all the extra information stored by the mod is lost
but the vanilla save will still work as intended,
and any cookies, vanilla achievements, vanilla buildings etc
that were earned while this mod was being used
will be kept.


Save the history of stock market prices (enabled by default)
============================================================

Vanilla Cookie Clicker only saves the current price of the stock in the save file.
This mod saves the entire history for all stocks,
up to 65 data points
(which is enough to fill the minigame's diagram).


Display the delta of stock market goods (enabled by default)
============================================================

![Stock market deltas](doc/delta.png "The mod shows the stock market deltas")

Despite saving the current price for stock market goods,
vanilla Cookie Clicker displays two values when loading a save file.
The first value is actually the current price minus the delta
instead of the previous value;
so actually the delta _is_ available for players,
just not in a straightforward way.
This mod shows the delta below the value of each stock.
