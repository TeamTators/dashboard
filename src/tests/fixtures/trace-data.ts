/**
 * @fileoverview Test fixtures for trace data
 * @description Provides sample trace data for testing
 */

/**
 * Valid trace JSON for 2025 season
 */
export const validTrace2025 = JSON.stringify({
	points: [
		[0, 0, 0, null],
		[1000, 100, 200, 'pickup'],
		[2000, 150, 250, 'score']
	],
	sections: [
		{ start: 0, end: 15000, section: 'auto' },
		{ start: 15000, end: 135000, section: 'teleop' },
		{ start: 135000, end: 150000, section: 'endgame' }
	],
	scoring: {
		auto: {
			cl1: 2,
			cl2: 1,
			cl3: 0,
			cl4: 0,
			brg: 1,
			prc: 0,
			total: 15
		},
		teleop: {
			cl1: 5,
			cl2: 3,
			cl3: 2,
			cl4: 1,
			brg: 2,
			prc: 1,
			total: 45
		}
	},
	metadata: {
		year: 2025,
		eventKey: '2025test',
		matchNumber: 1,
		team: 254
	}
});

/**
 * Valid trace JSON for 2024 season
 */
export const validTrace2024 = JSON.stringify({
	points: [
		[0, 0, 0, null],
		[1000, 100, 200, 'pickup'],
		[2000, 150, 250, 'score']
	],
	sections: [
		{ start: 0, end: 15000, section: 'auto' },
		{ start: 15000, end: 135000, section: 'teleop' },
		{ start: 135000, end: 150000, section: 'endgame' }
	],
	scoring: {
		auto: {
			total: 10
		},
		teleop: {
			total: 30
		}
	},
	metadata: {
		year: 2024,
		eventKey: '2024test',
		matchNumber: 1,
		team: 254
	}
});

/**
 * Invalid trace JSON (malformed)
 */
export const invalidTraceJSON = 'invalid json {';

/**
 * Invalid trace structure (missing required fields)
 */
export const invalidTraceStructure = JSON.stringify({
	points: []
	// Missing sections, scoring, metadata
});

/**
 * Valid checks array
 */
export const validChecks = JSON.stringify(['defense', 'fast', 'accurate']);

/**
 * Valid sliders object
 */
export const validSliders = JSON.stringify({
	speed: {
		value: 8,
		text: 'Very Fast',
		color: '#00ff00'
	},
	defense: {
		value: 6,
		text: 'Good Defense',
		color: '#0000ff'
	}
});

/**
 * Empty checks array
 */
export const emptyChecks = JSON.stringify([]);

/**
 * Empty sliders object
 */
export const emptySliders = JSON.stringify({});
