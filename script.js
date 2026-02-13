// DISCLAIMER:
// I know this is a lot more .js than we went over in class and that we really needed for this submission, but I really wanted to get as much done of this project as possible while I had the time this week because I know I'm going to be absolutely slammed juggling work + school next week. So I won't have as much time right before this deadline to work out the nitty gritty edits (css styling, cool js effects, etc.). So I tried doing as much as I could from the limited js functions we learned in class and of course with the help of Claude and a little bit of Cursor. My main approach to this would be to google in a "how do you...js" format of what I wanted to do, and the Google AI popup usually would help me identify key words/terms that I could then try to look up on MDN and then I'd try to piece together one-by-one the different components of the function that I needed, and whatever I couldn't figure out, I'd ask Claude to oversee and revise. If this falls outside the scope of the assignment, I'm happy to pull back. I just really want to be able to use at least one of my projects from this class for my portfolio, and I was hoping to showcase this one.

// ALSO TO NOTE: THE CURRENT ARE.NA CHANNEL DOESN'T HAVE THE NECESSARY 240 BLOCKS FOR THE CONCEPTUAL THEME OF MY SITE BUT I'M HOLDING OFF COMMITTING TO SUCH A TEDIOUS TASK OF ADDING THAT MANY BEFORE GETTING FEEDBACK FROM MY PEERS ON WHETHER THIS IDEA LANDS/MAKES SENSE (So for now, I have the blocks just repeat to make up the 240 blocks currently on the site).

/* ---------------- Variable Setups ---------------- */
let stage = document.querySelector('#canvas')

let filterButtons = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')
let refreshBlocksBtn = document.querySelector('#refreshBlocks')

let timeSearchInput = document.querySelector('#timeSearchInput')
let searchToggle = document.querySelector('#searchToggle')
let headerSearch = document.querySelector('#headerSearch')
let searchOverlay = document.querySelector('#searchOverlay')

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
let isPanelDimActive = false

/* ---------------- Calm Mode ---------------- */
function initializeCalmLayout() {
	if (stage) stage.classList.add('grid')
	document.body.classList.add('calm-mode')
}

/* ---------------- Background Overlay ---------------- */
function syncDimOverlay() {
	document.body.classList.toggle('panel-active', isPanelDimActive)

	if (!searchOverlay) return
	searchOverlay.hidden = !isPanelDimActive
	searchOverlay.style.pointerEvents = isPanelDimActive ? 'auto' : 'none'
}

function setPanelDimState(nextState) {
	isPanelDimActive = Boolean(nextState)
	syncDimOverlay()
}

/* ---------------- Get Are.na Block Content ---------------- */
function getArenaBlockKind(blockData) {
	const arenaType = blockData.type || ''
	const sourceUrl = (blockData.source?.url || '').toLowerCase()
	const attachmentContentType = (blockData.attachment?.content_type || '').toLowerCase()
	const attachmentUrl = (blockData.attachment?.url || '').toLowerCase()
	const attachmentFilename = (blockData.attachment?.file_name || '').toLowerCase()
	const embedType = (blockData.embed?.type || '').toLowerCase()

	const videoExtensions = /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i
	const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i

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

	const isAudio = (
		attachmentContentType.startsWith('audio/') ||
		audioExtensions.test(sourceUrl) ||
		audioExtensions.test(attachmentUrl) ||
		audioExtensions.test(attachmentFilename) ||
		sourceUrl.includes('spotify.com') ||
		sourceUrl.includes('soundcloud.com') ||
		sourceUrl.includes('bandcamp.com') ||
		sourceUrl.includes('mixcloud.com') ||
		sourceUrl.includes('podcast')
	)

	if (arenaType === 'Image') return 'Remember'
	if (attachmentContentType.startsWith('image/')) return 'Remember'
	if (isVideo) return 'See'
	if (isAudio) return 'Hear'
	return 'Read'
}

function getBlockContent(blockId) {
	const block = window.arenaBlocks?.find((entry) => String(entry.id) === String(blockId))
	if (!block) return null

	const blockData = block.data || {}

	const readTextValue = (value) => {
		if (!value) return ''
		if (typeof value === 'string') return value
		if (typeof value === 'object') return value.plain || value.markdown || value.html || ''
		return ''
	}

	const getImageUrl = (imageObj) => {
		if (!imageObj) return null

		return imageObj.large?.src ||
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
		return content
	}

	if (blockType === 'See') {
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
		return content
	}

	if (blockType === 'Hear') {
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
		return content
	}

	if (attachmentType.includes('pdf') || /\.pdf(\?|$)/i.test(sourceUrl) || /\.pdf(\?|$)/i.test(attachmentUrl)) {
		content.pdfSrc = attachmentUrl || sourceUrl
		content.mediaType = 'pdf'
		content.imageSrc = getImageUrl(blockData.image)
		return content
	}

	if (blockData.type === 'Text') {
		content.mediaType = 'text'
		content.text = readTextValue(blockData.content) || readTextValue(blockData.description) || ''
		content.imageSrc = getImageUrl(blockData.image)
		return content
	}

	if (blockData.type === 'Link') {
		content.mediaType = 'link'
		content.mediaHref = sourceUrl || content.href
		content.imageSrc = getImageUrl(blockData.image)
		return content
	}

	if (blockData.embed?.html) {
		content.mediaType = 'embed'
		content.embedHtml = blockData.embed.html
		content.imageSrc = getImageUrl(blockData.image)
		return content
	}

	content.mediaType = 'reading'
	content.imageSrc = getImageUrl(blockData.image)
	return content
}

/* ---------------- Detail Panel ---------------- */
function openDetail(blockId) {
	const content = getBlockContent(blockId)
	if (!content || !gridDetail) return

	if (detailTime) detailTime.textContent = content.time || ''

	if (content.mediaType === 'text') {
		if (detailTitle) detailTitle.style.display = 'none'
		if (detailText) {
			detailText.innerHTML = content.text || ''
			detailText.style.display = content.text ? 'block' : 'none'
			detailText.classList.add('text-block')
		}
	} else {
		if (detailTitle) {
			detailTitle.style.display = 'block'
			detailTitle.textContent = content.title
		}
		if (detailText) {
			detailText.innerHTML = ''
			detailText.style.display = 'none'
			detailText.classList.remove('text-block')
		}
	}

	if (detailLink) detailLink.href = content.href

	if (detailLearnMore) {
		const showLearnMore = content.mediaType === 'link' && Boolean(content.mediaHref)
		detailLearnMore.style.display = showLearnMore ? 'inline-block' : 'none'
		if (showLearnMore) detailLearnMore.href = content.mediaHref
	}

	if (detailMedia) renderMedia(content, detailMedia)

	gridDetail.classList.add('active')
	setPanelDimState(true)
}

function closeGridDetail() {
	if (gridDetail) gridDetail.classList.remove('active')
	setPanelDimState(false)
}

if (detailClose) {
	detailClose.addEventListener('click', closeGridDetail)
}

if (searchOverlay) {
	searchOverlay.addEventListener('click', closeGridDetail)
}

document.addEventListener('keydown', (event) => {
	if (event.key !== 'Escape') return
	closeGridDetail()
})

/* ---------------- Filter Controls ---------------- */
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

function applyFilter(filterType) {
	const normalizedFilter = normalizeFilterValue(filterType)

	if (normalizedFilter === 'all') {
		activeFilters.clear()
		activeFilters.add('all')
	} else {
		activeFilters.delete('all')
		if (activeFilters.has(normalizedFilter)) {
			activeFilters.delete(normalizedFilter)
			if (activeFilters.size === 0) activeFilters.add('all')
		} else {
			activeFilters.add(normalizedFilter)
		}
	}

	filterButtons.forEach((btn) => {
		const btnFilter = normalizeFilterValue(btn.dataset.filter)
		btn.classList.toggle('active', activeFilters.has(btnFilter))
	})

	timeButtons.forEach((btn) => {
		const blockType = btn.dataset.type || 'Read'
		if (activeFilters.has('all')) {
			btn.style.display = ''
			return
		}
		btn.style.display = activeFilters.has(blockType) ? '' : 'none'
	})
}

function bindFilterButtons() {
	filterButtons = document.querySelectorAll('#gridFilters .filter-btn[data-filter]')

	filterButtons.forEach((btn) => {
		if (btn.dataset.listenerAttached === 'true') return
		btn.dataset.listenerAttached = 'true'
		btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
	})
}

if (refreshBlocksBtn) {
	refreshBlocksBtn.textContent = 'Chaos'
	refreshBlocksBtn.addEventListener('click', () => {
		closeGridDetail()
		if (typeof window.randomizeCalmBlocks === 'function') {
			window.randomizeCalmBlocks()
		}
	})
}

/* ---------------- Time Search Functionality ---------------- */
/*
	Search bar functionality intentionally disabled for calm-only mode cleanup.
	Keeping the section title and comments in this file for continuity, but
	search interactions and behaviors are not running.
*/
if (headerSearch) headerSearch.hidden = true
if (searchToggle) searchToggle.setAttribute('aria-hidden', 'true')
if (timeSearchInput) timeSearchInput.value = ''

/* ---------------- Time Button Event Handling ---------------- */
function bindTimeButtons() {
	timeButtons = Array.from(document.querySelectorAll('#timeGrid button'))

	timeButtons.forEach((btn) => {
		if (btn.dataset.listenerAttached === 'true') return
		btn.dataset.listenerAttached = 'true'
		btn.addEventListener('click', () => openDetail(btn.dataset.block))
	})
}

window.addEventListener('arenaBlocksLoaded', () => {
	bindTimeButtons()
	bindFilterButtons()
	applyFilter('all')
	checkBackToTopVisibility()
})

/* ---------------- Initial Load ---------------- */
initializeCalmLayout()
bindFilterButtons()
setPanelDimState(false)

/* ---------------- Back to Top Button ---------------- */
const backToTopBtn = document.querySelector('#backToTop')

function checkBackToTopVisibility() {
	if (!backToTopBtn || !stage) return

	const headerSection = document.querySelector('#viewport > section:first-of-type')
	const headerHeight = headerSection ? headerSection.offsetHeight : 0
	backToTopBtn.classList.toggle('visible', stage.scrollTop > headerHeight)
}

if (stage) {
	stage.addEventListener('scroll', checkBackToTopVisibility)
}

if (backToTopBtn && stage) {
	backToTopBtn.addEventListener('click', () => {
		stage.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	})
}

/* ---------------- Render Media Content ---------------- */
function renderMedia(content, container) {
	container.innerHTML = ''
	container.classList.remove('has-audio-cover', 'has-audio-only')

	if (!content) return

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

	if (content.videoSrc) {
		const video = document.createElement('video')
		video.src = content.videoSrc
		video.controls = true
		video.preload = 'metadata'
		container.appendChild(video)
		return
	}

	if (content.embedHtml) {
		const embedSection = document.createElement('section')
		embedSection.innerHTML = content.embedHtml
		container.appendChild(embedSection)
		return
	}

	if (content.pdfSrc) {
		const iframe = document.createElement('iframe')
		iframe.src = content.pdfSrc
		container.appendChild(iframe)
		return
	}

	if (content.imageSrc) {
		const link = document.createElement('a')
		link.href = content.mediaHref || content.imageSrc
		link.target = '_blank'

		const img = document.createElement('img')
		img.src = content.imageSrc
		img.alt = content.title || 'Block content'

		link.appendChild(img)
		container.appendChild(link)
	}
}
