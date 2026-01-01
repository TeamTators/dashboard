import { browser } from "$app/environment";
import type { YearInfo } from "tatorscout/years";
import type { Scouting } from "./scouting";
import { Color } from "colors/color";
import YearInfo2024 from "tatorscout/years/2024.js";
import YearInfo2025 from "tatorscout/years/2025.js";
import { debounce } from "ts-utils";

const PATH_COLOR = Color.fromBootstrap('primary');

export class MatchHTML {
    target: HTMLElement | undefined;
    yearInfo: YearInfo | undefined;

    constructor(
        public readonly match: Scouting.MatchScoutingExtended,
    ) {
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

    drawPath(
    ) {
        if (!this.target) throw new Error('MatchHTML is not initialized');
        if (!this.yearInfo) throw new Error('YearInfo is not set in MatchHTML');

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("style", "position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;");
        this.target.appendChild(svg);

        const path = document.createElementNS(svgNS, "path");
        let d = "";
        let start = this.from;
        for (let i = this.from; i < this.to; i++) {
            const point = this.match.trace.points[i];
            const x = point[1] * this.target.clientWidth;
            const y = point[2] * this.target.clientHeight;
            if (x === 0 && y === 0) {
                start = i + 1;
                continue;
            }
            if (i === start) {
                d += `M ${x} ${y} `;
            } else {
                d += `L ${x} ${y} `;
            }
        }
        path.setAttribute("d", d);
        path.setAttribute("stroke", PATH_COLOR.toString('rgb'));
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("fill", "none");
        path.style.width = '100%';
        path.style.height = '100%';
        svg.appendChild(path);
    }

    drawActions(
    ) {
        if (!this.target) throw new Error('MatchHTML is not initialized');
        if (!this.yearInfo) throw new Error('YearInfo is not set in MatchHTML');

        const colors = PATH_COLOR.compliment(Object.keys(this.yearInfo.actions).length);

        for (let i = this.from; i < this.to; i++) {
            const [, x, y, a] = this.match.trace.points[i];
            if (!a) continue;

            const actionEl = document.createElement('div');
            actionEl.classList.add('action', 'hover-grow', 'no-select');
            actionEl.style.position = 'absolute';
            actionEl.style.left = `${x * this.target.clientWidth - 10}px`;
            actionEl.style.top = `${y * this.target.clientHeight - 10}px`;
            actionEl.style.width = '3%';
            actionEl.style.aspectRatio = '1 / 1';
            actionEl.style.backgroundColor = colors.colors[
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
        svgs.forEach(svg => svg.remove());
        const actions = this.target.querySelectorAll('.action');
        actions.forEach(action => action.remove());
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