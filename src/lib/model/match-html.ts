import { browser } from '$app/environment';
import type { YearInfo } from 'tatorscout/years';
import type { Scouting } from './scouting';
import { Color } from 'colors/color';
import YearInfo2024 from 'tatorscout/years/2024.js';
import YearInfo2025 from 'tatorscout/years/2025.js';
import { debounce } from 'ts-utils';
import { isInside } from 'math/polygon';
import type { Point2D } from 'math/point';
import { catmullRom } from 'math/spline';

const PATH_COLOR = Color.fromBootstrap('primary');

export class MatchHTML {
	target: HTMLElement | undefined;
	yearInfo: YearInfo | undefined;

	constructor(public readonly match: Scouting.MatchScoutingExtended) {
		if (!browser) {
			throw new Error('MatchHTML can only be used in the browser');
		}
		this.to = this.match.trace.points.length;
	}

	private _initialized = false;

	public from = 0;
	public to: number;

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
			default:
				throw new Error(`YearInfo for year ${this.match.year} is not implemented`);
		}
	}

	drawPath() {
		if (!this.target) throw new Error('MatchHTML is not initialized');
		if (!this.yearInfo) throw new Error('YearInfo is not set in MatchHTML');
		console.log('From:', this.from, 'To:', this.to);

		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute(
			'style',
			'position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;'
		);
		this.target.appendChild(svg);

		const path = document.createElementNS(svgNS, 'path');
		const copy = this.match.trace.points.slice(this.from, this.to).filter((p) => p[1] !== 0 || p[2] !== 0);
		const fn = catmullRom(
			copy.map((p) => [p[1] * Number(this.target?.clientWidth), p[2] * Number( this.target?.clientHeight)]),
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

	clear() {
		if (!this.target) throw new Error('MatchHTML is not initialized');
		const svgs = this.target.querySelectorAll('svg');
		svgs.forEach((svg) => svg.remove());
		const actions = this.target.querySelectorAll('.action');
		actions.forEach((action) => action.remove());
	}

	auto() {
		this.from = 0;
		this.to = 15 * 4;
		this.render();
	}

	teleop() {
		this.from = 15 * 4;
		this.to = this.match.trace.points.length;
		this.render();
	}

	render = debounce(() => {
		this.clear();
		this.drawPath();
		this.drawActions();
	}, 2);

	animate() {
		if (!browser) throw new Error('MatchHTML can only be used in the browser');
		this.render();
		window.addEventListener('resize', this.render);
	}
}

export class StartLocation {
	constructor(
		public readonly matches: Scouting.MatchScoutingExtendedArr,
		public readonly year: number
	) {}

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
	}
}

export class ActionHeatmap<A extends string> {
	target: HTMLDivElement | undefined;

	constructor(
		public readonly matches: Scouting.MatchScoutingExtendedArr,
		public readonly yearInfo: YearInfo<{}, {}, A>,
		public readonly year: number
	) {}

	private _filter: A[] = [];

	filter(...actions: A[]) {
		this._filter = actions;
		this.render();
	}

	init(target: HTMLDivElement) {
		if (this.target) throw new Error('ActionHeatmap is already initialized');
		this.target = target
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
		img.style.objectFit = 'contain';
		img.style.zIndex = '0';
		target.appendChild(img);

		this.render();
	}

	render() {
		if (!this.target) throw new Error('ActionHeatmap is not initialized');
		this.target.querySelectorAll('.action').forEach((a) => a.remove());

		for (const m of this.matches.data) {
			for (const p of m.trace.points) {
				const [, x, y, a] = p;
				if (!a) continue;
				if (this._filter.length > 0 && !this._filter.includes(a as A)) continue;

				const actionEl = document.createElement('div');
				actionEl.classList.add('action');
				actionEl.style.position = 'absolute';
				actionEl.style.left = `${x * this.target.clientWidth - 10}px`;
				actionEl.style.top = `${y * this.target.clientHeight - 10}px`;
				actionEl.style.width = '3%';
				actionEl.style.aspectRatio = '1 / 1';
				actionEl.style.backgroundColor = PATH_COLOR.toString('rgb');
				actionEl.style.borderRadius = '50%';
				actionEl.style.zIndex = '2';
				actionEl.style.opacity = '0.3';
				this.target.appendChild(actionEl);
			}
		}
	}
}
