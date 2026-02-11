const CHANNEL_SLUG = "night-life-is-so-fun";
const CHANNEL_API = "https://api.are.na/v2/channels";

const stage = document.querySelector("#canvas");
const viewport = document.querySelector("#viewport");
const timeGrid = document.querySelector("#timeGrid");
const viewToggle = document.querySelector("#viewToggle");
const searchToggle = document.querySelector("#searchToggle");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const zoomInButton = document.querySelector("#zoomIn");
const zoomOutButton = document.querySelector("#zoomOut");
const dragHintButton = document.querySelector("#dragHint");

const dialog = document.querySelector("#modal");
const modalClose = document.querySelector("#modalClose");
const aside = document.querySelector("#detailAside");
const asideClose = document.querySelector("#asideClose");

const modalPanel = {
	time: document.querySelector("#modalTime"),
	title: document.querySelector("#modalTitle"),
	text: document.querySelector("#modalText"),
	category: document.querySelector("#modalCategory"),
	link: document.querySelector("#modalLink"),
	sourceLink: document.querySelector("#modalSourceLink"),
	mediaLink: document.querySelector("#modalMediaLink"),
	image: document.querySelector("#modalImage"),
	embed: document.querySelector("#modalEmbed"),
	audio: document.querySelector("#modalAudio")
};

const asidePanel = {
	time: document.querySelector("#asideTime"),
	title: document.querySelector("#asideTitle"),
	text: document.querySelector("#asideText"),
	category: document.querySelector("#asideCategory"),
	link: document.querySelector("#asideLink"),
	sourceLink: document.querySelector("#asideSourceLink"),
	mediaLink: document.querySelector("#asideMediaLink"),
	image: document.querySelector("#asideImage"),
	embed: document.querySelector("#asideEmbed"),
	audio: document.querySelector("#asideAudio")
};

let isCalmView = false;
let isPanning = false;
let isSearchOpen = false;
let scale = 1;
let startX = 0;
let startY = 0;
let startScrollLeft = 0;
let startScrollTop = 0;
let activeBlockId = null;
let lastFocusedEl = null;

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;
const PANEL_CLOSE_MS = 420;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const blocksById = new Map();

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function buildFallbackThumbnail(label) {
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
			<defs>
				<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#1f1f1f" />
					<stop offset="100%" stop-color="#2e2e2e" />
				</linearGradient>
			</defs>
			<rect width="640" height="480" fill="url(#g)" />
			<text x="50%" y="50%" text-anchor="middle" fill="#75beb0" font-family="Inter, sans-serif" font-size="48">${label}</text>
		</svg>
	`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getImageUrl(block, size = "square") {
	const image = block.image || {};
	return (
		(image[size] && image[size].url) ||
		(image.thumb && image.thumb.url) ||
		(image.display && image.display.url) ||
		(image.large && image.large.url) ||
		(image.original && image.original.url) ||
		""
	);
}

function getEmbedUrl(block) {
	const embed = block.embed;
	if (!embed) return "";

	if (embed.html) {
		const parsed = new DOMParser().parseFromString(embed.html, "text/html");
		const iframe = parsed.querySelector("iframe");
		if (iframe && iframe.src) return iframe.src;
	}

	return embed.url || "";
}

function getAudioFileUrl(block) {
	const attachment = block.attachment || {};
	const contentType = (attachment.content_type || "").toLowerCase();
	return contentType.startsWith("audio/") ? (attachment.url || "") : "";
}

function getPdfUrl(block) {
	const attachment = block.attachment || {};
	const contentType = (attachment.content_type || "").toLowerCase();
	if (contentType.includes("pdf")) return attachment.url || "";
	return "";
}

function isAudioSource(url = "") {
	return /spotify\.com|soundcloud\.com|bandcamp\.com|mixcloud\.com|podcast|audio/.test(url);
}

function isVideoSource(url = "") {
	return /youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|dailymotion\.com|wistia|video/.test(url);
}

function getCategory(block) {
	const blockClass = (block.class || "").toLowerCase();
	const attachmentType = ((block.attachment || {}).content_type || "").toLowerCase();
	const sourceUrl = (((block.source || {}).url) || "").toLowerCase();
	const embedType = (((block.embed || {}).type) || "").toLowerCase();

	if (blockClass === "image") {
		return { key: "remember", label: "Remember" };
	}

	if (attachmentType.startsWith("audio/") || isAudioSource(sourceUrl)) {
		return { key: "hear", label: "Hear" };
	}

	if (
		attachmentType.startsWith("video/") ||
		isVideoSource(sourceUrl) ||
		embedType === "video" ||
		(blockClass === "media" && !isAudioSource(sourceUrl))
	) {
		return { key: "see", label: "See" };
	}

	if (
		attachmentType.includes("pdf") ||
		blockClass === "attachment" ||
		blockClass === "text" ||
		blockClass === "link"
	) {
		return { key: "read", label: "Read" };
	}

	return { key: "read", label: "Read" };
}

function getTimeLabel(block, index) {
	const connectedAt = block.connected_at || block.created_at || block.updated_at;
	const date = connectedAt ? new Date(connectedAt) : null;

	if (date && !Number.isNaN(date.getTime())) {
		const hh = String(date.getHours()).padStart(2, "0");
		const mm = String(date.getMinutes()).padStart(2, "0");
		return `${hh}:${mm}`;
	}

	const seed = index + 1;
	const fallbackHour = String((seed * 7) % 24).padStart(2, "0");
	const fallbackMinute = String((seed * 13) % 60).padStart(2, "0");
	return `${fallbackHour}:${fallbackMinute}`;
}

function getPrimaryText(block) {
	if (block.content && block.content.trim()) return block.content.trim();
	if (block.description && block.description.trim()) return block.description.trim();
	if (block.source && block.source.title) return block.source.title;
	return "";
}

function normalizeBlock(block, index) {
	const category = getCategory(block);
	const sourceUrl = (block.source && block.source.url) || "";
	const attachmentUrl = ((block.attachment || {}).url) || "";
	const arenaUrl = `https://www.are.na/block/${block.id}`;
	const mediaUrl = sourceUrl || attachmentUrl || arenaUrl;
	const audioUrl = getAudioFileUrl(block);
	const pdfUrl = getPdfUrl(block);
	const embedUrl = getEmbedUrl(block);
	const previewImage = getImageUrl(block, "square") || buildFallbackThumbnail(category.label);
	const detailImage = getImageUrl(block, "display") || getImageUrl(block, "original") || previewImage;
	const title = block.title || block.generated_title || "Untitled block";
	const text = getPrimaryText(block);
	const time = getTimeLabel(block, index);

	return {
		id: String(block.id),
		blockClass: block.class || "Block",
		title,
		text,
		time,
		categoryKey: category.key,
		categoryLabel: category.label,
		previewImage,
		detailImage,
		mediaUrl,
		sourceUrl,
		attachmentUrl,
		arenaUrl,
		audioUrl,
		pdfUrl,
		embedUrl,
		searchableText: [
			title,
			text,
			category.label,
			block.class,
			sourceUrl,
			attachmentUrl
		].join(" ").toLowerCase()
	};
}

function setLink(anchor, href) {
	if (!anchor) return;
	if (href) {
		anchor.href = href;
		anchor.hidden = false;
		return;
	}

	anchor.hidden = true;
	anchor.removeAttribute("href");
}

function clearPanelMedia(panel) {
	panel.embed.replaceChildren();
	panel.embed.hidden = true;

	panel.audio.pause();
	panel.audio.removeAttribute("src");
	panel.audio.load();
	panel.audio.hidden = true;

	panel.image.removeAttribute("src");
	panel.image.alt = "";
	panel.image.hidden = true;

	panel.mediaLink.hidden = true;
	panel.mediaLink.removeAttribute("href");
}

function renderEmbed(panel, item) {
	if (!item.embedUrl) {
		panel.embed.hidden = true;
		return;
	}

	const iframe = document.createElement("iframe");
	iframe.src = item.embedUrl;
	iframe.loading = "lazy";
	iframe.title = `${item.title} media embed`;
	iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
	iframe.allowFullscreen = true;

	panel.embed.replaceChildren(iframe);
	panel.embed.hidden = false;
}

function renderAudioPlayer(panel, item) {
	if (!item.audioUrl) {
		panel.audio.hidden = true;
		return;
	}

	panel.audio.src = item.audioUrl;
	panel.audio.hidden = false;
}

function fillPanel(panel, item) {
	panel.time.textContent = item.time;
	panel.title.textContent = item.title;
	panel.category.textContent = item.categoryLabel;
	panel.text.textContent = item.text || "No text content available for this block.";

	setLink(panel.link, item.arenaUrl);
	setLink(panel.sourceLink, item.sourceUrl || item.attachmentUrl || item.mediaUrl);
	setLink(panel.mediaLink, item.mediaUrl || item.arenaUrl);

	clearPanelMedia(panel);

	panel.image.src = item.detailImage || item.previewImage;
	panel.image.alt = item.title;
	panel.image.hidden = false;
	panel.mediaLink.hidden = false;
	panel.mediaLink.href = item.mediaUrl || item.arenaUrl;

	renderAudioPlayer(panel, item);
	renderEmbed(panel, item);

	if (item.pdfUrl) {
		panel.text.textContent = `${panel.text.textContent}\n\nPDF file available in source link.`;
	}
}

function updateBodyOverlay() {
	const modalOpenInChaos = !isCalmView && dialog.open;
	const asideOpenInCalm = isCalmView && aside.classList.contains("open");
	const shouldDimBody = isSearchOpen || modalOpenInChaos || asideOpenInCalm;

	document.body.classList.toggle("has-body-overlay", shouldDimBody);
}

function closeAside(options = {}) {
	const { preserveSelection = false } = options;

	if (!aside.classList.contains("open")) return;

	aside.classList.remove("open");
	aside.setAttribute("aria-hidden", "true");

	if (!preserveSelection) activeBlockId = null;
	updateBodyOverlay();
}

function closeDialog(options = {}) {
	const { immediate = false, preserveSelection = false } = options;

	if (!dialog.open) return;

	const finalizeClose = () => {
		if (!dialog.open) return;
		dialog.close();
		dialog.classList.remove("closing");
		if (!preserveSelection) activeBlockId = null;
		updateBodyOverlay();
	};

	if (immediate) {
		finalizeClose();
		return;
	}

	dialog.classList.add("closing");
	window.setTimeout(finalizeClose, PANEL_CLOSE_MS);
}

function openDetails(blockId) {
	const item = blocksById.get(String(blockId));
	if (!item) return;

	activeBlockId = item.id;
	lastFocusedEl = document.activeElement;

	if (isCalmView) {
		closeDialog({ immediate: true, preserveSelection: true });
		fillPanel(asidePanel, item);
		aside.classList.add("open");
		aside.setAttribute("aria-hidden", "false");
		asideClose.focus();
		updateBodyOverlay();
		return;
	}

	closeAside({ preserveSelection: true });
	fillPanel(modalPanel, item);
	dialog.classList.remove("closing");
	if (!dialog.open) dialog.showModal();
	modalClose.focus();
	updateBodyOverlay();
}

function createBlockButton(item, index) {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "time content-block";
	button.dataset.blockId = item.id;
	button.dataset.category = item.categoryKey;
	button.dataset.font = String((index % 7) + 1);

	const timeValue = document.createElement("span");
	timeValue.className = "time-value";
	timeValue.textContent = item.time;

	const label = document.createElement("span");
	label.className = "time-label";
	label.textContent = item.categoryLabel;

	const thumb = document.createElement("img");
	thumb.className = "block-thumb";
	thumb.src = item.previewImage;
	thumb.alt = item.title;
	thumb.loading = "lazy";

	const title = document.createElement("span");
	title.className = "block-title";
	title.textContent = item.title;

	button.append(timeValue, label, thumb, title);
	return button;
}

function applySearchFilter(rawQuery) {
	const query = rawQuery.trim().toLowerCase();
	const buttons = timeGrid.querySelectorAll(".content-block");

	buttons.forEach((button) => {
		const item = blocksById.get(button.dataset.blockId);
		const matched = !query || (item && item.searchableText.includes(query));

		button.classList.toggle("search-match", Boolean(query) && matched);
		button.classList.toggle("search-dim", Boolean(query) && !matched);
		button.setAttribute("aria-hidden", query && !matched ? "true" : "false");
	});
}

function centerCanvas() {
	if (isCalmView) return;

	requestAnimationFrame(() => {
		const fieldWidth = window.innerWidth * 3;
		const fieldHeight = window.innerHeight * 3;
		const targetLeft = (fieldWidth * 0.5 * scale) - (stage.clientWidth * 0.5);
		const targetTop = (fieldHeight * 0.5 * scale) - (stage.clientHeight * 0.5);

		stage.scrollLeft = targetLeft;
		stage.scrollTop = targetTop;
	});
}

function getChaosPosition(index, total, width, height) {
	const ratio = Math.sqrt(index / Math.max(total - 1, 1));
	const radiusMin = Math.min(width, height) * 0.25;
	const radiusMax = Math.min(width, height) * 1.25;
	const radius = radiusMin + ((radiusMax - radiusMin) * ratio);
	const angle = index * GOLDEN_ANGLE;

	let x = (width * 0.5) + (Math.cos(angle) * radius);
	let y = (height * 0.5) + (Math.sin(angle) * radius);

	x += ((index * 91) % 180) - 90;
	y += ((index * 47) % 180) - 90;

	const forbiddenLeft = (width * 0.5) - (window.innerWidth * 0.45);
	const forbiddenRight = (width * 0.5) + (window.innerWidth * 0.45);
	const forbiddenTop = (height * 0.5) - (window.innerHeight * 0.28);
	const forbiddenBottom = (height * 0.5) + (window.innerHeight * 0.58);

	if (x > forbiddenLeft && x < forbiddenRight && y > forbiddenTop && y < forbiddenBottom) {
		y = forbiddenTop - 100 - ((index % 4) * 40);
	}

	const margin = 100;
	x = clamp(x, margin, width - margin);
	y = clamp(y, margin, height - margin);
	return { x, y };
}

function positionChaosBlocks() {
	if (isCalmView) return;

	const buttons = [...timeGrid.querySelectorAll(".content-block")];
	if (buttons.length === 0) return;

	const fieldWidth = window.innerWidth * 3;
	const fieldHeight = window.innerHeight * 3;

	buttons.forEach((button, index) => {
		const position = getChaosPosition(index, buttons.length, fieldWidth, fieldHeight);
		button.style.left = `${position.x}px`;
		button.style.top = `${position.y}px`;
	});
}

function renderBlocks(items) {
	timeGrid.replaceChildren();

	const fragment = document.createDocumentFragment();
	items.forEach((item, index) => {
		const button = createBlockButton(item, index);
		fragment.appendChild(button);
	});

	timeGrid.appendChild(fragment);
	timeGrid.setAttribute("aria-busy", "false");

	if (!isCalmView) {
		positionChaosBlocks();
		setTimeout(centerCanvas, 50);
	}
}

function showLoadError() {
	timeGrid.setAttribute("aria-busy", "false");
	timeGrid.innerHTML = `
		<p class="status-message">
			Unable to load channel blocks right now. Try refreshing in a moment.
		</p>
	`;
}

async function fetchChannelBlocks(slug) {
	const perPage = 100;
	let page = 1;
	let totalLength = Infinity;
	const allBlocks = [];

	while (allBlocks.length < totalLength) {
		const response = await fetch(`${CHANNEL_API}/${slug}?per=${perPage}&page=${page}`);
		if (!response.ok) {
			throw new Error(`Are.na request failed with status ${response.status}`);
		}

		const data = await response.json();
		const pageContents = Array.isArray(data.contents) ? data.contents : [];
		totalLength = Number.isFinite(data.length) ? data.length : pageContents.length;

		allBlocks.push(...pageContents);
		if (pageContents.length < perPage) break;
		page += 1;
	}

	return allBlocks;
}

async function loadChannelContent() {
	try {
		const rawBlocks = await fetchChannelBlocks(CHANNEL_SLUG);
		const normalized = rawBlocks.map((block, index) => normalizeBlock(block, index));

		blocksById.clear();
		normalized.forEach((item) => blocksById.set(item.id, item));
		renderBlocks(normalized);
	} catch (error) {
		console.error("Failed to load channel blocks:", error);
		showLoadError();
	}
}

function setSearchOpen(nextIsOpen) {
	isSearchOpen = nextIsOpen;
	searchForm.classList.toggle("open", isSearchOpen);
	searchToggle.setAttribute("aria-expanded", String(isSearchOpen));

	if (isSearchOpen) {
		searchInput.focus();
		searchInput.select();
	}

	updateBodyOverlay();
}

function applyZoom(step) {
	if (isCalmView) return;

	const rect = stage.getBoundingClientRect();
	const midpointX = rect.width * 0.5;
	const midpointY = rect.height * 0.5;
	const contentX = (stage.scrollLeft + midpointX) / scale;
	const contentY = (stage.scrollTop + midpointY) / scale;
	const nextScale = clamp(scale + step, MIN_SCALE, MAX_SCALE);

	if (nextScale === scale) return;

	scale = nextScale;
	viewport.style.transform = `scale(${scale})`;
	stage.scrollLeft = (contentX * scale) - midpointX;
	stage.scrollTop = (contentY * scale) - midpointY;
}

function updateFooterControls() {
	const disableControls = isCalmView;
	zoomInButton.disabled = disableControls;
	zoomOutButton.disabled = disableControls;
	dragHintButton.disabled = disableControls;
}

function setView(nextIsCalmView) {
	isCalmView = nextIsCalmView;
	stage.classList.toggle("grid", isCalmView);

	viewToggle.classList.toggle("active", isCalmView);
	viewToggle.setAttribute("aria-pressed", String(isCalmView));
	viewToggle.textContent = isCalmView ? "Chaos View" : "Calm View";

	if (isCalmView) {
		scale = 1;
		viewport.style.transform = "scale(1)";
		closeDialog({ immediate: true, preserveSelection: true });
		if (activeBlockId) openDetails(activeBlockId);
	} else {
		closeAside({ preserveSelection: true });
		if (activeBlockId) openDetails(activeBlockId);
		positionChaosBlocks();
		setTimeout(centerCanvas, 50);
	}

	updateFooterControls();
	updateBodyOverlay();
}

viewToggle.addEventListener("click", () => {
	setView(!isCalmView);
});

searchToggle.addEventListener("click", () => {
	setSearchOpen(!isSearchOpen);
});

searchForm.addEventListener("submit", (event) => {
	event.preventDefault();
	applySearchFilter(searchInput.value);
	// Enter should remove the dark body opacity.
	setSearchOpen(false);
});

searchInput.addEventListener("input", () => {
	applySearchFilter(searchInput.value);
});

timeGrid.addEventListener("click", (event) => {
	const button = event.target.closest(".content-block");
	if (!button) return;
	openDetails(button.dataset.blockId);
});

modalClose.addEventListener("click", () => {
	closeDialog();
});

dialog.addEventListener("click", (event) => {
	if (event.target === dialog) closeDialog();
});

dialog.addEventListener("cancel", (event) => {
	event.preventDefault();
	closeDialog();
});

dialog.addEventListener("close", () => {
	if (!dialog.classList.contains("closing")) {
		dialog.classList.remove("closing");
		updateBodyOverlay();
	}

	if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
		lastFocusedEl.focus();
	}
});

asideClose.addEventListener("click", () => {
	closeAside();
});

zoomInButton.addEventListener("click", () => {
	applyZoom(0.15);
});

zoomOutButton.addEventListener("click", () => {
	applyZoom(-0.15);
});

document.addEventListener("keydown", (event) => {
	if (event.key !== "Escape") return;

	if (isSearchOpen) setSearchOpen(false);
	if (aside.classList.contains("open")) closeAside();
});

stage.addEventListener("wheel", (event) => {
	if (isCalmView || !event.ctrlKey) return;
	event.preventDefault();

	const rect = stage.getBoundingClientRect();
	const mouseX = event.clientX - rect.left;
	const mouseY = event.clientY - rect.top;
	const contentX = (stage.scrollLeft + mouseX) / scale;
	const contentY = (stage.scrollTop + mouseY) / scale;
	const nextScale = clamp(scale + (event.deltaY * -0.01), MIN_SCALE, MAX_SCALE);

	if (nextScale === scale) return;

	scale = nextScale;
	viewport.style.transform = `scale(${scale})`;
	stage.scrollLeft = (contentX * scale) - mouseX;
	stage.scrollTop = (contentY * scale) - mouseY;
}, { passive: false });

stage.addEventListener("pointerdown", (event) => {
	if (isCalmView || dialog.open || aside.classList.contains("open")) return;

	const clickedInteractive = event.target.closest("button, a, input, dialog, aside");
	if (clickedInteractive) return;

	isPanning = true;
	startX = event.clientX;
	startY = event.clientY;
	startScrollLeft = stage.scrollLeft;
	startScrollTop = stage.scrollTop;
	stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
	if (!isPanning) return;
	const deltaX = event.clientX - startX;
	const deltaY = event.clientY - startY;

	stage.scrollLeft = startScrollLeft - deltaX;
	stage.scrollTop = startScrollTop - deltaY;
});

function stopPanning() {
	isPanning = false;
}

stage.addEventListener("pointerup", stopPanning);
stage.addEventListener("pointercancel", stopPanning);

window.addEventListener("resize", () => {
	if (!isCalmView) {
		positionChaosBlocks();
		centerCanvas();
	}
});

setView(false);
setTimeout(centerCanvas, 100);
loadChannelContent();