/**
 * @fileoverview
 * DOM rendering helpers for match scouting visualizations (path, actions, start zones, heatmap).
 * Provides browser-only classes that draw on top of a field image using match trace data.
 */
import { browser } from '$app/environment';
import type { YearInfo } from 'tatorscout/years';
import type { Scouting } from './scouting';
import { Color } from 'colors/color';
import YearInfo2024 from 'tatorscout/years/2024.js';
import YearInfo2025 from 'tatorscout/years/2025.js';
import YearInfo2026 from 'tatorscout/years/2026.js';
import { debounce } from 'ts-utils';
import { isInside } from 'math/polygon';
import type { Point2D } from 'math/point';
import { catmullRom } from 'math/spline';

/**
 * Base path color used for drawing paths and overlays.
 * @type {Color}
 */
const PATH_COLOR = Color.fromBootstrap('primary');

/**
 * Renders a single match trace on top of the field image.
 *
 * @example
 * const view = new MatchHTML(match);
 * view.init(containerEl);
 * view.auto();
 * view.animate();
 */
export class MatchHTML {
	/**
	 * Target element where the SVG and action markers are rendered.
	 * @type {HTMLElement | undefined}
	 */
	target: HTMLElement | undefined;

	/**
	 * Year metadata describing field actions and zones.
	 * @type {YearInfo | undefined}
	 */
	yearInfo: YearInfo | undefined;

	/**
	 * @param {Scouting.MatchScoutingExtended} match Match scouting record with trace points.
	 */
	constructor(public readonly match: Scouting.MatchScoutingExtended) {
		if (!browser) {
			throw new Error('MatchHTML can only be used in the browser');
		}
		this.to = this.match.trace.points.length;
	}

	/**
	 * Internal initialization guard.
	 * @type {boolean}
	 */
	private _initialized = false;

	/**
	 * Starting index into `match.trace.points` for rendering.
	 * @type {number}
	 */
	public from = 0;

	/**
	 * Ending index (exclusive) into `match.trace.points` for rendering.
	 * @type {number}
	 */
	public to: number;

	/**
	 * Initializes the renderer and inserts the field image.
	 * @param {HTMLElement} target Container element to render into.
	 * @throws Error if called more than once.
	 */
	init(target: HTMLElement) {
		if (this._initialized) throw new Error('MatchHTML is already initialized');
		this.target = target;
		this._initialized = true;
		target.style.position = 'relative';
		target.style.overflow = 'hidden';
		this.target.style.width = '100%';
		this.target.style.aspectRatio = '2 / 1';
		const img = document.createElement('img');
		img.src = `/assets/field/${this.match.year}.png`;
		img.style.position = 'absolute';
		img.style.top = '0';
		img.style.left = '0';
		img.style.width = '100%';
		img.style.height = '100%';
		img.style.zIndex = '0';
		this.target.appendChild(img);

		switch (this.match.year) {
			case 2024:
				this.yearInfo = YearInfo2024;
				break;
			case 2025:
				this.yearInfo = YearInfo2025;
				break;
			case 2026:
				this.yearInfo = YearInfo2026;
				break;
			default:
				throw new Error(`YearInfo for year ${this.match.year} is not implemented`);
		}
	}

	/**
	 * Draws the smoothed trace path as an SVG overlay.
	 * @throws Error if not initialized or year info missing.
	 */
	drawPath() {
		if (!this.target) throw new Error('MatchHTML is not initialized');
		if (!this.yearInfo) throw new Error('YearInfo is not set in MatchHTML');

		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute(
			'style',
			'position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;'
		);
		this.target.appendChild(svg);

		const path = document.createElementNS(svgNS, 'path');
		const copy = this.match.trace.points
			.slice(this.from, this.to)
			.filter((p) => p[1] !== 0 || p[2] !== 0);
		const fn = catmullRom(
			copy.map((p) => [
				p[1] * Number(this.target?.clientWidth),
				p[2] * Number(this.target?.clientHeight)
			])
		);
		let d = '';
		// let start = this.from;
		// for (let i = this.from; i < this.to; i++) {
		// 	const point = this.match.trace.points[i];
		// 	const x = point[1] * this.target.clientWidth;
		// 	const y = point[2] * this.target.clientHeight;
		// 	if (x === 0 && y === 0) {
		// 		start = i + 1;
		// 		continue;
		// 	}
		// 	if (i === start) {
		// 		d += `M ${x} ${y} `;
		// 	} else {
		// 		d += `L ${x} ${y} `;
		// 	}
		// }
		const RATE = 0.001;
		let first = true;
		for (let i = 0; i <= 1; i += RATE) {
			const [x, y] = fn(i);
			if (x === 0 && y === 0) {
				continue;
			}
			if (first) {
				d += `M ${x} ${y} `;
			} else {
				d += `L ${x} ${y} `;
			}
			first = false;
		}
		path.setAttribute('d', d);
		path.setAttribute('stroke', PATH_COLOR.toString('rgb'));
		path.setAttribute('stroke-width', '2');
		path.setAttribute('stroke-linecap', 'round');
		path.setAttribute('fill', 'none');
		path.style.width = '100%';
		path.style.height = '100%';
		svg.appendChild(path);
	}

	/**
	 * Draws action markers on the field image.
	 * @throws Error if not initialized or year info missing.
	 */
	drawActions() {
		if (!this.target) throw new Error('MatchHTML is not initialized');
		if (!this.yearInfo) throw new Error('YearInfo is not set in MatchHTML');

		const colors = PATH_COLOR.compliment(Object.keys(this.yearInfo.actions).length);

		for (let i = this.from; i < this.to; i++) {
			const [, x, y, a] = this.match.trace.points[i];
			// const point = this.match.trace.points[i];
			// if (!point) continue;
			// const [, x, y, a] = point;
			if (!a) continue;
			const actionEl = document.createElement('div');
			actionEl.classList.add('action', 'hover-grow', 'no-select');
			actionEl.style.position = 'absolute';
			actionEl.style.left = `${x * this.target.clientWidth - 10}px`;
			actionEl.style.top = `${y * this.target.clientHeight - 10}px`;
			actionEl.style.width = '3%';
			actionEl.style.aspectRatio = '1 / 1';
			actionEl.style.backgroundColor =
				colors.colors[
					Object.keys(this.yearInfo.actions).indexOf(a as keyof typeof this.yearInfo.actions)
				]?.toString('rgb') || PATH_COLOR.toString('rgb');
			actionEl.style.borderRadius = '50%';
			actionEl.style.zIndex = '2';
			actionEl.title = this.yearInfo.actions[a];
			actionEl.dataset.bsTooltip = this.yearInfo.actions[a];
			const img = document.createElement('img');
			img.src = `/assets/icons/${a}.png`;
			img.style.width = '100%';
			img.style.height = '100%';
			actionEl.appendChild(img);

			this.target.appendChild(actionEl);
		}

		import('bootstrap').then(({ Tooltip }) => {
			if (!this.target) return;
			const tooltipTriggerList = Array.from(this.target.querySelectorAll('[data-bs-tooltip]'));
			for (const tooltipTriggerEl of tooltipTriggerList) {
				new Tooltip(tooltipTriggerEl);
			}
		});
	}

	/**
	 * Clears previously rendered SVG paths and action markers.
	 * @throws Error if not initialized.
	 */
	clear() {
		if (!this.target) throw new Error('MatchHTML is not initialized');
		const svgs = this.target.querySelectorAll('svg');
		svgs.forEach((svg) => svg.remove());
		const actions = this.target.querySelectorAll('.action');
		actions.forEach((action) => action.remove());
	}

	/**
	 * Renders the autonomous period (first 15s @ 4Hz).
	 */
	auto() {
		this.from = 0;
		this.to = 15 * 4;
		this.render();
	}

	/**
	 * Renders the teleop period (after 15s @ 4Hz).
	 */
	teleop() {
		this.from = 15 * 4;
		this.to = this.match.trace.points.length;
		this.render();
	}

	/**
	 * Debounced render that clears and redraws the path and actions.
	 * @type {() => void}
	 */
	render = debounce(() => {
		this.clear();
		this.drawPath();
		this.drawActions();
	}, 2);

	/**
	 * Renders immediately and re-renders on window resize.
	 * @throws Error in non-browser environments.
	 */
	animate() {
		if (!browser) throw new Error('MatchHTML can only be used in the browser');
		this.render();
		window.addEventListener('resize', this.render);
	}
}

/**
 * Visualizes the starting zone density across matches.
 *
 * @example
 * const start = new StartLocation(matches, 2025);
 * start.init(containerEl);
 */
export class StartLocation {
	/**
	 * @param {Scouting.MatchScoutingExtendedArr} matches Match collection store.
	 * @param {number} year Field year used for zones and field image.
	 */
	constructor(
		public readonly matches: Scouting.MatchScoutingExtendedArr,
		public readonly year: number
	) {}

	/**
	 * Initializes the view and renders start zones.
	 * @param {HTMLElement} target Container element to render into.
	 */
	init(target: HTMLElement) {
		if (!browser) {
			throw new Error('StartLocation can only be used in the browser');
		}
		target.style.position = 'relative';
		target.style.overflow = 'hidden';
		target.style.width = '100%';
		target.style.aspectRatio = '1 / 1';
		const img = document.createElement('img');
		img.src = `/assets/field/${this.year}.png`;
		img.style.position = 'absolute';
		img.style.top = '0';
		img.style.left = '0';
		img.style.width = '100%';
		img.style.height = '100%';
		img.style.zIndex = '0';
		target.appendChild(img);

		const zones: Point2D[][] = [];

		for (const match of this.matches.data) {
			let x = 0,
				y = 0;

			for (const point of match.trace.points) {
				const [, px, py] = point;
				if (px !== 0 && py !== 0) {
					x = px;
					y = py;
					break;
				}
			}

			let yearInfo: YearInfo;
			switch (this.year) {
				case 2024:
					yearInfo = YearInfo2024;
					break;
				case 2025:
					yearInfo = YearInfo2025;
					break;
				default:
					throw new Error(`YearInfo for year ${this.year} is not implemented`);
			}

			for (const zone of Object.values(yearInfo.actionZones)) {
				if (isInside([x, y], zone.red as Point2D[]) || isInside([x, y], zone.blue as Point2D[])) {
					zones.push(zone.red as Point2D[]);
					break;
				}
			}
		}

		for (const z of zones) {
			const zoneEl = document.createElement('div');
			zoneEl.style.position = 'absolute';
			zoneEl.style.top = '0';
			zoneEl.style.left = '0';
			zoneEl.style.width = '100%';
			zoneEl.style.height = '100%';
			zoneEl.style.zIndex = '1';
			zoneEl.style.backgroundColor = PATH_COLOR.clone().setAlpha(0.3).toString('rgba');
			zoneEl.style.clipPath = `polygon(${z.map((p) => `${p[0] * 100}% ${p[1] * 100}%`).join(', ')})`;
			target.appendChild(zoneEl);
		}

		return this.matches.subscribe(() => this.init(target));
	}
}

/**
 * Renders an action heatmap with a legend and tooltips.
 *
 * @template A Action key string union for the given year.
 *
 * @example
 * const heatmap = new ActionHeatmap<'score' | 'pickup'>(matches, 2026);
 * heatmap.init(containerEl);
 * heatmap.filter('score');
 */
export class ActionHeatmap<A extends string> {
	/**
	 * Container element for the heatmap.
	 * @type {HTMLDivElement | undefined}
	 */
	target: HTMLDivElement | undefined;

	/**
	 * Year metadata describing actions and zones.
	 * @type {YearInfo | undefined}
	 */
	yearInfo: YearInfo | undefined;

	/**
	 * @param {Scouting.MatchScoutingExtendedArr} matches Match collection store.
	 * @param {number} year Field year used for actions and field image.
	 */
	constructor(
		public readonly matches: Scouting.MatchScoutingExtendedArr,
		public readonly year: number
	) {}

	/**
	 * Current action filter applied to points.
	 * @type {A[]}
	 */
	private _filter: A[] = [];

	/**
	 * Sets the action filter and re-renders.
	 * @param {...A} actions Action keys to display.
	 */
	filter(...actions: A[]) {
		this._filter = actions;
		this.render();
	}

	/**
	 * Initializes the heatmap and subscribes to match updates.
	 * @param {HTMLDivElement} target Container element to render into.
	 * @returns {() => void} Unsubscribe callback from the matches store.
	 */
	init(target: HTMLDivElement) {
		if (this.target) throw new Error('ActionHeatmap is already initialized');
		this.target = target;
		target.style.display = 'flex';
		target.style.justifyContent = 'center';
		target.style.overflow = 'hidden';
		target.style.height = '100%';
		target.style.width = '100%';

		switch (this.year) {
			case 2024:
				this.yearInfo = YearInfo2024;
				break;
			case 2025:
				this.yearInfo = YearInfo2025;
				break;
			case 2026:
				this.yearInfo = YearInfo2026;
				break;
			default:
				throw new Error(`YearInfo for year ${this.year} is not implemented`);
		}
		this.render();

		return this.matches.subscribe(() => {
			this.render();
		});
	}

	/**
	 * Pending animation timeouts used for staggered rendering.
	 * @type {ReturnType<typeof setTimeout>[]}
	 */
	private readonly timeouts: ReturnType<typeof setTimeout>[] = [];

	/**
	 * Clears and rebuilds the heatmap UI and action markers.
	 * @returns {Promise<void>}
	 */
	async render() {
		if (!this.target) throw new Error('ActionHeatmap is not initialized');
		if (!this.yearInfo) throw new Error("ActionHeatmap doesn't have yearInfo");
		for (const to of this.timeouts) {
			clearTimeout(to);
			this.timeouts.splice(this.timeouts.indexOf(to), 1);
		}
		this.target.querySelectorAll('.heatmap-item').forEach((a) => a.remove());
		const container = document.createElement('div');
		container.classList.add('heatmap-item');
		container.style.position = 'relative';
		container.style.maxWidth = '100%';
		container.style.aspectRatio = '2 / 1';
		container.style.overflow = 'hidden';
		this.target.appendChild(container);

		const legend = document.createElement('div');
		legend.classList.add('heatmap-item');
		legend.style.display = 'flex';
		legend.style.justifyContent = 'space-between';
		legend.style.flexWrap = 'wrap';
		legend.style.position = 'absolute';
		legend.style.zIndex = '1';
		legend.style.width = '100%';
		legend.style.top = '0';
		const { colors } = PATH_COLOR.compliment(Object.keys(this.yearInfo.actions).length);
		const keys = Object.keys(this.yearInfo.actions);
		for (let i = 0; i < keys.length; i++) {
			const color = colors[i] || PATH_COLOR;
			const item = document.createElement('div');
			item.classList.add('heatmap-item');
			item.style.alignItems = 'center';
			item.style.marginBottom = '4px';
			item.style.backgroundColor = color.toString('rgba');
			item.style.padding = '4px 8px';
			item.style.borderRadius = '4px';
			item.style.display = 'flex';
			item.style.cursor = 'pointer';
			item.style.margin = '4px';
			item.style.opacity = '0.9';
			item.style.width = '12%';
			item.style.minWidth = '100px';
			item.style.justifyContent = 'center';
			item.style.minHeight = '10%';
			if (this._filter.length && this._filter.includes(keys[i] as A)) {
				item.style.border = '2px solid white';
				item.style.padding = '2px 6px';
			} else {
				item.style.border = '2px solid transparent';
				item.style.padding = '2px 6px';
			}

			const label = document.createElement('p');
			label.textContent = this.yearInfo.actions[keys[i] as A];
			if (color.detectContrast(Color.fromName('white')) > 3) {
				label.style.color = 'white';
			} else {
				label.style.color = 'black';
			}


			label.style.fontWeight = 'bold';
			label.style.fontSize =  '1em';
			label.style.whiteSpace = 'nowrap';
			label.style.lineHeight = '1em';
			label.style.margin = 'auto';
			label.style.padding = '0';
			item.appendChild(label);

			item.onclick = () => {
				if (this._filter.includes(keys[i] as A)) {
					this._filter = this._filter.filter((a) => a !== keys[i]);
				} else {
					this._filter.push(keys[i] as A);
				}
				this.render();
			};

			legend.appendChild(item);
		}
		container.appendChild(legend);


		const img = document.createElement('img');
		img.src = `/assets/field/${this.year}.png`;
		img.style.position = 'absolute';
		img.style.bottom = '0';
		img.style.left = '0';
		img.style.width = '100%';
		img.style.zIndex = '0';
		container.appendChild(img);

		const imgContainer = document.createElement('div');
		imgContainer.style.position = 'absolute';
		imgContainer.style.bottom = '0';
		imgContainer.style.left = '0';
		imgContainer.style.width = img.style.width;
		imgContainer.style.height = img.style.height;
		imgContainer.style.aspectRatio = '2 / 1';
		// imgContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
		container.appendChild(imgContainer);

		const { Tooltip } = await import('bootstrap');

		let i = 0;
		for (const m of this.matches.data) {
			for (const p of m.trace.points) {
				const [, x, y, a] = p;
				if (!a) continue;
				i++;
				if (this._filter.length > 0 && !this._filter.includes(a as A)) continue;

				const actionEl = document.createElement('div');
				actionEl.classList.add('heatmap-item', 'animate__animated', 'animate__bounceIn');
				actionEl.style.position = 'absolute';
				actionEl.style.left = `${x * 100}%`;
				actionEl.style.top = `${y * 100}%`;
				actionEl.style.transform = 'translate(-50%, -50%)';
				actionEl.style.width = '3%';
				actionEl.style.aspectRatio = '1 / 1';
				actionEl.style.backgroundColor =
					colors[
						Object.keys(this.yearInfo.actions).indexOf(a as keyof typeof this.yearInfo.actions)
					]
						?.clone()
						.setAlpha(0.5)
						.toString('rgba') || PATH_COLOR.clone().setAlpha(0.5).toString('rgba');
				actionEl.style.borderRadius = '50%';
				actionEl.style.zIndex = '2';

				actionEl.dataset.bsTooltip = this.yearInfo.actions[a as A];
				actionEl.dataset.bsTitle = this.yearInfo.actions[a as A];
				actionEl.dataset.bsToggle = 'tooltip';
				actionEl.title = this.yearInfo.actions[a as A];
				actionEl.classList.add('hover-grow', 'hover-grow-xl', 'no-select');

				const to = setTimeout(() => {
					imgContainer.appendChild(actionEl);
					this.timeouts.splice(this.timeouts.indexOf(to), 1);
				}, i * 2);

				this.timeouts.push(to);

				const tt = Tooltip.getOrCreateInstance(actionEl);
				tt.enable();
			}
		}
	}
}
