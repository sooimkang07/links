/* ---------------- Variable Setups ---------------- */
	/* ----- I'm setting the variables as we learned in class, so I'm grabbing the element with the if #canvas with the first line.  ----- */
	let stage = document.querySelector("#canvas");
	let viewport = document.querySelector("#viewport");

	let toggle = document.querySelector("#viewToggle");

	let dialog = document.querySelector("#modal");
	let modalClose = document.querySelector("#modalClose");
	let modalTime = document.querySelector("#modalTime");
	let modalTitle = document.querySelector("#modalTitle");
	let modalText = document.querySelector("#modalText");
	let modalLink = document.querySelector("#modalLink");
	let modalMediaLink = document.querySelector("#modalMediaLink");
	let modalImage = document.querySelector("#modalImage");

	let timeButtons = (document.querySelectorAll("#timeGrid button"));

	
	/* ---------------- Canvas ---------------- */
	// I wanted the user to be able to toggle between the canvas vs. grid mode with different grid layouts for each to the main, so I needed a way to track which view the user was in. 
	// I referenced this article: https://www.freecodecamp.org/news/what-are-falsey-values-in-javascript/
	// From my understanding, this boolean value establishes the view state of the user so let isGridView = false means the user is in canvas view.

	let isGridView = false;

	// I wanted users to be able to freely zoom in and out of the main in canvas view exactly like how Figjam operates, so the user can freely explore all the blocks.
	// With a combination of references, I knew I needed to start off by establishing scale variables for my zoom function: 
		// https://stackoverflow.com/questions/64835486/how-to-make-an-infinite-html5-canvas-which-can-be-zoomed-and-panned 
		// https://www.sandromaglione.com/articles/infinite-canvas-html-with-zoom-and-pan 
		// https://tympanus.net/codrops/2026/01/07/infinite-canvas-building-a-seamless-pan-anywhere-image-space/  
	// From my understanding, scale = 1 establishes the current zoom level (so no change from default at 1), then min_scale is how far you can zoom out and the opposite for max_scale of how far you can zoom in. 
	let scale = 1;
	let MIN_SCALE = 0.6;
	let MAX_SCALE = 2.5;

	// I wanted users to be able to drag around the canvas (also like Figjam) to add to the overall experience of freely moving around aka never really knowing where you are. 
	// With a combination of references, I knew I needed to start off by establishing variables for how much x-axis and y-axis is "offset" from the panning triggered by the mousepad:
		// https://stackoverflow.com/questions/64835486/how-to-make-an-infinite-html5-canvas-which-can-be-zoomed-and-panned 
		// https://www.sandromaglione.com/articles/infinite-canvas-html-with-zoom-and-pan 
		// https://tympanus.net/codrops/2026/01/07/infinite-canvas-building-a-seamless-pan-anywhere-image-space/ 
	// From my understanding, let isPanning = false is distinguishing whether or not the area is currently being dragged or not. startX/Y is where the drag started. startScrollLeft/Top is where the canvas was scrolled at the start. 
	let isPanning = false;
	let startX = 0;
	let startY = 0;
	let startScrollLeft = 0;
	let startScrollTop = 0;


	/* ---------------- Hard-coding content blocks in Modal ---------------- */
	// These will obviously be later plugged in with the CMS, but for now, I just have the content living in my local repo and linked externally to their sources.
	// I wanted each time button to open a different modal with its own image, link, and description, but for this first iteration I’m not connecting a CMS yet so I needed a simple way to fake the “database”, but I couldn't hard-code the actual individual content elements (<audio> <video> etc.) in this modal unless I did an aside? but I wanted it to be a modal like we learned in class.
	// I referenced how to structure JS objects and access values by a key:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors
	// From my understanding, this object is basically a lookup table: the keys (like "0112") match the button’s data-block value, and then the JS does blockContentById[blockId] to grab the right time/title/text/link/image and fill the modal with it.
	let blockContentById = {
		"0112": {
			time: "01:12",
			title: "After midnight I'm feeling kinda freaky",
			text: "Chappell Roan · The Rise and Fall of a Midwest Princess · Song · 2023",
			href: "https://www.are.na/block/43291462",
			mediaHref: "https://open.spotify.com/track/4rlQza35DE4Prh5yonxnCs?si=511e3c4998f34ce3",
			imageSrc: "afterMidnight.jpg",
			imageAlt: "Chappell Roan styled as a pageant queen in a tiara and sash, wearing a glittery turquoise dress at a glowing vanity for her The Rise and Fall of a Midwest Princess album cover."
		},
		"0247": {
			time: "02:47",
			title: "It's Saturday Night Live!",
			text: "SNL Season 48 Opening Credits // Uploaded by SNL Clips on 2022-10-17 // Cover image: https://fontsinuse.com/uses/49512/saturday-night-live-opening-intro-titles-2022",
			href: "https://www.are.na/block/43156025",
			mediaHref: "https://www.youtube.com/watch?v=_k8sMBTSExc",
			imageSrc: "snl.jpeg",
			imageAlt: "Saturday Night Live’ title over a nighttime city skyline and river"
		},
		"0305": {
			time: "03:05",
			title: "the clock strikes twelve",
			text: "The walk back home // Sound of high heels and a church bell // Audio clip: https://pixabay.com/sound-effects/film-special-effects-a-woman-in-high-heels-going-out-for-the-night-32518/ // Cover image: https://www.pinterest.com/pin/957155727056215825/",
			href: "https://www.are.na/block/43159823?blockId=43159823&blockProfileId=sophia-bae-zsvqiaw7cdm&blockChannelId=night-life-is-so-fun&mode=Show&intent=title",
			mediaHref: "https://www.are.na/sophia-bae-zsvqiaw7cdm/night-life-is-so-fun",
			imageSrc: "churchBells.jpg",
			imageAlt: "Two people walking along a dimly lit cobblestone street at night under a single streetlamp"
		},
		"0033": {
			time: "00:33",
			title: "what's the vibe?",
			text: "Nightlife as Form by Madison Moore, 2016",
			href: "https://www.are.na/block/43158032",
			imageSrc: "nightlifeAsForm.gif",
			imageAlt: "Abstract blurred light forms in red and blue, resembling neon streaks and reflections at night"
		},
		"0418": {
			time: "04:18",
			title: "more alive",
			text: "I often think that the night is more alive and more richly colored than the day.",
			href: "https://www.are.na/block/43160381?blockId=43160381&blockProfileId=sophia-bae-zsvqiaw7cdm&blockChannelId=night-life-is-so-fun&mode=Show&intent=content",
		},
		"0541": {
			time: "05:41",
			title: "night view",
			text: "Night view on the balcony",
			href: "https://www.are.na/block/8507159",
			mediaHref: "https://www.are.na/block/8507159",
			imageSrc: "nightView.jpg",
			imageAlt: "Nighttime cityscape with a dimly lit highway curving along a river, scattered building lights reflecting on the water"
		},
		"0159": {
			time: "01:59",
			title: "nightlife section",
			text: "Nightlife - New York Magazine // See an archive of all nightlife stories published on the New York Media network, which includes NYMag, The Cut, Vulture, and Grub Street. // Cover image: https://www.pinterest.com/pin/431290101834231421/",
			href: "https://www.are.na/block/43161055",
			mediaHref: "https://nymag.com/tags/nightlife/",
			imageSrc: "nightlifeSection.jpg",
			imageAlt: "Magazine spread showing a lively nightclub scene with people laughing, dancing, and sitting at a bar under warm, crowded lighting"
		}
	};


/* ---------------- Centering Canvas ---------------- */
// After every refresh, I wanted the user to be returned to the default beginning position centered in the canvas, so they’re not lost somewhere random on load.
// I referenced a mix of articles to understand this: 
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
	// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
// From my understanding, this function calculates the center of the giant 300vw x 300vh canvas and programmatically scrolls the main container so the visible viewport lines up with that center, while accounting for the current zoom level.
function centerCanvas() {
	if (isGridView) return;

	requestAnimationFrame(() => {
		const fieldW = window.innerWidth * 3;
		const fieldH = window.innerHeight * 3;

		const targetLeft = (fieldW * 0.5 * scale) - (stage.clientWidth * 0.5);
		const targetTop = (fieldH * 0.5 * scale) - (stage.clientHeight * 0.5);

		stage.scrollLeft = targetLeft;
		stage.scrollTop = targetTop;
	});
}


/* ---------------- Canvas/Grid View Toggle ---------------- */
// I wanted the user to be able to switch between a freeform canvas experience and a more structured grid layout depending on how they want to explore the content.
// I referenced how class toggling works in JS: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
// From my understanding, this function flips the isGridView boolean, adds or removes the .grid class on main, updates the button text, and resets zoom when switching into grid view.
function setView(nextIsGridView) {
	isGridView = nextIsGridView;

	stage.classList.toggle("grid", isGridView);

	toggle.classList.toggle("active", !isGridView);
	toggle.textContent = isGridView ? "Canvas View" : "Grid View";

	if (isGridView) {
		scale = 1;
		if (viewport) viewport.style.transform = "scale(1)";
		return;
	}

	setTimeout(centerCanvas, 50);
}

toggle.addEventListener("click", () => setView(!isGridView));


/* ---------------- Dialog Modal / Opening + Closing ---------------- */
// I wanted each time block to open a side panel with its own content instead of navigating away from the canvas.
// I referenced the native dialog element and modal behavior: // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
// From my understanding, openDialog() pulls the correct content from blockContentById using the data-block value, fills in the modal text/image/link, and then opens the dialog.
function openDialog(blockId) {
	const content = blockContentById[blockId];
	if (!content) return;

	lastFocusedEl = document.activeElement;

	modalTime.textContent = content.time;
	modalTitle.textContent = content.title;
	modalText.textContent = content.text;
	modalLink.href = content.href;

	if (modalMediaLink && content.mediaHref) modalMediaLink.href = content.mediaHref;

	if (modalImage && content.imageSrc) {
		modalImage.src = content.imageSrc;
		if (content.imageAlt) modalImage.alt = content.imageAlt;
	}

	dialog.classList.remove("closing");
	dialog.showModal();
	modalClose.focus();
}


// I wanted the modal to slide out smoothly instead of instantly disappearing.
// I referenced timing UI animations with JS: // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, this adds a closing class to trigger the CSS animation, waits for it to finish, then actually closes the dialog.
function closeDialog() {
	if (!dialog.open) return;

	dialog.classList.add("closing");
	window.setTimeout(() => {
		dialog.close();
		dialog.classList.remove("closing");
	}, 400);
}


/* ---------------- Modal Event Handling ---------------- */
// I wanted each time button to open its corresponding modal content.
// I referenced addEventListener and dataset usage:
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
// From my understanding, this loops through all the time buttons and uses the data-block value as a key to open the correct modal content.
timeButtons.forEach((btn) => {
	btn.addEventListener("click", () => openDialog(btn.dataset.block));
});


// I wanted users to be able to close the modal in multiple intuitive ways (close button, clicking backdrop, escape key).
// I referenced dialog events: // https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
// From my understanding, these listeners cover all the standard dismissal patterns and restore focus when the modal closes.
modalClose.addEventListener("click", closeDialog);

dialog.addEventListener("click", (event) => {
	if (event.target === dialog) closeDialog();
});

dialog.addEventListener("cancel", (event) => {
	event.preventDefault();
	closeDialog();
});

dialog.addEventListener("close", () => {
	if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
		lastFocusedEl.focus();
	}
});


/* ---------------- Canvas Zoom ---------------- */
// I wanted users to be able to zoom in and out of the canvas using trackpad gestures, similar to Figma or FigJam.
// I referenced wheel events and scaling math:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
	// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/transform
// From my understanding, this listens for ctrl + scroll, calculates a new scale value within limits, applies it to the viewport, and adjusts scroll so the zoom centers around the cursor.
stage.addEventListener("wheel", (e) => {
	if (isGridView) return;
	if (!e.ctrlKey) return;

	e.preventDefault();

	const rect = stage.getBoundingClientRect();
	const mx = e.clientX - rect.left;
	const my = e.clientY - rect.top;

	const contentX = (stage.scrollLeft + mx) / scale;
	const contentY = (stage.scrollTop + my) / scale;

	const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + (e.deltaY * -0.01)));
	if (next === scale) return;

	scale = next;
	viewport.style.transform = `scale(${scale})`;

	stage.scrollLeft = (contentX * scale) - mx;
	stage.scrollTop = (contentY * scale) - my;
}, { passive: false });


/* ---------------- Canvas Drag ---------------- */
// I wanted users to be able to click and drag the canvas to move around freely instead of relying on scrollbars.
// I referenced pointer events for drag interactions: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
// From my understanding, pointerdown starts tracking movement, pointermove updates the scroll position based on cursor movement, and pointerup stops the drag.
stage.addEventListener("pointerdown", (event) => {
	if (isGridView) return;
	if (dialog.open) return;

	const clickedInteractive = event.target.closest("button, a, dialog");
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

	const dx = event.clientX - startX;
	const dy = event.clientY - startY;

	stage.scrollLeft = startScrollLeft - dx;
	stage.scrollTop = startScrollTop - dy;
});

function stopPanning() {
	isPanning = false;
}

stage.addEventListener("pointerup", stopPanning);
stage.addEventListener("pointercancel", stopPanning);


/* ---------------- Initial Load ---------------- */
// I wanted the site to load in canvas view by default and immediately center the user.
// I referenced basic function calls and timing: // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
// From my understanding, this initializes the view state and recenters the canvas shortly after load so layout values are ready.
setView(false);
setTimeout(centerCanvas, 100);