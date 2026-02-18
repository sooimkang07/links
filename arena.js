let channelSlug = 'night-life-is-so-fun' // The "slug" is just the end of the URL.
let myUsername  = 'sooim-kang-07' // For linking to your profile.


// I needed one global array to hold all the block data after fetching from Are.na so other functions can access the same blocks without refetching.
// From my understanding, arenaBlocks starts as an empty array [] and gets filled up later with all 240 time buttons and their respective Are.na block info.
let arenaBlocks = []

// I wanted to track which filters are active and whether chaos mode is on.
// I first thought about using arrays for activeFilters and isChaosMode and referenced the class recording, but then I asked Google if that was the right way to track those things and the Google AI Overview mentioned using a Set for tracking unique items and a boolean for toggling true/false instead, so I looked those up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean	
// From my understanding, a Set lets me add/remove/check filter names without duplicates, and isChaosMode just flips between true and false when the toggle is clicked.
let activeFilters = new Set(['all'])
let isChaosMode   = true
let originalOrder = []


// ---- VARIABLES ----
// I wanted to establish my variables to call later in my functions.
// I referenced the class site about adding/removing a class to learn how to setup a basic variable and then watched the class recording with Eric showing us querySelectorAll.
// From my understanding, querySelector grabs single elements by ID or class, querySelectorAll grabs multiple elements as a NodeList, and storing them in variables lets me reuse them throughout the script without searching the DOM every time.
let timeGrid        = document.querySelector('#timeGrid')
let filterButtons   = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')
let chaosToggle     = document.querySelector('#chaosToggle')
let modalButton     = document.querySelector('#gridDetail') // The thing we're clicking into.
let modalDialog     = document.querySelector('#gridDetail') // Now one for our `dialog`.
let closeButton     = modalDialog.querySelector('button')   // Only looking within `modalDialog`.
let detailTime      = document.querySelector('#detailTime')
let detailTitle     = document.querySelector('#detailTitle')
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
// I referenced the adding/removing a class section of the class site to learn how to target the countdown element and add a class after a delay. I wanted the countdown to fade out after 7 seconds, then be removed from the layout after the fade completes at 7.1 seconds, so I used two setTimeouts to add .hidden and then .gone.
// JS only adds .hidden (fade out) and .gone (remove from layout) after the full 7s sequence ends. 5 frames × 1s each + 1.5s pulse on the last frame = 7ish seconds total.
if (countdownTime) {
	setTimeout(() => {
		countdownTime.classList.add('hidden')
		setTimeout(() => countdownTime.classList.add('gone'), 100) // Remove from layout after fade.
	}, 5000)
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
// Then our big function for specific-block-type rendering, adapted from the class demo's renderBlock function. Instead of inserting into a list, this targets the modal figure directly  because I have 240 buttons that all open the same dialog so something has to remember which button was clicked and go get that block's data to fill it in.
// I Googled "how to insert html string into element javascript" and the Google AI Overview mentioned "insertAdjacentHTML", so I looked that up on MDN. I also saw Michael's Slack note about how Are.na stores audio files to pull the src from attachment.url:
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
let openDetail = (blockId) => { // The thing we're clicking into.
	let block = arenaBlocks.find((entry) => String(entry.id) == String(blockId))
	
	if (!block) return

	let blockData = block.data

	detailTime.textContent       = block.time
	detailTime.dataset.fontIndex = block.fontIndex

	// Text blocks show their content in the text field instead of a title + media.
	// CSS reads data-type on the dialog to swap layout classes.
	// From my understanding, toggle(class, bool) adds the class when true, removes when false so this one line replaces a full if/else:
	let isText = blockData.type == 'Text'
	detailTitle.classList.toggle('hidden', isText)
	detailText.classList.toggle('text-block', isText)
	detailText.classList.toggle('hidden', !isText)

	if (!isText) {
		detailTitle.textContent = blockData.title || blockData.generated_title || 'Untitled'
		detailText.innerHTML    = ''
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
// I wanted to handle filter button clicks to show/hide time buttons based on which filters are active. I Googled "javascript set add remove selected item" and the Google AI Overview mentioned "has/add/delete methods", so I looked those up on MDN:
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


// ---- CHAOS/CALM TOGGLE BUTTON ----
// I wanted to let users toggle between chaos mode (shuffled random order) and calm mode (chronological 12:00–3:59 order). 
// I first referenced the class site's section about arrays and loops. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with Math.random", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// From my understanding, this flips between chaos and calm mode, then either scrambles all the time buttons into a random order or puts them back in chronological order.
// Note: instead of reassigning textContent in JS, the button label is driven by CSS reading a data-chaos attribute, so JS just flips the attribute value and CSS handles what the user reads: 
	// [data-chaos="true"]  ::after { content: 'Calm' } 
	// [data-chaos="false"] ::after { content: 'Chaos' }
	// https://developer.mozilla.org/en-US/docs/Web/CSS/content
// toggleChaos and shuffleGrid are extra functions not in the class demo, but they're needed because the grid has a chaos/calm toggle that reorders 240 buttons based on the concept of the site.
let shuffleGrid = () => { // Extracted helper — shared by toggleChaos and the initial load shuffle.
	let buttons = Array.from(timeGrid.children).sort(() => Math.random() - 0.5)
	timeGrid.innerHTML = ''
	buttons.forEach((btn) => timeGrid.appendChild(btn))
}

// let toggleChaos = () => {
// 	isChaosMode = !isChaosMode
// 	chaosToggle.dataset.chaos = isChaosMode // CSS reads this attribute to swap the label.

// 	if (isChaosMode) {
// 		shuffleGrid()
// 	} 
// 		else {
// 			timeGrid.innerHTML = ''
// 			originalOrder.forEach((btn) => timeGrid.appendChild(btn))
// 		}
// }

// chaosToggle.dataset.chaos = isChaosMode // Set initial state so the CSS label matches JS state on load.
// chaosToggle.addEventListener('click', toggleChaos)


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


// ---- HIDE HEADER + FOOTER WHEN FILTERS LEAVE VIEWPORT ----
// I wanted the header and footer to slide out of view once the gridFilters nav scrolls out of view, so they don't cover the time grid.
// I referenced the class site's section about "Watching for Scrolling".
// From my understanding, this creates an IntersectionObserver that watches #gridFilters, so when it's intersecting (visible), remove the hide classes; otherwise, add them. CSS handles the actual transition, and @media (width >= 770px) undoes the effect on desktop so the header and footer stay fixed as normal there.
let gridObserver = new IntersectionObserver(([entry]) => {
	// When it is intersecting, remove the class; otherwise, apply it.
	siteHeader.classList.toggle('hidden-up', !entry.isIntersecting)
	siteFooter.classList.toggle('hidden-down', !entry.isIntersecting)
}, { root: scrollContainer })
gridObserver.observe(document.querySelector('#gridFilters')) // Watch for it!


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
		let fontIndex  = (index % 13) + 1
		let blockType  = getBlockType(blockData)

		// Declares a "template literal" of the dynamic HTML we want.
		let timeButton =
			`
			<button class="time" type="button"
				data-block="${ blockData.id }"
				data-time="${ timeString }"
				data-font-index="${ fontIndex }"
				data-type="${ blockType }">
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
		btn.addEventListener('click', () => openDetail(btn.dataset.block))
	})

	filterButtons.forEach((btn) => {
		btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
	})

	applyFilter('all') // Show all buttons initially.

	// Do the initial chaos shuffle now that buttons are in the DOM.
	// Reuses shuffleGrid() — the same function toggleChaos calls — so there's no duplicated logic.
	originalOrder = Array.from(timeGrid.children)
	shuffleGrid()
})