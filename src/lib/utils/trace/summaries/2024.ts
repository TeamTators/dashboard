/**
 * @fileoverview Trace summary definitions for the 2024 season.
 * @description
 * Exports a preconfigured summary builder used by trace visualizations.
 */

import YearInfo2024 from 'tatorscout/years/2024.js';
import { Aggregators } from 'tatorscout/summary';

/**
 * Summary configuration for 2024 trace data.
 * @example
 * import summary2024 from '$lib/utils/trace/summaries/2024';
 */
const summary2024 = YearInfo2024.summary({
	'Auto Points': {
		Speaker: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.auto.spk)),
		Amp: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.auto.amp)),
		Total: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.auto.total))
	},
	'Teleop Points': {
		Speaker: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.teleop.spk)),
		Amp: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.teleop.amp)),
		Trap: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.endgame.trp)),
		Total: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.teleop.total))
	},
	'Endgame Points': {
		Climb: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.endgame.clb)),
		Park: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.endgame.park)),
		Total: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.endgame.total))
	},
	Stats: {
		'Total Points': ({ scoring }) => Aggregators.sum(scoring.map((d) => d.total)),
		Lobs: ({ scoring }) => Aggregators.sum(scoring.map((d) => d.teleop.lob)),
		'Average Velocity': ({ traces }) => Aggregators.average(traces.map((t) => t.averageVelocity())),
		'Average Seconds Not Moving': ({ traces }) =>
			Aggregators.average(traces.map((t) => t.secondsNotMoving()))
	}
});

export default summary2024;
