import YearInfo2026 from 'tatorscout/years/2026.js';
import { Aggregators } from 'tatorscout/summary';

export default YearInfo2026.summary({
	'Auto Points': {
		'Average Hub Scored': (data) => {
			const hubData = data.scoring.map((d) => d.auto.hub1 + d.auto.hub5 + d.auto.hub10);
			return Aggregators.average(hubData);
		},
		'Average Climb': () => 0,
		'Average Total': () => 0
	},
	'Teleop Points': {
		'Average Hub Scored': () => 0,
		'Average Lob': () => 0
	},
	'Endgame Points': {
		'Average Climb': () => 0,
		'Average Hub': () => 0,
		'Average Total': () => 0
	},
	Stats: {
		Lobs: () => 0,
		'Average Velocity': (data) => Aggregators.average(data.traces.map((t) => t.averageVelocity())),
		'Average Seconds Not Moving': (data) =>
			Aggregators.average(data.traces.map((t) => t.secondsNotMoving())),
		Total: () => 0
	}
});
