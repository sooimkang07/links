let channelSlug = 'night-life-is-so-fun' // The "slug" is just the end of the URL.
let myUsername  = 'sooim-kang-07' // For linking to your profile.


// I needed one global array to hold all the block data after fetching from Are.na so other functions can access the same blocks without refetching.
// From my understanding, arenaBlocks starts as an empty array [] and gets filled up later with all 240 time buttons and their respective Are.na block info.
let arenaBlocks = []

// I wanted to track which filters are active.
// I first thought about using arrays for activeFilters and referenced the class recording, but then I asked Google if that was the right way to track those things and the Google AI Overview mentioned using a Set for tracking unique items instead, so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// From my understanding, a Set lets me add/remove/check filter names without duplicates.
let activeFilters = new Set(['all'])


// ---- VARIABLES ----
// I wanted to establish my variables to call later in my functions.
// I referenced the class site about adding/removing a class to learn how to setup a basic variable and then watched the class recording with Eric showing us querySelectorAll.
// From my understanding, querySelector grabs single elements by ID or class, querySelectorAll grabs multiple elements as a NodeList, and storing them in variables lets me reuse them throughout the script without searching the DOM every time.
let timeGrid        = document.querySelector('#timeGrid')
let filterButtons   = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')
let modalDialog     = document.querySelector('#gridDetail')
let closeButton     = modalDialog.querySelector('button')   // Only looking within `modalDialog`.
let detailTime      = document.querySelector('#detailTime')
let detailText      = document.querySelector('#detailText')
let detailLink      = document.querySelector('#detailLink')
let detailLearnMore = document.querySelector('#detailLearnMore')
let detailMedia     = document.querySelector('#detailMedia')
let backToTopBtn    = document.querySelector('#backToTop')
let headerSection   = document.querySelector('main > section:first-of-type')
let scrollContainer = document.querySelector('main')
let countdownTime   = document.querySelector('#countdownTime')
let siteHeader      = document.querySelector('body > header')
let siteFooter      = document.querySelector('footer')


// ---- COUNTDOWN ----
// I referenced the adding/removing a class section of the class site to learn how to target the countdown element and add a class after a delay. Instead of relying on CSS animation-delay (which iOS Safari handles inconsistently which I slacked Michael about, causing all frames to show at once), I drive the sequence entirely with JS setTimeouts (one per frame) adding .active to show each p and removing it before the next one appears. CSS just handles the visible state via the .active class.
if (countdownTime) {
	let frames = Array.from(countdownTime.querySelectorAll('p'))

	frames.forEach((frame, index) => {
		setTimeout(() => {
			frames.forEach((f) => f.classList.remove('active')) // Hide all frames.
			frame.classList.add('active') // Show just this one.
		}, index * 1000)
	})

	// Hide the overlay after all frames have played + pulse duration on the last frame.
	setTimeout(() => {
		countdownTime.classList.add('hidden')
		setTimeout(() => countdownTime.classList.add('gone'), 200) // Remove from layout after fade.
	}, frames.length * 1000 + 200)
}


// ---- CATEGORIZE BLOCKS ----
// I needed to determine what type of content each Are.na block is (Remember/See/Hear/Read) so I can assign it to the right filter category for the time grid.
// I first referenced the class recording on if statements for conditionals. Then, I looked at the class demo for the let renderBlock function and Googled "how to check if string contains text javascript" and the Google AI Overview mentioned "includes method and startsWith method", so I looked those up on MDN along with regular expressions:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// From my understanding, this grabs all the various type/URL fields from the Are.na block data, categorizes as video/audio, then returns 'Remember' for images, 'See' for videos, 'Hear' for audio, or 'Read' for everything else.
let getBlockType = (blockData) => {
	let sourceUrl      = blockData.source?.url || ''
	let attachmentType = blockData.attachment?.content_type || ''
	let embedType      = blockData.embed?.type || ''

	let isVideo = attachmentType.includes('video') || embedType == 'video' ||
				  sourceUrl.includes('youtube') || sourceUrl.includes('vimeo') || sourceUrl.includes('youtu.be')
	let isAudio = attachmentType.includes('audio') ||
				  sourceUrl.includes('spotify') || sourceUrl.includes('soundcloud')

	if (blockData.type == 'Image' || attachmentType.includes('image')) return 'Remember'
	if (isVideo) return 'See'
	if (isAudio) return 'Hear'
	return 'Read'
}


// ---- RENDER BLOCKS ----
// Then our big function for specific-block-type rendering, adapted from the class demo's renderBlock function. Instead of inserting into a list, this targets the modal figure directly because I have 240 buttons that all open the same dialog so something has to remember which button was clicked and go get that block's data to fill it in.
// I Googled "how to insert html string into element javascript" and the Google AI Overview mentioned "insertAdjacentHTML", so I looked that up on MDN. I also saw Michael's Slack note about how Are.na stores audio files to pull the src from attachment.url and fixed the PDF iframe safari issue. I confirmed my function write up with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
// From my understanding, this empties the media container, figures out what kind of content the block has, declares a template literal of the dynamic HTML we want, and puts it into the modal with insertAdjacentHTML.
let renderBlock = (blockData) => {
	// To start, clear the figure where we'll insert all our media.
	detailMedia.innerHTML = ''
	detailMedia.className = ''

	let sourceUrl      = blockData.source?.url || ''
	let attachmentUrl  = blockData.attachment?.url || ''
	let attachmentType = blockData.attachment?.content_type || ''
	let imageSrc       = blockData.image?.large?.src || blockData.image?.display?.src || blockData.image?.thumb?.src || null

	// Links!
	if (blockData.type == 'Link') {
		detailMedia.insertAdjacentHTML('beforeend',
			`<img alt="${ blockData.title }" src="${ imageSrc }">`)
	}

	// Images! (Remember)
	else if (blockData.type == 'Image' || attachmentType.includes('image')) {
		detailMedia.insertAdjacentHTML('beforeend',
			`<img alt="${ blockData.title }" src="${ imageSrc }">`)
	}

	// Text!
	else if (blockData.type == 'Text') {
		let raw         = blockData.content || blockData.description || ''
		detailText.innerHTML = typeof raw == 'string' ? raw : raw.plain || raw.html || ''
	}

	// Uploaded (not linked) media…
	else if (blockData.type == 'Attachment') {

		// Uploaded videos!
		if (attachmentType.includes('video')) {
			detailMedia.insertAdjacentHTML('beforeend',
				`<video controls src="${ attachmentUrl }"></video>`)

			// More on `video`, like the `autoplay` attribute:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
		}

		// Uploaded PDFs!
		else if (attachmentType.includes('pdf')) {
			detailMedia.insertAdjacentHTML('beforeend',
				`<img alt="${ blockData.title }" src="${ imageSrc }">`)
			detailLearnMore.href = attachmentUrl
			detailLearnMore.classList.remove('hidden')
		}

		// Uploaded audio!
		else if (attachmentType.includes('audio')) {
			// Show cover image alongside the player if one exists.
			if (imageSrc) {
				detailMedia.classList.add('has-audio-cover')
				detailMedia.insertAdjacentHTML('beforeend',
					`<img alt="${ blockData.title }" src="${ imageSrc }">`)
			}

			detailMedia.insertAdjacentHTML('beforeend',
				`<audio controls src="${ attachmentUrl }"></audio>`)

			// More on `audio`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
		}
	}

	// Linked (embedded) media…
	else if (blockData.type == 'Embed') {
		let embedType = blockData.embed?.type

		// Linked video!
		if (embedType == 'video') {
			detailMedia.insertAdjacentHTML('beforeend',
				`<div>${ blockData.embed.html }</div>`)

			// More on `iframe`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		}

		// Linked audio!
		else if (embedType == 'rich') {
			detailMedia.insertAdjacentHTML('beforeend',
				`<div>${ blockData.embed.html }</div>`)
		}
	}
}


// ---- OPEN/CLOSE MODAL ----
// I first referenced the class site's section about opening a modal. Then, I Googled "how to open html dialog element" and the Google AI Overview mentioned "showModal method", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close
// From my understanding, openDetail gets the block data from arenaBlocks using the blockId, fills the modal's time/title/text/media fields with that content, then opens the modal using showModal(). The close button listener calls close(). openDetail is an extra function not in the class demo, but it's needed because 240 time buttons all share one dialog, so something has to look up which block was clicked and fill the modal before calling showModal().
let openDetail = (blockId, timeLabel) => {
	let block = arenaBlocks.find((entry) => String(entry.id) == String(blockId))
	if (!block) return
	let blockData = block.data

	detailTime.textContent       = timeLabel || block.time
	detailTime.dataset.fontIndex = block.fontIndex

	// Text blocks show content in the text field, all other types show media.
	let isText = blockData.type == 'Text'
	detailText.classList.toggle('text-block', isText)
	detailText.classList.toggle('hidden', !isText)

	if (!isText) {
		detailText.innerHTML = ''
	}

	// Only show "Learn More" for Link blocks that have a source URL.
	let learnMoreUrl = blockData.type == 'Link' ? blockData.source?.url : null
	detailLearnMore.classList.toggle('hidden', !learnMoreUrl)
	if (learnMoreUrl) detailLearnMore.href = learnMoreUrl

	detailLink.href = `https://www.are.na/block/${ blockData.id }`

	renderBlock(blockData)
	modalDialog.showModal() // This opens it up.
}

closeButton.addEventListener('click', () => {
	modalDialog.close() // And this closes it!
})

// Listen to *all* clicks, now including the `event` parameter…
document.addEventListener('click', (event) => {
	// Only clicks on the page itself behind the `dialog`.
	if (event.target == modalDialog) {
		modalDialog.close() // Close it too then.
	}
})


// ---- FILTER BUTTONS ----
// I wanted to handle filter button clicks to show/hide time buttons based on which filters are active. 
// I Googled "javascript set add remove selected item" and the Google AI Overview mentioned "has/add/delete methods", so I looked those up on MDN and then confirmed my function write up with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// From my understanding, this tracks which filters are active in a Set, clears it and adds 'all' if All is clicked, otherwise toggles that filter on or off, then updates the active class on filter buttons and shows or hides time buttons to match. applyFilter is an extra function not in the class demo, but it's needed because the grid has four content-type filters (Remember/See/Hear/Read) that need to show/hide buttons.
let applyFilter = (filterType) => {
	if (filterType == 'all') {
		activeFilters.clear()
		activeFilters.add('all')
	} 
	
	else {
		activeFilters.delete('all')

		if (activeFilters.has(filterType)) {
			activeFilters.delete(filterType)

			if (activeFilters.size == 0) activeFilters.add('all') // If nothing is active, fall back to All.
		} 
			else {
				activeFilters.add(filterType)
			}
	}

	// Update active class on each filter button.
	filterButtons.forEach((btn) => {
		btn.classList.toggle('active', activeFilters.has(btn.dataset.filter))
	})

	// Show or hide each time button based on active filters.
	document.querySelectorAll('.time').forEach((btn) => {
		btn.classList.toggle('hidden', !activeFilters.has('all') && !activeFilters.has(btn.dataset.type))
	})
}


// ---- SHUFFLE GRID ----
// I wanted to randomize the display order of the time buttons on load so the grid feels different every visit.
// I first referenced the class site's section about arrays and loops. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with Math.random", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// From my understanding, this grabs all current buttons as an array, sorts them in a random order, clears the grid, then re-appends them in that new order.
let shuffleGrid = () => {
	let buttons = Array.from(timeGrid.children).sort(() => Math.random() - 0.5)
	timeGrid.innerHTML = ''
	buttons.forEach((btn) => timeGrid.appendChild(btn))
}


// ---- BACK TO TOP BUTTON ----
// I wanted to show/hide the back-to-top button based on scroll position, only visible when scrolled down past the header section.
// I referenced the class site's section about "Watching for Scrolling".
// From my understanding, this creates an IntersectionObserver that watches the header section, so when the header is intersecting (visible) it removes .visible from the button, and when it's not intersecting (scrolled past) it adds .visible. classList.toggle handles both branches in one line.
// Set up an IntersectionObserver.
let sectionObserver = new IntersectionObserver(([entry]) => {
	// When it is intersecting, remove the class; otherwise, apply it.
	backToTopBtn.classList.toggle('visible', !entry.isIntersecting)
}, 
	{ 
		root: scrollContainer 
	}) // Pass `main` as the root so it watches scroll within that container.
sectionObserver.observe(headerSection) // Watch for it!


// ---- HIDE HEADER + FOOTER WHEN DESCRIPTION LEAVES VIEWPORT ----
// I wanted the header and footer to slide out of view once the site description scrolls out of view, so they don't cover the time grid.
// I referenced the class site's section about "Watching for Scrolling".
// From my understanding, this creates an IntersectionObserver that watches the p in the first section of main, so when it's intersecting (visible), remove the hide classes; otherwise, add them. CSS handles the actual transition, and @media (width >= 770px) undoes the effect on desktop so the header and footer stay fixed as normal there.
let gridObserver = new IntersectionObserver(([entry]) => {
	// When it is intersecting, remove the class; otherwise, apply it.
	siteHeader.classList.toggle('hidden-up', !entry.isIntersecting)
	siteFooter.classList.toggle('hidden-down', !entry.isIntersecting)
}, { root: scrollContainer })
gridObserver.observe(document.querySelector('main > section:first-of-type p')) // Watch for it!


// ---- FETCH HELPER ----
// Finally, a helper function to fetch data from the API, then run a callback function with it.
// I adapted the class demo's fetchJson to use json.meta.next_page (v3 API) instead of json.meta.has_more_pages, so all blocks in the channel are fetched and not just the first 20 (this is what Claude told me to do, might be incorrect, but using the class example didn't show me all my blocks):
let fetchJson = (url, callback, pageResponses = []) => {
	fetch(url, { cache: 'no-store' })
		.then((response) => response.json())
		.then((json) => {
			// Add this page to our temporary "accumulator" list parameter (an array).
			pageResponses.push(json)

			// Are.na response includes this "there are more!" flag (a boolean):
			if (json.meta?.next_page) { // If that exists and is `true`, keep going…
				// Fetch *another* page worth, passing along our previous/accumulated responses.
				fetchJson(`${ url }&page=${ json.meta.next_page }`, callback, pageResponses)
			} else { // If it is `false`, there are no more pages…
				// "Flattens" them all together as if they were one page response.
				json.data = pageResponses.flatMap((page) => page.contents || page.data || [])

				// Return the data to the callback!
				callback(json)
			}
		})
}

// More on `fetch`:
// https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch


// ---- GET ARENA DATA ----
// Now that we have said all the things we *can* do, go get the channel data:
fetchJson(`https://api.are.na/v3/channels/${ channelSlug }/contents?per=100`, (json) => {
	console.log(json) // Always good to check your response!

	let blocks = json.data || []

	if (blocks.length == 0) {
		console.error('NO BLOCKS FOUND!')
		return
	}

	console.log(`Total blocks: ${ blocks.length }`)

	// I wanted to create exactly 240 different time labels (12:00–3:59 AM) so I have one for every minute in my 4-hour timeline.
	// I first referenced the class site's loops section. Then, I Googled "how to create array of times javascript" and the Google AI Overview mentioned "nested loops and array push", so I looked those up on MDN along with string padding:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
	// From my understanding, this starts with an empty allMinutes array, then the outer loop goes through hours 0–3 and the inner loop goes through minutes 0–59, and for each combo it pushes a time string formatted like '00:00' using padStart to add leading zeros.
	let allMinutes = []
	for (let hour = 0; hour < 4; hour++) {
		for (let minute = 0; minute < 60; minute++) {
			allMinutes.push(`${ String(hour).padStart(2, '0') }:${ String(minute).padStart(2, '0') }`)
		}
	}

	// I wanted to randomize the order of blocks so the same block doesn't always appear at the same time when I reload the page.
	// I first referenced the class recording about arrays. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with random comparator":
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	// From my understanding, this creates a copy of the blocks array and calls sort with a comparator function that returns Math.random() - 0.5, which randomly returns positive or negative numbers to shuffle the array order.
	let shuffledBlocks = [...blocks].sort(() => Math.random() - 0.5)

	// Loop through all 240 time slots and match each one with a block, creating a button for each pairing.
	allMinutes.forEach((timeString, index) => {
		let blockData  = shuffledBlocks[index % shuffledBlocks.length] // Modulo wraps around if fewer than 240 blocks.
		let fontIndex = Math.floor(Math.random() * 13) + 1
		let blockType  = getBlockType(blockData)

		// I wanted to randomize the order of blocks so the same block doesn't always appear at the same time when I reload the page.
		// I used the same shuffle method as before for consistency, but this time it's shuffling the blocks as they're being rendered into buttons, so the time-block pairings stay the same but their position in the grid changes on each load. I wanted it to look more scattered than assigning every X numver of blocks a larger span, so I asked Claude how to calculate that which got me the numbers part of this:
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
		// From my understanding, this creates a copy of the blocks array and calls sort with a comparator function that returns Math.random() - 0.5, which randomly returns positive or negative numbers to shuffle the array order. So basically it randomly assigns some cells a larger span so the grid looks scattered but still structured with this math: 
		let r = Math.random()
		let span = r < 0.4 ? 'both' : r < 0.15 ? 'col' : r < 0.4 ? 'row' : ''
		let spanAttr = span ? `data-span="${ span }"` : ''

		// This occasionally inserts an empty placeholder cell before this button for scattered spacing (~10% chance), and it's aria-hidden better semantically which Michael told me to look more into last project because it's implying it should be ignored by screen readers which is true, as it's just pure aesthetic space.
		if (Math.random() < 0.1) {
			timeGrid.insertAdjacentHTML('beforeend', `<span aria-hidden="true"></span>`)
		}

		// Declares a "template literal" of the dynamic HTML we want.
		// Pulsing is assigned after shuffleGrid() so it reflects actual DOM order.
		let timeButton =
			`
			<button class="time" type="button"
				data-block="${ blockData.id }"
				data-time="${ timeString }"
				data-font-index="${ fontIndex }"
				data-type="${ blockType }"
				${ spanAttr }>
				${ timeString }
			</button>
			`

		// And puts it into the page!
		timeGrid.insertAdjacentHTML('beforeend', timeButton)

		// Push the block into the array so openDetail can find it later by id.
		arenaBlocks.push({ id: blockData.id, time: timeString, fontIndex, data: blockData })
	})

	// Loop through the list, doing this `forEach` for each one.
	document.querySelectorAll('.time').forEach((btn) => {
		btn.addEventListener('click', () => openDetail(btn.dataset.block, btn.dataset.time))
	})

	filterButtons.forEach((btn) => {
		btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
	})

	applyFilter('all') // Show all buttons initially.
	shuffleGrid()      // Randomize the grid order on load.


// ---- PULSE ----
	// I wanted certain cells to pulse on load so the grid feels alive without everything moving at once.
	// I moved this after shuffleGrid() so that i === 0 is genuinely the first button the user sees, not just the first one that was rendered. The staggered animation delays are handled in CSS so the cells don't all beat in sync. I just had to look up how to add a class to multiple elements with JavaScript, and the Google AI Overview mentioned classList.add and querySelectorAll, so I looked those up on MDN:
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
	// From my understanding, this grabs all the time buttons in their final shuffled order, then adds .is-pulsing to the first one and every 6th one after that — CSS takes over from there and handles the actual animation.
	let allButtons = Array.from(timeGrid.querySelectorAll('button.time'))
	allButtons.forEach((btn, i) => {
		if (i === 0 || i % 6 === 0) btn.classList.add('is-pulsing')
	})
})