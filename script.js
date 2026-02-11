// DISCLAIMER: 
// I know this is a lot more .js than we went over in class and that we really needed for this submission, but I really wanted to get as much done of this project as possible while I had the time this week because I know I’m going to be absolutely slammed juggling work + school next week. So I won’t have as much time right before this deadline to work out the nitty gritty edits (css styling, cool js effects, etc.). So I tried doing as much as I could from the limited js functions we learned in class and of course with the help of Claude and a little bit of Cursor. My main approach to this would be to google in--human--words of what I wanted to do, and the Google AI popup usually would help me identify key words/terms that I could then try to look up on MDN and then I'd try to piece together one-by-one the different components of the function that I needed, and whatever I couldn't figure out, I'd ask Claude to oversee and revise. If this falls outside the scope of the assignment, I’m happy to pull back. I just really want to be able to use at least one of my projects from this class for my portfolio, and I was hoping to showcase this one. 

// ALSO TO NOTE: THE CURRENT ARE.NA CHANNEL DOESN’T HAVE THE NECESSARY 240 BLOCKS FOR THE CONCEPTUAL THEME OF MY SITE BUT I’M HOLDING OFF COMMITTING TO SUCH A TEDIOUS TASK OF ADDING THAT MANY BEFORE GETTING FEEDBACK FROM MY PEERS ON WHETHER THIS IDEA LANDS/MAKES SENSE (So for now, I have the blocks just repeat to make up the 240 blocks currently on the site).


// I'm setting all the variables I need for the functions below as we learned in class. So for example, with the first line, I'm assigning the variable "stage" to the element with id="canvas" so it can be referenced in the functions below.

/* ---------------- Variable Setups ---------------- */
let stage = document.querySelector("#canvas")
let viewport = document.querySelector("#viewport")

let toggle = document.querySelector("#viewToggle")
let zoomInBtn = document.querySelector("#zoomIn")
let zoomOutBtn = document.querySelector("#zoomOut")
let goToNowBtn = document.querySelector("#goToNow")
let filterButtons = document.querySelectorAll("#gridFilters .filter-btn")
let timeSearchInput = document.querySelector("#timeSearchInput")
let searchToggle = document.querySelector("#searchToggle")
let headerSearch = document.querySelector("#headerSearch")
let searchOverlay = document.querySelector("#searchOverlay")

let dialog = document.querySelector("#modal")
let modalClose = document.querySelector("#modalClose")
let modalTime = document.querySelector("#modalTime")
let modalTitle = document.querySelector("#modalTitle")
let modalText = document.querySelector("#modalText")
let modalLink = document.querySelector("#modalLink")
let modalMediaLink = document.querySelector("#modalMediaLink")
let modalImage = document.querySelector("#modalImage")
let modalMedia = document.querySelector("#modalMedia")

// Grid detail view elements with 
let gridDetail = document.querySelector("#gridDetail")
let detailClose = document.querySelector("#detailClose")
let detailTime = document.querySelector("#detailTime")
let detailTitle = document.querySelector("#detailTitle")
let detailText = document.querySelector("#detailText")
let detailLink = document.querySelector("#detailLink")
let detailMediaLink = document.querySelector("#detailMediaLink")
let detailImage = document.querySelector("#detailImage")
let detailMedia = document.querySelector("#detailMedia")

let timeButtons = []
let lastFocusedEl = null

let isGridView = false

let scale = 1
let MIN_SCALE = 0.6
let MAX_SCALE = 2.5
let zoomInCount = 0
let zoomOutCount = 0
let MAX_ZOOM_CLICKS = 2

let isPanning = false
let startX = 0
let startY = 0
let startScrollLeft = 0
let startScrollTop = 0

let isSearchUiActive = false
let isPanelDimActive = false

/* ---------------- Overlay State Helpers ---------------- */
// I wanted one source of truth for body dimming so search, modal, and aside all feel consistent.
// I referenced class toggling and the hidden attribute on MDN:
// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden
// From my understanding, this computes whether the UI should be dimmed, toggles body classes, and enables/disables the overlay click layer.
function syncDimOverlay() {
	const shouldDim = isSearchUiActive || isPanelDimActive
	document.body.classList.toggle('search-active', shouldDim)
	document.body.classList.toggle('panel-active', isPanelDimActive)
	if (searchOverlay) {
		searchOverlay.hidden = !shouldDim
		searchOverlay.style.pointerEvents = shouldDim ? 'auto' : 'none'
	}
}

// I wanted panel-open state updates to stay DRY and always re-run the same overlay sync logic.
// I referenced Boolean casting and utility-style helper functions:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
// From my understanding, this helper normalizes any truthy/falsy input into a real boolean and then refreshes shared dimming state.
function setPanelDimState(nextState) {
	isPanelDimActive = Boolean(nextState)
	syncDimOverlay()
}

// Normalize Are.na block type to match your filter labels
// Remember: image media content
// See: video media content
// Hear: audio media content
// Read: PDFs, text-content, hyperlinks
// I wanted all category labels on the site to match Are.na content reliably.
// I referenced MDN string helpers and regex docs:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// From my understanding, this classifier inspects type/content hints (mime, URL, filename, embed type) and maps each block to Remember/See/Hear/Read.
function getArenaBlockKind(blockData) {
	const arenaType = blockData.type || ''
	const sourceUrl = (blockData.source?.url || '').toLowerCase()
	const attachmentContentType = (blockData.attachment?.content_type || '').toLowerCase()
	const attachmentUrl = (blockData.attachment?.url || '').toLowerCase()
	const attachmentFilename = (blockData.attachment?.file_name || '').toLowerCase()
	const embedType = (blockData.embed?.type || '').toLowerCase()

	// See (Videos)
	const videoExtensions = /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i
	const isVideo = (
		attachmentContentType.startsWith('video/') ||
		videoExtensions.test(sourceUrl) ||
		videoExtensions.test(attachmentUrl) ||
		videoExtensions.test(attachmentFilename) ||
		sourceUrl.includes('youtube.com') ||
		sourceUrl.includes('youtu.be') ||
		sourceUrl.includes('vimeo.com') ||
		sourceUrl.includes('tiktok.com') ||
		embedType === 'video'
	)

	// Hear (Audios)
	const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i
	const isAudio = (
		attachmentContentType.startsWith('audio/') ||
		audioExtensions.test(sourceUrl) ||
		audioExtensions.test(attachmentUrl) ||
		audioExtensions.test(attachmentFilename) ||
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

	// Remember (Images)
	if (arenaType === 'Image') return 'Remember'
	if (attachmentContentType.startsWith('image/')) return 'Remember'

	// See/Hear
	if (isVideo) return 'See'
	if (isAudio) return 'Hear'

	// Read (PDFs, Text, Links)
	return 'Read'
}



/* ---------------- Get Are.na Block Content ---------------- */
// I wanted one parser function that can read different Are.na block shapes and return a normalized object for rendering.
// I referenced optional chaining and object access patterns on MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
// From my understanding, this builds one consistent content payload (title/text/media URLs/type) so the modal and aside can use the same render path.
function getBlockContent(blockId) {
	const block = window.arenaBlocks?.find(b => b.id == blockId)
	if (!block) {
		console.error('Block not found:', blockId)
		return null
	}

	const blockData = block.data
	console.log('=== BLOCK DATA DEBUG ===')
	console.log('Block ID:', blockId)
	console.log('Block Type:', blockData.type || blockData.class)
	console.log('Full Block Data:', blockData)
	console.log('Image Object:', blockData.image)
	console.log('Source Object:', blockData.source)
	console.log('Attachment Object:', blockData.attachment)
	if (blockData.attachment) {
		console.log('Attachment URL:', blockData.attachment.url)
		console.log('Attachment Content Type:', blockData.attachment.content_type)
	}
	console.log('=======================')

	// I wanted text blocks to gracefully support either plain strings or nested text payloads.
	// I referenced runtime type checks and fallback chaining:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
	// From my understanding, this returns the first usable text candidate and prevents crashes when content structure varies between blocks.
	const readTextValue = (value) => {
		if (!value) return ''
		if (typeof value === 'string') return value
		if (typeof value === 'object') return value.plain || value.markdown || value.html || ''
		return ''
	}

	// Helper function to get image URL from Are.na image object
	// I wanted image extraction to be resilient because Are.na can expose different image sizes/keys.
	// I referenced object property access and short-circuit fallbacks:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
	// From my understanding, this tries preferred image sources in order and returns the first valid URL for display.
	const getImageUrl = (imageObj) => {
		if (!imageObj) return null

		const url = imageObj.large?.src ||
			imageObj.display?.src ||
			imageObj.medium?.src ||
			imageObj.square?.src ||
			imageObj.thumb?.src ||
			imageObj.original?.src ||
			imageObj.large?.url ||
			imageObj.display?.url ||
			imageObj.square?.url ||
			imageObj.thumb?.url ||
			imageObj.original?.url ||
			imageObj.url ||
			imageObj.src ||
			(typeof imageObj === 'string' ? imageObj : null)

		return url
	}

	const sourceUrl = blockData.source?.url || ''
	const attachmentUrl = blockData.attachment?.url || ''
	const attachmentType = (blockData.attachment?.content_type || '').toLowerCase()
	const attachmentFilename = (blockData.attachment?.file_name || '').toLowerCase()
	const blockType = getArenaBlockKind(blockData)

	const content = {
		time: block.time,
		title: blockData.title || blockData.generated_title || 'Untitled',
		text: '',
		href: `https://www.are.na/block/${blockData.id}`,
		mediaHref: sourceUrl || attachmentUrl || `https://www.are.na/block/${blockData.id}`,
		imageSrc: null,
		videoSrc: null,
		audioSrc: null,
		pdfSrc: null,
		embedHtml: null,
		mediaType: null
	}

	if (blockType === 'Remember') {
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.imageSrc || content.href
		content.mediaType = 'image'
	}
	else if (blockType === 'See') {
		const videoExtensions = /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i

		if (attachmentType.startsWith('video/') || videoExtensions.test(attachmentUrl)) {
			content.videoSrc = attachmentUrl
		}
		if (!content.videoSrc && videoExtensions.test(sourceUrl)) {
			content.videoSrc = sourceUrl
		}

		if (blockData.embed?.html) content.embedHtml = blockData.embed.html
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.videoSrc || content.href
		content.mediaType = 'video'
	}
	else if (blockType === 'Hear') {
		const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i

		if (attachmentType.startsWith('audio/') || audioExtensions.test(attachmentUrl) || audioExtensions.test(attachmentFilename)) {
			content.audioSrc = attachmentUrl
		}
		if (!content.audioSrc && audioExtensions.test(sourceUrl)) {
			content.audioSrc = sourceUrl
		}
		if (!content.audioSrc && sourceUrl.includes('/audio/')) {
			content.audioSrc = sourceUrl
		}
		if (!content.audioSrc && attachmentUrl) {
			content.audioSrc = attachmentUrl
		}

		if (blockData.embed?.html) content.embedHtml = blockData.embed.html
		content.imageSrc = getImageUrl(blockData.image)
		content.mediaHref = sourceUrl || content.audioSrc || content.href
		content.mediaType = 'audio'
	}
	else {
		if (attachmentType.includes('pdf') || /\.pdf(\?|$)/i.test(sourceUrl) || /\.pdf(\?|$)/i.test(attachmentUrl)) {
			content.pdfSrc = attachmentUrl || sourceUrl
			content.mediaType = 'pdf'
		}
		else if (blockData.type === 'Text') {
			content.mediaType = 'text'
			content.text = readTextValue(blockData.content) || readTextValue(blockData.description) || ''
		}
		else if (blockData.type === 'Link') {
			content.mediaType = 'link'
			content.mediaHref = sourceUrl || content.href
		}
		else if (blockData.embed?.html) {
			content.embedHtml = blockData.embed.html
			content.mediaType = 'embed'
		}
		else {
			content.mediaType = 'reading'
		}

		if (!content.imageSrc) content.imageSrc = getImageUrl(blockData.image)
	}

	console.log('Processed content:', content)
	console.log('Final imageSrc:', content.imageSrc)
	console.log('Final videoSrc:', content.videoSrc)
	console.log('Final audioSrc:', content.audioSrc)
	return content
}

/* ---------------- Centering Canvas ---------------- */
// After every refresh, I wanted the user to be returned to the default beginning position centered in the canvas, so they're not lost somewhere random on load.
// I referenced a mix of articles to understand this: 
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
	// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
// From my understanding, this function calculates the center of the giant 300vw x 300vh canvas and programmatically scrolls the main container so the visible viewport lines up with that center, while accounting for the current zoom level.
function centerCanvas() {
	if (isGridView) return

	requestAnimationFrame(() => {
		const fieldW = window.innerWidth * 3
		const fieldH = window.innerHeight * 3

		const targetLeft = (fieldW * 0.5 * scale) - (stage.clientWidth * 0.5)
		const targetTop = (fieldH * 0.5 * scale) - (stage.clientHeight * 0.5)

		stage.scrollLeft = targetLeft
		stage.scrollTop = targetTop
	})
}

// Function to center on a specific time button
// I wanted direct navigation to a selected minute without manually dragging around.
// I referenced dataset usage and requestAnimationFrame timing:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
// From my understanding, this converts stored percentage coordinates to pixel scroll positions (with zoom scale applied) and centers that block in view.
function centerOnTime(timeButton) {
	if (isGridView || !timeButton) return

	const top = parseFloat(timeButton.dataset.top)
	const left = parseFloat(timeButton.dataset.left)

	requestAnimationFrame(() => {
		const fieldW = window.innerWidth * 3
		const fieldH = window.innerHeight * 3

		// Convert vh/vw to pixels and account for scale
		const targetLeftPx = (left / 100) * fieldW * scale
		const targetTopPx = (top / 100) * fieldH * scale

		// Center the button in the viewport
		stage.scrollLeft = targetLeftPx - (stage.clientWidth * 0.5)
		stage.scrollTop = targetTopPx - (stage.clientHeight * 0.5)
	})
}

// Function to find and center on current time
// I wanted a quick "jump to now" interaction for the midnight-to-4am range.
// I referenced Date APIs and array searching:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// From my understanding, this formats the current time, finds the matching button, centers it, and applies a temporary pulse highlight.
function goToCurrentTime() {
	if (isGridView) return

	const now = new Date()
	const hours = now.getHours()
	const minutes = now.getMinutes()

	// Only works for times between 00:00 and 03:59
	if (hours >= 4) {
		alert('Current time is outside the midnight to 4am range!')
		return
	}

	const currentTimeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
	
	// Find the button with this time
	const targetButton = Array.from(timeButtons).find(btn => btn.dataset.time === currentTimeString)
	
	if (targetButton) {
		centerOnTime(targetButton)
		
		// Add pulse animation - scale larger and pulse slower
		targetButton.style.transition = 'transform 1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 1s cubic-bezier(0.4, 0, 0.2, 1)'
		targetButton.style.transform = 'scale(1.5)'
		
		// Add pulsing glow effect
		const originalBoxShadow = targetButton.style.boxShadow
		targetButton.style.boxShadow = '0 0 0 0 rgba(117,190,176,0.9)'
		
		// Animate the pulse - slower expansion
		setTimeout(() => {
			targetButton.style.boxShadow = '0 0 0 30px rgba(117,190,176,0)'
		}, 100)
		
		// Reset after animation
		setTimeout(() => {
			targetButton.style.transform = ''
			targetButton.style.boxShadow = originalBoxShadow
		}, 2000)
	}
}

if (goToNowBtn) goToNowBtn.addEventListener("click", goToCurrentTime)



/* ---------------- Zoom Controls ---------------- */
// I wanted users to be able to zoom using buttons as well as trackpad gestures for better accessibility.
// I referenced basic DOM manipulation and click events: https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
// From my understanding, these button handlers increment or decrement the scale value, apply it to the viewport transform, and recenter the canvas to maintain focus.
// I wanted zoom-in to feel controlled (not infinite), especially for usability on dense canvases.
// I also referenced clamping with Math.min and guarding repeated interactions:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
// From my understanding, this increases scale in steps, enforces upper bounds/click limits, and keeps the canvas recentered.
function zoomIn() {
	if (isGridView) return
	if (zoomInCount >= MAX_ZOOM_CLICKS) return // Limit zoom amount to 2 clicks
	const next = Math.min(MAX_SCALE, scale + 0.2)
	if (next === scale) return
	scale = next
	zoomInCount++
	// Disable further zooming out if we're at the limit
	if (zoomOutCount > 0) zoomOutCount--
	viewport.style.transform = `scale(${scale})`
	setTimeout(centerCanvas, 50)
}

// I wanted zoom-out behavior to mirror zoom-in and keep the experience constrained and predictable.
// I referenced transform scaling concepts:
// https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/scale
// From my understanding, this decreases scale in fixed increments, enforces min limits, tracks click caps, and recenters after changing zoom.
function zoomOut() {
	if (isGridView) return
	if (zoomOutCount >= MAX_ZOOM_CLICKS) return // Limit zoom amount to 2 clicks
	const next = Math.max(MIN_SCALE, scale - 0.2)
	if (next === scale) return
	scale = next
	zoomOutCount++
	// Disable further zooming in if we're at the limit
	if (zoomInCount > 0) zoomInCount--
	viewport.style.transform = `scale(${scale})`
	setTimeout(centerCanvas, 50)
}

if (zoomInBtn) zoomInBtn.addEventListener("click", zoomIn)
if (zoomOutBtn) zoomOutBtn.addEventListener("click", zoomOut)


/* ---------------- Canvas/Grid View Toggle ---------------- */
// I wanted the user to be able to switch between a freeform canvas experience and a more structured grid layout depending on how they want to explore the content.
// I referenced how class toggling works in JS: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this function flips the isGridView boolean, adds or removes the .grid class on main, updates the button text, and resets zoom when switching into grid view.
function setView(nextIsGridView) {
	isGridView = nextIsGridView

	stage.classList.toggle("grid", isGridView)

	document.body.classList.toggle('calm-mode', isGridView)
	document.body.classList.toggle('chaos-mode', !isGridView)

	toggle.classList.toggle("active", !isGridView)
	toggle.textContent = isGridView ? "Chaos" : "Calm"

	// Search is only visible + active in calm mode
	if (!isGridView) {
		closeSearchUI()
		closeGridDetail()
	}

	if (isGridView && dialog.open) {
		closeDialog()
	}

	if (isGridView) {
		scale = 1
		zoomInCount = 0
		zoomOutCount = 0
		if (viewport) viewport.style.transform = "scale(1)"
		// Scroll to top when entering grid view
		stage.scrollTop = 0
		stage.scrollLeft = 0
		return
	}

	setTimeout(centerCanvas, 50)
}

toggle.addEventListener("click", () => setView(!isGridView))


/* ---------------- Dialog Modal / Opening + Closing ---------------- */
// I wanted each time block to open a side panel with its own content instead of navigating away from the canvas.
// I wanted the modal to slide in from the left and push the entire canvas to the left in canvas view, creating a split-screen effect like the Palmer Dinnerware site. In grid view, the modal appears normally without pushing content.
// I referenced the native dialog element and modal behavior: // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
// From my understanding, openDialog() pulls the correct content from the Are.na blocks using the block ID, fills in the modal text/image/link, adds a class to create the split-screen effect only in canvas view, and then opens the dialog.
function openDialog(blockId) {
	const content = getBlockContent(blockId)
	if (!content) return

	// In grid mode, use the side detail panel
	if (isGridView) {
		detailTime.textContent = content.time

		if (content.mediaType === 'text') {
			detailTitle.style.display = 'none'
			detailText.innerHTML = content.text || ''
			detailText.style.display = content.text ? 'block' : 'none'
			detailText.classList.add('text-block')
		} else {
			detailTitle.textContent = content.title
			detailTitle.style.display = 'block'
			detailText.innerHTML = ''
			detailText.style.display = 'none'
			detailText.classList.remove('text-block')
		}

		detailLink.href = content.href
		
		// Show "Learn More" button for link blocks
		if (content.mediaType === 'link' && content.mediaHref) {
			const learnMoreBtn = document.getElementById('detailLearnMore')
			if (learnMoreBtn) {
				learnMoreBtn.href = content.mediaHref
				learnMoreBtn.style.display = 'inline-block'
			}
		} else {
			const learnMoreBtn = document.getElementById('detailLearnMore')
			if (learnMoreBtn) learnMoreBtn.style.display = 'none'
		}

		// Render media
		if (detailMedia) renderMedia(content, detailMedia)

		gridDetail.classList.add('active')
		setPanelDimState(true)
		return
	}

	// In canvas mode, use the existing modal
	lastFocusedEl = document.activeElement

	modalTime.textContent = content.time

	if (content.mediaType === 'text') {
		modalTitle.style.display = 'none'
		modalText.innerHTML = content.text || ''
		modalText.style.display = content.text ? 'block' : 'none'
		modalText.classList.add('text-block')
	} else {
		modalTitle.style.display = 'block'
		modalTitle.textContent = content.title
		modalText.innerHTML = ''
		modalText.style.display = 'none'
		modalText.classList.remove('text-block')
	}
	
	modalLink.href = content.href
	
	// Show "Learn More" button for link blocks
	if (content.mediaType === 'link' && content.mediaHref) {
		const learnMoreBtn = document.getElementById('modalLearnMore')
		if (learnMoreBtn) {
			learnMoreBtn.href = content.mediaHref
			learnMoreBtn.style.display = 'inline-block'
		}
	} else {
		const learnMoreBtn = document.getElementById('modalLearnMore')
		if (learnMoreBtn) learnMoreBtn.style.display = 'none'
	}

	// Render media
	if (modalMedia) renderMedia(content, modalMedia)

	// Add split-screen effect only in canvas view
	stage.classList.add('modal-open')
	
	dialog.classList.remove("closing")
	dialog.showModal()
	modalClose.focus()
	setPanelDimState(true)
}


// I wanted the modal to slide out smoothly instead of instantly disappearing, and for the canvas to return to full width.
// I referenced timing UI animations with JS: // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, this adds a closing class to trigger the CSS animation, removes the split-screen effect, waits for the animation to finish, then actually closes the dialog.
function closeDialog() {
	if (!dialog.open) {
		setPanelDimState(gridDetail.classList.contains('active'))
		return
	}

	dialog.classList.add("closing")
	
	// Remove split-screen effect
	setTimeout(() => {
		stage.classList.remove('modal-open')
	}, 200)
	
	window.setTimeout(() => {
		dialog.close()
		dialog.classList.remove("closing")
		setPanelDimState(gridDetail.classList.contains('active'))
	}, 400)
}

// Close grid detail view (grid mode)
// I wanted a tiny dedicated closer for calm-mode aside so close behavior stays reusable.
// I referenced class removal/toggle patterns from class examples and MDN classList docs:
// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this hides the aside and immediately recalculates overlay state in case a modal is still open.
function closeGridDetail() {
	gridDetail.classList.remove('active')
	setPanelDimState(dialog.open)
}


/* ---------------- Modal Event Handling ---------------- */
// I wanted each time button to open its corresponding modal content.
// Since the time buttons are now dynamically generated from Are.na, I need to wait for them to load before attaching event listeners.
// I referenced addEventListener and dataset usage:
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
// From my understanding, this listens for the custom 'arenaBlocksLoaded' event dispatched by arena.js, then loops through all the generated time buttons and uses the data-block value (which is the Are.na block ID) as a key to open the correct modal content.
window.addEventListener('arenaBlocksLoaded', () => {
	timeButtons = document.querySelectorAll("#timeGrid button")
	
	timeButtons.forEach((btn) => {
		btn.addEventListener("click", () => openDialog(btn.dataset.block))
	})
})


// I wanted users to be able to close the modal in multiple intuitive ways (close button, clicking backdrop, escape key).
// I referenced dialog events: // https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
// From my understanding, these listeners cover all the standard dismissal patterns and restore focus when the modal closes.
modalClose.addEventListener("click", closeDialog)

// Close dialog when clicking outside the inner div
dialog.addEventListener("click", (event) => {
	// Check if the click is directly on the dialog (backdrop), not on its children
	if (event.target === dialog) {
		closeDialog()
	}
})

dialog.addEventListener("cancel", (event) => {
	event.preventDefault()
	closeDialog()
})

dialog.addEventListener("close", () => {
	if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
		lastFocusedEl.focus()
	}
	setPanelDimState(gridDetail.classList.contains('active'))
})

// Grid detail view close handler
if (detailClose) {
	detailClose.addEventListener("click", closeGridDetail)
}


/* ---------------- Filter Controls ---------------- */
// I wanted users to be able to filter blocks by type (Image, Link, Text, Attachment, Embed) to explore specific content in grid view only.
// Updated to allow multiple simultaneous filter selections
// I referenced classList manipulation and event delegation: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, clicking a filter button shows/hides time buttons based on their block type, and updates the active state styling.

let activeFilters = new Set(['all'])

// I wanted one normalization map so older/new filter labels still resolve to the current taxonomy.
// I referenced object lookup table patterns:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
// From my understanding, this converts incoming button labels into canonical Remember/See/Hear/Read values before filtering logic runs.
function normalizeFilterValue(filterValue) {
	const map = {
		all: 'all',
		Images: 'Remember',
		Videos: 'See',
		Audio: 'Hear',
		Readings: 'Read',
		Remember: 'Remember',
		See: 'See',
		Hear: 'Hear',
		Read: 'Read'
	}
	return map[filterValue] || filterValue
}

// Filter functionality
// I wanted multi-select filtering in calm mode without duplicating UI state logic.
// I referenced Set operations and forEach loops:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
// From my understanding, this toggles active filter values, syncs active button styling, and conditionally hides/shows time buttons by dataset type.
function applyFilter(filterType) {
	const normalizedFilter = normalizeFilterValue(filterType)

	// Toggle filter on/off
	if (normalizedFilter === 'all') {
		activeFilters.clear()
		activeFilters.add('all')
	} else {
		activeFilters.delete('all')
		if (activeFilters.has(normalizedFilter)) {
			activeFilters.delete(normalizedFilter)
			// If no filters selected, revert to 'all'
			if (activeFilters.size === 0) {
				activeFilters.add('all')
			}
		} else {
			activeFilters.add(normalizedFilter)
		}
	}
	
	// Update active button states
	filterButtons.forEach(btn => {
		const btnFilter = normalizeFilterValue(btn.dataset.filter)
		btn.classList.toggle('active', activeFilters.has(btnFilter))
	})

	// Show/hide time buttons based on active filters
	timeButtons.forEach(btn => {
		const blockType = btn.dataset.type || 'Read'

		if (activeFilters.has('all')) {
			btn.style.display = ''
		} else {
			// Show if block type matches any active filter
			const shouldShow = activeFilters.has(blockType)
			btn.style.display = shouldShow ? '' : 'none'
		}
	})
}

// Attach filter button listeners after blocks load
window.addEventListener('arenaBlocksLoaded', () => {
	filterButtons = document.querySelectorAll("#gridFilters .filter-btn")
	
	filterButtons.forEach(btn => {
		btn.addEventListener("click", () => {
			applyFilter(btn.dataset.filter)
		})
	})
})


/* ---------------- Time Search Functionality ---------------- */
// Search for a specific time and highlight it with a pulse animation
// I wanted users to jump directly to a minute and get clear visual feedback they found the right block.
// I referenced regex matching, scrollIntoView, and dynamic style injection:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
// From my understanding, this validates a time string, finds the matching button, moves to it, runs a pulse animation, then closes the search UI.
function searchTime() {
	const searchValue = timeSearchInput?.value.trim()
	
	if (!searchValue) {
		closeSearchUI()
		return
	}
	
	// Validate time format (HH:MM where HH is 0-3 and MM is 00-59)
	const timeRegex = /^([0-3]?\d):([0-5]\d)$/
	const match = searchValue.match(timeRegex)
	
	if (!match) {
		alert('Please enter a valid time between 00:00 and 03:59 (e.g., 2:32)')
		closeSearchUI()
		return
	}
	
	const hours = String(parseInt(match[1], 10)).padStart(2, '0')
	const minutes = match[2]
	const searchTimeString = `${hours}:${minutes}`
	
	// Check if hour is within range
	if (parseInt(hours, 10) > 3) {
		alert('Time must be between 00:00 and 03:59')
		closeSearchUI()
		return
	}
	
	// Find the button with this time
	const targetButton = Array.from(timeButtons).find(btn => btn.dataset.time === searchTimeString)
	
	if (targetButton) {
		// Scroll to the button
		if (isGridView) {
			targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
		} else {
			centerOnTime(targetButton)
		}
		
		// Add CSS animation for multiple pulses
		const style = document.createElement('style')
		style.id = 'pulse-animation'
		if (!document.getElementById('pulse-animation')) {
			style.textContent = `
				@keyframes pulse-scale {
					0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(117,190,176,0); }
					50% { transform: scale(1.5); box-shadow: 0 0 0 40px rgba(117,190,176,0); }
				}
				.pulsing {
					animation: pulse-scale 3.6s ease-in-out 2;
				}
			`
			document.head.appendChild(style)
		}
		
		// Add pulsing class
		targetButton.classList.add('pulsing')
		
		// Remove class after animation completes
		setTimeout(() => {
			targetButton.classList.remove('pulsing')
		}, 7600)
	} else {
		alert(`No content found for time ${searchTimeString}`)
	}

	// Enter removes dim overlay for search
	closeSearchUI()
}


/* ---------------- Search UI (Header) ---------------- */
// I wanted a single opener for search interactions so click/focus paths behave identically.
// I referenced focus management and class toggling:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this only activates search in calm mode, expands the search UI, and syncs shared dim overlay state.
function openSearchUI() {
	if (!headerSearch) return
	if (!isGridView) return
	isSearchUiActive = true
	headerSearch.classList.add('expanded')
	syncDimOverlay()
}

// I wanted a single closer so Enter, blur, and overlay-click all collapse search consistently.
// I referenced the same classList/state patterns from class examples.
// From my understanding, this resets search-active state and removes UI expansion before re-syncing dim overlay.
function closeSearchUI() {
	if (!headerSearch) return
	isSearchUiActive = false
	headerSearch.classList.remove('expanded')
	syncDimOverlay()
}

// I wanted a convenience wrapper that always opens the search UI and places focus in the input.
// I referenced input focus behavior on MDN:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
// From my understanding, this keeps the search trigger interaction concise and reusable.
function focusSearch() {
	openSearchUI()
	if (timeSearchInput && isGridView) timeSearchInput.focus()
}

if (searchToggle) {
	searchToggle.addEventListener('click', () => {
		if (!isGridView) return
		focusSearch()
	})
}

if (searchOverlay) {
	searchOverlay.addEventListener('click', () => {
		closeSearchUI()
	})
}

if (timeSearchInput) {
	timeSearchInput.addEventListener('focus', () => {
		if (!isGridView) return
		openSearchUI()
	})

	timeSearchInput.addEventListener('blur', () => {
		setTimeout(() => {
			const active = document.activeElement
			const stillInside = headerSearch && active && headerSearch.contains(active)
			if (!stillInside) closeSearchUI()
		}, 0)
	})
}

if (timeSearchInput) {
	timeSearchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			searchTime()
		}
	})
	
	// Allow 3-digit time input like "2:32" without forcing leading zero
	timeSearchInput.addEventListener('input', (e) => {
		let value = e.target.value.replace(/[^\d:]/g, '')

		const firstColonIndex = value.indexOf(':')
		if (firstColonIndex !== -1) {
			const before = value.slice(0, firstColonIndex).replace(/:/g, '').slice(0, 2)
			const after = value.slice(firstColonIndex + 1).replace(/:/g, '').slice(0, 2)
			value = after.length > 0 ? `${before}:${after}` : `${before}:`
		} else {
			const digits = value.slice(0, 4)
			if (digits.length === 3) {
				value = `${digits.slice(0, 1)}:${digits.slice(1)}`
			} else if (digits.length === 4) {
				value = `${digits.slice(0, 2)}:${digits.slice(2)}`
			} else {
				value = digits
			}
		}

		e.target.value = value.slice(0, 5)
	})
}



/* ---------------- Canvas Zoom ---------------- */
stage.addEventListener("wheel", (e) => {
	if (isGridView) return
	if (!e.ctrlKey) return

	e.preventDefault()

	const rect = stage.getBoundingClientRect()
	const mx = e.clientX - rect.left
	const my = e.clientY - rect.top

	const contentX = (stage.scrollLeft + mx) / scale
	const contentY = (stage.scrollTop + my) / scale

	const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + (e.deltaY * -0.01)))
	if (next === scale) return

	scale = next
	viewport.style.transform = `scale(${scale})`

	stage.scrollLeft = (contentX * scale) - mx
	stage.scrollTop = (contentY * scale) - my
}, { passive: false })


/* ---------------- Canvas Drag ---------------- */
stage.addEventListener("pointerdown", (event) => {
	if (isGridView) return
	if (dialog.open) return

	const clickedInteractive = event.target.closest("button, a, dialog")
	if (clickedInteractive) return

	isPanning = true

	startX = event.clientX
	startY = event.clientY
	startScrollLeft = stage.scrollLeft
	startScrollTop = stage.scrollTop

	stage.setPointerCapture(event.pointerId)
})

stage.addEventListener("pointermove", (event) => {
	if (!isPanning) return

	const dx = event.clientX - startX
	const dy = event.clientY - startY

	stage.scrollLeft = startScrollLeft - dx
	stage.scrollTop = startScrollTop - dy
})

// I wanted drag release to be reusable across pointerup and pointercancel.
// I referenced pointer event cleanup patterns:
// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
// From my understanding, this is a shared terminator that flips the panning state off whenever drag interaction ends.
function stopPanning() {
	isPanning = false
}

stage.addEventListener("pointerup", stopPanning)
stage.addEventListener("pointercancel", stopPanning)


/* ---------------- Initial Load ---------------- */
// I wanted the site to load in canvas view by default and immediately center the user.
// I referenced basic function calls and timing: // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, this initializes the view state and recenters the canvas shortly after load so layout values are ready.
setView(false)

// Center canvas after blocks are loaded
window.addEventListener('arenaBlocksLoaded', () => {
	setTimeout(centerCanvas, 100)
})

// Also center on window load as fallback
window.addEventListener('load', () => {
	setTimeout(centerCanvas, 200)
})


/* ---------------- Back to Top Button ---------------- */
const backToTopBtn = document.querySelector('#backToTop')

// Show/hide back to top button based on scroll position in grid view
if (backToTopBtn) {
	let lastScrollTop = 0
	
	// I wanted the "back to top" affordance to appear only after users move beyond the intro area.
	// I referenced scroll position checks and offsetHeight usage:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
	// From my understanding, this compares current scroll against intro height and toggles a visibility class.
	const checkBackToTopVisibility = () => {
		if (!isGridView) {
			backToTopBtn.classList.remove('visible')
			return
		}
		
		const scrollTop = stage.scrollTop
		
		// Get the height of the header section (h1, description, filters)
		const headerSection = document.querySelector('#viewport > section:first-of-type')
		const headerHeight = headerSection ? headerSection.offsetHeight : 800
		
		// Show button when scrolled past the header section
		if (scrollTop > headerHeight) {
			backToTopBtn.classList.add('visible')
		} else {
			backToTopBtn.classList.remove('visible')
		}
		
		lastScrollTop = scrollTop
	}
	
	// Listen for scroll events
	stage.addEventListener('scroll', checkBackToTopVisibility)
	
	// Handle click to scroll to top
	backToTopBtn.addEventListener('click', () => {
		stage.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	})
	
	// Check on view toggle
	const originalSetView = setView
	setView = function(nextIsGridView) {
		originalSetView(nextIsGridView)
		setTimeout(checkBackToTopVisibility, 100)
	}
}

/* ---------------- Render Media Content ---------------- */
// I wanted one rendering pipeline for modal + aside so every media type stays consistent across both views.
// I referenced DOM element creation and media element docs:
// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
// From my understanding, this clears the container then branches by media type to inject the right element structure (including clickable audio covers + native controls).
function renderMedia(content, container) {
	container.innerHTML = ''
	container.classList.remove('has-audio-cover', 'has-audio-only')
	
	if (!content) return
	
	// For audio with cover image: show clickable thumbnail and audio player below
	if (content.audioSrc && content.imageSrc) {
		container.classList.add('has-audio-cover')

		const link = document.createElement('a')
		link.href = content.mediaHref || content.audioSrc
		link.target = '_blank'
		link.rel = 'noopener noreferrer'
		
		const img = document.createElement('img')
		img.src = content.imageSrc
		img.alt = content.title || 'Audio cover'
		
		const audio = document.createElement('audio')
		audio.src = content.audioSrc
		audio.controls = true
		audio.setAttribute('controls', '')
		audio.preload = 'metadata'
		
		link.appendChild(img)
		container.appendChild(link)
		container.appendChild(audio)
		return
	}
	
	// For audio without cover image: show audio player
	if (content.audioSrc) {
		container.classList.add('has-audio-only')

		const audio = document.createElement('audio')
		audio.src = content.audioSrc
		audio.controls = true
		audio.setAttribute('controls', '')
		audio.preload = 'metadata'
		container.appendChild(audio)
		return
	}
	
	// For video files: embed video player directly
	if (content.videoSrc) {
		const video = document.createElement('video')
		video.src = content.videoSrc
		video.controls = true
		video.preload = 'metadata'
		container.appendChild(video)
		return
	}
	
	// Embed HTML
	if (content.embedHtml) {
		const embedDiv = document.createElement('div')
		embedDiv.innerHTML = content.embedHtml
		container.appendChild(embedDiv)
		return
	}
	
	// PDF
	if (content.pdfSrc) {
		const iframe = document.createElement('iframe')
		iframe.src = content.pdfSrc
		container.appendChild(iframe)
		return
	}
	
	// For images: show as clickable link
	if (content.imageSrc) {
		const link = document.createElement('a')
		link.href = content.mediaHref || content.imageSrc
		link.target = '_blank'
		
		const img = document.createElement('img')
		img.src = content.imageSrc
		img.alt = content.title || 'Block content'
		
		link.appendChild(img)
		container.appendChild(link)
		return
	}
}