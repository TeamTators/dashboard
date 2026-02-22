import { WritableBase } from '../writables';
import { type Point2D } from 'math/point';

/**
 * Configuration for a whiteboard path.
 * @typedef PathConfig
 * @property {Point2D[]} points - Array of points for the path.
 * @property {string} color - Path color.
 */
export type PathConfig = {
	points: Point2D[];
	color: string;
};

/**
 * Whiteboard path element with rendering and serialization.
 * @extends WritableBase<PathConfig>
 */
export class Path extends WritableBase<PathConfig> {
	/**
	 * Render the path onto an SVG element.
	 * @param {SVGElement} target - SVG element to render into.
	 * @returns {() => void} Cleanup function to remove the path.
	 */
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
}
