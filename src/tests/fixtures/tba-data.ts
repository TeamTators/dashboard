/**
 * @fileoverview Test fixtures for TBA data
 * @description Provides sample TBA event, match, and team data for testing
 */

import type { TBAEvent, TBAMatch, TBAMatch2025, TBATeam } from 'tatorscout/tba';

/**
 * Mock TBA Event (2025 Idaho Boise)
 */
export const mockEvent2025: TBAEvent = {
	key: '2025idbo',
	name: 'Idaho Regional',
	year: 2025,
	start_date: '2025-03-19',
	end_date: '2025-03-22'
};

/**
 * Mock TBA Event (2024)
 */
export const mockEvent2024: TBAEvent = {
	...mockEvent2025,
	key: '2024idbo',
	year: 2024,
	start_date: '2024-03-20',
	end_date: '2024-03-23'
};

/**
 * Mock TBA Match (Qualifications)
 */
export const mockMatch2025: TBAMatch = {
	key: '2025idbo_qm1',
	comp_level: 'qm',
	set_number: 1,
	match_number: 1,
	alliances: {
		red: {
			score: 150,
			team_keys: ['frc254', 'frc1114', 'frc2056']
		},
		blue: {
			score: 145,
			team_keys: ['frc148', 'frc1323', 'frc2471']
		}
	},
	winning_alliance: 'red',
	event_key: '2025idbo',
	time: 1679328000,
	actual_time: 1679328000,
	predicted_time: 1679328000,
	score_breakdown: null,
	videos: []
};

/**
 * Mock TBA Match with 2025 score breakdown
 */
export const mockMatch2025WithScoreBreakdown: TBAMatch2025 = {
	key: '2025idbo_qm1',
	comp_level: 'qm',
	set_number: 1,
	match_number: 1,
	winning_alliance: 'red',
	event_key: '2025idbo',
	time: 1679328000,
	actual_time: 1679328000,
	predicted_time: 1679328000,
	videos: [],
	alliances: {
		red: {
			score: 150,
			team_keys: ['frc254', 'frc1114', 'frc2056'],
			dq_team_keys: [],
			surrogate_team_keys: []
		},
		blue: {
			score: 145,
			team_keys: ['frc148', 'frc1323', 'frc2471'],
			dq_team_keys: [],
			surrogate_team_keys: []
		}
	},
	score_breakdown: {
		red: {
			adjustPoints: 0,
			algaePoints: 0,
			autoBonusAchieved: false,
			autoCoralCount: 0,
			autoCoralPoints: 0,
			autoLineRobot1: 'Yes',
			autoLineRobot2: 'Yes',
			autoLineRobot3: 'Yes',
			autoMobilityPoints: 0,
			autoPoints: 0,
			autoReef: {
				botRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				midRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				tba_botRowCount: 0,
				tba_midRowCount: 0,
				tba_topRowCount: 0,
				topRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				trough: 0
			},
			bargeBonusAchieved: false,
			coopertitionCriteriaMet: false,
			coralBonusAchieved: false,
			endGameBargePoints: 0,
			endGameRobot1: 'ShallowCage',
			endGameRobot2: 'Parked',
			endGameRobot3: 'None',
			foulCount: 0,
			foulPoints: 0,
			g206Penalty: false,
			g410Penalty: false,
			g418Penalty: false,
			g428Penalty: false,
			netAlgaeCount: 0,
			rp: 0,
			techFoulCount: 0,
			teleopCoralCount: 0,
			teleopCoralPoints: 0,
			teleopPoints: 0,
			teleopReef: {
				botRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				midRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				tba_botRowCount: 0,
				tba_midRowCount: 0,
				tba_topRowCount: 0,
				topRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				trough: 0
			},
			totalPoints: 0,
			wallAlgaeCount: 0
		},
		blue: {
			adjustPoints: 0,
			algaePoints: 0,
			autoBonusAchieved: false,
			autoCoralCount: 0,
			autoCoralPoints: 0,
			autoLineRobot1: 'Yes',
			autoLineRobot2: 'Yes',
			autoLineRobot3: 'Yes',
			autoMobilityPoints: 0,
			autoPoints: 0,
			autoReef: {
				botRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				midRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				tba_botRowCount: 0,
				tba_midRowCount: 0,
				tba_topRowCount: 0,
				topRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				trough: 0
			},
			bargeBonusAchieved: false,
			coopertitionCriteriaMet: false,
			coralBonusAchieved: false,
			endGameBargePoints: 0,
			endGameRobot1: 'ShallowCage',
			endGameRobot2: 'Parked',
			endGameRobot3: 'None',
			foulCount: 0,
			foulPoints: 0,
			g206Penalty: false,
			g410Penalty: false,
			g418Penalty: false,
			g428Penalty: false,
			netAlgaeCount: 0,
			rp: 0,
			techFoulCount: 0,
			teleopCoralCount: 0,
			teleopCoralPoints: 0,
			teleopPoints: 0,
			teleopReef: {
				botRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				midRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				tba_botRowCount: 0,
				tba_midRowCount: 0,
				tba_topRowCount: 0,
				topRow: {
					nodeA: false,
					nodeB: false,
					nodeC: false,
					nodeD: false,
					nodeE: false,
					nodeF: false,
					nodeG: false,
					nodeH: false,
					nodeI: false,
					nodeJ: false,
					nodeK: false,
					nodeL: false
				},
				trough: 0
			},
			totalPoints: 0,
			wallAlgaeCount: 0
		}
	}
};

/**
 * Mock TBA Teams
 */
export const mockTeam254: TBATeam = {
	key: 'frc254',
	team_number: 254,
	nickname: 'The Cheesy Poofs',
	name: 'NASA Ames Research Center & Google'
};

export const mockTeam1114: TBATeam = {
	...mockTeam254,
	key: 'frc1114',
	team_number: 1114,
	nickname: 'Simbotics',
	name: 'General Motors & Ryerson University'
};

export const mockTeam2056: TBATeam = {
	...mockTeam254,
	key: 'frc2056',
	team_number: 2056,
	nickname: 'OP Robotics',
	name: 'Overland High School'
};

/**
 * Array of mock teams
 */
export const mockTeams = [mockTeam254, mockTeam1114, mockTeam2056];

/**
 * Array of mock matches
 */
export const mockMatches = [mockMatch2025, mockMatch2025WithScoreBreakdown];
