import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from 'drizzle-struct/front-end';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		data: event.data.data.map((d) => {
			return {
				team: new TBATeam(d.team, e),
				left: new DataArr(
					Scouting.PIT.Questions,
					d.left.map((q) => Scouting.PIT.Questions.Generator(q))
				),
				uploaded: d.uploaded,
				tbaPictures: d.tba
			};
		})
	};
};
