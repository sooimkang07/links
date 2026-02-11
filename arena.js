// I needed to store my Arena channel name and username in one place so I can switch them out easily if I make a new channel or account.
// From my understanding, channelSlug holds the exact Arena channel ID ('night-life-is-so-fun') and myUsername stores my Arena username ('sooim-kang-07') so both can be referenced throughout the rest of the script.
let channelSlug = 'night-life-is-so-fun'
let myUsername = 'sooim-kang-07'

// I needed one global array to hold all the block data after fetching from Arena so other scripts (like script.js) can access the same blocks without refetching.
// I first referenced the class site's JSON section about storing data. Then, I Googled "how to share data between javascript files" and the Google AI Overview mentioned "global variables on window object", so I looked that up on MDN:
	// https://typography-interaction-2526.github.io/week/18/#meet-json
	// https://developer.mozilla.org/en-US/docs/Web/API/Window
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
// From my understanding, window.arenaBlocks starts as an empty array [] and gets filled up later with all 240 time buttons and their associated Arena block info.
window.arenaBlocks = []

// I wanted to display the Arena channel's title, description, block count, and link on my page without hardcoding them so they update automatically when I fetch new data.
// I just pulled straight from your example repo.
// From my understanding, this grabs channelTitle, channelDescription, channelCount, and channelLink from my HTML using querySelector, then fills each one with data from channelData (like channelData.title or channelData.description.html) but only if those HTML elements actually exist on the page, and if the data is missing it uses empty strings or 0 as fallbacks.
let placeChannelInfo = (channelData) => {
	let channelTitle = document.querySelector('#channel-title')
	let channelDescription = document.querySelector('#channel-description')
	let channelCount = document.querySelector('#channel-count')
	let channelLink = document.querySelector('#channel-link')

	if (channelTitle) channelTitle.innerHTML = channelData.title || ''
	if (channelDescription) channelDescription.innerHTML = channelData.description?.html || ''
	if (channelCount) channelCount.innerHTML = channelData.counts?.blocks || channelData.length || 0
	if (channelLink) channelLink.href = `https://www.are.na/channel/${channelSlug}`
}

// A function to display the owner/collaborator info:
let renderUser = (userData) => {
	let channelUsers = document.querySelector('#channel-users')
	if (!channelUsers) return

	let userAddress = `
		<address>
			<img src="${userData.avatar}">
			<h3>${userData.name}</h3>
			<p><a href="https://are.na/${userData.slug}">Are.na profile ↗</a></p>
		</address>
	`

	channelUsers.insertAdjacentHTML('beforeend', userAddress)
}

// I wanted to grab ALL the blocks from Arena (not just the first 50) because Arena splits results into multiple pages and I need every single one to fill my 240 time slots.
// I just pulled straight from your example repo.
// From my understanding, 
	// this creates a URL object from the url string, 
	// fetches that page using fetch, 
	// converts the response to JSON, 
	// pushes that JSON into pageResponses, 
	// checks if there's a json.meta.next_page, 
	// and if yes it calls itself again with the new page number until there are no more pages, 
	// then it smooshes all the pageResponses together into one big allContents array and sends that to the callback function.
let fetchJson = (url, callback, pageResponses = []) => {
	const requestUrl = new URL(url)

	fetch(requestUrl.toString(), { cache: 'no-store' })
		.then((response) => response.json())
		.then((json) => {
			pageResponses.push(json)

			const nextPage = json.meta?.next_page
			if (nextPage) {
				requestUrl.searchParams.set('page', String(nextPage))
				fetchJson(requestUrl.toString(), callback, pageResponses)
				return
			}

			const allContents = pageResponses.flatMap((page) => page.contents || page.data || [])
			json.contents = allContents
			json.data = allContents
			callback(json)
		})
		.catch(error => {
			console.error('Error fetching from Are.na:', error)
		})
}

/* ---------------- Fetch Channel Metadata ---------------- */
// I wanted to load the channel's basic info (title, description, owner) first and separately from the blocks so the header can display even if the blocks take a while to load.
// I just pulled straight from your example repo.
// From my understanding, this calls fetchJson with the Arena API URL for my channel (using channelSlug variable), and when the data comes back it console.logs it, calls placeChannelInfo to fill in the title/description/etc., and if there's a json.owner it calls renderUser to show the owner's card.

// Now that we have said all the things we *can* do, go get the channel data:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
	console.log('Channel data:', json)
	placeChannelInfo(json)
	if (json.owner) renderUser(json.owner)
})

/* ---------------- Fetch Channel Blocks + Build Time Map ---------------- */
// I wanted to grab all the actual content blocks from my Arena channel so I can map them to my 240 time slots and generate clickable time buttons.
// I first referenced the class site's JSON section about fetching data. Then, I Googled "how to check if array is empty javascript" and the Google AI Overview mentioned "checking array.length", so I looked that up on MDN and then asked Claude to help me put it together into a fetchJson call that gets all the blocks and checks if we got any results before continuing with the rest of the setup:
	// https://typography-interaction-2526.github.io/week/18/#lets-try-it-out
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length
	// https://developer.mozilla.org/en-US/docs/Web/API/Console/log_static
// From my understanding, this fetches all blocks from my channel's /contents endpoint, logs the response to console, tries to get the blocks array from either json.contents or json.data, checks if blocks is empty and errors out if so, then logs how many blocks were fetched.
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents`, (json) => {
	console.log('=== ARE.NA API RESPONSE ===', json)
	
	const blocks = json.contents || json.data || []
	
	if (blocks.length === 0) {
		console.error('NO BLOCKS FOUND IN API RESPONSE!')
		return
	}

	console.log(`Total blocks fetched: ${blocks.length}`)

	// I wanted to create exactly 240 different time labels (00:00 to 03:59) so I have one for every minute in my 4-hour timeline before having that many in my actual channel (cause that's tedious work I'm procrastinating...).
	// I first referenced the class site's loops section to understand for loops. Then, I Googled "how to create array of times javascript" and the Google AI Overview mentioned "nested loops and array push", so I looked those up on MDN along with string padding. Then I asked Claude to help me put it together into a nested loop that generates every hour/minute combo, formats it as a time string with leading zeros, and pushes an object with all that info into the allMinutes array:
		// https://typography-interaction-2526.github.io/topic/javascript/#loops
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	// From my understanding, this starts with an empty allMinutes array, then the outer loop goes through hours 0-3 and the inner loop goes through minutes 0-59, and for each combo it pushes an object containing hour, minute, and timeString (formatted like '00:00' using padStart to add leading zeros) into allMinutes, ending up with 240 total objects.
	const allMinutes = []
	for (let hour = 0; hour < 4; hour++) {
		for (let minute = 0; minute < 60; minute++) {
			allMinutes.push({
				hour: hour,
				minute: minute,
				timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
			})
		}
	}

	// I wanted to randomize the order of blocks so the same block doesn't always appear at the same time when I reload the page.
	// I first referenced the class recording about arrays. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with random comparator", so I looked that up on MDN along with the spread operator and then asked Claude to help me put it together into a single line that creates a shuffled copy of the blocks array:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
	// From my understanding, this makes a copy of the blocks array using [...blocks], then sorts it randomly by using Math.random() - 0.5 which gives random positive or negative numbers so the sort order becomes totally scrambled, and stores the shuffled result in shuffledBlocks.
	const shuffledBlocks = [...blocks].sort(() => Math.random() - 0.5)

	// I needed to make sure shuffledBlocks isn't empty before I start dividing by its length to avoid a scary math error.
	// I first referenced the class site's loops section to understand early returns. Then, I Googled "how to prevent divide by zero javascript" and the Google AI Overview mentioned "check array length before math operations", so I looked that up on MDN and then confirmed with Claude:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return
	// From my understanding, this checks if shuffledBlocks.length is 0, and if it is it logs an error and stops the whole function with return so it doesn't try to use on an empty array later.
	if (shuffledBlocks.length === 0) {
		console.error('No blocks available for time mapping')
		return
	}
	
	// I wanted to my randomly placed time buttons to not overlap too much and become unreadable especially over the h1 and site-description (specifically targeted later).
	// I Googled "how to track taken positions in grid javascript" and the Google AI Overview mentioned "using Set data structure", so I looked that up on MDN then asked Claude to help me set up a grid system with a Set to track occupied cells and a function to check if a new position is available before placing a button, and another function to mark cells as occupied after placing a button:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
	// From my understanding, GRID_SIZE is set to 20 which divides my screen into coarse chunks, and occupiedCells starts as an empty Set that will store string coordinates of grid cells that already have buttons near them.
	const GRID_SIZE = 20
	const occupiedCells = new Set()

	// I needed a checker function to reject any random position that's too close to existing buttons so they don't visually overlap.
	// I first referenced the class site's loops section to understand nested for loops. Then, I Googled "how to check if position overlaps with others javascript" and the Google AI Overview mentioned "grid cell collision detection with loops", so I looked that up on MDN along with Set.has. Then asked Claude to help me put it together into a function that converts top/left to grid coordinates, checks a radius of cells around it with nested loops, and returns false if any are occupied and true if all are clear:
		// https://typography-interaction-2526.github.io/topic/javascript/#loops
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
	// From my understanding, this 
		// converts top and left (the random vh/vw percentages) into grid cell coordinates using Math.floor(top / GRID_SIZE), 
		// then checks a 3-cell radius around that spot using nested loops (dy and dx going from -3 to 3), 
		// and if any cell in that radius is already in occupiedCells it returns false meaning this position is too crowded, 
		// otherwise it returns true meaning the spot is safe.
	function isPositionValid(top, left) {
		const cellY = Math.floor(top / GRID_SIZE)
		const cellX = Math.floor(left / GRID_SIZE)
		
		// I needed to check not just the exact grid cell but also nearby cells to create space between buttons.
		// I first referenced the class site's loops section to check for any nesting for loops. Then, I Googled "how to check surrounding cells in grid javascript" and the Google AI Overview mentioned "offset loops with dy and dx", so I looked that up on MDN and then knew to ask Claude to help me write a nested loop that goes through an array of cells around the target one and checks if any of them are in the occupiedCells Set, returning false if so and true if all are clear:
			// https://typography-interaction-2526.github.io/topic/javascript/#loops
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has
		// From my understanding, 
			// dy goes from -3 to 3 and dx also goes from -3 to 3, so for each cell position it checks a 7x7 grid of cells around it, 
			// calculates checkY and checkX by adding the offsets to cellY and cellX, 
			// then checks if that coordinate string is in occupiedCells, 
			// and if any single cell is occupied it immediately returns false.
		for (let dy = -3; dy <= 3; dy++) {
			for (let dx = -3; dx <= 3; dx++) {
				const checkY = cellY + dy
				const checkX = cellX + dx
				if (occupiedCells.has(`${checkY},${checkX}`)) {
					return false
				}
			}
		}
		return true
	}

	// I needed a function to mark a position as taken after I place a button there so future buttons won't spawn in that same area.
	// I Googled "how to add items to set javascript" and the Google AI Overview mentioned "Set.add method", so I looked that up on MDN and then confirmed with Claude:
		// https://typography-interaction-2526.github.io/topic/javascript/#loops
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
	// From my understanding, this 
		// converts top and left to grid coordinates with Math.floor, 
		// then uses nested loops to mark a 3x3 grid of cells (dy and dx from -1 to 1) as occupied by adding their coordinate strings like "5,10" to the occupiedCells Set, creating a small reserved zone around the placed button.
	function markCellOccupied(top, left) {
		const cellY = Math.floor(top / GRID_SIZE)
		const cellX = Math.floor(left / GRID_SIZE)
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				occupiedCells.add(`${(cellY + dy)},${(cellX + dx)}`)
			}
		}
	}

	// I needed a function to protect the center area of my page so time buttons don't cover up my h1 and site-description.
	// I first watched the class recording about if statements and conditionals. Then, I Googled "how to check if number is in range javascript" and the Google AI Overview mentioned "comparison operators with && (and)", so I looked that up on MDN. Then confirmed with Claude if this was the right way to write my function:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators#comparison_operators
	// From my understanding, this checks if top is between 120 and 180 AND left is between 120 and 180, and if both are true it returns true (meaning the position is in the forbidden center zone), otherwise it returns false (safe to place button).
	function isInCenterZone(top, left) {
		// I made the center zone smaller (120-180 instead of 90-210) so more buttons can fit on screen while still keeping the intro text readable.
		// I didn't find this in class examples so I asked Claude "how do I adjust the safe zone coordinates for my center protection function" and it said to just change the numbers in my comparison to make the rectangle bigger or smaller.
		// From my understanding, this compares top > 120 && top < 180 to create a vertical band and left > 120 && left < 180 to create a horizontal band, and where they overlap is the protected center rectangle.
		return (top > 120 && top < 180 && left > 120 && left < 180)
	}

	// I needed to categorize each Arena block into my four custom types (Remember/See/Hear/Read) so the filter buttons and modal can sort and display them correctly.
	// I first referenced the class recording on if statements for conditionals. Then, I Googled "how to check if string contains text javascript" and the Google AI Overview mentioned "includes method and startsWith method", so I looked those up on MDN along with regular expressions and then asked Claude to break that down for me and help me write a function that determines if it's a video, audio, PDF, or just text/link/image based on the various type and URL fields in the block data:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test
	// From my understanding, this 
		// grabs all the different type/URL fields from blockData (like blockData.type, blockData.source.url, blockData.attachment.content_type), 
		// converts them to lowercase, 
		// then checks them against a bunch of conditions using includes, startsWith, and regex patterns to determine if it's a video (isVideo), audio (isAudio), or PDF (isPdf), 
		// and finally returns 'Remember' for images, 'See' for videos, 'Hear' for audio, 'Read' for PDFs/text/links, with 'Read' as the default fallback.
	function getBlockType(blockData) {
		const arenaType = blockData.type || ''
		const sourceUrl = (blockData.source?.url || '').toLowerCase()
		const attachmentType = (blockData.attachment?.content_type || '').toLowerCase()
		const attachmentUrl = (blockData.attachment?.url || '').toLowerCase()
		const attachmentFilename = (blockData.attachment?.file_name || '').toLowerCase()
		const embedType = (blockData.embed?.type || '').toLowerCase()

		const isVideo = (
			attachmentType.startsWith('video/') ||
			/\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i.test(sourceUrl) ||
			/\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i.test(attachmentUrl) ||
			/\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i.test(attachmentFilename) ||
			sourceUrl.includes('youtube.com') ||
			sourceUrl.includes('youtu.be') ||
			sourceUrl.includes('vimeo.com') ||
			sourceUrl.includes('tiktok.com') ||
			embedType === 'video'
		)

		const isAudio = (
			attachmentType.startsWith('audio/') ||
			/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i.test(sourceUrl) ||
			/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i.test(attachmentUrl) ||
			/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i.test(attachmentFilename) ||
			sourceUrl.includes('spotify.com') ||
			sourceUrl.includes('soundcloud.com') ||
			sourceUrl.includes('bandcamp.com') ||
			sourceUrl.includes('mixcloud.com') ||
			sourceUrl.includes('podcast') ||
			(embedType === 'rich' && (
				sourceUrl.includes('spotify.com') ||
				sourceUrl.includes('soundcloud.com') ||
				sourceUrl.includes('bandcamp.com') ||
				sourceUrl.includes('mixcloud.com')
			))
		)

		const isPdf = (
			attachmentType.includes('pdf') ||
			/\.pdf(\?|$)/i.test(sourceUrl) ||
			/\.pdf(\?|$)/i.test(attachmentUrl)
		)

		if (arenaType === 'Image' || attachmentType.startsWith('image/')) return 'Remember'
		if (isVideo) return 'See'
		if (isAudio) return 'Hear'
		if (isPdf || arenaType === 'Text' || arenaType === 'Link' || arenaType === 'Attachment' || arenaType === 'Embed') return 'Read'

		return 'Read'
	}

	// I wanted to grab the container element where all my time buttons will live and make sure it exists before trying to fill it.
	// I first referenced the class example about querySelector. Then, I Googled "how to check if element exists before using it javascript" and the Google AI Overview mentioned "checking if querySelector returns null", so I looked that up on MDN. And then of course (with Claude, could you guess) asked how to put that together into a check that logs an error and stops the function if the element isn't found, or clears it out and resets the arenaBlocks array if it is:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return
	// From my understanding, this grabs the #timeGrid element from my HTML, checks if it's null (doesn't exist), and if so logs an error and stops the whole function with return, otherwise it clears out timeGrid's innerHTML to start fresh and resets window.arenaBlocks to an empty array.
	const timeGrid = document.querySelector('#timeGrid')
	if (!timeGrid) {
		console.error('No #timeGrid element found!')
		return
	}

	timeGrid.innerHTML = ''
	window.arenaBlocks = []

	// I needed to loop through all 240 time slots and create a button for each one, even if I have fewer Arena blocks, by cycling through the available blocks repeatedly.
	// I first referenced the class site's loops section to understand forEach. Then, I Googled "how to repeat array when not enough items javascript" and the Google AI Overview mentioned "modulo operator to cycle through array", so I looked that up on MDN along with forEach then confirmed with Claude I wrote it properly:
		// https://typography-interaction-2526.github.io/topic/javascript/#loops
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	// From my understanding, 
		// forEach goes through every timeSlot object in allMinutes with its index (0, 1, 2... 239), grabs a block from shuffledBlocks using index % shuffledBlocks.length which wraps around when index exceeds the array length (like index 50 % 30 blocks = block 20), 
		// gets the timeString from timeSlot, 
		// generates a random fontIndex between 1-13 for font variety, 
		// and calls getBlockType to classify the block.
	allMinutes.forEach((timeSlot, index) => {
		const blockData = shuffledBlocks[index % shuffledBlocks.length]
		const timeString = timeSlot.timeString
		const fontIndex = Math.floor(Math.random() * 13) + 1
		const blockType = getBlockType(blockData)

		// I wanted to keep generating random positions until I find one that's not in the center zone and doesn't overlap with existing buttons, but also have a bailout so it doesn't loop forever.
		// I first referenced the class site's loops section but didn't find do-while examples, so I Googled "how to keep trying random position until valid javascript" and the Google AI Overview mentioned "do-while loop with validation", so I looked that up on MDN and then confirmed my format with Claude:
			// https://typography-interaction-2526.github.io/topic/javascript/#loops
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/do...while
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_NOT
		// From my understanding, 
			// the do-while loop generates randomTop (30 to 270) and randomLeft (30 to 270) using Math.random(), 
			// counts attempts each time, and if attempts hits 150 maxAttempts it gives up and breaks out if the current position isn't in the center, 
			// then the while condition checks if the position isInCenterZone OR if it's not isPositionValid (using ! to negate), and if either is true it loops again.
		let randomTop
		let randomLeft
		let attempts = 0
		const maxAttempts = 150
		
		do {
			randomTop = 30 + Math.random() * 240
			randomLeft = 30 + Math.random() * 240
			attempts++
			
			if (attempts >= maxAttempts) {
				if (!isInCenterZone(randomTop, randomLeft)) {
					break
				}
			}
		} while (
			isInCenterZone(randomTop, randomLeft) ||
			!isPositionValid(randomTop, randomLeft)
		)

		// I wanted to immediately reserve this position after the loop finds a valid spot so the next button knows this area is taken.
		// I first referenced the class site's section about functions. Then, I Googled "how to call function in javascript" and the Google AI Overview mentioned "function invocation with parentheses", so I looked that up on MDN and confirmed with Claude that this is the right way to call my markCellOccupied function with the randomTop and randomLeft arguments to reserve the area for this button:
			// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#calling_functions
		// From my understanding, this calls the markCellOccupied function I wrote earlier and passes in the randomTop and randomLeft that just got validated, which marks those coordinates and nearby cells as occupied in the occupiedCells Set.
		markCellOccupied(randomTop, randomLeft)

		// I wanted to build the actual clickable button element with all its data attributes and styling so it can be added to my page and work with the modal/filters.
		// I first referenced the class site's section about adding/removing classes but realized I needed to create elements from scratch, so I Googled "how to create button element with javascript" and the Google AI Overview mentioned "document.createElement and dataset properties", so I looked those up on MDN along with CSS custom propertie and then confirmed with Claude that this is the right way to create a button, set its class and type, store all the relevant block and time info in data attributes, set the visible text to the timeString, and use CSS custom properties to position it randomly on the grid:
			// https://typography-interaction-2526.github.io/topic/javascript/#adding-removing-a-class
			// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
			// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
			// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty
			// https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
		// From my understanding, this 
			// creates a new button element, 
			// sets its className to 'time', sets type to 'button', 
			// stores blockData.id in dataset.block, stores timeString in dataset.time, stores fontIndex in dataset.fontIndex, stores the random positions in dataset.top and dataset.left, stores blockType in dataset.type for filtering, 
			// puts timeString as the visible button text, 
			// and sets CSS custom properties --random-top and --random-left using the randomTop and randomLeft values with vh/vw units.
		let timeButton = document.createElement('button')
		timeButton.className = 'time'
		timeButton.type = 'button'
		timeButton.dataset.block = blockData.id
		timeButton.dataset.time = timeString
		timeButton.dataset.fontIndex = fontIndex
		timeButton.dataset.top = randomTop
		timeButton.dataset.left = randomLeft
		timeButton.dataset.type = blockType // Store block type for filtering
		timeButton.textContent = timeString
		timeButton.style.setProperty('--random-top', `${randomTop}vh`)
		timeButton.style.setProperty('--random-left', `${randomLeft}vw`)

		// I wanted to save all the button and block info in a global array so my other files (like script.js) can access this data to power the modal and filters without refetching.
		// I Googled "how to add object to array javascript" and the Google AI Overview mentioned "array.push method", so I looked that up on MDN and then asked Claude to break down how to use it to store an object with all the relevant info about this button and its corresponding Arena block into the window.arenaBlocks array:
			// https://typography-interaction-2526.github.io/week/18/#meet-json
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
		// From my understanding, this pushes a new object into the window.arenaBlocks array containing id (from blockData.id), time (the timeString), fontIndex, position (object with top and left properties), and data (the entire blockData object from Arena), so each button's full info is accessible globally.
		window.arenaBlocks.push({
			id: blockData.id,
			time: timeString,
			fontIndex: fontIndex,
			position: { top: randomTop, left: randomLeft },
			data: blockData
		})

		// I wanted to actually add the finished button to the page so it shows up in the DOM and users can see and click it.
		// I first referenced the class site's section about adding/removing classes but realized I needed to add elements, so I Googled "how to add element to page javascript" and the Google AI Overview mentioned "appendChild method", so I looked that up on MDN and confirmed with Claude:
			// https://typography-interaction-2526.github.io/topic/javascript/#adding-removing-a-class
			// https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
		// From my understanding, this takes the timeButton element I just created and calls appendChild on the timeGrid container, which inserts timeButton as the last child element inside #timeGrid, making it visible on the page.
		timeGrid.appendChild(timeButton)
	})

	// I wanted to log a summary to the console so I can verify in Inspect that all buttons were created successfully and see how blocks are distributed across types in an easier way so I didn't have to expand the sections each time.
	// I first referenced the class recording on how to even use the console. Then, I Googled "how to count occurrences in array javascript" and the Google AI Overview mentioned "reduce or forEach to build object", so I looked those up on MDN along with Object.entries and then confirmed with Claude that this is the right way to log the total buttons created, build a typeDistribution object by looping through arenaBlocks and counting each type, and then log the distribution of block types in the console:
		// https://typography-interaction-2526.github.io/week/18/#lets-try-it-out
		// https://developer.mozilla.org/en-US/docs/Web/API/Console/log_static
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
	// From my understanding, the first console.logs print separator lines and show window.arenaBlocks.length 
		// to confirm 240 buttons were made, 
		// then typeDistribution starts as an empty object {}, 
		// forEach loops through every block in window.arenaBlocks, 
		// calls getBlockType on each block.data to get its type, 
		// and increments typeDistribution[type] (or sets it to 1 if undefined using ||), 
		// then Object.entries converts typeDistribution into an array of [type, count] pairs and forEach logs each one, showing how many Remember/See/Hear/Read blocks exist.
	console.log('=================================================')
	console.log('✅ TOTAL BUTTONS CREATED:', window.arenaBlocks.length)
	console.log('=================================================')
	
	const typeDistribution = {}
	window.arenaBlocks.forEach(block => {
		const type = getBlockType(block.data)
		typeDistribution[type] = (typeDistribution[type] || 0) + 1
	})
	
	console.log('📊 BLOCK TYPE DISTRIBUTION:')
	Object.entries(typeDistribution).forEach(([type, count]) => {
		console.log(`  ${type}: ${count}`)
	})
	console.log('=================================================')
	
	// I needed to tell other files (like script.js) that all the blocks are loaded and ready so they can start listening for clicks and setting up the modal.
	// I first referenced the class site but didn't find custom event examples, so I Googled "how to trigger event when data is loaded javascript" and the Google AI Overview mentioned "CustomEvent and dispatchEvent", so I looked those up on MDN and confirmed with Claude:
		// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
		// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
		// https://developer.mozilla.org/en-US/docs/Web/API/Window
	// From my understanding, this creates a new CustomEvent named 'arenaBlocksLoaded' (with no extra data), then calls window.dispatchEvent to broadcast that event to the whole page, so any script listening for 'arenaBlocksLoaded' (using addEventListener) will be notified and can run their initialization code.
	window.dispatchEvent(new CustomEvent('arenaBlocksLoaded'))
})