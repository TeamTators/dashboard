import YearInfo2026 from 'tatorscout/years/2026.js';
import { Aggregators } from 'tatorscout/summary';

const summariesViaTBA = (data, dataType, param: string) => {
	const summaryData = data.matches.map(m => {
				const parsed = YearInfo2026.parseMatch(m).unwrap();
				const redPosition = m.alliances.red.team_keys.indexOf('frc' + data.team);
				const bluePosition = m.alliances.blue.team_keys.indexOf('frc' + data.team);
				const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
				const position = alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
				if (alliance && position !== -1) {
					dataType = [
						parsed.score_breakdown[alliance][param + 1],
						parsed.score_breakdown[alliance][],
						parsed.score_breakdown[alliance].autoTowerRobot3
					][position];

					// const endClimb = [
					// 	parsed.score_breakdown[alliance].endgameTowerRobot1,
					// 	parsed.score_breakdown[alliance].endgameTowerRobot2,
					// 	parsed.score_breakdown[alliance].endgameTowerRobot3
					// ][position];

					let points = 0;
					// if (dataType !== 'None') points += 15; -- ************Specific************

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
			return Aggregators.average(summaryData);
		}



export default YearInfo2026.summary({
	'Auto Points': {
		'Average Hub Scored': (data) => { return Aggregators.average(data.scoring.map((d) => d.auto.hub1 + d.auto.hub5 + d.auto.hub10)) },
		'Average Climb': (data) => {
			const climbData = data.matches.map(m => {
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
