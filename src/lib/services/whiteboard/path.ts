import { WritableBase } from '../writables';
import { type Point2D } from 'math/point';

export type PathConfig = {
	points: Point2D[];
	color: string;
};

export class Path extends WritableBase<PathConfig> {
	render(target: SVGElement) {
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', this.data.color);
		path.setAttribute('stroke-width', '3');
		target.appendChild(path);

		const renderPath = () => {
			const d = this.data.points
				.map(([x, y]) => `${x * target.clientWidth} ${y * target.clientHeight}`)
				.join(' ');
			path.setAttribute('d', `M ${d}`);
		};
		renderPath();
		const unsub = this.subscribe(() => {
			renderPath();
		});

		return () => {
			unsub();
			path.remove();
		};
	}

	serialize() {}
}
