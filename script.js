// DISCLAIMER: 
// I know this is a lot more .js than we went over in class and that we really needed for this submission, but I really wanted to get as much done of this project as possible while I had the time this week because I know I'm going to be absolutely slammed juggling work + school next week. So I won't have as much time right before this deadline to work out the nitty gritty edits (css styling, cool js effects, etc.). So I tried doing as much as I could from the limited js functions we learned in class and of course with the help of Claude and a little bit of Cursor. My main approach to this would be to google in a "how do you...js" format of what I wanted to do, and the Google AI popup usually would help me identify key words/terms that I could then try to look up on MDN and then I'd try to piece together one-by-one the different components of the function that I needed, and whatever I couldn't figure out, I'd ask Claude to oversee and revise. If this falls outside the scope of the assignment, I'm happy to pull back. I just really want to be able to use at least one of my projects from this class for my portfolio, and I was hoping to showcase this one. 

// ALSO TO NOTE: THE CURRENT ARE.NA CHANNEL DOESN'T HAVE THE NECESSARY 240 BLOCKS FOR THE CONCEPTUAL THEME OF MY SITE BUT I'M HOLDING OFF COMMITTING TO SUCH A TEDIOUS TASK OF ADDING THAT MANY BEFORE GETTING FEEDBACK FROM MY PEERS ON WHETHER THIS IDEA LANDS/MAKES SENSE (So for now, I have the blocks just repeat to make up the 240 blocks currently on the site).



/* ---------------- Variable Setups ---------------- */
// I wanted to store references to all my HTML elements at the top so I can access them easily throughout the rest of my functions without having to keep calling document.querySelector over and over.
// I referenced the class site examples on how to assign elements to variables and then tried to deep dive a bit more on querySelector and querySelectorAll to understand how they work and what they return:
	// https://typography-interaction-2526.github.io/topic/javascript/#2-wrapped-in-script-tags
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
// From my understanding, stage grabs the #canvas element which is my scrollable container, viewport is where all the time buttons live, toggle is the chaos/calm switcher button, and all the other variables are grabbing specific UI pieces like the zoom buttons, filter chips, search input, modal elements, and grid detail panel pieces so I can manipulate them later in my functions.
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

// I wanted empty arrays and state trackers so I can fill them later or check their status in my functions.
// I remember Eric talking about arrays in class so I watched class recording and then referenced basic JS variable types and boolean usage on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
// From my understanding: 
	// timeButtons will hold all my generated time button elements once they load from Are.na, 
	// lastFocusedEl remembers what was focused before opening a modal so I can return focus back to it when closing, 
	// isGridView tracks whether we're in calm or chaos mode, 
	// scale/MIN_SCALE/MAX_SCALE control zoom levels, 
	// zoomInCount/zoomOutCount limit how many times you can zoom, 
	// isPanning tracks if you're currently dragging the canvas, 
	// startX/startY/startScrollLeft/startScrollTop remember where your drag started from, 
	// and isSearchUiActive/isPanelDimActive track whether the search or side panels are open so I know when to show the dim overlay.
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


/* ---------------- Background Overlay ---------------- */
// I needed one place to control the darker overlay underneath the popups (only search input and asides since this modals already have built-in ::backdrop css styling) so that they would function the same.
// I first referenced the class site about adding/removing a class to understand I had to setup my toggle states. Then, I Googled "how to have overlay appear and disappear on click js" and the Google AI Overview pop up mentioned "toggling a CSS class", so I search that up on MDN and the hidden attribute on MDN:
	// https://typography-interaction-2526.github.io/topic/javascript/#opening-a-modal
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
// I referenced Boolean casting and utility-style helper functions to understand how to create a reusable function that can be called from different places in my code whenever I need to update the panel dim state and then I asked Claude to help me put it together with my existing variable setup and overlay functions above:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
// From my understanding, this helper normalizes any truth/fals input into a real boolean and then refreshes shared dimming state.
function setPanelDimState(nextState) {
	isPanelDimActive = Boolean(nextState)
	syncDimOverlay()
}

// I wanted all category labels on the site to match Are.na content so when I filter by "Remember" it shows all images, "See" shows videos, etc.
// I first looked at the class site about loops to understand how to check through different conditions. Then I Googled "how to check if string contains another string javascript" and the AI Overview mentioned ".includes()" so I then knew to look up string values on MDN. I also Googled "how to check file type from url javascript" and found out about checking file extensions with regex patterns, so I looked up regex on MDN. Finally I Googled "how to detect if url is youtube or spotify" and learned I could just use .includes() on the url to check for platform names. I then asked Claude to help me put all these different string checks together into one function that can take an Are.na block and return the right category label based on its content.
	// https://typography-interaction-2526.github.io/topic/javascript/#loops
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// From my understanding, this function takes a block from Are.na (which has properties like blockData.type, blockData.source.url, blockData.attachment.content_type, etc.) and figures out if it's an image, video, audio, or text/pdf/link by checking: first if arenaType says "Image" then it returns "Remember", then it checks if any of the URLs or file types contain video file extensions like .mp4 or platform names like youtube.com/vimeo.com (using regex patterns and .includes()) which makes it return "See", then it does the same for audio files and platforms to return "Hear", and if none of those match it defaults to "Read" for text/pdfs/links.
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
// I needed one function that can take any random Arena block (whether it's an image, video, text, link, PDF, or whatever) and translate all its different structures into one clean consistent format that my modal and aside can actually understand and display without breaking.
// I first referenced the class site's JSON section to understand working with objects. Then, I Googled "how to safely access nested object properties javascript" and the Google AI Overview mentioned "optional chaining with ?. operator", so I looked that up on MDN. But honestly Arena's API structure is so chaotic with like block.source sometimes, block.attachment other times, block.embed for some things, that I asked Claude "I have an Are.na API response where some blocks have data in block.source.url, some in block.attachment.url, some in block.image.original.url, and some in block.embed - how do I write a function that safely extracts the right data from all these different structures and normalizes it into one consistent object with title, description, imageUrl, videoUrl, audioUrl, and type fields?" and Claude explained I should use optional chaining (?.) to safely check each possible location, use fallback values with || operators, and build a normalized object that my other functions can rely on:
	// https://typography-interaction-2526.github.io/week/18/#meet-json
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
// From my understanding, this function is basically like a translator that takes whatever weird format Arena gives me (could be block.title, block.generated_title, block.content, block.description, literally anything) and carefully checks all the possible places that data might be hiding using the ?. operator so it doesn't crash if something's missing, then packages everything up into one nice clean object with consistent field names (like title, description, imageUrl, etc.) that the rest of my code can trust will always be in the same format, so I don't have to write a million if statements everywhere else checking "does this block have a source? or an attachment? or an embed?" - I just call this function once and get back a predictable structure every single time.
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

	// I needed to handle Arena's various text block formats where sometimes block.content is just a plain string like "hello world" but other times it's a whole nested object like { html: "<p>hello world</p>", markdown: "hello world", text: "hello world" } and I have no idea which one I'm gonna get until runtime.
	// I first referenced the class recording about if statements to understand checking conditions. Then, I Googled "how to check if variable is string or object javascript" and the Google AI Overview mentioned "typeof operator", so I looked that up on MDN. But I was still confused about how to handle all the possible variations (what if it's block.content.html? or block.content.text? or just block.content as a string? or block.description instead?), so I asked Claude "Arena blocks sometimes have text as block.content (string), sometimes as block.content.html, sometimes as block.content.text, and sometimes as block.description - how do I write code that checks all these possibilities and returns the first one that actually has text without crashing?" and Claude explained I should use typeof to check if it's a string first, then use the || operator to chain fallbacks in order of preference, checking each possible location until I find actual text:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
	// From my understanding, this checks if block.content is a string using typeof === 'string' and if yes just uses it directly, but if it's an object it tries block.content.html first, then block.content.text, then block.content.markdown, then gives up and tries block.description as a last resort, and the || operator makes it so whichever one it finds first that's not undefined/null/empty becomes the winner, so no matter what random structure Arena decides to send me today my code won't explode and users will actually see the text content instead of [object Object] or undefined showing up on the page which would be so embarrassing.
	const readTextValue = (value) => {
		if (!value) return ''
		if (typeof value === 'string') return value
		if (typeof value === 'object') return value.plain || value.markdown || value.html || ''
		return ''
	}

	// I needed to grab image URLs from Arena blocks but Arena is inconsistent because sometimes the image is in block.image.large.src, sometimes it's block.image.display.url, sometimes it's block.image.original.url.
	// I first referenced the class site's JavaScript tips section. Then, I Googled "how to access nested object properties javascript" and the AI Overview mentioned "optional chaining and property accessors", so I looked those up on MDN. Then I Googled "javascript get first non-null value from list" and learned about the || operator for chaining fallbacks. But I still wasn't sure what order to check all the image properties in, so I asked Claude "Arena image blocks have different size properties like block.image.large.src, block.image.display.url, block.image.medium.src, block.image.square, block.image.thumb, block.image.original.url - what's the best way to try each one in order until I find an actual image URL?" and Claude suggested using optional chaining with || to waterfall through size preferences:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR
	// From my understanding, this creates a waterfall where it tries imageObj.large.src first (biggest/best quality), then falls back to imageObj.display.src, then imageObj.medium.src, then keeps checking smaller sizes like square and thumb, and also tries the .url versions of everything in case Arena decided to use that property name instead of .src, and the || operator stops as soon as it finds ANY truth value (an actual URL string) and returns that, or returns null at the very end if literally none of the image properties exist so at least my code doesn't crash trying to display undefined.
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

	// I wanted to create a standard object structure that holds all the info I need to display a block (like time, title, text, links, and media URLs) so I don't have to keep checking Are.na properties everywhere else in my code.
	// I first Googled "how to create object with properties javascript" and learned about object literals on MDN.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
	// From my understanding, this builds a content object with properties like content.time (showing what minute it is), content.title (the block's title or "Untitled" if there isn't one), content.text (empty for now, will be filled if it's a text block), content.href (link to the Are.na block page), content.mediaHref (link to the actual source like YouTube or wherever), and empty slots for imageSrc/videoSrc/audioSrc/pdfSrc/embedHtml/mediaType that will get filled in based on what type of block this is.
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

	// I wanted to fill in the right media URLs based on what type of block it is (Remember/See/Hear/Read) so each type gets the correct content properties filled.
	// I referenced the class examples and the recording on conditional logic. And of course, I asked Claude to correct my format and if I was writing it correctly:
		// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
	// From my understanding, if blockType is "Remember" (images), it calls getImageUrl to grab the image and sets content.imageSrc and marks mediaType as 'image'. If it's "See" (videos), it checks if there's a video file attachment or URL using regex to test for video extensions, and if it finds one it sets content.videoSrc, plus if there's embedded HTML like a YouTube iframe it sets content.embedHtml. If it's "Hear" (audio), it does the same checking for audio file URLs and sets content.audioSrc. For everything else ("Read"), it checks if it's a PDF and sets content.pdfSrc, or if it's a Text block it reads the text content using readTextValue, or if it's a Link it uses the sourceUrl, or if there's embed HTML it uses that.
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
// I wanted the user to start at the center of the giant 300vw x 300vh canvas every time they load the page or toggle views, so they're not lost in a random corner.
// I first Googled "how to scroll to specific position javascript" and the AI Overview mentioned "scrollLeft" and "scrollTop" properties, so I looked those up on MDN. Then I Googled "how to make smooth animation javascript" and learned about requestAnimationFrame.
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
	// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
// From my understanding, this function first checks if we're in grid view and exits if we are (because centering only matters in canvas view), then it uses requestAnimationFrame to wait for the next paint cycle, calculates fieldW as the full canvas width (which is 3x the viewport width) and fieldH as the full canvas height (3x viewport height), figures out targetLeft by taking half the field width times the current zoom scale and subtracting half the visible stage width (so the center point ends up in the middle of what you can see), does the same math for targetTop vertically, then sets stage.scrollLeft and stage.scrollTop to those calculated positions which actually scrolls the container to center everything.
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

// I wanted users to be able to click a time button from search results or the "go to now" button and have the canvas automatically pan and center on that specific minute.
// I first looked at the class examples on getting element attributes with dataset. Then I Googled "how to scroll to element position javascript" and learned about scroll positioning calculations on MDN. And of course, I asked Claude to help me put all the pieces together into one function that can take a time button, figure out where it is on the canvas based on the percentage values I stored in data attributes when I created the buttons, and then scroll the stage to center on that position with smooth animation.
	// https://typography-interaction-2526.github.io/topic/javascript/#some-miscellaneous-js-tips
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
	// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
// From my understanding, this takes a timeButton element as input, checks if we're in grid view or if the button is null and exits if so (because again, this only matters in canvas view), pulls out the top and left percentages from timeButton.dataset (which were stored when the button was created), uses requestAnimationFrame again for smooth animation timing, calculates the full field dimensions same as centerCanvas, converts the percentage values to actual pixel positions by doing (left / 100) * fieldW * scale for horizontal and same for vertical with fieldH, then scrolls the stage to put that pixel position right in the center of the visible viewport by subtracting half the stage width/height.
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

// I wanted a quick "jump to now" interaction button that finds the current real-world time (but only if it's between midnight and 4am since those are the only minutes on my site) and centers the canvas on that time button with a cool pulsing animation.
// I first looked at the class examples on using Date objects. Then I Googled "javascript get current time hours minutes" and learned about Date methods like getHours() and getMinutes() on MDN. For finding the button, I looked at array methods and learned about .find().
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// From my understanding, this creates a new Date object called now which has the current date/time, extracts hours and minutes from it, checks if hours is 4 or more and if so shows an alert saying it's outside the midnight-4am range and exits, otherwise it formats currentTimeString as "HH:MM" using padStart to add leading zeros, searches through all the timeButtons to find one where the dataset.time matches currentTimeString, and if it finds a match it calls centerOnTime to scroll there, then it adds a fancy pulse animation by setting CSS transitions and transform to scale(1.5) to make it bigger, adds a pulsing box-shadow effect that expands outward from 0px to 30px with fading opacity, and after 2 seconds resets everything back to normal.
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
// I wanted users to be able to zoom in and out using the zoom buttons in chaos mode to get closer to specific time buttons or zoom out to see the overall layout.
// I referenced the basic click event examples from class and also looked at MDN documentation on click events and CSS transforms to understand how to apply zooming with JavaScript:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
// From my understanding, these button handlers increment or decrement the scale value, apply it to the viewport transform, and recenter the canvas to maintain focus.

// I wanted zoom-in to feel controlled (not infinite) especially for usability on dense canvases, so I limited it to only 2 clicks max.
// I first looked at the class examples on functions. Then I Googled "javascript limit number between min and max" and the AI Overview mentioned Math.min and Math.max so I looked those up on MDN.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
// From my understanding, this checks if we're in grid view and exits if we are (zoom only works in canvas mode), checks if zoomInCount already hit the MAX_ZOOM_CLICKS limit of 2 and exits if so, calculates next scale by adding 0.2 to current scale but using Math.min to cap it at MAX_SCALE so it never goes higher than 2.5, checks if next equals scale meaning we're already maxed out and exits if so, updates scale to next, increments zoomInCount, decrements zoomOutCount if it's above 0 (to balance the click counters), applies the new scale to viewport using a CSS transform, then calls setTimeout to run centerCanvas after 50ms so the zoom stays centered on your view.
function zoomIn() {
	if (isGridView) return
	// Limit zoom amount to 2 clicks
	if (zoomInCount >= MAX_ZOOM_CLICKS) return
	const next = Math.min(MAX_SCALE, scale + 0.2)
	if (next === scale) return
	scale = next
	zoomInCount++
	// Disable further zooming out if we're at the limit
	if (zoomOutCount > 0) zoomOutCount--
	viewport.style.transform = `scale(${scale})`
	setTimeout(centerCanvas, 50)
}

// I wanted zoom-out behavior to mirror zoom-in and keep the experience constrained and predictable with the same 2-click limit.
// I referenced the same Math functions and transform concepts:
	// https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/scale
// From my understanding, this does the same checks as zoomIn but in reverse - it exits if in grid view or if zoomOutCount hit MAX_ZOOM_CLICKS, calculates next scale by subtracting 0.2 but using Math.max to never go below MIN_SCALE of 0.6, exits if we're already at minimum, updates scale, increments zoomOutCount, decrements zoomInCount if needed, applies the transform, and recenters the canvas.
function zoomOut() {
	if (isGridView) return
	// Limit zoom amount to 2 clicks
	if (zoomOutCount >= MAX_ZOOM_CLICKS) return 
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


/* ---------------- Chaos/Calm View Toggle ---------------- */
// I wanted the user to be able to switch between the default free-browsing chaos experience (like how the files are setup in my Figma) and a calmer grid layout depending on how they want to "explore the night."
// I referenced the class site example on adding/removing a class:
	// https://typography-interaction-2526.github.io/topic/javascript/#adding-removing-a-class
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this function takes a boolean nextIsGridView as input, updates the global isGridView variable to match it, uses classList.toggle to add the "grid" class to stage if nextIsGridView is true (which triggers CSS to switch to grid layout) or removes it if false, toggles "calm-mode" and "chaos-mode" classes on body for additional styling, toggles "active" class on the toggle button itself (but inverted so it's active when in chaos mode), changes the button text to say "Chaos" when in calm mode or "Calm" when in chaos mode (so it always shows what you'll switch TO), closes the search UI and grid detail panel if switching to chaos mode (since those only work in calm), closes the dialog modal if switching to calm mode and a modal is open, and if switching to calm mode it resets scale back to 1, resets zoom counters, applies scale(1) transform, and scrolls to top-left, then if switching to chaos mode it waits 50ms and calls centerCanvas.
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
// I wanted each time button to open a side panel with its own content instead of navigating away from the canvas, and I wanted the modal to slide in from the left and push the entire canvas to the right in chaos mode (creating a split-screen effect like the Palmer Dinnerware site I took inspiration from), but in calm mode the aside should appear normally without pushing content.
// I referenced the class example on opening a modal and the native dialog element docs adn then asked Claude to help me figure out how to fill in the content and trigger the right CSS classes for both grid and canvas modes:
	// https://typography-interaction-2526.github.io/topic/javascript/#opening-a-modal
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
// From my understanding, this calls getBlockContent with the blockId to fetch all the content data from window.arenaBlocks, and if content is null it exits, then if we're in grid view (calm mode) it fills in the detailTime/detailTitle/detailText/detailLink elements in the gridDetail aside with the content data (handling special cases like text blocks which hide the title and show the text with a special class, and link blocks which show a "Learn More" button), calls renderMedia to insert the media content, adds the "active" class to gridDetail to make it slide in, and calls setPanelDimState(true) to show the dim overlay, but if we're in canvas view (chaos mode) it saves the currently focused element to lastFocusedEl so we can restore focus later, fills in the modal elements instead (modalTime/modalTitle/modalText/modalLink/modalMedia), adds the "modal-open" class to stage which triggers CSS to push the canvas to the right, removes any "closing" class left over from previous animations, calls dialog.showModal() to actually open the dialog element, focuses on modalClose button for accessibility, and calls setPanelDimState(true).
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


// I wanted the modal to slide out smoothly instead of instantly disappearing, and for the canvas to return to full width with a nice transition.
// I referenced timing UI animations with JavaScript from class examples and setTimeout docs then asked Claude to help me figure out the sequence of class changes and timeouts needed to coordinate the CSS animations for both the dialog sliding out and the canvas resizing back to normal:
	// https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, this first checks if dialog.open is false meaning the dialog is already closed, and if so it just updates the dim state based on whether gridDetail is open and exits, otherwise it adds the "closing" class to dialog which triggers CSS animations to slide it out, uses setTimeout to wait 200ms then removes the "modal-open" class from stage (which in CSS makes the canvas transition back to full width), then uses another setTimeout to wait 400ms total (giving the slide-out animation time to finish) before calling dialog.close() to actually close the dialog element, removing the "closing" class, and updating the dim state based on whether gridDetail is still open.
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

// I wanted a dedicated closer for the calm-mode aside so I could close it separately from the chaos-mode modal.
// I referenced the class examples on classList manipulation and then Googled "javascript remove class from element" to confirm how to do it properly with classList.remove and then asked Claude to help me figure out the right sequence of actions to close the aside and update the dim state correctly:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this removes the "active" class from gridDetail which triggers CSS to hide the aside, then immediately calls setPanelDimState passing in dialog.open to check if the chaos modal is open (so if both the aside and modal are closed, the dim overlay gets removed, but if the modal is still open it stays).
function closeGridDetail() {
	gridDetail.classList.remove('active')
	setPanelDimState(dialog.open)
}


/* ---------------- Modal Event Handling ---------------- */
// I wanted each time button to open its corresponding modal content, but since the time buttons are now dynamically generated from Are.na data (not hardcoded in HTML), I need to wait for them to load before attaching event listeners.
// I referenced the class examples on addEventListener and dataset usage and then looked at MDN documentation on custom events and data attributes to understand how to listen for the 'arenaBlocksLoaded' event that arena.js releases when it's done creating the time buttons, and how to access the block ID stored in data-block attribute on each button:
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
// From my understanding, this listens for a custom event called 'arenaBlocksLoaded' that gets dispatched by arena.js once all the time buttons are created, then it grabs all the button elements inside #timeGrid using querySelectorAll, loops through them with forEach, and for each button it adds a click listener that calls openDialog passing in btn.dataset.block (which is the Are.na block ID stored on the button when it was created).
window.addEventListener('arenaBlocksLoaded', () => {
	timeButtons = document.querySelectorAll("#timeGrid button")
	
	timeButtons.forEach((btn) => {
		btn.addEventListener("click", () => openDialog(btn.dataset.block))
	})
})


// I wanted users to be able to close the modal in multiple intuitive ways (clicking the close button, clicking the backdrop, or pressing escape key) so it feels natural.
// I referenced the dialog events documentation and then asked Claude to help me understand the purpose of each event listener I set up on the dialog element (click, cancel, and close) and how they work together to create a smooth closing experience with animations and focusing:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
// From my understanding, the first listener just calls closeDialog when you click the close button, the second listener checks if you clicked directly on the dialog element itself (the backdrop) rather than clicking inside the modal content, and if so it closes the dialog, the third listener intercepts the "cancel" event which fires when you press Escape key and prevents the default instant close behavior so our animated closeDialog function runs instead, and the fourth listener fires after the dialog actually closes and tries to restore focus back to whatever element was focused before the modal opened (stored in lastFocusedEl), then updates the dim state.
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
// I wanted users to be able to filter blocks by type in calm mode (like only show images "Remember", or only videos "See", or only audio "Hear", or only text/pdfs "Read") and be able to select multiple filters at once to see combinations like both images AND videos.
// I referenced the class examples on classList manipulation and event delegation and then looked at MDN documentation on classList and dataset to understand how to toggle the "active" class on filter buttons and how to read the data-filter attribute to know which filter was clicked. Then I asked Claude to help me put it all together into a function that can handle the filter logic and update the UI accordingly:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, clicking a filter button shows/hides time buttons based on their data-type attribute, and updates the active state styling on the filter chips.

// I wanted to keep track of which filters are currently active using a Set data structure (which automatically handles uniqueness).
// I first Googled "javascript store unique values" and the AI Overview mentioned "Set" so I looked that up on MDN. I initialized it with ['all'] so by default all content shows.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// From my understanding, activeFilters is a Set that starts with just 'all' in it, meaning show everything by default.
let activeFilters = new Set(['all'])

// I wanted to handle potential mismatches between old filter button labels (like "Images", "Videos") and my current taxonomy (Remember/See/Hear/Read) so filters still work even if button text changes.
// I first looked at the class examples on objects. Then I Googled "javascript map one value to another" and learned about object lookup tables on MDN and then confirmed with Claude.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
// From my understanding, this takes a filterValue string (like "Images" or "Remember") and looks it up in the map object, returning the canonical value (like "Remember") so my filter logic always uses consistent labels, or if it's not in the map it just returns the original value unchanged.
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

// I wanted the filter system to support multi-select (like checking both "Remember" and "See" at the same time to show images AND videos) with toggle behavior (click again to uncheck).
// I first looked at the class examples on loops. Then I Googled "javascript toggle item in set" and learned about Set methods like .has(), .add(), .delete(), and .clear() on MDN and then confirmed with Claude.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
// From my understanding, this takes a filterType string (like "Remember" or "all"), normalizes it using normalizeFilterValue, then if it's "all" it clears activeFilters and adds only 'all' back (showing everything), otherwise it removes 'all' from the set (because if you're selecting specific filters you don't want "all" active), then checks if normalizedFilter is already in activeFilters using .has(), and if it is it removes it with .delete() (toggling it off), and if that leaves activeFilters empty it adds 'all' back so at least something shows, or if normalizedFilter wasn't in the set it adds it with .add() (toggling it on), then it loops through all filterButtons and toggles their "active" class based on whether their normalized filter value is in activeFilters, and finally it loops through all timeButtons and for each one it grabs its data-type attribute, checks if activeFilters has 'all' (in which case show everything by setting display to empty string), otherwise it checks if the block's type is in activeFilters using .has() and sets display to empty string if yes or 'none' if no.
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

// I wanted to attach the filter click listeners only after the Are.na blocks finish loading (so the buttons and their data-filter attributes actually exist).
// I referenced the same custom event pattern from the modal handling as mentioned in class and in this MDN site:
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
// From my understanding, this waits for the 'arenaBlocksLoaded' event, then re-queries all the filter buttons (in case they were added dynamically), loops through each one with forEach, and adds a click listener that calls applyFilter with the button's data-filter value.
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
// I wanted users to be able to type a specific time (like "2:32") into the search input and have it jump to that minute and pulse it so you can clearly see which button you found.
// I first looked at the class examples on getting input values. Then I Googled "javascript validate time format" and learned about regex patterns for time validation on MDN. I also Googled "how to scroll to element and animate javascript" and found scrollIntoView and CSS animation injection techniques then asked Claude to help me pull it together to write the full function.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
// From my understanding, this grabs the value from timeSearchInput and trims whitespace, checks if it's empty and just closes the search UI if so, validates the format using a regex pattern /^([0-3]?\d):([0-5]\d)$/ which matches times like "2:32" or "03:45" where the first part is 0-3 (hours) and second part is 00-59 (minutes), and if it doesn't match it shows an alert and closes search, otherwise it: 
	// parses out the hours and minutes, 
	// pads hours with a leading zero to get "02:32" format, 
	// checks if hours are greater than 3 and shows an alert if so, 
	// then searches through timeButtons to find one where dataset.time matches, 
	// and if found it either calls scrollIntoView in calm mode or centerOnTime in chaos mode to navigate to it, 
	// then it creates a <style> element with CSS keyframes animation called pulse-scale that scales the button to 1.5x and adds expanding box-shadow over 3.6 seconds and repeats twice, 
	// adds that style to the document head, adds a "pulsing" class to the target button to trigger the animation, 
	// and after 7600ms (when animation completes) removes the pulsing class, then finally closes the search UI.
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
// I wanted the search input to expand when you click on it or the search icon in calm mode, with a dim overlay behind it, and collapse when you're done searching.
// I referenced these MDN sites on managing focus and toggling classes which I knew to look up after Googleing "javascript expand input on focus" and "javascript toggle class on element" and then Claude helped me put it together into the openSearchUI and closeSearchUI functions:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, openSearchUI checks if headerSearch element exists and if we're not in grid view it just exits (search only works in calm mode), sets isSearchUiActive to true, adds "expanded" class to headerSearch which triggers CSS to expand the input, and calls syncDimOverlay to show the dim background.
function openSearchUI() {
	if (!headerSearch) return
	if (!isGridView) return
	isSearchUiActive = true
	headerSearch.classList.add('expanded')
	syncDimOverlay()
}

// I wanted a single closer so all the different ways to exit search (pressing Enter, clicking outside, losing focus) would run the same.
// I referenced the same classList/state patterns from class examples.
// From my understanding, closeSearchUI checks if headerSearch exists and exits if not, sets isSearchUiActive to false, removes the "expanded" class which triggers CSS to collapse the input back, and calls syncDimOverlay to remove the dim background.
function closeSearchUI() {
	if (!headerSearch) return
	isSearchUiActive = false
	headerSearch.classList.remove('expanded')
	syncDimOverlay()
}

// I wanted to open the search bar and immediately put your cursor in the input so you can start typing.
// I referenced input focus behavior on MDN which I knew to look up after Googleing "javascript search bar input focusing" and then Claude helped me understand how to combine that with my existing openSearchUI function to create a focusSearch function that both opens the search UI and focuses the input:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
// From my understanding, this calls openSearchUI to do the expanding/dim overlay stuff, then checks if timeSearchInput exists and if we're in grid view, and if so calls focus() on the input to place the cursor there.
function focusSearch() {
	openSearchUI()
	if (timeSearchInput && isGridView) timeSearchInput.focus()
}

// I wanted clicking the search icon to open and focus the search input, but only in calm mode.
// I referenced the class examples on click listeners.
// From my understanding, this checks if searchToggle exists, adds a click listener, checks if we're in grid view and exits if not, then calls focusSearch.
if (searchToggle) {
	searchToggle.addEventListener('click', () => {
		if (!isGridView) return
		focusSearch()
	})
}

// I wanted clicking the dim overlay to close the search input.
// I referenced the same click listener patterns from class.
// From my understanding, this checks if searchOverlay exists, adds a click listener that just calls closeSearchUI.
if (searchOverlay) {
	searchOverlay.addEventListener('click', () => {
		closeSearchUI()
	})
}

// I wanted the search input to expand when you focus it (like clicking into it or tabbing to it) and collapse when you leave it (unless you're moving to another element inside the search container).
// I first looked at the class examples on focus events. Then I Googled "javascript detect when element loses focus" and learned about blur events on MDN. I also Googled "how to check if focused element is inside container" and learned about .contains() method and then confirmed with Claude to pull the function together.
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
	// https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
// From my understanding, the focus listener just calls openSearchUI when you focus the input, and the blur listener uses setTimeout with 0ms delay (to let the browser update document.activeElement first) then grabs the currently focused element, checks if headerSearch contains that element using .contains(), and if it's not inside the search container anymore it calls closeSearchUI.
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

// I wanted pressing Enter in the search input to trigger the search, and I wanted to allow users to type times like "2:32" without forcing them to type the leading zero (so both "2:32" and "02:32" work).
// I first looked at the class examples on keydown events. Then I Googled "javascript detect enter key press" and learned about checking e.key on MDN. For the input formatting, I Googled "javascript auto format time input" and learned about the input event and string manipulation methods and then confirmed with Claude on the format.
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
// From my understanding, the keydown listener checks if e.key equals 'Enter', prevents the default form submission behavior, and calls searchTime, and the input listener strips out any non-digit or non-colon characters, handles the colon placement by checking if there's already a colon in the value, splits on it, takes up to 2 digits before the colon and up to 2 digits after, and if there's no colon yet but you've typed 3 or 4 digits it automatically inserts the colon (like typing "232" becomes "2:32"), then limits the final value to 5 characters max.
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



/* ---------------- Canvas Zoom (Trackpad Gesture) ---------------- */
// I wanted users to be able to zoom in chaos mode using trackpad pinch gestures (Ctrl+wheel) in addition to the zoom buttons, with the zoom centered on wherever their mouse is pointing (instead of always centering on the middle).
// I first Googled "javascript detect trackpad pinch zoom" and the AI Overview mentioned "wheel event with ctrlKey" so I looked up the wheel event on MDN. Then I Googled "javascript zoom to mouse position" and learned about calculating scroll offsets relative to mouse coordinates. Then I asked Claude to help me put it all together into a single wheel event listener that handles the zooming logic and keeps the zoom centered on the mouse position:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
// From my understanding, this listens for wheel events on stage, checks if we're in grid view and exits if so (zoom only works in chaos), checks if Ctrl key is held down (which indicates pinch gesture on trackpad) and exits if not, calls preventDefault to stop the page from zooming normally, gets the stage's position using getBoundingClientRect, calculates mx and my as the mouse position relative to stage (by subtracting the rect's left/top from the event's clientX/clientY), calculates where in the content that mouse position corresponds to by doing (scrollLeft + mx) / scale for contentX and same for contentY, calculates the next scale value by adding (e.deltaY * -0.01) to current scale (deltaY is negative when zooming in, positive when zooming out) but clamped between MIN_SCALE and MAX_SCALE using Math.min/max, checks if next equals scale meaning we're already at the limit and exits if so, updates scale to next, applies the transform to viewport, then adjusts scrollLeft/scrollTop so that contentX/contentY stay under the mouse cursor by doing (contentX * scale) - mx, using passive: false to allow preventDefault.
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


/* ---------------- Canvas Drag (Panning) ---------------- */
// I wanted users to be able to click and drag anywhere on the canvas in chaos mode to pan around and explore different areas without having to use scrollbars.
// I first looked at the class examples on mouse events. Then I Googled "javascript drag to scroll" and the AI Overview mentioned "pointer events" and "pointer capture" so I looked those up on MDN. Then I asked Claude to help me turn it into a set of pointer event listeners that track when the user is dragging and update the scroll position accordingly:
	// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
// From my understanding, the pointerdown listener fires when you press down anywhere on stage, checks if we're in grid view or if the dialog is open and exits if so (panning only works in chaos mode and not when modal is open), checks if you clicked on an interactive element like a button, link, or dialog using .closest() and exits if so (so clicking buttons still works normally), sets isPanning to true to track that we're now dragging, stores the starting mouse position in startX/startY and the starting scroll position in startScrollLeft/startScrollTop, then calls setPointerCapture so the element keeps receiving pointer events even if you drag outside the element's bounds.
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

// I wanted the canvas to follow your mouse movement while dragging, updating the scroll position to create a smooth panning effect.
// I referenced the same pointer events docs from above.
// From my understanding, the pointermove listener fires continuously while you move your mouse, checks if isPanning is false and exits if so (meaning you're not currently dragging), calculates dx as the horizontal distance moved (clientX - startX) and dy as vertical distance, then updates stage.scrollLeft to startScrollLeft - dx and scrollTop to startScrollTop - dy (subtracting because when you drag right you want the content to scroll left, so it feels like you're grabbing and moving the canvas).
stage.addEventListener("pointermove", (event) => {
	if (!isPanning) return

	const dx = event.clientX - startX
	const dy = event.clientY - startY

	stage.scrollLeft = startScrollLeft - dx
	stage.scrollTop = startScrollTop - dy
})

// I wanted drag release to be reusable across both pointerup (normal release) and pointercancel (like if you drag off screen).
// I referenced pointer event cleanup patterns:
	// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
// From my understanding, this is a shared terminator function that just sets isPanning back to false, and it's attached to both pointerup and pointercancel events so whichever one fires will stop the panning.
function stopPanning() {
	isPanning = false
}

stage.addEventListener("pointerup", stopPanning)
stage.addEventListener("pointercancel", stopPanning)


/* ---------------- Initial Load ---------------- */
// I wanted the site to start in chaos mode by default (so setView(false) passes false for isGridView) and automatically center the canvas after a short delay so the layout is ready.
// I referenced basic function calls and timing from class examples:
	// https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, setView(false) initializes the view to chaos mode, the first event listener waits for 'arenaBlocksLoaded' then after 100ms calls centerCanvas (giving time for the buttons to render), and the second listener waits for window 'load' event then after 200ms calls centerCanvas as a fallback in case the arena blocks load before that event fires.
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
// I wanted the backToTopBtn to appear only once the intro section (h1, .site-description, and #gridFilter) is scrolled out of view in calm mode, since that mode has a more linear flow, but the button should stay hidden in chaos mode since users are encouraged to freely browse in any direction there.
// I referenced the "Watching for Scrolling" section on the class site:
	// https://typography-interaction-2526.github.io/topic/javascript/#watching-for-scrolling
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
// From my understanding, backToTopBtn is grabbed from the DOM, lastScrollTop tracks the previous scroll position, checkBackToTopVisibility first checks if we're not in grid view and removes "visible" class and exits if so (button only shows in calm mode), grabs current scrollTop from stage, finds the headerSection element and gets its offsetHeight (or defaults to 800px if not found), checks if scrollTop is greater than headerHeight meaning you've scrolled past the intro, and adds "visible" class if so or removes it if not, then updates lastScrollTop, this function is attached to stage's scroll event listener, the button click listener smoothly scrolls back to top with scrollTo, and then there's a wrapper around the original setView function that also calls checkBackToTopVisibility after view switches.
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
// I wanted one rendering flow that works for both the modal and the aside so every media type (images, videos, audio, PDFs, embeds) displays consistently in both views.
// I first looked at the class examples on creating elements. Then I Googled "javascript create audio element" and "javascript create video element" and found the docs for audio/video elements on MDN. Then asked Claude to help me put it together into a single renderMedia function that checks the content object for different media types and creates the appropriate elements with controls and styling, then appends them to the given container element:
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
// From my understanding, this takes a content object (which has properties like audioSrc, imageSrc, videoSrc, etc.) and a container element (either modalMedia or detailMedia), clears the container's innerHTML and removes any media-specific classes, checks if content is null/undefined and exits if so, then branches based on what type of media exists: if it's audio with a cover image it adds "has-audio-cover" class, creates an <a> link wrapping an <img> for the cover and a separate <audio> element with controls below it; if it's audio without a cover it just creates the audio element with "has-audio-only" class; if it's a video file it creates a <video> element with controls; if it's embed HTML (like YouTube iframe) it creates a div and sets its innerHTML; if it's a PDF it creates an <iframe> with the PDF URL; if it's an image it creates an <a> link wrapping an <img> tag; then appends everything to the container.
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