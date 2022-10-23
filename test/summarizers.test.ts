import { FileCoverageData, Range } from 'istanbul-lib-coverage';
import { branchSummarizer, functionSummarizer, lineSummarizer, statementSummarizer } from '../src/summarizers';

const emptyFileCoverage: FileCoverageData = {
	b: {},
	branchMap: {},
	f: {},
	fnMap: {},
	s: {},
	statementMap: {},
	path: 'test.ts',
};

describe('statementSummarizer', () => {
	it('should properly summarize both total & covered statements', () => {
		expect(
			statementSummarizer({
				...emptyFileCoverage,
				s: {
					0: 10,
					1: 3,
					2: 4,
					3: 5,
					4: 0,
				},
			}),
		).toStrictEqual({
			total: 5,
			covered: 4,
		});
	});

	it('should properly summarize file with no statements', () => {
		expect(statementSummarizer(emptyFileCoverage)).toStrictEqual({
			total: 0,
			covered: 0,
		});
	});
});

describe('functionSummarizer', () => {
	it('should properly summarize both total & covered functions', () => {
		expect(
			functionSummarizer({
				...emptyFileCoverage,
				f: {
					0: 10,
					1: 3,
					2: 1,
					3: 5,
					4: 0,
					5: 7,
					6: 0,
					7: 10,
					8: 0,
					9: 15,
					10: 0,
				},
			}),
		).toStrictEqual({
			total: 11,
			covered: 7,
		});
	});

	it('should properly summarize file with no functions', () => {
		expect(functionSummarizer(emptyFileCoverage)).toStrictEqual({
			total: 0,
			covered: 0,
		});
	});
});

describe('branchSummarizer', () => {
	it('should properly summarize both total & covered branches', () => {
		expect(
			branchSummarizer({
				...emptyFileCoverage,
				b: {
					'0': [1, 1],
					'1': [0, 2],
					'2': [],
					'3': [1],
				},
			}),
		).toStrictEqual({
			total: 5,
			covered: 4,
		});
	});

	it('should properly summarize file with no branches', () => {
		expect(branchSummarizer(emptyFileCoverage)).toStrictEqual({
			total: 0,
			covered: 0,
		});
	});
});

describe('lineSummarizer', () => {
	it('should properly summarize both total & covered branches', () => {
		expect(
			lineSummarizer({
				...emptyFileCoverage,
				s: {
					0: 10,
					1: 15,
					2: 0,
					3: 11,
					4: 16,
				},
				statementMap: {
					0: {
						start: {
							line: 1,
						},
					},
					1: {
						start: {
							line: 2,
						},
					},
					2: {
						start: {
							line: 3,
						},
					},
					3: {
						start: {
							line: 2,
						},
					},
				} as unknown as Record<string, Range>,
			}),
		).toStrictEqual({
			total: 3,
			covered: 2,
		});
	});
});
