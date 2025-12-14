import YearInfo2024 from 'tatorscout/years/2024.js';
import { Aggregators } from 'tatorscout/summary';

export default YearInfo2024.summary({
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
