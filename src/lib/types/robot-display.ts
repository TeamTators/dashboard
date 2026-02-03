/**
 * @fileoverview Shared types used by robot display visualizations.
 * @description
 * Defines focus flags used to filter or emphasize match phases in charts.
 */

/**
 * Toggles for which phases of a match to focus on in visualizations.
 * @example
 * const focus: Focus = { auto: true, teleop: true, endgame: false };
 */
export type Focus = {
	auto: boolean;
	teleop: boolean;
	endgame: boolean;
};
