import YearInfo2026 from 'tatorscout/years/2026.js';
import { Aggregators } from 'tatorscout/summary';
import { Match2026Schema, type TBAMatch, type TBAMatch2025, type TBAMatch2026 } from 'tatorscout/tba';
import type z from 'zod';
import type { Trace } from 'tatorscout/trace';

/**
 * Helper function to calculate summaries based on TBA match data. It parses the matches using the provided schema, determines the alliance and position of the team, and applies the provided function to the score breakdown for that alliance.
 * @param data The data object containing team number, scoring information, traces, and matches.
 * @param matches The list of matches to process.
 * @param matchSchema The Zod schema to parse the matches.
 * @param fn The function to apply to the score breakdown for the team's alliance. It receives the score breakdown for the alliance as an argument and should return a value of type T.
 * @returns The average of the values returned by the function for all matches.
 */
const summariesViaTBA = <T, Match extends TBAMatch2025 | TBAMatch2026>(
	team: number,
	matches: TBAMatch[],
	matchSchema: z.ZodSchema<Match>,
	fn: (data: Match['score_breakdown']['red'], position: number) => T
) => {
	const summaryData = matches.map((m) => {
		const parsed = matchSchema.parse(m);
		const redPosition = m.alliances.red.team_keys.indexOf('frc' + team);
		const bluePosition = m.alliances.blue.team_keys.indexOf('frc' + team);
		const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
		const position = alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
		if (alliance && position !== -1) {
			fn(parsed.score_breakdown[alliance], position);
		}
		return 0;
	});
	return Aggregators.average(summaryData);
};

const exapleSummary = summariesViaTBA(2122, [], Match2026Schema, (match, position) => {

});


export default YearInfo2026.summary({
	'Auto Points': {
		'Average Hub Scored': (data) => {
			return Aggregators.average(data.scoring.map((d) => d.auto.hub1 + d.auto.hub5 + d.auto.hub10));
		},
		'Average Climb': (data) => {
			const climbData = data.matches.map((m) => {
				const parsed = YearInfo2026.parseMatch(m).unwrap();
				const redPosition = m.alliances.red.team_keys.indexOf('frc' + data.team);
				const bluePosition = m.alliances.blue.team_keys.indexOf('frc' + data.team);
				const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
				const position = alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
				if (alliance && position !== -1) {
					const autoClimb = [
						parsed.score_breakdown[alliance].autoTowerRobot1,
						parsed.score_breakdown[alliance].autoTowerRobot2,
						parsed.score_breakdown[alliance].autoTowerRobot3
					][position];

					// const endClimb = [
					// 	parsed.score_breakdown[alliance].endgameTowerRobot1,
					// 	parsed.score_breakdown[alliance].endgameTowerRobot2,
					// 	parsed.score_breakdown[alliance].endgameTowerRobot3
					// ][position];

					let points = 0;
					if (autoClimb !== 'None') points += 15;

					// const end = {
					// 	'Level1': 10,
					// 	'Level2': 20,
					// 	'Level3': 30
					// };
					// if (endClimb in end) points += end[endClimb as keyof typeof end];
					return points;
				}
				return 0;
			});
			return Aggregators.average(climbData);
		},
		'Average Total': (data) => 0
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
