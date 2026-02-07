/**
 * @fileoverview Test fixtures for TBA data
 * @description Provides sample TBA event, match, and team data for testing
 */

import type { TBAEvent, TBAMatch, TBATeam } from 'tatorscout/tba';

/**
 * Mock TBA Event (2025 Idaho Boise)
 */
export const mockEvent2025: TBAEvent = {
	key: '2025idbo',
	name: 'Idaho Regional',
	event_code: 'idbo',
	event_type: 0,
	district: null,
	city: 'Boise',
	state_prov: 'ID',
	country: 'USA',
	start_date: '2025-03-20',
	end_date: '2025-03-23',
	year: 2025,
	short_name: 'Idaho',
	event_type_string: 'Regional',
	week: 2,
	address: '123 Test St',
	postal_code: '83702',
	gmaps_place_id: 'test',
	gmaps_url: 'https://maps.google.com',
	lat: 43.6135,
	lng: -116.2023,
	location_name: 'Boise Event Center',
	timezone: 'America/Boise',
	website: 'https://example.com',
	first_event_id: 'test-id',
	first_event_code: 'idbo',
	webcasts: [],
	division_keys: [],
	parent_event_key: null,
	playoff_type: 0,
	playoff_type_string: 'Bracket'
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
			team_keys: ['frc254', 'frc1114', 'frc2056'],
			surrogate_team_keys: [],
			dq_team_keys: []
		},
		blue: {
			score: 145,
			team_keys: ['frc148', 'frc1323', 'frc2471'],
			surrogate_team_keys: [],
			dq_team_keys: []
		}
	},
	winning_alliance: 'red',
	event_key: '2025idbo',
	time: 1679328000,
	actual_time: 1679328000,
	predicted_time: 1679328000,
	post_result_time: 1679328300,
	score_breakdown: null,
	videos: []
};

/**
 * Mock TBA Match with 2025 score breakdown
 */
export const mockMatch2025WithScoreBreakdown: TBAMatch = {
	...mockMatch2025,
	score_breakdown: {
		red: {
			autoLineRobot1: 'Yes',
			autoLineRobot2: 'Yes',
			autoLineRobot3: 'No',
			endGameRobot1: 'DeepCage',
			endGameRobot2: 'ShallowCage',
			endGameRobot3: 'Parked'
		},
		blue: {
			autoLineRobot1: 'Yes',
			autoLineRobot2: 'No',
			autoLineRobot3: 'No',
			endGameRobot1: 'ShallowCage',
			endGameRobot2: 'Parked',
			endGameRobot3: 'None'
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
	name: 'NASA Ames Research Center & Google',
	city: 'San Jose',
	state_prov: 'California',
	country: 'USA',
	address: null,
	postal_code: null,
	gmaps_place_id: null,
	gmaps_url: null,
	lat: null,
	lng: null,
	location_name: null,
	website: 'http://www.team254.com',
	rookie_year: 1999,
	motto: null,
	home_championship: null
};

export const mockTeam1114: TBATeam = {
	...mockTeam254,
	key: 'frc1114',
	team_number: 1114,
	nickname: 'Simbotics',
	name: 'General Motors & Ryerson University',
	city: 'St. Catharines',
	state_prov: 'Ontario',
	country: 'Canada',
	website: 'http://www.simbotics.org',
	rookie_year: 2003
};

export const mockTeam2056: TBATeam = {
	...mockTeam254,
	key: 'frc2056',
	team_number: 2056,
	nickname: 'OP Robotics',
	name: 'Overland High School',
	city: 'Aurora',
	state_prov: 'Colorado',
	website: 'http://www.oprobotics.com',
	rookie_year: 2007
};

/**
 * Array of mock teams
 */
export const mockTeams = [mockTeam254, mockTeam1114, mockTeam2056];

/**
 * Array of mock matches
 */
export const mockMatches = [mockMatch2025, mockMatch2025WithScoreBreakdown];
