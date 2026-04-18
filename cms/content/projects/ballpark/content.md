![](/cms-assets/projects/ballpark/image-1.jpg)

I wanted to make a game built around solving Fermi Problems, or problems that require making many assumptions and finding answers within an order of magnitude. This is a skill that I believe is quite important - being able to make rough assumptions and build a mental model that gets you within an order of magnitude of an answer can help sift through numbers and judge ideas faster than any other method.

"Ballpark" seemed like a fitting name for the game because, of course, baseball is a game and "in the ballpark" is a perfect way of describing a rough estimate of something. When I looked into origins of that phrase, I found a (somewhat dark) connection that really ties this project together!

# A real Fermi-dable estimator
Enrico Fermi was an Italian physicist probably best known for his work on the Manhattan project. Of course, from his time in the desert we got the Fermi Paradox, Fermi Problems, and a whole host of equations, rules, and discoveries in physics that I don't understand. 

Fermi was known for his surprisingly accurate "napkin" calculations, famously estimating the strength of the Trinity atomic bomb test to within half an order of magnitude (estimated: 10kilotons, actual:18.6 kilotons) by observing some scraps of paper blown away in the blast.


# Baseballs and atom bombs
The popularization of the idiom 'in the ballpark' can be traced back to the mid-20th century, coinciding with some 'fun for the whole family'-type research taking place in the New Mexico desert.

It turns out making missiles is filled with really complicated math that requires assumptions and rough estimation. And, of course, one of the only things more 1950's American than the thermonuclear bomb is BASEBALL ⚾️ !

It's no surprise that "in the ballpark" would make its way into the estimation language that scientists were using in their calculations. What is surprising is the extent to which it became a standard for them! The amount of space that our favorite pastime inhabits became the accepted error tolerance for a missile target during testing (https://en.wiktionary.org/wiki/in_the_ballpark). Judging missile test effectiveness by benchmarking against a space that brings people joy is a bit dark if think about it, especially when your partner is on her way to a Yankees game as you're writing this...

# Enough about history on to the project!
This project was a doozy - it relies on GPT-4o heavily and getting the Raspberry Pi Pico to display make the API calls at the right time, and properly display the page was harder than you would guess based on how bad it looks!

If I'm being honest, I went slightly over time on this one and there was still so much more I wanted to do for it (read as: this NEEDS a cute handheld console enclosure and some graphics on the screen!). 

[View the demo on Instagram](https://www.instagram.com/p/C75EjQfPjnY)

The general way that this works is:
-> GPT-4 generates a problem
-> GPT-4 (in the background) solves the problem 3 separate times and averages the answers together
-> While that's happening, the user is also solving the problem on some scratch paper
-> The user enters their answer with a rotary encoder
-> The results are shown and you can compare how close your answer was to the machine's

Ideally, this would be a bit smarter, run the estimation a few more times, and provide your distance from the mean but this is scrappy summer