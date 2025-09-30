import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from '$lib/services/struct/data-arr';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		data: event.data.data.map((d) => {
			const left = new DataArr(
				Scouting.PIT.Questions,
				d.left.map((q) => Scouting.PIT.Questions.Generator(q))
			);

			return {
				team: new TBATeam(d.team, e),
				left,
				question: left, //.map((item) => item.data.key).join(','),
				uploaded: d.uploaded,
				tbaPictures: d.tba
			};
		})
	};
};
