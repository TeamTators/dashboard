export const freqEst = (type: string, args: string): string => {
	const split = args.split(':');
	switch (type) {
		case 'alliance_selection':
			return 'Once per event';
		case 'match_score':
			if (split.length === 1) {
				return 'Once per match at the event';
			} else {
				return 'When that specific match is played';
			}
		case 'match_video':
			return 'When a new video is uploaded for that match';
		case 'schedule_updated':
			return 'Whenever the schedule is updated';
		case 'starting_comp_level':
			if (split.length === 1) {
				return 'Once per competition level at the event';
			} else {
				return 'When that specific competition level starts';
			}
		case 'upcoming_match':
			if (split.length === 1) {
				return 'Every match at the event';
			} else {
				return 'When that specific match is upcoming';
			}
		default:
			return 'Unknown frequency';
	}
};

export const getDesc = (type: string, args: string): string => {
	const split = args.split(':');
	switch (type) {
		case 'alliance_selection':
			return `Notify me when alliance selection starts for the event ${args}.`;
		case 'match_score':
			if (split.length === 1) {
				return `Notify me when any match is scored at the event ${args}.`;
			} else {
				return `Notify me when match ${split[1]}${split[2]} at the event ${split[0]} is scored.`;
			}
		case 'match_video':
			return `Notify me when a new video is uploaded for match ${split[1]} at the event ${split[0]}.`;
		case 'schedule_updated':
			return `Notify me whenever the schedule is updated for the event ${args}.`;
		case 'starting_comp_level':
			if (split.length === 1) {
				return `Notify me when any competition level starts at the event ${args}.`;
			} else {
				return `Notify me when the ${split[1]}${split[2]} competition level starts at the event ${split[0]}.`;
			}
		case 'upcoming_match':
			if (split.length === 1) {
				return `Notify me when any match is upcoming at the event ${args}.`;
			} else {
				return `Notify me when match ${split[1]}${split[2]} at the event ${split[0]} is upcoming.`;
			}
		default:
			return 'No description available.';
	}
};
