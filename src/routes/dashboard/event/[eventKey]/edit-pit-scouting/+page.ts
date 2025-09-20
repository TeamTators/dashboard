export const load = (event) => {
	const year = /(^\d+)/.exec(event.params.eventKey)?.[0];
	return {
		eventKey: event.data.eventKey,
		year: Number(year),
		event: event.data.event
	};
};

export const ssr = false;
