export const load = (event) => {
	const year = /(^\d+)/.exec(event.params.eventKey)?.[0];
	return {
		eventKey: event.params.eventKey,
		year: Number(year)
	};
};
