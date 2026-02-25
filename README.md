GOALS OF PROJECT:
* Make the site fluidly responsive across all breakpoints
* Establish a cohesive visual design system that explores the theme of the assigned are.na channel but still feels structured and scalable
* Translate the theme into the interface logic itself, not just visually style it to look on-theme
* Follow best typography practices from last semester like hierarchy, spacing, line-length, gutters, contrast, etc.
* Hook up to the are.na API and dynamically pull in all content blocks, no hardcoding
* Interpret API content types into my own conceptual filter system tied to time and nightlife
* Build the JS only to the degree that I fully understand what each function is doing
* Keep layout, rendering, filtering, and modals modular
* Ensure accessibility in contrast, structure, and reading order
* Make the interface feel inseparable from this specific channel and not like a swappable template

WHAT I COMPLETED:
* Connected to the are.na API and rendered all blocks dynamically
* Parsed content types and rendered image, link, text, attachment, etc.
* Created a conceptual filter system mapped from API types
* Built modals that populate dynamically and respond across breakpoints
* Established a time thumbnail system so every block reinforces the time/nightlife motif
* After Michael and Eric said the grid felt static, I adjusted fonts, font-size, grid-arrangement, and added subtle randomized pulsing to keep it alive but still structured
* Ensured accessible contrast even with darker gradient backgrounds
* Used CSS variables for colors, fonts, spacing, and sizing
* Nested CSS and styled by element instead of divs and id/class names
* Built mobile-first and scaled up 
Breakpoints:
* <= 350px grid 2 → 1 column
* >= 770px nav alignment changes, padding increases, grid 2 → 3 columns, dialog width adjusts
* >= 1025px padding increases again, h1 line-break behavior changes
* >= 1200px grid 3 → 4 columns

MAIN TRIUMPHS:
* Getting the API fully connected without hardcoding
* Turning raw API data into something conceptual instead
* Creating thematic filtering instead of technical sorting
* Making modals responsive and stable across breakpoints
* Responding to feedback about rigidity without abandoning the grid
* Pulling back on JS overdesign and focusing on structure
* Actually sticking to mobile-first
* Actually made more commits!! (yayy but def still need to make more)

MAIN CHALLENGES:
* I definitely jumped the gun with JS at first and relied too much on AI logic I did not fully understand
* Actually understanding at least the JS functions we learned in class
* After Michael pointed that out, I stripped everything down to what I actually need vs. what’s just cool in theory
* Mentally structured it as 70 percent core, 25 percent refinement, 5 percent experimentation
* Making the grid feel less static without losing clarity
* Handling dynamic content types correctly from the API
* Balancing conceptual ambition with the level of JS I realistically understand
* Ensuring contrast with brighter text on darker gradients
* Styling various content types within a fixed dialog box

WHAT I WOULD CONTINUE TO WORK ON:
* Styling print mode
* Thoroughly testing accessibility media queries like prefers-reduced-motion and contrast modes
* Improving keyboard navigation and ARIA attributes
* Exploring more subtle time-based interactions
* Possibly experimenting with different kinds of filtering like a slider??
* Testing scrollable content with scroll-based animations and intersectionObserver??
* More commits!!

QUESTIONS I STILL HAVE:
* How far can I push the time motif without breaking structure?
* Is the clean grid limiting my concept?
* Could this have been a scrolling timeline instead?
* How should screen readers interpret the time blocks?
* Within the JS I actually understand, what interactions would meaningfully deepen this without overcomplicating it?
* On the next project, now that I have the foundational core and refinement more settled, how can I push the experimentation percent?
