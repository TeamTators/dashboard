import type { Point2D } from 'math/point';
import { WritableBase } from '../writables';
import interact from 'interactjs';
import { prompt } from '$lib/utils/prompts';
import { Stack } from '$lib/utils/stack';

export type CommentConfig = {
	position: Point2D;
	text: string;
	size: Point2D;
	hidden: boolean;
	selected: boolean;
};

export class Comment extends WritableBase<CommentConfig> {
	render(target: HTMLDivElement, stack: Stack) {
		const container = document.createElement('div');
		container.classList.add('comment');
		container.style.padding = '5px';
		container.style.backgroundColor = 'rgba(243, 193, 55, 0.9)';
		container.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
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

		const renderPos = (config: { position: Point2D; size: Point2D }) => {
			const {
				position: [x, y],
				size: [width, height]
			} = config;
			container.style.left = x * target.clientWidth + 'px';
			container.style.top = y * target.clientHeight + 'px';
			container.style.width = width + 'px';
			container.style.height = height + 'px';
		};
		renderPos({
			position: this.data.position,
			size: this.data.size
		});

		const unsub = this.subscribe((state) => {
			renderText();
			if (state.hidden) {
				container.style.opacity = '0';
			} else {
				container.style.opacity = '1';
			}
			if (state.selected) {
				container.style.border = '2px solid blue';
			} else {
				container.style.border = 'none';
			}
		});

		const ondblclick = async () => {
			const res = await prompt('Edit comment text', {
				default: this.data.text,
				multiline: true
			});
			if (!res) return;
			this.update((config) => ({ ...config, text: res }));
			renderText();
		};

		const onresize = () => {
			renderPos({
				position: this.data.position,
				size: this.data.size
			});
		};

		const onclick = () => {
			if (this.data.hidden) return;
			if (this.data.selected) {
				this.deselect();
			} else {
				this.select();
			}
		};

		container.addEventListener('click', onclick);

		window.addEventListener('resize', onresize);

		let currentPos = this.data.position;
		let currentSize = this.data.size;
		let prevPos = currentPos;
		let prevSize = currentSize;

		interact(container)
			.draggable({
				listeners: {
					start: () => {
						prevPos = currentPos;
						this.select();
					},
					move: (event) => {
						const newPos: Point2D = [
							currentPos[0] + event.dx / target.clientWidth,
							currentPos[1] + event.dy / target.clientHeight
						];
						currentPos = newPos;
						renderPos({
							position: newPos,
							size: currentSize
						});
					},
					end: (event) => {
						const prevState = prevPos;
						const newPos: Point2D = [
							currentPos[0] + event.dx / target.clientWidth,
							currentPos[1] + event.dy / target.clientHeight
						];

						stack.push({
							do: () => {
								this.update((config) => ({ ...config, position: newPos }));
								renderPos({
									position: newPos,
									size: this.data.size
								});
								currentPos = newPos;
							},
							undo: () => {
								this.update((config) => ({ ...config, position: prevState }));
								renderPos({
									position: prevState,
									size: this.data.size
								});
								currentPos = prevState;
							},
							name: 'Move Comment'
						});
					}
				},
				inertia: true
			})
			.resizable({
				listeners: {
					start: () => {
						prevSize = currentSize;
						this.select();
					},
					move: (event) => {
						const newSize: Point2D = [
							currentSize[0] + event.deltaRect.width,
							currentSize[1] + event.deltaRect.height
						];
						currentSize = newSize;
						renderPos({
							position: this.data.position,
							size: newSize
						});
					},
					end: (event) => {
						const prevState = prevSize;
						const newSize: Point2D = [
							currentSize[0] + event.deltaRect.width,
							currentSize[1] + event.deltaRect.height
						];

						stack.push({
							do: () => {
								this.update((config) => ({ ...config, size: newSize }));
								renderPos({
									position: this.data.position,
									size: newSize
								});
								currentSize = newSize;
							},
							undo: () => {
								this.update((config) => ({ ...config, size: prevState }));
								renderPos({
									position: this.data.position,
									size: prevState
								});
								currentSize = prevState;
							},
							name: 'Resize Comment'
						});
					}
				},
				edges: { left: false, right: true, bottom: true, top: false }
			});

		container.addEventListener('dblclick', ondblclick);

		return () => {
			unsub();
			window.removeEventListener('resize', onresize);
			interact(container).unset();
			container.removeEventListener('dblclick', ondblclick);
			target.removeChild(container);
			container.removeEventListener('click', onclick);
		};
	}

	hide() {
		this.update((config) => ({ ...config, hidden: true }));
	}

	show() {
		this.update((config) => ({ ...config, hidden: false }));
	}

	select() {
		this.update((config) => ({ ...config, selected: true }));
	}

	deselect() {
		this.update((config) => ({ ...config, selected: false }));
	}

	serialize() {}
}
