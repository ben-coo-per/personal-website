/**
 * Copy and data for the PIGEON project page, carried over from the final
 * presentation (github.com/ben-coo-per/FINAL_presentation, src/lib/content/*).
 * Strings are the deck's own wording; images are filenames in the project's
 * content folder, resolved with the page's `asset()` helper.
 */

export interface Tweet {
	type: 'tweet';
	avatar: string;
	name: string;
	handle: string;
	platform?: 'x' | 'truthsocial';
	text: string;
	timestamp: string;
	metrics: { reposts: number; likes: number; views?: number };
	caption: string;
	source: string;
	date: string;
	archiveUrl?: string;
}

export interface Shot {
	type: 'image';
	src: string;
	caption: string;
	alt: string;
	source: string;
	date: string;
}

export type Evidence = Tweet | Shot;

export interface Stop {
	number: string;
	label: string;
	sublabel: string;
	/** Gantt bar placement, in % of the row (from the deck's HookTimeline). */
	offset: number;
	width: number;
	items: Evidence[];
}

export const caseStudy: Stop[] = [
	{
		number: '01',
		label: 'Official statements',
		sublabel: 'T + 2 hours',
		offset: 2,
		width: 35,
		items: [
			{
				type: 'tweet',
				avatar: 'case-av-dhs.webp',
				name: 'Department of Homeland Security',
				handle: 'DHSgov',
				text: 'Today, ICE officers in Minneapolis were conducting targeted operations when rioters began blocking ICE officers and one of these violent rioters weaponized her vehicle, attempting to run over our law enforcement officers in an attempt to kill them—an act of domestic terrorism.\n\nAn ICE officer, fearing for his life, the lives of his fellow law enforcement and the safety of the public, fired defensive shots.',
				timestamp: '11:45 AM · Jan 7, 2026',
				metrics: { reposts: 21000, likes: 97000, views: 28_400_000 },
				caption: 'DHS statement post',
				source: 'DHS / X',
				date: 'Jan 7, 2026',
				archiveUrl: 'https://archive.ph/QG6Op'
			},
			{
				type: 'tweet',
				avatar: 'case-av-tricia.webp',
				name: 'Tricia McLaughlin',
				handle: 'TriciaOhio',
				text: 'Today, ICE officers in Minneapolis were conducting targeted operations when rioters began blocking  ICE officers and one of these violent rioters weaponized her vehicle, attempting to run over our law enforcement officers in an attempt to kill them—an act of domestic terrorism.',
				timestamp: '11:41 AM · Jan 7, 2026',
				metrics: { reposts: 15200, likes: 19000, views: 11_200_000 },
				caption: 'DHS Spokesperson statement post',
				source: 'Tricia McLaughlin / X',
				date: 'Jan 7, 2026',
				archiveUrl: 'https://archive.ph/RkOF8'
			},
			{
				type: 'image',
				src: 'case-noem.webp',
				caption: 'DHS Secretary Noem speaks on the fatal shooting',
				alt: 'DHS Secretary Noem at a press conference, captioned with the headline of her statement',
				source: 'KSTP 5 Eyewitness News / YouTube',
				date: 'Jan 7, 2026'
			},
			{
				type: 'tweet',
				platform: 'truthsocial',
				avatar: 'case-av-djt.webp',
				name: 'Donald J. Trump',
				handle: 'realDonaldTrump',
				text: 'I have just viewed the clip of the event which took place in Minneapolis, Minnesota. It is a horrible thing to watch. The woman screaming was, obviously, a professional agitator, and the woman driving the car was very disorderly, obstructing and resisting, who then violently, willfully, and viciously ran over the ICE Officer, who seems to have shot her in self defense.',
				timestamp: '2:28 PM · Jan 7, 2026',
				metrics: { reposts: 31000, likes: 142000, views: 9_100_000 },
				caption: 'Presidential post',
				source: 'Truth Social / X repost',
				date: 'Jan 7, 2026',
				archiveUrl: 'https://archive.ph/aJSkN'
			}
		]
	},
	{
		number: '02',
		label: 'Citizen footage',
		sublabel: 'Filmed at T+0, surfaced in pieces',
		offset: 10,
		width: 52,
		items: [
			{
				type: 'image',
				src: 'case-angle2.webp',
				caption: 'Bystander phone footage, street level',
				alt: 'Phone video still of the maroon Honda Pilot stopped on a snowy residential street, a bystander in the road and agents at the vehicle',
				source: 'Bystander / X',
				date: 'Jan 7, 2026'
			},
			{
				type: 'image',
				src: 'case-renderingaid.webp',
				caption: 'Armed agents at the vehicle in the immediate aftermath',
				alt: 'Bystander phone footage of armed federal agents surrounding the Honda Pilot after the shooting',
				source: 'Bystander / X',
				date: 'Jan 7, 2026'
			},
			{
				type: 'image',
				src: 'case-angle3.webp',
				caption: 'Obstructed view from across the street',
				alt: 'Distant phone footage of the scene shot through bare trees from across the street',
				source: 'Bystander / KSTP 5',
				date: 'Jan 7, 2026'
			},
			{
				type: 'image',
				src: 'case-angle3-still.webp',
				caption: 'Zoomed witness clip, the agent highlighted',
				alt: 'Zoomed-in witness still with a red circle drawn around the agent who fired',
				source: 'Bystander / X',
				date: 'Jan 7, 2026'
			}
		]
	},
	{
		number: '03',
		label: 'Mis/disinformation',
		sublabel: 'Days 1–6, at scale',
		offset: 27,
		width: 64,
		items: [
			{
				type: 'image',
				src: 'case-ai-car-edit.webp',
				caption: 'Doctored frame vs. authentic footage',
				alt: 'A manipulated still staged to look like the car ramming officers, beside the verified frame',
				source: 'Debunk / X',
				date: 'Jan 8, 2026'
			},
			{
				type: 'image',
				src: 'case-ai-generated.webp',
				caption: 'AI-generated mockery of the victim',
				alt: 'X post with a Grok Imagine AI image mocking the victim',
				source: '@NukeDST / X · Grok Imagine',
				date: 'Jan 9, 2026'
			},
			{
				type: 'image',
				src: 'case-unmask.webp',
				caption: "AI 'unmasking' of the masked agent",
				alt: 'Side-by-side labelled Real Image and AI-Generated, the synthetic version fabricating the masked agent’s face',
				source: 'Unattributed / X',
				date: 'Jan 9, 2026'
			},
			{
				type: 'image',
				src: 'case-mistaken-photo.webp',
				caption: "The wrong woman's photo circulated as the victim",
				alt: 'Facebook post sharing an unrelated woman’s portrait as Renee Good',
				source: 'Facebook (viral repost)',
				date: 'Jan 10, 2026'
			},
			{
				type: 'image',
				src: 'case-mural.webp',
				caption: 'AI mural conflating her with Ashli Babbitt',
				alt: 'X post showing an AI-generated mural of Renee Good and Ashli Babbitt',
				source: '@DainFitzgerald / X',
				date: 'Jan 11, 2026'
			},
			{
				type: 'image',
				src: 'case-desantis.webp',
				caption: 'Clip from unrelated events, passed off as a reaction',
				alt: 'Video thumbnail of Ron DeSantis from an unrelated segment',
				source: 'The Rubin Report / YouTube',
				date: 'Jan 12, 2026'
			}
		]
	},
	{
		number: '04',
		label: 'OSINT investigation',
		sublabel: 'Coherent at day 6',
		offset: 40,
		width: 40,
		items: [
			{
				type: 'image',
				src: 'case-bellingcat.webp',
				caption: 'Animated reconstruction of officer positions',
				alt: 'Bellingcat overhead sequence mapping the positions of officers and vehicles',
				source: 'Bellingcat',
				date: 'Jan 7, 2026'
			},
			{
				type: 'image',
				src: 'case-index.webp',
				caption: 'Photogrammetric 3D scene reconstruction',
				alt: 'INDEX 3D reconstruction of the Honda Pilot and figures around it',
				source: 'INDEX',
				date: 'Jan 12, 2026'
			},
			{
				type: 'image',
				src: 'case-nyt.webp',
				caption: 'Frame-by-frame video analysis',
				alt: 'New York Times video analysis synchronising the available footage',
				source: 'The New York Times',
				date: 'Jan 15, 2026'
			}
		]
	}
];

export const toolFamilies = [
	{
		label: 'Manual forensics',
		kicker: 'Most robust but least scalable',
		blurb:
			"The one approach that actually corroborates: by hand, by experts, over days. WITNESS's Rapid Response Force is a team of volunteers who analyze viral content for human rights investigations.",
		src: 'tools-witness.webp',
		alt: "WITNESS's Deepfake Rapid Response Force"
	},
	{
		label: 'AI detection',
		kicker: 'The worst option',
		blurb:
			"Chatbots and detector tools rarely work, and often spread more misinformation than they catch. Experts like WITNESS's Mahsa Alimardani worry about people trusting the answers.",
		src: 'tools-grok.webp',
		alt: '“@grok is this true?” asked of an image on X'
	},
	{
		label: 'Digital provenance',
		kicker: 'Emerging and exciting',
		blurb:
			'A nutritional label for everything you see online: where the content came from, and how much it was edited.',
		src: 'tools-c2pa.webp',
		alt: 'Content Credentials'
	}
];

/** The gap quadrant. x: authentication → corroboration, y: manual → scalable (0..1). */
export const quadrant = {
	points: [
		{ label: 'C2PA · Content Credentials', x: 0.3, y: 0.9, anchor: true },
		{ label: 'SynthID watermarking', x: 0.07, y: 0.79 },
		{ label: 'Meta Video Seal', x: 0.05, y: 0.69 },
		{ label: 'Diffusion-image detectors', x: 0.04, y: 0.55, anchor: true },
		{ label: 'Video deepfake detectors', x: 0.04, y: 0.46 },
		{ label: 'LLM debunking', x: 0.41, y: 0.37 }
	],
	band: {
		label: 'Manual forensics',
		y: 0.16,
		from: 0.12,
		to: 0.88,
		/** The worked examples at each end of the bar. */
		ends: [{ label: 'Expert image analysis' }, { label: 'Geolocation · evidence sourcing' }]
	}
};

export interface Pillar {
	id: 'hardware' | 'pattern' | 'software' | 'form';
	label: string;
	image?: string;
	imageAlt: string;
	highlights: { lead: string; text: string }[];
}

export const pillars: Pillar[] = [
	{
		id: 'hardware',
		label: 'Hardware',
		image: 'pillar-hardware-v2.webp',
		imageAlt: 'Exploded render of the PIGEON device: case, e-ink display, PCB and battery',
		highlights: [
			{ lead: 'Creates pattern', text: 'Location + time + device ID + per-device counter.' },
			{ lead: 'Components', text: 'GNSS module · microcontroller · e-ink display.' },
			{ lead: 'Why e-ink', text: 'Sunlight-readable, zero power to hold an image, field-robust.' },
			{ lead: 'Accessible', text: 'Under £15 · open source.' }
		]
	},
	{
		id: 'pattern',
		label: 'Pattern',
		imageAlt: 'A live PIGEON pattern',
		highlights: [
			{
				lead: 'Hostile pipeline',
				text: 'Angle → motion blur → JPEG → screenshot-of-a-screenshot.'
			},
			{
				lead: 'Error correction',
				text: 'Truchet tiling + Reed-Solomon: robust to cropping, blur, and partial capture.'
			},
			{
				lead: 'Encodes data directly',
				text: 'A simple decoder can pull out time, place, and authentication info from a photo of the pattern alone.'
			},
			{
				lead: 'Room for expansion',
				text: 'The pattern encodes a version number, so future iterations could add more data or features.'
			}
		]
	},
	{
		id: 'software',
		label: 'Software',
		image: 'pillar-software.webp',
		imageAlt: 'The PIGEON evidence browser on a laptop',
		highlights: [
			{
				lead: 'Decode fork',
				text: 'Image in → context to the submitter and a leaf appended to the log, at once.'
			},
			{ lead: 'Append-only', text: 'Add-only, never altered: tampering is detectable by anyone.' },
			{
				lead: 'Redaction',
				text: 'Image storage is separate from the log: content removable, record intact.'
			},
			{
				lead: 'Federation',
				text: 'Any org runs a node; the pattern encodes which log. No single gatekeeper.'
			}
		]
	},
	{
		id: 'form',
		label: 'Form',
		image: 'pillar-form-v2.webp',
		imageAlt: 'A render of the PIGEON device from the front',
		highlights: [
			{
				lead: 'Form family',
				text: 'Open hardware, transparency, an invitation to edit the form to your needs.'
			},
			{
				lead: 'Functional aesthetics',
				text: 'Decals on the faceplate assist pattern decoding; exposed screws allow for backplate expansion.'
			},
			{
				lead: 'Pattern first',
				text: 'The case is built around the pattern, so it can live on any surface.'
			},
			{ lead: 'Visual language', text: 'Deliberately not a QR / tracking aesthetic.' }
		]
	}
];

export const claims = [
	'Corroboration is the unmet need',
	'Citizen witnesses are the users',
	'Pattern survives the real world'
];

export const people = [
	{
		name: 'Santiago Lyon',
		org: "Content Authenticity Initiative, formerly AP's Global Director of Photography",
		portrait: 'person-santiago.webp'
	},
	{ name: 'Mahsa Alimardani', org: 'WITNESS / Journalist', portrait: 'person-mahsa.webp' },
	{
		name: 'Jacobo Castellanos',
		org: 'WITNESS / C2PA Threats & Harms',
		portrait: 'person-jacobo.webp'
	},
	{ name: 'Ron Haviv', org: 'VII Foundation, conflict photographer', portrait: 'person-ron.webp' },
	{
		name: 'Maya Burnand',
		org: 'Independent visual journalist, formerly Centre for Information Resilience',
		portrait: 'person-maya.webp'
	}
];

export interface Capture {
	n: number;
	leaf: number;
	device: string;
	counter: number;
	observed: string;
	lat: number;
	lon: number;
	/** Set when the decode was rejected as a replay of an earlier leaf. */
	dupOf?: string;
}

export const fieldMap = {
	image: 'field-basemap.webp',
	bounds: { north: 51.4867, south: 51.4496, west: -0.22238, east: -0.11652 },
	aspect: 1280 / 720
};

export const captures: Capture[] = [
	{ n: 1, leaf: 15, device: '372376', counter: 175, observed: '2026-06-08T15:20:00Z', lat: 51.4813, lon: -0.1431 },
	{ n: 2, leaf: 14, device: '372376', counter: 212, observed: '2026-06-08T15:30:00Z', lat: 51.4834, lon: -0.146 },
	{ n: 3, leaf: 16, device: '372376', counter: 175, observed: '2026-06-08T15:20:00Z', lat: 51.4813, lon: -0.1431, dupOf: '#15' },
	{ n: 4, leaf: 0, device: '372376', counter: 11, observed: '2026-06-08T15:40:00Z', lat: 51.4828, lon: -0.1526 },
	{ n: 5, leaf: 11, device: '642632', counter: 104, observed: '2026-06-13T10:50:00Z', lat: 51.4686, lon: -0.1802 },
	{ n: 6, leaf: 6, device: '642632', counter: 29, observed: '2026-06-12T21:20:00Z', lat: 51.4644, lon: -0.1863 },
	{ n: 7, leaf: 8, device: '642632', counter: 174, observed: '2026-06-13T19:10:00Z', lat: 51.4566, lon: -0.1934 },
	{ n: 8, leaf: 5, device: '642632', counter: 28, observed: '2026-06-12T21:30:00Z', lat: 51.4529, lon: -0.1958 }
];

export const prototyping = [
	{
		name: 'Pattern',
		blurb: 'Origin truchet → sketches → tiling maths → generative families → on the device.',
		shots: [
			['proto-pattern-01.webp', 'og truchet'],
			['proto-pattern-02.webp', 'concept sketch'],
			['proto-pattern-03.webp', 'concept sketch'],
			['proto-pattern-04.webp', 'tiling maths'],
			['proto-pattern-05.webp', 'tile overlap'],
			['proto-pattern-06.webp', 'nested truchet'],
			['proto-pattern-07.webp', 'decode test'],
			['proto-pattern-08.webp', 'recursive wang'],
			['proto-pattern-09.webp', 'wang tiles'],
			['proto-pattern-10.webp', 'panel render'],
			['proto-pattern-11.webp', 'flexible print'],
			['proto-pattern-12.webp', 'live render']
		]
	},
	{
		name: 'Form',
		blurb: 'Form studies → shape language → printed case → worn prototype → V2.',
		shots: [
			['proto-form-01.webp', 'form study'],
			['proto-form-02.webp', 'form study'],
			['proto-form-03.webp', 'form study'],
			['proto-form-04.webp', 'form study'],
			['proto-form-05.webp', 'form study'],
			['proto-form-06.webp', 'shape language'],
			['proto-form-07.webp', 'shape language'],
			['proto-form-08.webp', 'case v1.0'],
			['proto-form-09.webp', 'worn prototype'],
			['reveal-wrist.webp', 'v1 on the wrist'],
			['pillar-form-v2.webp', 'v2']
		]
	},
	{
		name: 'Hardware',
		blurb: 'Breadboard bring-up → revisions → PCB design → custom PCB → current build.',
		shots: [
			['proto-hw-01.webp', 'v0.1'],
			['proto-hw-02.webp', 'v0.3'],
			['proto-hw-03.webp', 'v0.6'],
			['proto-hw-04.webp', 'pcb design'],
			['proto-hw-05.webp', 'v1.0 pcb'],
			['proto-hw-06.webp', 'v1.0 assembly'],
			['proto-hw-07.webp', 'knolling']
		]
	},
	{
		name: 'Software',
		blurb: 'Concept sketch → pattern sims → decoder iterations → working UI.',
		shots: [
			['proto-sw-01.webp', 'concept sketch'],
			['proto-sw-02.webp', 'sim sketch'],
			['proto-sw-03.webp', 'pattern sim'],
			['proto-sw-04.webp', 'bit budget'],
			['proto-sw-05.webp', 'decoder v3'],
			['proto-sw-06.webp', 'decoder v4'],
			['proto-sw-07.webp', 'decode fail'],
			['proto-sw-08.webp', 'decoder ui']
		]
	}
] as { name: string; blurb: string; shots: [string, string][] }[];

export const acknowledgements = [
	['Santiago Lyon', 'Content Authenticity Initiative'],
	['Jacobo Castellanos', 'WITNESS / C2PA Threats and Harms Taskforce'],
	['Ron Haviv', 'VII Foundation'],
	['Mahsa Alimardani', 'WITNESS'],
	['Maya Burnand', 'Visual journalist, former OSINT researcher'],
	['Chao Liu', 'Former newsroom editor'],
	['Dr Simone Paci', 'Political Science, Stanford University'],
	['Christine Thomas Yoon', 'Documentary filmmaker & educator'],
	['Jeffery Chung', 'Activist & designer']
];
