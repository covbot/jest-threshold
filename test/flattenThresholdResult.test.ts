import { flattenThresholdResult } from '../src/flattenThresholdResult';
import { ThresholdGroupType } from '../src/ThresholdGroupType';
import { ThresholdType } from '../src/ThresholdType';

describe('flattenThresholdResult', () => {
	it('should flatten unidentified result', () => {
		expect(
			flattenThresholdResult({
				hello: {
					group: 'hello',
					type: ThresholdGroupType.UNIDENTIFIED,
				},
			}),
		).toStrictEqual([
			{
				group: 'hello',
			},
		]);
	});

	it('should flatten GLOBAL result', () => {
		expect(
			flattenThresholdResult({
				global: {
					group: 'global',
					type: ThresholdGroupType.GLOBAL,
					checks: {
						statements: {
							actual: 50,
							threshold: 75,
							pass: false,
							type: ThresholdType.PERCENTAGE,
						},
						branches: {
							type: ThresholdType.UNSPECIFIED,
						},
						functions: {
							type: ThresholdType.UNSPECIFIED,
						},
						lines: {
							type: ThresholdType.UNSPECIFIED,
						},
					},
				},
			}),
		).toStrictEqual([
			{
				group: 'global',
				entryType: 'statements',
				actual: 50,
				threshold: 75,
				pass: false,
				type: ThresholdType.PERCENTAGE,
			},
			{
				group: 'global',
				entryType: 'branches',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: 'global',
				entryType: 'functions',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: 'global',
				entryType: 'lines',
				type: ThresholdType.UNSPECIFIED,
			},
		]);
	});

	it('should flatten PATH result', () => {
		const path = './path-to/file.js';
		expect(
			flattenThresholdResult({
				[path]: {
					group: path,
					type: ThresholdGroupType.PATH,
					checks: {
						statements: {
							actual: 50,
							threshold: 75,
							pass: false,
							type: ThresholdType.PERCENTAGE,
						},
						branches: {
							type: ThresholdType.UNSPECIFIED,
						},
						functions: {
							type: ThresholdType.UNSPECIFIED,
						},
						lines: {
							type: ThresholdType.UNSPECIFIED,
						},
					},
				},
			}),
		).toStrictEqual([
			{
				group: path,
				entryType: 'statements',
				actual: 50,
				threshold: 75,
				pass: false,
				type: ThresholdType.PERCENTAGE,
			},
			{
				group: path,
				entryType: 'branches',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: path,
				entryType: 'functions',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: path,
				entryType: 'lines',
				type: ThresholdType.UNSPECIFIED,
			},
		]);
	});

	it('should flatten GLOB result', () => {
		const pattern = './path-to/*.js';

		const file1 = './path-to/file1.js';
		const file2 = './path-to/file2.js';
		expect(
			flattenThresholdResult({
				[pattern]: {
					group: pattern,
					type: ThresholdGroupType.GLOB,
					checks: {
						[file1]: {
							statements: {
								actual: 50,
								threshold: 75,
								pass: false,
								type: ThresholdType.PERCENTAGE,
							},
							branches: {
								type: ThresholdType.UNSPECIFIED,
							},
							functions: {
								type: ThresholdType.UNSPECIFIED,
							},
							lines: {
								type: ThresholdType.UNSPECIFIED,
							},
						},
						[file2]: {
							statements: {
								actual: 100,
								threshold: 100,
								pass: true,
								type: ThresholdType.PERCENTAGE,
							},
							branches: {
								type: ThresholdType.UNSPECIFIED,
							},
							functions: {
								type: ThresholdType.UNSPECIFIED,
							},
							lines: {
								type: ThresholdType.UNSPECIFIED,
							},
						},
					},
				},
			}),
		).toStrictEqual([
			{
				group: file1,
				entryType: 'statements',
				actual: 50,
				threshold: 75,
				pass: false,
				type: ThresholdType.PERCENTAGE,
			},
			{
				group: file1,
				entryType: 'branches',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: file1,
				entryType: 'functions',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: file1,
				entryType: 'lines',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: file2,
				entryType: 'statements',
				actual: 100,
				threshold: 100,
				pass: true,
				type: ThresholdType.PERCENTAGE,
			},
			{
				group: file2,
				entryType: 'branches',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: file2,
				entryType: 'functions',
				type: ThresholdType.UNSPECIFIED,
			},
			{
				group: file2,
				entryType: 'lines',
				type: ThresholdType.UNSPECIFIED,
			},
		]);
	});
});
