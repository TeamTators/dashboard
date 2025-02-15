export const load = async (event) => {
	const { eventKey } = event.params;

	return {
		eventKey
	};
};
