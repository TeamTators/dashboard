/**
 * @fileoverview AG Grid cell renderer for listing missing pit scouting questions.
 * @description
 * Renders a comma-separated list of question keys for the current row.
 */

import type { ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { Scouting } from '$lib/model/scouting';
import { capitalize, fromSnakeCase } from 'ts-utils/text';

/**
 * Cell renderer that displays missing pit scouting questions.
 */
export class MissingPitscoutComp implements ICellRendererComp {
	eGui!: HTMLElement;
	params!: ICellRendererParams;

	/**
	 * Initializes the cell renderer with the provided grid params.
	 * @param params - AG Grid parameters for the current cell.
	 * @returns Nothing.
	 */
	init(params: ICellRendererParams): void {
		this.params = params;

		this.eGui = create('div');
		// this.eGui.classList.add('list-unstyled')
		// create your gui here
		const questions: Scouting.PIT.QuestionArr = params.data.left;
		// for (const q of questions.data) {
		// 	const text = document.createElement('li');
		// 	text.textContent = capitalize(fromSnakeCase(q.data.key || '')) || 'No Question Text';
		// 	this.eGui.appendChild(text);
		// }
		this.eGui.innerHTML = questions.data
			.map((q) => capitalize(fromSnakeCase(q.data.key || '')))
			.join(', ');
		//questions.map((q) => Scouting.PIT.Questions.Generator(q));
		// Task:
		// Create links for each of the questions, they will go to the correct link
	}

	/**
	 * Returns the root element to render in the grid cell.
	 * @returns The DOM element that represents this cell renderer.
	 */
	getGui(): HTMLElement {
		return this.eGui;
	}

	/**
	 * Updates the renderer when the row data changes.
	 * @param params - Latest grid params after a refresh.
	 * @returns True to indicate the refresh was handled.
	 */
	refresh(params: ICellRendererParams): boolean {
		this.params = params;
		this.updateState();
		return true;
	}

	/**
	 * Recomputes derived UI state from current params.
	 * @returns Nothing.
	 */
	updateState() {}

	/**
	 * Cleans up any resources when the renderer is destroyed.
	 * @returns Nothing.
	 */
	destroy(): void {}
}
