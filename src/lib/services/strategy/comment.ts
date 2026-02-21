import type { Point2D } from 'math/point';
import { WritableBase } from '../writables';
import interact from 'interactjs';
import { prompt } from '$lib/utils/prompts';

export type CommentConfig = {
	position: Point2D;
	text: string;
	size: Point2D;
};

export class Comment extends WritableBase<CommentConfig> {
	render(target: HTMLDivElement) {
		const container = document.createElement('div');
		container.classList.add('comment');
		container.style.padding = '5px';
		container.style.backgroundColor = 'rgba(243, 193, 55, 0.9)';
		container.style.transition = 'opacity 0.3s';
		container.style.position = 'absolute';
		const textEl = document.createElement('p');
		textEl.style.margin = '0';
		textEl.classList.add('no-select');
		textEl.textContent = this.data.text;
		textEl.style.width = '100%';
		textEl.style.height = '100%';
		textEl.style.overflow = 'hidden';
		textEl.style.textOverflow = 'ellipsis';
		textEl.style.color = 'black';
		container.appendChild(textEl);
		target.appendChild(container);
		// make it look like a sticky note with a small triangle at the bottom right corner
		container.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 10px 100%, 0 100%)';

        const renderText = () => {
            const lines = this.data.text.trim().split('\n');
            textEl.textContent = '';
            for (const line of lines) {
                if (!line.trim().length) {
                    const br = document.createElement('br');
                    textEl.appendChild(br);
                    continue;
                }
                const lineEl = document.createElement('div');
                lineEl.textContent = line;
                textEl.appendChild(lineEl);
            }
        };

		const renderPos = () => {
			const {
				position: [posX, posY],
				size: [width, height]
			} = this.data;
			container.style.left = posX * target.clientWidth + 'px';
			container.style.top = posY * target.clientHeight + 'px';
			container.style.width = width + 'px';
			container.style.height = height + 'px';
		};
		renderPos();

		const unsub = this.subscribe(() => {
			renderText();
		});

		const ondblclick = async () => {
			const res = await prompt('Edit comment text', {
				default: this.data.text,
                multiline: true,
			});
			if (!res) return;
			this.update((config) => ({ ...config, text: res }));
			renderText();
		};

		window.addEventListener('resize', renderPos);

		interact(container)
			.draggable({
				listeners: {
					move: (event) => {
						const { position } = this.data;
						const newPos: Point2D = [
							position[0] + event.dx / target.clientWidth,
							position[1] + event.dy / target.clientHeight
						];
						this.update((config) => ({ ...config, position: newPos }));
						renderPos();
					}
				},
				inertia: true
			})
			.resizable({
				listeners: {
					move: (event) => {
						const { size } = this.data;
						const newSize: Point2D = [
							size[0] + event.deltaRect.width,
							size[1] + event.deltaRect.height
						];
						this.update((config) => ({ ...config, size: newSize }));
						renderPos();
					}
				},
				edges: { left: false, right: true, bottom: true, top: false }
			});

		container.addEventListener('dblclick', ondblclick);

		return () => {
			unsub();
			window.removeEventListener('resize', renderPos);
			interact(container).unset();
			container.removeEventListener('dblclick', ondblclick);
			target.removeChild(container);
		};
	}

	serialize() {}
}
