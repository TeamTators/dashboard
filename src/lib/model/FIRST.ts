import { sse } from '../services/sse';
import { Struct, type StructData, type DataArr } from 'drizzle-struct/front-end';
import { browser } from '$app/environment';

export namespace FIRST {
	export const TeamPictures = new Struct({
		name: 'team_pictures',
		structure: {
			team: 'number',
			eventKey: 'string',
			picture: 'string',
			accountId: 'string'
		},
		socket: sse,
		browser
	});

	export type TeamPicturesData = StructData<typeof TeamPictures.data.structure>;
	export type TeamPicturesArr = DataArr<typeof TeamPictures.data.structure>;

	export const CustomMatches = new Struct({
		name: 'custom_matches',
		structure: {
			name: 'string',
			eventKey: 'string',
			number: 'number',
			compLevel: 'string',
			red1: 'number',
			red2: 'number',
			red3: 'number',
			red4: 'number',
			blue1: 'number',
			blue2: 'number',
			blue3: 'number',
			blue4: 'number'
		},
		socket: sse,
		browser
	});

	export type CustomMatchesData = StructData<typeof CustomMatches.data.structure>;
	export type CustomMatchesArr = DataArr<typeof CustomMatches.data.structure>;
}
