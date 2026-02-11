let channelSlug = 'night-life-is-so-fun'
let myUsername = 'sooim-kang-07'

window.arenaBlocks = []

// Place basic channel info
// I wanted to keep channel metadata rendering separate so setup stays clean and reusable.
// I referenced querySelector and safe fallback rendering patterns:
// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
// From my understanding, this function grabs optional header nodes and hydrates title/description/count/link only when those elements exist.
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

// Display user info
// I wanted the channel owner info to be injected as semantic HTML without rebuilding the whole container.
// I referenced insertAdjacentHTML on MDN:
// https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
// From my understanding, this builds one address card string and appends it to the users container if present.
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

// Helper function to fetch all pages from Are.na API
// I wanted to fetch every Are.na page (not just page 1) so all blocks can be mapped to time slots.
// I referenced fetch, URL/searchParams, recursion, and array flattening:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// https://developer.mozilla.org/en-US/docs/Web/API/URL
// https://developer.mozilla.org/en-US/docs/Glossary/Recursion
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
// From my understanding, this keeps requesting next_page until done, then merges every page's contents into one payload and passes it to the callback.
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
// I wanted metadata and block content fetched separately so each part of the UI can fail/succeed independently.
// I referenced callback-based composition from our class patterns plus MDN fetch docs above.
// From my understanding, this first request hydrates channel-level UI (title/owner) before time-button generation runs.
// Fetch channel metadata
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
	console.log('Channel data:', json)
	placeChannelInfo(json)
	if (json.owner) renderUser(json.owner)
})

/* ---------------- Fetch Channel Blocks + Build Time Map ---------------- */
// Fetch and display all blocks
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents`, (json) => {
	console.log('=== ARE.NA API RESPONSE ===', json)
	
	const blocks = json.contents || json.data || []
	
	if (blocks.length === 0) {
		console.error('NO BLOCKS FOUND IN API RESPONSE!')
		return
	}

	console.log(`Total blocks fetched: ${blocks.length}`)

	// Generate all 240 time slots (00:00 to 03:59)
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

	// Shuffle blocks for variety
	const shuffledBlocks = [...blocks].sort(() => Math.random() - 0.5)

	// Safety guard to avoid modulo by zero
	if (shuffledBlocks.length === 0) {
		console.error('No blocks available for time mapping')
		return
	}
	
	// Positioning logic to avoid center and overlaps
	const GRID_SIZE = 20
	const occupiedCells = new Set()

	// I wanted a spacing guard so randomly placed time buttons do not overlap visually.
	// I referenced grid bucketing with Math.floor and Set membership checks:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has
	// From my understanding, this converts random coordinates into coarse grid cells and rejects positions near already occupied zones.
	function isPositionValid(top, left) {
		const cellY = Math.floor(top / GRID_SIZE)
		const cellX = Math.floor(left / GRID_SIZE)
		
		// Check 3-cell radius for overlaps
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

	// I wanted accepted positions to reserve nearby cells so later buttons still have breathing room.
	// I referenced Set.add and loop-based neighborhood marking:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
	// From my understanding, this marks a small surrounding area as occupied to prevent future collisions.
	function markCellOccupied(top, left) {
		const cellY = Math.floor(top / GRID_SIZE)
		const cellX = Math.floor(left / GRID_SIZE)
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				occupiedCells.add(`${(cellY + dy)},${(cellX + dx)}`)
			}
		}
	}

	// I wanted to preserve open space around the intro text in chaos mode.
	// I referenced simple conditional range checks from class logic examples and MDN if...else docs:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
	// From my understanding, this returns true when a random coordinate falls inside the protected center zone.
	function isInCenterZone(top, left) {
		// Smaller center avoidance zone in chaos mode (decreased from 90/210 to 120/180)
		return (top > 120 && top < 180 && left > 120 && left < 180)
	}

	// Block type detection for data-type attribute
	// Must match requested categories: Remember / See / Hear / Read
	// I wanted arena.js classification to mirror script.js so filter chips and modal content stay consistent.
	// I referenced string matching + regex checks from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
	// From my understanding, this maps each raw block into your site labels (Remember/See/Hear/Read) and stores that on each time button.
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

	// Create a button for each time slot
	const timeGrid = document.querySelector('#timeGrid')
	if (!timeGrid) {
		console.error('No #timeGrid element found!')
		return
	}

	timeGrid.innerHTML = ''
	window.arenaBlocks = []

	// Repeat blocks when there are fewer than 240
	// I wanted exactly 240 rendered minutes every time, even when the channel has fewer source blocks.
	// I referenced modulo cycling and forEach loops:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
	// From my understanding, index % shuffledBlocks.length loops through available blocks repeatedly so each minute still receives a mapped block.
	allMinutes.forEach((timeSlot, index) => {
		const blockData = shuffledBlocks[index % shuffledBlocks.length]
		const timeString = timeSlot.timeString
		const fontIndex = Math.floor(Math.random() * 13) + 1
		const blockType = getBlockType(blockData)

		// Find a valid position avoiding center and overlaps
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

		markCellOccupied(randomTop, randomLeft)

		// Create the time button
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

		// Store block data globally
		window.arenaBlocks.push({
			id: blockData.id,
			time: timeString,
			fontIndex: fontIndex,
			position: { top: randomTop, left: randomLeft },
			data: blockData
		})

		timeGrid.appendChild(timeButton)
	})

	console.log('=================================================')
	console.log('✅ TOTAL BUTTONS CREATED:', window.arenaBlocks.length)
	console.log('=================================================')
	
	// Log block type distribution
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
	
	// Dispatch event to let other scripts know blocks are loaded
	window.dispatchEvent(new CustomEvent('arenaBlocksLoaded'))
})