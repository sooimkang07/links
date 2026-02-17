/* ---------------- Variables ---------------- */
// I wanted to establish my variables to call later in my functions.
// I first referenced the class site about adding/removing a class to learn how to setup a basic variable. Then, I Googled "how to select multiple elements javascript" and the Google AI Overview mentioned "querySelectorAll", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
// From my understanding, querySelector grabs single elements by ID or class, querySelectorAll grabs multiple elements as a NodeList, and storing them in variables lets me reuse them throughout the script without searching the DOM every time.
let stage = document.querySelector('#canvas')
let filterButtons = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')
let chaosToggle = document.querySelector('#chaosToggle')
let gridDetail = document.querySelector('#gridDetail')
let detailClose = document.querySelector('#detailClose')
let detailTime = document.querySelector('#detailTime')
let detailTitle = document.querySelector('#detailTitle')
let detailText = document.querySelector('#detailText')
let detailLink = document.querySelector('#detailLink')
let detailLearnMore = document.querySelector('#detailLearnMore')
let detailMedia = document.querySelector('#detailMedia')

let timeButtons = []
let activeFilters = new Set(['all'])
let isChaosMode = true
let originalOrder = []


/* ---------------- Countdown ---------------- */
// I wanted to show a full-screen countdown from 11:59:55 PM to 12:00:00 AM on every page load.
// I first referenced the class site about adding/removing a class to learn how to set up a basic variable. Then, I Googled "how to step through elements one at a time javascript" and the Google AI Overview mentioned "setInterval with an index counter", so I looked that up on MDN and then put it all together with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/setInterval
	// https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
// From my understanding, this steps through each p one at a time using a counter, removes .active and adds .done to the outgoing frame so it disappears instantly, then adds .active to the next frame and because both happen in the same JS tick, there's no gap between times. Once the last frame is reached, it clears the interval, waits 3s for the pulse to finish, then adds .hidden to fade the overlay out and .gone to remove it from layout.
let countdownTime = document.querySelector('#countdownTime')

if (countdownTime) {
	let frames = Array.from(countdownTime.querySelectorAll('p'))
	let current = 0

	frames[0].classList.add('active')

	let interval = setInterval(() => {
		frames[current].classList.remove('active')
		frames[current].classList.add('done')
		current++

		if (current < frames.length) {
			frames[current].classList.add('active')
		}

		if (current === frames.length - 1) {
			clearInterval(interval)
			setTimeout(() => {
				countdownTime.classList.add('hidden')
				setTimeout(() => countdownTime.classList.add('gone'), 200)
			}, 3000)
		}
	}, 1000)
}


/* ---------------- Get Block Type ---------------- */
// I needed to categorize what type of content each Arena block is (Remember/See/Hear/Read) so the filters can sort them and the modal can display them correctly later once I reference them based from their filter buttons.
// I first referenced the class recording on if statements for conditionals. Then, I Googled "how to check if string contains text javascript" and the Google AI Overview mentioned "includes method and startsWith method", so I looked those up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
// From my understanding, this grabs all the various type/URL fields from the Arena block data, converts them to lowercase, checks them against patterns to categorize as video/audio, then returns 'Remember' for images, 'See' for videos, 'Hear' for audio, or 'Read' for everything else.
let getArenaBlockKind = (blockData) => {
	let arenaType = blockData.type || ''
	let sourceUrl = (blockData.source && blockData.source.url || '').toLowerCase()
	let attachmentType = (blockData.attachment && blockData.attachment.content_type || '').toLowerCase()
	let embedType = (blockData.embed && blockData.embed.type || '').toLowerCase()

	let isVideo = attachmentType.includes('video') || sourceUrl.includes('youtube') || sourceUrl.includes('vimeo') || embedType == 'video'
	let isAudio = attachmentType.includes('audio') || sourceUrl.includes('spotify') || sourceUrl.includes('soundcloud')

	if (arenaType == 'Image') return 'Remember'
	if (attachmentType.includes('image')) return 'Remember'
	if (isVideo) return 'See'
	if (isAudio) return 'Hear'
	return 'Read'
}


/* ---------------- Get Block Content ---------------- */
// I needed to get all the relevant data from the Arena blocks and organize it so the modal can display the type of content.
// I first watched the class recording when Eric went over arrays. Then, I Googled "how to find item in array by id javascript" and the Google AI Overview mentioned "array.find method", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// From my understanding, this searches window.arenaBlocks for the block with matching ID, extracts all the URLs and content from the block data, determines the block type, builds a content object with all possible media fields, then pulls only the relevant fields based on whether it's an image/video/audio/PDF/text/link and returns that organized content object.
let getBlockContent = (blockId) => {
	let block = window.arenaBlocks.find((entry) => String(entry.id) == String(blockId))
	if (!block) return null

	let blockData = block.data || {}
	let blockType = getArenaBlockKind(blockData)

	let getImageUrl = (imageObj) => {
		if (!imageObj) return null
		return (imageObj.large && imageObj.large.src) || 
		       (imageObj.display && imageObj.display.src) || 
		       (imageObj.thumb && imageObj.thumb.src) || 
		       imageObj.url || null
	}

	let sourceUrl = blockData.source && blockData.source.url || ''
	let attachmentUrl = blockData.attachment && blockData.attachment.url || ''
	let attachmentType = (blockData.attachment && blockData.attachment.content_type || '').toLowerCase()

	let content = {
		time: block.time,
		fontIndex: block.fontIndex,
		title: blockData.title || blockData.generated_title || 'Untitled',
		text: '',
		href: `https://www.are.na/block/${blockData.id}`,
		mediaHref: sourceUrl || attachmentUrl || `https://www.are.na/block/${blockData.id}`,
		imageSrc: null,
		videoSrc: null,
		audioSrc: null,
		pdfSrc: null,
		embedHtml: null,
		mediaType: blockType.toLowerCase(),
		learnMoreUrl: (blockData.type == 'Link' && sourceUrl) ? sourceUrl : null
	}

	if (blockType == 'Remember') {
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.imageSrc || content.href
	}

	if (blockType == 'See') {
		if (attachmentType.includes('video')) content.videoSrc = attachmentUrl
		if (blockData.embed && blockData.embed.html) content.embedHtml = blockData.embed.html
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.videoSrc || content.href
	}

	if (blockType == 'Hear') {
		if (attachmentType.includes('audio')) content.audioSrc = attachmentUrl
		if (blockData.embed && blockData.embed.html) content.embedHtml = blockData.embed.html
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.audioSrc || content.href
	}

	if (attachmentType.includes('pdf')) {
		content.pdfSrc = attachmentUrl || sourceUrl
		content.imageSrc = getImageUrl(blockData.image)
	}

	if (blockData.type == 'Text') {
		let textContent = blockData.content || blockData.description || ''
		content.text = (typeof textContent == 'string') ? textContent : (textContent.plain || textContent.html || '')
		content.imageSrc = getImageUrl(blockData.image)
	}

	if (blockData.type == 'Link') {
		content.mediaHref = sourceUrl || content.href
		content.imageSrc = getImageUrl(blockData.image)
	}

	return content
}


/* ---------------- Render Media ---------------- */
// I needed to insert the correct media elements (images, videos, audio, PDFs, embeds) into the modal based on the block's content type.
// I first referenced the demo file for "specific-block-type rendering."" My audio files weren't working because I wanted the audio player to show alongside their thumbnails, so I saw Michael's slack about how Are.na stores audio files to pull that, and then I Googled "how to create audio element javascript" and the Google AI Overview mentioned "createElement with 'audio'/'video'", so I looked those up on MDN and then confirmed my function with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
	// https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
// From my understanding, this empties the media container, figures out what kind of content the block has, builds the right HTML element for it (image, video, audio, embed, or PDF), and drops it in.
let renderMedia = (content, container) => {
	container.innerHTML = ''
	container.classList.remove('has-audio-cover', 'has-audio-only')

	if (!content) return

	if (content.audioSrc && content.imageSrc) {
		container.classList.add('has-audio-cover')
		let img = document.createElement('img')
		img.src = content.imageSrc
		img.alt = content.title
		let audio = document.createElement('audio')
		audio.src = content.audioSrc
		audio.controls = true
		container.appendChild(img)
		container.appendChild(audio)
		return
	}

	if (content.audioSrc) {
		container.classList.add('has-audio-only')
		let audio = document.createElement('audio')
		audio.src = content.audioSrc
		audio.controls = true
		container.appendChild(audio)
		return
	}

	if (content.videoSrc) {
		let video = document.createElement('video')
		video.src = content.videoSrc
		video.controls = true
		container.appendChild(video)
		return
	}

	if (content.embedHtml) {
		let embedDiv = document.createElement('div')
		embedDiv.innerHTML = content.embedHtml
		container.appendChild(embedDiv)
		return
	}

	if (content.pdfSrc) {
		let iframe = document.createElement('iframe')
		iframe.src = content.pdfSrc
		container.appendChild(iframe)
		return
	}

	if (content.imageSrc) {
		let img = document.createElement('img')
		img.src = content.imageSrc
		img.alt = content.title
		container.appendChild(img)
	}
}


/* ---------------- Open Detail Modal ---------------- */
// I needed to open the modal dialog with the block's content when you click a time button, filling it in with the correct data and media.
// I first referenced the class site's section about opening a modal. Then, I Googled "how to open html dialog element" and the Google AI Overview mentioned "showModal method", so I looked that up on MDN and then confirmed my function was written correctly with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
// From my understanding, this gets the block content using the blockId, fills the modal's time/title/text fields with that content, shows or hides the "Learn More" link depending on whether it's a Link type, calls renderMedia to display any images/videos/audio in the modal, then opens the modal using showModal().
let openDetail = (blockId) => {
	let content = getBlockContent(blockId)
	if (!content || !gridDetail) return

	if (detailTime) {
		detailTime.textContent = content.time || ''
		detailTime.dataset.fontIndex = content.fontIndex || '1'
	}

	if (content.text) {
		if (detailTitle) detailTitle.classList.add('hidden')
		if (detailText) {
			detailText.innerHTML = content.text
			detailText.classList.remove('hidden')
			detailText.classList.add('text-block')
		}
	} else {
		if (detailTitle) {
			detailTitle.classList.remove('hidden')
			detailTitle.textContent = content.title
		}
		if (detailText) {
			detailText.innerHTML = ''
			detailText.classList.add('hidden')
			detailText.classList.remove('text-block')
		}
	}

	if (detailLink) detailLink.href = content.href

	if (detailLearnMore) {
		if (content.learnMoreUrl) {
			detailLearnMore.classList.remove('hidden')
			detailLearnMore.href = content.learnMoreUrl
			if (detailMedia) detailMedia.classList.add('has-learn-more')
		} else {
			detailLearnMore.classList.add('hidden')
			if (detailMedia) detailMedia.classList.remove('has-learn-more')
		}
	}

	if (detailMedia) renderMedia(content, detailMedia)

	gridDetail.showModal()
}


/* ---------------- Close Detail Modal ---------------- */
// I needed to close the modal dialog when the user clicks the close button.
// I first referenced the class site's section about event listeners.
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close
// From my understanding, this calls the dialog's close() method which closes the modal.
if (detailClose) {
	detailClose.addEventListener('click', () => {
		if (gridDetail) gridDetail.close()
	})
}


/* ---------------- Apply Filter ---------------- */
// I wanted to handle filter button clicks to show/hide time buttons based on which filters are active.
// I Googled "javascript set add remove check item" and the Google AI Overview mentioned "has/add/delete methods", so I looked those up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// From my understanding, this tracks which filters are active in a Set, clears it and adds 'all' if All is clicked, otherwise toggles that filter on or off, then updates the active class on filter buttons and shows or hides time buttons to match.
let applyFilter = (filterType) => {
	if (filterType == 'all') {
		activeFilters.clear()
		activeFilters.add('all')
	} else {
		activeFilters.delete('all')
		if (activeFilters.has(filterType)) {
			activeFilters.delete(filterType)
			if (activeFilters.size == 0) activeFilters.add('all')
		} else {
			activeFilters.add(filterType)
		}
	}

	filterButtons.forEach((btn) => {
		btn.classList.toggle('active', activeFilters.has(btn.dataset.filter))
	})

	timeButtons.forEach((btn) => {
		let blockType = btn.dataset.type || 'Read'
		btn.classList.toggle('hidden', !activeFilters.has('all') && !activeFilters.has(blockType))
	})
}


/* ---------------- Bind Filter Buttons ---------------- */
// I needed to attach click event listeners to all the filter buttons so they trigger the applyFilter function when clicked.
// I first referenced the class site's section about forEach loops. Then, I Googled "how to add event listener to multiple buttons javascript ES6+" and the Google AI Overview mentioned "querySelectorAll with forEach", so I looked those up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
// From my understanding, this queries all filter buttons and loops through them with forEach, adding a click listener to each one that calls applyFilter with that button's filter value.
let bindFilterButtons = () => {
	filterButtons = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')
	filterButtons.forEach((btn) => {
		btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
	})
}


/* ---------------- Toggle Chaos Mode ---------------- */
// I wanted to let users toggle between chaos mode (shuffled random order) and calm mode (chronological 12:00-3:59 order) so they can either explore randomly or browse chronologically.
// I first referenced the class site's section about arrays and loops. Then, I Googled "how to shuffle array javascript" and the Google AI Overview mentioned "sort with Math.random", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// From my understanding, this flips between chaos and calm mode, updates the button label, then either scrambles all the time buttons into a random order or puts them back in chronological order.
let toggleChaos = () => {
	isChaosMode = !isChaosMode
	chaosToggle.textContent = isChaosMode ? 'Calm' : 'Chaos'
	
	let timeGrid = document.querySelector('#timeGrid')
	if (!timeGrid) return

	if (isChaosMode) {
		let buttons = Array.from(timeGrid.children)
		let shuffled = buttons.sort(() => Math.random() - 0.5)
		timeGrid.innerHTML = ''
		shuffled.forEach(btn => timeGrid.appendChild(btn))
	} else {
		if (originalOrder.length == 0) {
			originalOrder = Array.from(timeGrid.children).sort((a, b) => {
				return a.dataset.time.localeCompare(b.dataset.time)
			})
		}
		timeGrid.innerHTML = ''
		originalOrder.forEach(btn => timeGrid.appendChild(btn))
	}
}

if (chaosToggle) {
	chaosToggle.addEventListener('click', toggleChaos)
}


/* ---------------- Bind Time Buttons ---------------- */
// I needed to attach click event listeners to all the time buttons after they're created so they open the modal when clicked.
// I referenced the class recording about querySelectorAll and forEach. 
// From my understanding, this queries all elements with class 'time', converts the NodeList to an array, stores it in timeButtons variable, then loops through each button and attaches a click listener that calls openDetail with that button's block ID.
let bindTimeButtons = () => {
	timeButtons = Array.from(document.querySelectorAll('.time'))
	timeButtons.forEach((btn) => {
		btn.addEventListener('click', () => openDetail(btn.dataset.block))
	})
}


/* ---------------- Back to Top Button ---------------- */
// I wanted to show/hide the back-to-top button based on scroll position, only visible when scrolled down past the header section.
// I first referenced the class site's section about "Watching for Scrolling". Then, I Googled "how to detect element visibility javascript" and the Google AI Overview mentioned "IntersectionObserver API", so I looked that up on MDN and confirmed my function with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
	// https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
// From my understanding, this sets up variables for the button and header section, then creates an IntersectionObserver that watches the header - when the header is intersecting (visible in viewport) it removes the 'visible' class from the button to hide it, and when the header is not intersecting (scrolled past) it adds the 'visible' class to show the button.
let visibleClass = 'visible'
let backToTopBtn = document.querySelector('#backToTop')
let headerSection = document.querySelector('main > section:first-of-type')

if (backToTopBtn && headerSection) {
	let backToTopObserver = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) {
			backToTopBtn.classList.remove(visibleClass)
		} else {
			backToTopBtn.classList.add(visibleClass)
		}
	})
	backToTopObserver.observe(headerSection)
}

// I wanted the back-to-top button to smoothly scroll the page back to the top when clicked.
// I first referenced the class site's section about scrollTo. Then, I Googled "how to smooth scroll to top javascript" and the Google AI Overview mentioned "scrollTo with behavior smooth", so I looked that up on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo
// From my understanding, this checks if both the button and stage exist, then attaches a click listener that calls stage.scrollTo with top: 0 to scroll to the top and behavior: 'smooth' to animate the scroll.
if (backToTopBtn && stage) {
	backToTopBtn.addEventListener('click', () => {
		stage.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	})
}


/* ---------------- Initialize on Blocks Loaded ---------------- */
// I needed to wait until arena.js finishes fetching and creating all the time buttons before setting up event listeners and applying filters.
// I first referenced the class site's section about custom events. Then, I Googled "how to listen for custom event javascript" and the Google AI Overview mentioned "addEventListener with custom event name", so I looked that up on MDN and confirmed my function with Claude:
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
	// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
// From my understanding, this listens for the 'arenaBlocksLoaded' custom event that arena.js fires when it's done, then calls bindTimeButtons to attach click listeners, bindFilterButtons to set up filters, applyFilter to show all buttons initially, and does an initial shuffle since we start in chaos mode.
window.addEventListener('arenaBlocksLoaded', () => {
	bindTimeButtons()
	bindFilterButtons()
	applyFilter('all')
	
	let timeGrid = document.querySelector('#timeGrid')
	if (timeGrid && isChaosMode) {
		originalOrder = Array.from(timeGrid.children)
		let buttons = Array.from(timeGrid.children)
		let shuffled = buttons.sort(() => Math.random() - 0.5)
		timeGrid.innerHTML = ''
		shuffled.forEach(btn => timeGrid.appendChild(btn))
	}
})