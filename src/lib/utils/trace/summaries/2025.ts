/**
 * @fileoverview Trace summary definitions for the 2025 season.
 * @description
 * Exports a preconfigured summary builder used by trace visualizations.
 */

import YearInfo2025 from 'tatorscout/years/2025.js';
import { Aggregators } from 'tatorscout/summary';

/**
 * Summary configuration for 2025 trace data.
 * @example
 * import summary2025 from '$lib/utils/trace/summaries/2025';
 */
const summary2025 = YearInfo2025.summary({
	'Average Auto Points': {
		Mobility: ({ matches, team }) =>
			Aggregators.average(
				matches.map((m) => {
					const asYear = YearInfo2025.parseMatch(m).unwrap();

					const redPosition = asYear.alliances.red.team_keys.indexOf(`frc${team}`);
					const bluePosition = asYear.alliances.blue.team_keys.indexOf(`frc${team}`);
					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
					const position =
						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
					if (alliance && position !== -1) {
						const mobilityRobots = [
							asYear.score_breakdown[alliance].autoLineRobot1,
							asYear.score_breakdown[alliance].autoLineRobot2,
							asYear.score_breakdown[alliance].autoLineRobot3
						];

						return 3 * Number(mobilityRobots[position] === 'Yes');
					}

					return 0;
				})
			),
		Coral: ({ scoring }) =>
			Aggregators.average(scoring.map((d) => d.auto.cl1 + d.auto.cl2 + d.auto.cl3 + d.auto.cl4)),
		Algae: ({ scoring }) => Aggregators.average(scoring.map((d) => d.auto.brg + d.auto.prc)),
		Total: ({ scoring }) => Aggregators.average(scoring.map((d) => d.auto.total))
	},
	'Average Teleop Points': {
		Coral: ({ scoring }) =>
			Aggregators.average(
				scoring.map((d) => d.teleop.cl1 + d.teleop.cl2 + d.teleop.cl3 + d.teleop.cl4)
			),
		Algae: ({ scoring }) => Aggregators.average(scoring.map((d) => d.teleop.brg + d.teleop.prc)),
		Total: ({ scoring }) => Aggregators.average(scoring.map((d) => d.teleop.total))
	},
	'Average Endgame Points': {
		Park: ({ matches, team }) =>
			Aggregators.average(
				matches.map((m) => {
					const match2025 = YearInfo2025.parseMatch(m).unwrap();
					const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${team}`);
					const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${team}`);
					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
					const position =
						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
					if (alliance) {
						const endgameRobots = [
							match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
							match2025.score_breakdown[alliance].endGameRobot2,
							match2025.score_breakdown[alliance].endGameRobot3
						];
						return endgameRobots[position] === 'Parked' ? 2 : 0;
					}
					return 0;
				})
			),
		Shallow: ({ matches, team }) =>
			Aggregators.average(
				matches.map((m) => {
					const match2025 = YearInfo2025.parseMatch(m).unwrap();
					const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${team}`);
					const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${team}`);
					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
					const position =
						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
					if (alliance) {
						const endgameRobots = [
							match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
							match2025.score_breakdown[alliance].endGameRobot2,
							match2025.score_breakdown[alliance].endGameRobot3
						];
						return endgameRobots[position] === 'ShallowCage' ? 6 : 0;
					}
					return 0;
				})
			),
		Deep: ({ matches, team }) =>
			Aggregators.average(
				matches.map((m) => {
					const match2025 = YearInfo2025.parseMatch(m).unwrap();
					const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${team}`);
					const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${team}`);
					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
					const position =
						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
					if (alliance) {
						const endgameRobots = [
							match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
							match2025.score_breakdown[alliance].endGameRobot2,
							match2025.score_breakdown[alliance].endGameRobot3
						];
						return endgameRobots[position] === 'DeepCage' ? 12 : 0;
					}
					return 0;
				})
			)
	},
	Stats: {
		'Average Total Points': ({ scoring }) => Aggregators.average(scoring.map((d) => d.total)),
		'Average Point Deviation': ({ scoring }) => Aggregators.standardDeviation(scoring.map((d) => d.total)),
		'Average Velocity': ({ traces }) => Aggregators.average(traces.map((t) => t.averageVelocity())),
		'Average Seconds Not Moving': ({ traces }) =>
			Aggregators.average(traces.map((t) => t.secondsNotMoving()))
	}
});

export default summary2025;
