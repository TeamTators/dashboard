import YearInfo2026 from 'tatorscout/years/2026.js';
import { Aggregators } from 'tatorscout/summary';
import { type TBAMatch, type TBAMatch2025, type TBAMatch2026, Match2026Schema } from 'tatorscout/tba';
import type z from 'zod';

/**
 * Helper function to calculate summaries based on TBA match data. It parses the matches using the provided schema, determines the alliance and position of the team, and applies the provided function to the score breakdown for that alliance.
 * @param data The data object containing team number, scoring information, traces, and matches.
 * @param matches The list of matches to process.
 * @param matchSchema The Zod schema to parse the matches.
 * @param fn The function to apply to the score breakdown for the team's alliance. It receives the score breakdown for the alliance as an argument and should return a value of type T.
 * @returns The average of the values returned by the function for all matches.
 */
const summariesViaTBA = <Match extends TBAMatch2025 | TBAMatch2026>(
	team: number,
	matches: TBAMatch[],
	matchSchema: z.ZodSchema<Match>,
	fn: (data: Match['score_breakdown']['red'], position: number) => number
) => {
	return matches.map((m) => {
		const parsed = matchSchema.parse(m);
		const redPosition = m.alliances.red.team_keys.indexOf('frc' + team);
		const bluePosition = m.alliances.blue.team_keys.indexOf('frc' + team);
		const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
		const position = alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
		if (alliance && position !== -1) {
			return fn(parsed.score_breakdown[alliance], position);
		}
		return 0;
	});
};

// const exapleSummary = summariesViaTBA(2122, [], Match2026Schema, (match, position) => {
// 	const autoClimb = [
// 		match.autoTowerRobot1,
// 		match.autoTowerRobot2,
// 		match.autoTowerRobot3
// 	][position];
// 	return 0;
// });

export default YearInfo2026.summary({
	'Auto Points': {
		'Climb Points': (data) => {
			return Aggregators.average(summariesViaTBA(
				data.team,
				data.matches,
				Match2026Schema,
				(match, position) => {
					const autoClimb = [
						match.autoTowerRobot1,
						match.autoTowerRobot2,
						match.autoTowerRobot3
					][position];
					switch (autoClimb) {
						case 'Level1':
							return 15;
						default:
							return 0;
					}
				}
			))
		},
		'Average Hub Scored': (data) => {
			return Aggregators.average(data.scoring.map((d) => d.auto.hub1 + d.auto.hub5 + d.auto.hub10));
		}
	},
	'Teleop Points': {
		'Average Hub Scored': (data) => {
			return Aggregators.average(
				data.scoring.map((d) => d.teleop.hub1 + d.teleop.hub5 + d.teleop.hub10)
			);
		}
	},
	'Endgame Points': {
		'Climb Points': (data) => {
			return Aggregators.average(summariesViaTBA(
				data.team,
				data.matches,
				Match2026Schema,
				(match, position) => {
					const autoClimb = [
						match.endgameTowerRobot1,
						match.endgameTowerRobot2,
						match.endgameTowerRobot3
					][position];
					switch (autoClimb) {
						case 'Level1':
							return 10;
						case 'Level2':
							return 20;
						case 'Level3':
							return 30;
						default:
							return 0;
					}
				}
			))
		},
		'Average Hub': (data) => {
			return Aggregators.average(
				data.scoring.map((d) => d.endgame.hub1 + d.endgame.hub5 + d.endgame.hub10)
			);
		}
		// 'Average Total': (data) => 0,
	},
	Stats: {
		'Total Points': (data) => {
			const autoPoints = summariesViaTBA(
				data.team,
				data.matches,
				Match2026Schema,
				(match, position) => {
					const autoClimb = [
						match.autoTowerRobot1,
						match.autoTowerRobot2,
						match.autoTowerRobot3
					][position];
					switch (autoClimb) {
						case 'Level1':
							return 15;
						default:
							return 0;
					}
				}
			);
			const endgamePoints = summariesViaTBA(
				data.team,
				data.matches,
				Match2026Schema,
				(match, position) => {
					const endgameClimb = [
						match.endgameTowerRobot1,
						match.endgameTowerRobot2,
						match.endgameTowerRobot3
					][position];
					let endgameClimbPoints = 0;
					switch (endgameClimb) {
						case 'Level1':
							endgameClimbPoints = 10;
							break;
						case 'Level2':
							endgameClimbPoints = 20;
							break;
						case 'Level3':
							endgameClimbPoints = 30;
							break;	
					}
					return endgameClimbPoints;
				}
			);

			const totals = data.scoring.map(d => d.total);
			const combined = totals.map((total, index) => total + (autoPoints[index] || 0) + (endgamePoints[index] || 0));
			return Aggregators.average(combined);
		},
		'Average Lob': (data) =>
			Aggregators.average(
				data.traces.map(
					(t) =>
						t.filterAction('lob1').length +
						t.filterAction('lob5').length * 5 +
						t.filterAction('lob10').length * 10
				)
			),
		'Average Velocity': (data) =>
			Aggregators.average(
				data.traces.map((t) =>
					t.averageVelocity({
						maxVel: 20,
						rolloff: true,
						rolloffVel: 25
					})
				)
			),
		'Average Seconds Not Moving': (data) =>
			Aggregators.average(
				data.traces.map((t) =>
					t.secondsNotMoving({
						maxVel: 20,
						rolloff: true,
						rolloffVel: 25,
						threshold: 2 // TODO: ensure these are correct
					})
				)
			)
	}
});
