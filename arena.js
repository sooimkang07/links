/* ---------------- Variables ---------------- */
let channelSlug = 'night-life-is-so-fun'
let myUsername = 'sooim-kang-07'

// I needed one global array to hold all the block data after fetching from Arena so other scripts (like script.js) can access the same blocks without refetching.
// I first watched the class recording about storing data and arrays. Then, I Googled "how to share data between javascript files" and the Google AI Overview mentioned "global variables on window object", so I looked that up on MDN:
	// https://typography-interaction-2526.github.io/week/18/#meet-json
	// https://developer.mozilla.org/en-US/docs/Web/API/Window
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
// From my understanding, window.arenaBlocks starts as an empty array [] and gets filled up later with all 240 time buttons and their associated Arena block info.
window.arenaBlocks = []


/* ---------------- Fetch JSON Helper ---------------- */
// I wanted to grab ALL the blocks from Arena (not just the first 50) because Arena splits results into multiple pages and I need every single one to fill my 240 time slots.
// I just pulled straight from your example repo.
// From my understanding, this fetches that page using fetch, converts the response to JSON, pushes that JSON into pageResponses, checks if there's a json.meta.next_page, and if yes it calls itself again with the new page number until there are no more pages, then it smooshes all the pageResponses together into one big allContents array and sends that to the callback function.
let fetchJson = (url, callback, pageResponses = []) => {
	let requestUrl = new URL(url)

	fetch(requestUrl.toString(), { cache: 'no-store' })
		.then((response) => response.json())
		.then((json) => {
			pageResponses.push(json)

			let nextPage = json.meta && json.meta.next_page
			if (nextPage) {
				requestUrl.searchParams.set('page', String(nextPage))
				fetchJson(requestUrl.toString(), callback, pageResponses)
			} else {
				json.data = pageResponses.flatMap((page) => page.contents || page.data || [])
				callback(json)
			}
		})
}


/* ---------------- Get Block Type ---------------- */
// I needed to determine what type of content each Arena block is (Remember/See/Hear/Read) so I can assign it to the right filter category for the time grid.
// I first referenced the class recording on if statements for conditionals. Then, I Googled "how to check if string contains text javascript" and the Google AI Overview mentioned "includes method and startsWith method", so I looked those up on MDN along with regular expressions and then confirmed I was writing this write with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// From my understanding, this grabs all the various type/URL fields from the Arena block data, converts them to lowercase, checks them against patterns using includes/startsWith/regex to categorize as video/audio, then returns 'Remember' for images, 'See' for videos, 'Hear' for audio, or 'Read' for everything else.
let getBlockType = (blockData) => {
	let arenaType = blockData.type || ''
	let sourceUrl = (blockData.source && blockData.source.url || '').toLowerCase()
	let attachmentType = (blockData.attachment && blockData.attachment.content_type || '').toLowerCase()
	let attachmentUrl = (blockData.attachment && blockData.attachment.url || '').toLowerCase()
	let embedType = (blockData.embed && blockData.embed.type || '').toLowerCase()

	let isVideo = attachmentType.includes('video') || sourceUrl.includes('youtube') || sourceUrl.includes('vimeo') || sourceUrl.includes('youtu.be') || embedType == 'video'
	let isAudio = attachmentType.includes('audio') || sourceUrl.includes('spotify') || sourceUrl.includes('soundcloud')

	if (arenaType == 'Image') return 'Remember'
	if (attachmentType.includes('image')) return 'Remember'
	if (isVideo) return 'See'
	if (isAudio) return 'Hear'
	return 'Read'
}


/* ---------------- Render Time Button ---------------- */
// I needed to create a single time button element with all its data attributes so it can be added to the grid and clicked to open the modal.
// I first referenced the class recording on how to set a variables. Then, I Googled "how to set css custom properties javascript" and the Google AI Overview mentioned "style.setProperty", so I looked those up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
	// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty
// From my understanding, this creates a button element, sets its class/type/dataset values, sets the text content to the time string, stores the button and block info in window.arenaBlocks, and returns the button element ready to be appended to the DOM.
let renderTimeButton = (blockData, timeString, fontIndex) => {
	let blockType = getBlockType(blockData)
	
	let timeButton = document.createElement('button')
	timeButton.className = 'time'
	timeButton.type = 'button'
	timeButton.dataset.block = blockData.id
	timeButton.dataset.time = timeString
	timeButton.dataset.fontIndex = fontIndex
	timeButton.dataset.type = blockType
	timeButton.textContent = timeString

	window.arenaBlocks.push({
		id: blockData.id,
		time: timeString,
		fontIndex: fontIndex,
		data: blockData
	})

	return timeButton
}


/* ---------------- Fetch and Build Time Grid ---------------- */
// I wanted to grab all the actual content blocks from my Arena channel so I can map them to my 240 time slots and generate clickable time buttons.
// I first watched the class recording on arrays. Then, I Googled "how to check if array is empty javascript" and the Google AI Overview mentioned "checking array.length", so I looked that up on MDN and then asked Claude to help me put it together into a fetchJson call that gets all the blocks and checks if we got any results before continuing with the rest of the setup:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length
	// https://developer.mozilla.org/en-US/docs/Web/API/Console/log_static
// From my understanding, this fetches all blocks from my channel's /contents endpoint, logs the response to console, tries to get the blocks array from json.data, checks if blocks is empty and errors out if so, then logs how many blocks were fetched.
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents`, (json) => {
	console.log('=== ARE.NA API RESPONSE ===', json)
	
	let blocks = json.data || []
	
	if (blocks.length == 0) {
		console.error('NO BLOCKS FOUND!')
		return
	}

	console.log(`Total blocks: ${blocks.length}`)

	// I wanted to create exactly 240 different time labels (00:00 to 03:59) so I have one for every minute in my 4-hour timeline.
	// I first referenced the class site's loops section. Then, I Googled "how to create array of times javascript" and the Google AI Overview mentioned "nested loops and array push", so I looked those up on MDN along with string padding:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
	// From my understanding, this starts with an empty allMinutes array, then the outer loop goes through hours 0-3 and the inner loop goes through minutes 0-59, and for each combo it pushes an object containing the timeString formatted like '00:00' using padStart to add leading zeros into allMinutes, ending up with 240 total objects.
	let allMinutes = []
	for (let hour = 0; hour < 4; hour++) {
		for (let minute = 0; minute < 60; minute++) {
			allMinutes.push({
				timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
			})
		}
	}

	// I wanted to randomize the order of blocks so the same block doesn't always appear at the same time when I reload the page.
	// I first referenced the class recording about arrays. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with random comparator", so I looked that up on MDN:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	// From my understanding, this creates a copy of the blocks array and calls sort with a comparator function that returns Math.random() - 0.5, which randomly returns positive or negative numbers to shuffle the array order.
	let shuffledBlocks = [...blocks].sort(() => Math.random() - 0.5)

	// I wanted to get the container element where all the time buttons will be inserted.
	// I referenced the class recording on how to setup DOM elements.
	// From my understanding, this queries the DOM for the element with ID 'timeGrid' and stores a reference to it.
	let timeGrid = document.querySelector('#timeGrid')

	// I wanted to loop through all 240 time slots and match each one with a random block, creating a button for each pairing.
	// I first referenced the class site's section about forEach loops and the class recording on arrays.
	// From my understanding, this calls forEach on allMinutes (which has 240 time objects), and for each one it receives the minute object and the index, then uses that index to grab the corresponding block from shuffledBlocks with modulo to wrap around if we have fewer than 240 blocks.
	allMinutes.forEach((minute, index) => {
		let blockData = shuffledBlocks[index % shuffledBlocks.length]
		let timeString = minute.timeString
		let fontIndex = (index % 13) + 1

		timeGrid.appendChild(renderTimeButton(blockData, timeString, fontIndex))
	})
	
	// I needed to tell other files (like script.js) that all the blocks are loaded and ready.
	// I I Googled "how to trigger event when data is loaded javascript" and the Google AI Overview mentioned "CustomEvent and dispatchEvent", so I looked those up on MDN then asked Claude to confirm it:
		// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
		// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
	// From my understanding, this creates a new CustomEvent named 'arenaBlocksLoaded' and broadcasts it to the whole page so any script listening for it can run their initialization code.
	window.dispatchEvent(new CustomEvent('arenaBlocksLoaded'))
})