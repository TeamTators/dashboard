import { Struct, type StructData, type DataArr } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';
import { browser } from '$app/environment';
import { attempt, attemptAsync } from 'ts-utils/check';
import { z } from 'zod';
import { Account } from './account';

export namespace Scouting {
	export const MatchScouting = new Struct({
		name: 'match_scouting',
		structure: {
			matchId: 'string',
			team: 'number',
			scoutId: 'string',
			scoutGroup: 'string',
			prescouting: 'boolean',
			remote: 'boolean',
			trace: 'string',
			checks: 'string'
		},
		socket: sse,
		browser
	});

	export type MatchScoutingData = StructData<typeof MatchScouting.data.structure>;
	export type MatchScoutingArr = DataArr<typeof MatchScouting.data.structure>;

	export const TeamComments = new Struct({
		name: 'team_comments',
		structure: {
			matchScoutingId: 'string',
			accountId: 'string',
			team: 'number',
			comment: 'string',
			type: 'string',
			eventKey: 'string'
		},
		socket: sse,
		browser
	});

	export type TeamCommentsData = StructData<typeof TeamComments.data.structure>;
	export type TeamCommentsArr = DataArr<typeof TeamComments.data.structure>;

	export namespace PIT {
		export const Sections = new Struct({
			name: 'pit_sections',
			structure: {
				name: 'string',
				order: 'number',
				eventKey: 'string'
			},
			socket: sse,
			browser
		});

		export type SectionData = StructData<typeof Sections.data.structure>;
		export type SectionArr = DataArr<typeof Sections.data.structure>;

		export const Groups = new Struct({
			name: 'pit_groups',
			structure: {
				sectionId: 'string',
				name: 'string',
				order: 'number'
			},
			socket: sse,
			browser
		});

		export type GroupData = StructData<typeof Groups.data.structure>;
		export type GroupArr = DataArr<typeof Groups.data.structure>;

		export const Questions = new Struct({
			name: 'pit_questions',
			structure: {
				groupId: 'string',
				question: 'string',
				type: 'string',
				key: 'string',
				order: 'number',
				options: 'string'
			},
			socket: sse,
			browser
		});

		export type QuestionData = StructData<typeof Questions.data.structure>;
		export type QuestionArr = DataArr<typeof Questions.data.structure>;

		export const Answers = new Struct({
			name: 'pit_answers',
			structure: {
				questionId: 'string',
				answer: 'string',
				team: 'number',
				accountId: 'string'
			},
			socket: sse,
			browser
		});

		export type AnswerData = StructData<typeof Answers.data.structure>;
		export type AnswerArr = DataArr<typeof Answers.data.structure>;

		export type Options = {};

		export const parseOptions = (question: QuestionData) => {
			return attempt(() => {
				const options = question.data.options;
				if (!options) throw new Error('No options key');
				return z.array(z.string()).parse(JSON.parse(options));
			});
		};

		export const parseAnswer = (answer: AnswerData) => {
			return attempt(() => {
				const value = answer.data.answer;
				if (!value) throw new Error('No answer key');
				return z.array(z.string()).parse(JSON.parse(value));
			});
		};

		export const getAnswersFromGroup = (group: GroupData, questionIDs: string[]) => {
			return Answers.query(
				'from-group',
				{
					group: group.data.id
				},
				{
					asStream: false,
					satisfies: (d) => (d.data.questionId ? questionIDs.includes(d.data.questionId) : false)
				}
			);
		};

		export const answerQuestion = (
			question: QuestionData,
			answer: string[],
			team: number,
			account: Account.AccountData
		) => {
			return attemptAsync(async () => {
				if (!question.data.id) throw new Error('Question ID not found');
				const accountId = account.data.id;
				if (!accountId) throw new Error('Account ID not found');
				const res = (
					await Answers.new({
						questionId: question.data.id,
						answer: JSON.stringify(answer),
						team,
						accountId
					})
				).unwrap();

				if (!res.success) throw new Error(res.message || 'Failed to answer question');
			});
		};
	}
}
