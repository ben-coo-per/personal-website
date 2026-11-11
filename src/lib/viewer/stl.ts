/**
 * The STL viewer behind `Model` / `modelViewers`: one three.js scene per stage, the mesh
 * centred and framed, lit softly, slowly turning until the viewer takes the orbit.
 * Imported on demand, so three only ships to pages that show a model.
 *
 * Kept deliberately small: rotate only (no zoom, so the wheel still scrolls the page;
 * no pan), vertical touch drags keep scrolling the page, and the loop runs only while
 * the stage is on screen.
 */
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ViewerHandle = { destroy(): void };

function cssColor(el: HTMLElement, name: string, fallback: string): THREE.Color {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	try {
		return new THREE.Color(raw || fallback);
	} catch {
		return new THREE.Color(fallback);
	}
}

export function mount(stage: HTMLElement, src: string): ViewerHandle {
	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
	} catch {
		stage.dataset.modelState = 'error';
		return { destroy() {} };
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	const canvas = renderer.domElement;
	canvas.className = 'model__canvas';
	stage.appendChild(canvas);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);

	// Mesh colour: `--model-color` where a page sets it, else the page's ink. The cast
	// light (`--model-light`) tints the shadow side and the hover glow; amber by default.
	const has = (name: string) => !!getComputedStyle(stage).getPropertyValue(name).trim();
	const ink = has('--model-color') ? cssColor(stage, '--model-color', '#f5f2eb') : cssColor(stage, '--ink', '#f5f2eb');
	const amber = cssColor(stage, '--amber', '#fbbf24');
	const cast = has('--model-light') ? cssColor(stage, '--model-light', '#fbbf24') : amber;
	// Ambient: a neutral sky above, a little of the cast colour bouncing up from below.
	scene.add(new THREE.HemisphereLight(0xffffff, cast.clone().multiplyScalar(0.22), 0.85));
	const key = new THREE.DirectionalLight(0xffffff, 1.6);
	key.position.set(1.2, 1.6, 1.0);
	scene.add(key);
	const fill = new THREE.DirectionalLight(cast, 0.5);
	fill.position.set(-1.4, -0.4, -1.0);
	scene.add(fill);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.autoRotate = true;
	controls.autoRotateSpeed = 1.1;
	// OrbitControls writes an inline cursor on the canvas ('auto' by default), which beats
	// any stylesheet; ask it for the hand instead, open at rest and closed while dragging.
	controls.cursorStyle = 'grab';
	// Dragging: stop the idle turn and let the CSS swap the cursor to a closed hand.
	controls.addEventListener('start', () => {
		controls.autoRotate = false;
		stage.dataset.modelGrabbing = 'true';
	});
	controls.addEventListener('end', () => {
		delete stage.dataset.modelGrabbing;
	});
	// OrbitControls sets touch-action: none; give vertical swipes back to the page.
	canvas.style.touchAction = 'pan-y';

	let mesh: THREE.Mesh | null = null;
	const material = new THREE.MeshStandardMaterial({
		color: ink.clone().multiplyScalar(0.82),
		roughness: 0.58,
		metalness: 0.08
	});

	// Hover: the mesh warms a touch (eased in the render loop), so the thing you can grab
	// answers the pointer the way a button would. Framed stages also brighten their rule in CSS.
	const idleGlow = new THREE.Color(0x000000);
	const hoverGlow = cast.clone().multiplyScalar(0.14);
	let glowTarget = idleGlow;
	const setHover = (on: boolean) => {
		glowTarget = on ? hoverGlow : idleGlow;
		if (on) stage.dataset.modelHover = 'true';
		else delete stage.dataset.modelHover;
	};
	const onEnter = (e: PointerEvent) => {
		if (e.pointerType === 'mouse') setHover(true);
	};
	const onLeave = () => setHover(false);
	stage.addEventListener('pointerenter', onEnter);
	stage.addEventListener('pointerleave', onLeave);

	const frame = (geometry: THREE.BufferGeometry) => {
		geometry.computeVertexNormals();
		geometry.center();
		geometry.computeBoundingSphere();
		const radius = geometry.boundingSphere?.radius ?? 1;
		mesh = new THREE.Mesh(geometry, material);
		// STLs from CAD are usually Z-up; show them the way they sit on the bench.
		mesh.rotation.x = -Math.PI / 2;
		scene.add(mesh);

		// The bounding sphere overstates flat parts, so frame a little inside it.
		const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2)) * 0.92;
		camera.near = distance / 100;
		camera.far = distance * 10;
		camera.position.set(distance * 0.62, distance * 0.46, distance * 0.64);
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();
		controls.target.set(0, 0, 0);
		controls.update();
		stage.dataset.modelState = 'ready';
	};

	new STLLoader().load(
		src,
		frame,
		undefined,
		() => {
			stage.dataset.modelState = 'error';
		}
	);

	const resize = () => {
		const w = stage.clientWidth;
		const h = stage.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	};
	resize();
	const ro = new ResizeObserver(resize);
	ro.observe(stage);

	let raf = 0;
	let visible = false;
	const tick = () => {
		raf = 0;
		if (!visible) return;
		controls.update();
		material.emissive.lerp(glowTarget, 0.14);
		renderer.render(scene, camera);
		raf = requestAnimationFrame(tick);
	};
	const io = new IntersectionObserver(
		(entries) => {
			visible = entries.some((e) => e.isIntersecting);
			if (visible && !raf) raf = requestAnimationFrame(tick);
		},
		{ threshold: 0 }
	);
	io.observe(stage);

	return {
		destroy() {
			visible = false;
			if (raf) cancelAnimationFrame(raf);
			io.disconnect();
			ro.disconnect();
			stage.removeEventListener('pointerenter', onEnter);
			stage.removeEventListener('pointerleave', onLeave);
			delete stage.dataset.modelHover;
			delete stage.dataset.modelGrabbing;
			controls.dispose();
			mesh?.geometry.dispose();
			material.dispose();
			renderer.dispose();
			canvas.remove();
		}
	};
}
