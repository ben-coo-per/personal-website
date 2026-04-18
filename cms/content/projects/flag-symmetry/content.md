
# Pirates and Protest
Back in ye olde days when privateers were near the top of a sailor's concerns, flying a flag upside down was thought to be a way to signal to allied ships that you were in distress. That’s great news for the majority of countries, but for a select 14, and a few others, whose flags' mirror images are so similar to the original that you really can’t tell (looking at you, Great Britain), this was not possible.

Flying a flag upside down has since become a common form of protest (and, at one point, [even ended up as a case in front of the supreme court](https://www.oyez.org/cases/1973/72-1690)!). This protest method has come up in a number of high profile occasions over the past few years (Jan. 6th, Overturning of Roe v Wade, Maro Lago FBI raid, and Justice Alito's home). 

When discussing these events with a friend during a long car ride, we began joking about how this form of protest wouldn’t be possible in a country like Switzerland, since there is no one "correct" way to hang the flag (assuming you aren’t being a smart-ass and hanging it from a corner or something).

This, of course, led to a game of guessing which other flags would fall into this category of "unflippable," and this project idea was born.

# A lil rusty
I decided to use this as an excuse to try out Rust lang since there are some more advanced embedded project ideas that I want to work up to in the future.

The code basically loops through pixels in a flag, comparing them across the vertical and horizontal axis. At first I thought I was done with the project in the first few hours of working on it until I discovered Japan wasn't included in the fully symmetrical category! 

Frustratingly, this was due to the structure of the png images I was getting back from the api. There were significant differences in many 1-to-1 pixel comparisons around the central circle, despite the area representing the mirrored curve.

I had to switch my approach to a fuzzy-match window that I could bring in as a secondary check when the 1-to-1 check failed. This was a bit of a doozy but a great learning experience (I see why people like this language so much).

# The results
-> you can find a [csv of the detailed results on github](https://github.com/ben-coo-per/flag-symmetry/blob/main/results.csv)


![](/cms-assets/projects/flag-symmetry/image-1.png)

![](/cms-assets/projects/flag-symmetry/image-2.png)



```
+----------------------------------------+-----+
| 🪩 Flags with full symmetry            | 14  |
+----------------------------------------+-----+
| ↕️ Flags with horizontal line symmetry  | 23  |
+----------------------------------------+-----+
| ↔️ Flags with vertical line symmetry    | 42  |
+----------------------------------------+-----+
| ❌ Flags with no symmetry              | 173 |
+----------------------------------------+-----+

Full symmetry flags: 🇵🇪🇯🇲🇯🇵🇹🇭🇫🇲🇱🇻🇨🇭🇧🇼🇮🇱🇦🇹🇲🇰🇬🇬🇳🇬🇬🇪
Horizontal line symmetry flags: 🇬🇾🇦🇽🇵🇼🇬🇳🇲🇫🇫🇴🇮🇪🇫🇷🇧🇪🇫🇮🇹🇩🏳️🇨🇮🇸🇪🇩🇰🇧🇭🇸🇯🇲🇱🇮🇸🇳🇴🇶🇦🇷🇴🇮🇹
Vertical line symmetry flags: 🇬🇦🇸🇷🇷🇪🇮🇳🇸🇴🇲🇦🇱🇹🇷🇺🇹🇯🇭🇺🇩🇪🇲🇲🇻🇳🇸🇾🇳🇱🇧🇬🇻🇪🇸🇱🇲🇨🇱🇺🇭🇳🇦🇱🇨🇴🇲🇺🇮🇩🇬🇭🇬🇲🇧🇮🇲🇷🇪🇪🇺🇦🇱🇦🇦🇬🇲🇴🇪🇺🇧🇧🇱🇨🇵🇱🇦🇲🇨🇦🇳🇪🇾🇪
No symmetry flags: 🇿🇼🇹🇨🇭🇰🇻🇨🇦🇸🇳🇺🇮🇴🇱🇾🇲🇶🇧🇲🇨🇰🇧🇿🇸🇬🇪🇬🇵🇦🇿🇦🇰🇬🇯🇪🇼🇫🇬🇮🇳🇷🇯🇴🇵🇭🇺🇿🇧🇩🇪🇸🇭🇷🇸🇧🇪🇭🇰🇷🇹🇬🇲🇳🇪🇹🇳🇮🇹🇹🇳🇫🇨🇼🇸🇸🇧🇯🇱🇰🇧🇴🇦🇮🇵🇬🇨🇻🇰🇵🇮🇷🇸🇮🇦🇺🏳️🇼🇸🇧🇸🏳️🇧🇫🇲🇭🇰🇿🇺🇳🇳🇨🇵🇹🇨🇱🇬🇧🇨🇬🇬🇫🇨🇩🇬🇵🇭🇹🇲🇪🇦🇼🇲🇽🇷🇸🇹🇲🇧🇦🇲🇹🇱🇮🇰🇮🇫🇰🇵🇳🇹🇰🇳🇦🇦🇿🇨🇷🇨🇿🇬🇱🇸🇽🇦🇪🇨🇫🏳️🇰🇲🇹🇷🇸🇿🇬🇹🇲🇬🇨🇳🇦🇷🇺🇸🇧🇱🇳🇵🇰🇼🇫🇯🏳️🇰🇾🇲🇾🇬🇸🇬🇺🇾🇹🇵🇫🇸🇹🇨🇾🇵🇸🇹🇳🇺🇾🇮🇲🇺🇬🇹🇱🇧🇳🏳️🇮🇶🇲🇩🇧🇹🇧🇾🇪🇨🇸🇩🇸🇦🇴🇲🇱🇧🇦🇶🇰🇳🇰🇪🇲🇼🇬🇼🇪🇷🇬🇶🇩🇲🇰🇭🇸🇲🇵🇰🇽🇰🇩🇯🇹🇼🇷🇼🇨🇲🇦🇩🇸🇭🇻🇬🇹🇴🇦🇴🇬🇷🇸🇻🇲🇿🇨🇺🇸🇨🇻🇦🇵🇾🇸🇰🇿🇲🇲🇸🇹🇻🇹🇿🇵🇷🇻🇮🇩🇴🇩🇿🇲🇵🇳🇿🇱🇷🇻🇺🇱🇸🇬🇩🇸🇳🇲🇻🇧🇷🇦🇫🏳️🇵🇲
```