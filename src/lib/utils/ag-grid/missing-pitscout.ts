import type { ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { Scouting } from '$lib/model/scouting';
import { capitalize, fromSnakeCase } from 'ts-utils/text';

export class MissingPitscoutComp implements ICellRendererComp {
	eGui!: HTMLElement;
	params!: ICellRendererParams;

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

	getGui(): HTMLElement {
		return this.eGui;
	}

	refresh(params: ICellRendererParams): boolean {
		this.params = params;
		this.updateState();
		return true;
	}

	updateState() {}

	destroy(): void {}
}
