/**
 * Gives every controlled <video> in the body (not the silent autoplay clips) a big themed
 * play button. Before the first play the native controls are hidden and the whole frame
 * is the button; once playing, the native controls take over, and the button comes back
 * whenever the video is paused or ends. The native bar stays native on purpose: a full
 * custom scrubber, volume and fullscreen UI is where video players get buggy.
 *
 * Mirrors `ditherImages`: the video is wrapped in a `.video-player` shell styled by
 * log.css, and the body is re-scanned on subtree mutations for swapped panel bodies.
 */
const PROCESSED = 'videoPlayerProcessed';

const PLAY_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5z" fill="currentColor"/></svg>';

// Speaker, muted (with a cross) and sounding (with waves). Stroke icons on the 24 grid.
const MUTED_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" stroke="none"/><path d="M16 9.5l4 5M20 9.5l-4 5"/></svg>';
const SOUND_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" stroke="none"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/></svg>';

/** A silent autoplay clip with a soundtrack worth hearing gets a mute toggle. */
function wrapClip(video: HTMLVideoElement) {
	if (video.dataset[PROCESSED] === 'true') return;
	if (video.dataset.sound !== 'true') return;
	const parent = video.parentNode;
	if (!parent) return;
	video.dataset[PROCESSED] = 'true';

	const shell = document.createElement('div');
	shell.className = 'video-player video-player--clip';

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'video-player__mute';

	parent.insertBefore(shell, video);
	shell.append(video, button);

	const render = () => {
		const muted = video.muted;
		button.innerHTML = muted ? MUTED_ICON : SOUND_ICON;
		button.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
		shell.dataset.muted = muted ? 'true' : 'false';
	};
	render();

	button.addEventListener('click', () => {
		video.muted = !video.muted;
		// lazyVideo re-mutes clips as they scroll into view unless told the viewer chose sound.
		video.dataset.unmuted = video.muted ? 'false' : 'true';
		if (!video.muted && video.paused) video.play().catch(() => {});
		render();
	});
	video.addEventListener('volumechange', render);
}

function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '';
	const total = Math.round(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

function wrap(video: HTMLVideoElement) {
	if (video.dataset[PROCESSED] === 'true') return;
	if (video.dataset.autoplay === 'true' || video.autoplay) {
		wrapClip(video);
		return;
	}
	if (!video.controls) return;
	const parent = video.parentNode;
	if (!parent) return;
	video.dataset[PROCESSED] = 'true';

	const shell = document.createElement('div');
	shell.className = 'video-player';
	shell.dataset.state = 'idle';

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'video-player__play';
	button.setAttribute('aria-label', 'Play video');

	const icon = document.createElement('span');
	icon.className = 'video-player__icon';
	icon.innerHTML = PLAY_ICON;

	const time = document.createElement('span');
	time.className = 'video-player__time';
	time.setAttribute('aria-hidden', 'true');

	button.append(icon, time);

	parent.insertBefore(shell, video);
	shell.append(video, button);

	// Until the first play the frame is the button; the native bar would only clutter it.
	video.controls = false;

	const setState = (state: 'idle' | 'playing' | 'paused') => {
		shell.dataset.state = state;
		button.setAttribute('aria-label', state === 'playing' ? 'Pause video' : 'Play video');
	};

	const showDuration = () => {
		time.textContent = formatDuration(video.duration);
	};
	if (video.readyState >= 1) showDuration();
	video.addEventListener('loadedmetadata', showDuration);
	video.addEventListener('durationchange', showDuration);

	button.addEventListener('click', () => {
		if (video.paused || video.ended) {
			video.controls = true;
			video.play().catch(() => {});
		} else {
			video.pause();
		}
	});

	video.addEventListener('play', () => setState('playing'));
	video.addEventListener('playing', () => setState('playing'));
	video.addEventListener('pause', () => setState(video.ended ? 'idle' : 'paused'));
	video.addEventListener('ended', () => setState('idle'));
}

export function videoPlayers(node: HTMLElement) {
	const scan = (root: HTMLElement) => {
		if (root.tagName === 'VIDEO') wrap(root as HTMLVideoElement);
		root.querySelectorAll<HTMLVideoElement>('video').forEach(wrap);
	};

	scan(node);

	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type !== 'childList') continue;
			m.addedNodes.forEach((added) => {
				if (added.nodeType === Node.ELEMENT_NODE) scan(added as HTMLElement);
			});
		}
	});
	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
