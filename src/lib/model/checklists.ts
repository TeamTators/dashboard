/**
 * @fileoverview Checklist Struct models and types.
 *
 * @description
 * Defines Structs for checklists, questions, assignments, and answers used in event checklists.
 */
import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';

export namespace Checklist {
	export const Checklists = new Struct({
		name: 'checklists',
		structure: {
			/** Checklist display name. */
			name: 'string',
			/** Event key the checklist belongs to. */
			eventKey: 'string',
			/** Checklist description. */
			description: 'string'
		},
		socket: sse,
		browser
	});

	export type ChecklistData = StructData<typeof Checklists.data.structure>;
	export type ChecklistArr = DataArr<typeof Checklists.data.structure>;

	export const Questions = new Struct({
		name: 'checklist_questions',
		structure: {
			/** Parent checklist id. */
			checklistId: 'string',
			/** Question prompt text. */
			question: 'string',
			/** Interval (seconds/minutes) between reminders. */
			interval: 'number'
		},
		socket: sse,
		browser
	});

	export type QuestionData = StructData<typeof Questions.data.structure>;
	export type QuestionArr = DataArr<typeof Questions.data.structure>;

	export const Assignments = new Struct({
		name: 'checklist_assignments',
		structure: {
			/** Question id to assign. */
			questionId: 'string',
			/** Account id that is assigned. */
			accountId: 'string'
		},
		socket: sse,
		browser
	});

	export type AssignmentData = StructData<typeof Assignments.data.structure>;
	export type AssignmentArr = DataArr<typeof Assignments.data.structure>;

	export const Answers = new Struct({
		name: 'checklist_answers',
		structure: {
			/** Account id that submitted the answer. */
			accountId: 'string',
			/** Question id being answered. */
			questionId: 'string',
			/** Match id associated with the answer. */
			matchId: 'string'
		},
		socket: sse,
		browser
	});

	export type AnswerData = StructData<typeof Answers.data.structure>;
	export type AnswerArr = DataArr<typeof Answers.data.structure>;
}
