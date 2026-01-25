![](/cms-assets/blog/magic-macros/image-1.gif)

# Current nutritional tracking apps are not working

Every once and a while I decide that it's time to get start roughly estimating how I am doing with my nutrition. I think of it kind of like a bank account, I want to know what's going in and coming out - but I don't want it to become something I obsess over, or even look at, every day. 

Each time I try to get into this habit, I am genuinely shocked at how sorry the state of nutritional tracking is. Every app I have tried has been either too buggy, filled with ads, or has an overcomplicated interface for what should be a low-friction, daily routine. I also feel like many of these apps are not great at handling what, for some, can be a complicated psychological relationship with food, making it feel like you're being pushed into obsessively tracking each individual bite.

Personally, I don't want to spend any time keeping track of all of this and I don't really care about the macros being perfectly accurate. All I wanted was a general estimate to know how I'm doing at a macro (no pun intended) scale.


# Recounting what you ate is a conversation

Food is a cultural binder. We bond over food whether it is something we are in the act of prepping/eating or if its recounting what we've eaten in the past. 

Almost all existing apps require you to fill in a rigid form describing what you ate. Not only is this a tedious process but this is also not how we communicate about food naturally. It is inevitably going to feel cumbersome.

I wanted to create an experience that leans into that fluid, conversational way of describing what we eat, but still able to handle more exact measurements if needed (So saying I had a handful of peanuts and saying I had 2 oz of peanuts would both work).

# How it's made
We live in a golden age for conversational intelligence, so what else would you turn to if not an LLM! For this project I am using OpenAI's GPT-4o.

I built a lightweight, FastAPI endpoint that takes in an open, flexible description and returns the estimated nutritional data for whatever you described.

I then built out an iOS Shortcut (first time trying this, 🤷‍♂️ pretty cool!), that queries that API and logs the data in the Apple Health app.

Here's a link if you're interested, although I've removed the API I built since it would cost me $$$ to support many people querying the LLM. If you're interested in spinning up your own, the Github link to the project is at the top!