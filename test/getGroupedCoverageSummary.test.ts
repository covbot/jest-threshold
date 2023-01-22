/**
 * Tests were ported from https://github.com/facebook/jest.
 * Altered to suit project's needs.
 */
import { resolve } from 'path';
import { CoverageMap, CoverageSummary, createCoverageSummary, FileCoverage } from 'istanbul-lib-coverage';
import { getGroupedCoverageSummary } from '../src/getGroupedCoverageSummary';

// fs-mocking disabled, see in getGroupedCoverageSummary.ts, function createGlobWithCache
// 
// beforeEach(() => {
// 	mockFs({
// 		[`${process.cwd()}/path-test-files`]: {
// 			'000pc_coverage_file.js': '',
// 			'050pc_coverage_file.js': '',
// 			'100pc_coverage_file.js': '',
// 			'full_path_file.js': '',
// 			'glob-path': {
// 				'file1.js': '',
// 				'file2.js': '',
// 			},
// 			'non_covered_file.js': '',
// 			'relative_path_file.js': '',
// 		},
// 		[`${process.cwd()}/path-test`]: {
// 			'100pc_coverage_file.js': '',
// 		},
// 	});
// });

// afterEach(() => mockFs.restore());

const emptyCoverage = {
	covered: 0,
	pct: 100,
	skipped: 0,
	total: 0,
};

describe('getGroupedCoverageSummary', () => {
	let coverageMap: CoverageMap;

	beforeEach(() => {
		const fileCoverage = [
			['./path-test/100pc_coverage_file.js', { statements: { covered: 10, total: 10, skipped: 0, pct: 100 } }],
			['./path-test-files/covered_file_without_threshold.js'],
			['./path-test-files/full_path_file.js'],
			['./path-test-files/relative_path_file.js'],
			['./path-test-files/glob-path/file1.js'],
			['./path-test-files/glob-path/file2.js'],
			['./path-test-files/000pc_coverage_file.js', { statements: { covered: 0, total: 10, skipped: 0, pct: 0 } }],
			['./path-test-files/050pc_coverage_file.js'],
			[
				'./path-test-files/100pc_coverage_file.js',
				{ statements: { covered: 10, total: 10, skipped: 0, pct: 100 } },
			],
		] as const;

		const fileSummaryMap: Record<string, CoverageSummary> = {};

		const defaultCoverage = {
			branches: { covered: 0, total: 0, skipped: 0, pct: 0 },
			functions: { covered: 0, total: 0, skipped: 0, pct: 0 },
			lines: { covered: 0, total: 0, skipped: 0, pct: 0 },
			statements: { covered: 5, total: 10, skipped: 0, pct: 50 },
		};

		for (const [path, overrides] of fileCoverage) {
			fileSummaryMap[resolve(path)] = createCoverageSummary({
				...defaultCoverage,
				...overrides,
			});
		}

		coverageMap = {
			fileCoverageFor: (filename) => {
				if (fileSummaryMap[filename]) {
					return {
						toSummary() {
							return fileSummaryMap[filename];
						},
					} as FileCoverage;
				}

				throw new Error(`File ${filename} does not exist`);
			},
			files() {
				return Object.keys(fileSummaryMap);
			},
		} as CoverageMap;
	});

	it('should correctly calculate global coverage', async () => {
		const result = await getGroupedCoverageSummary(coverageMap, {
			global: {
				statements: 100,
			},
		});

		expect(result).toStrictEqual({
			global: {
				group: 'global',
				type: 'global',
				summary: {
					// TODO: get more information about this stat
					branchesTrue: expect.anything(),
					statements: {
						covered: 50,
						pct: 55.55,
						skipped: 0,
						total: 90,
					},
					branches: emptyCoverage,
					functions: emptyCoverage,
					lines: emptyCoverage,
				},
			},
		});
	});

	it('should correctly calculate coverage for individual files (by path)', async () => {
		const absolutePath = `${resolve(process.cwd())}/path-test-files/full_path_file.js`;
		const relativePath = './path-test-files/relative_path_file.js';

		const result = await getGroupedCoverageSummary(coverageMap, {
			global: {
				statements: 100,
			},
			[absolutePath]: {
				statements: 100,
			},
			[relativePath]: {
				statements: 100,
			},
		});

		expect(result).toStrictEqual({
			global: {
				group: 'global',
				type: 'global',
				summary: {
					statements: {
						covered: 40,
						pct: 57.14,
						skipped: 0,
						total: 70,
					},
					branchesTrue: expect.anything(),
					branches: emptyCoverage,
					functions: emptyCoverage,
					lines: emptyCoverage,
				},
			},
			[absolutePath]: {
				group: absolutePath,
				type: 'path',
				summary: {
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
					branchesTrue: expect.anything(),
					branches: emptyCoverage,
					functions: emptyCoverage,
					lines: emptyCoverage,
				},
			},
			[relativePath]: {
				type: 'path',
				group: relativePath,
				summary: {
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
					branchesTrue: expect.anything(),
					branches: emptyCoverage,
					functions: emptyCoverage,
					lines: emptyCoverage,
				},
			},
		});
	});

	it('should return a special failure, when no coverage data about file exists', async () => {
		const filepath = 'path-test-files/non_covered_file.js';
		const result = await getGroupedCoverageSummary(coverageMap, {
			[filepath]: {
				statements: 100,
			},
		});

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'unidentified',
			},
		});
	});

	it('should correctly calculate coverage for directory', async () => {
		const filepath = './path-test-files/glob-path/';
		const result = await getGroupedCoverageSummary(coverageMap, {
			[filepath]: {
				statements: 100,
			},
		});

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'path',
				summary: {
					statements: {
						covered: 10,
						pct: 50,
						skipped: 0,
						total: 20,
					},
					branchesTrue: expect.anything(),
					branches: emptyCoverage,
					functions: emptyCoverage,
					lines: emptyCoverage,
				},
			},
		});
	});

	it("should mark a special failure, when file doesn't exist", async () => {
		const filepath = './path/doesnt/exist';
		const result = await getGroupedCoverageSummary(coverageMap, {
			[filepath]: {
				statements: 40,
			},
		});

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'unidentified',
			},
		});
	});

	it(
		'should correctly calculate global coverage when PATH ' +
			'and GLOB threshold groups have matched all the files in coverage data',
		async () => {
			const result = await getGroupedCoverageSummary(coverageMap, {
				['./path-test-files/']: {
					statements: 50,
				},
				['./path-test/']: {
					statements: 100,
				},
				global: {
					statements: 100,
				},
			});

			expect(result).toStrictEqual({
				['./path-test-files/']: {
					group: './path-test-files/',
					type: 'path',
					summary: {
						statements: {
							covered: 40,
							pct: 50,
							skipped: 0,
							total: 80,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
				['./path-test/']: {
					group: './path-test/',
					type: 'path',
					summary: {
						statements: {
							covered: 10,
							pct: 100,
							skipped: 0,
							total: 10,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
				global: {
					group: 'global',
					type: 'unidentified',
				},
			});
		},
	);

	it('should correctly calculate coverage when file and directory groups overlap', async () => {
		const covThreshold: Record<string, { statements: number }> = {};
		[
			'./path-test-files/',
			'./path-test-files/covered_file_without_threshold.js',
			'./path-test-files/full_path_file.js',
			'./path-test-files/relative_path_file.js',
			'./path-test-files/glob-path/file1.js',
			'./path-test-files/glob-path/file2.js',
			'./path-test-files/*.js',
		].forEach((path) => {
			covThreshold[path] = {
				statements: 0,
			};
		});

		const result = await getGroupedCoverageSummary(coverageMap, covThreshold);

		expect(result).toStrictEqual({
			'./path-test-files/': {
				group: './path-test-files/',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 40,
						pct: 50,
						skipped: 0,
						total: 80,
					},
				},
			},
			'./path-test-files/*.js': {
				group: './path-test-files/*.js',
				type: 'glob',
				summary: {
					[resolve(process.cwd(), 'path-test-files/000pc_coverage_file.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 0,
							pct: 0,
							skipped: 0,
							total: 10,
						},
					},
					[resolve(process.cwd(), 'path-test-files/050pc_coverage_file.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
					},
					[resolve(process.cwd(), 'path-test-files/100pc_coverage_file.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 10,
							pct: 100,
							skipped: 0,
							total: 10,
						},
					},
					[resolve(process.cwd(), 'path-test-files/full_path_file.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
					},
					[resolve(process.cwd(), 'path-test-files/covered_file_without_threshold.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
					},
					[resolve(process.cwd(), 'path-test-files/relative_path_file.js')]: {
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
					},
				},
			},
			'./path-test-files/covered_file_without_threshold.js': {
				group: './path-test-files/covered_file_without_threshold.js',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
				},
			},
			'./path-test-files/full_path_file.js': {
				group: './path-test-files/full_path_file.js',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
				},
			},
			'./path-test-files/glob-path/file1.js': {
				group: './path-test-files/glob-path/file1.js',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
				},
			},
			'./path-test-files/glob-path/file2.js': {
				group: './path-test-files/glob-path/file2.js',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
				},
			},
			'./path-test-files/relative_path_file.js': {
				group: './path-test-files/relative_path_file.js',
				type: 'path',
				summary: {
					branches: emptyCoverage,
					branchesTrue: expect.anything(),
					functions: emptyCoverage,
					lines: emptyCoverage,
					statements: {
						covered: 5,
						pct: 50,
						skipped: 0,
						total: 10,
					},
				},
			},
		});
	});

	it(
		'should subtract coverage data for matching paths from overall coverage, when globs or paths are ' +
			'specified alongside global',
		async () => {
			const result = await getGroupedCoverageSummary(coverageMap, {
				'./path-test-files/100pc_coverage_file.js': {
					statements: 100,
				},
				'./path-test/100pc_coverage_file.js': {
					statements: 100,
				},
				global: {
					statements: 50,
				},
			});

			expect(result).toStrictEqual({
				'./path-test-files/100pc_coverage_file.js': {
					group: './path-test-files/100pc_coverage_file.js',
					type: 'path',
					summary: {
						statements: {
							covered: 10,
							pct: 100,
							skipped: 0,
							total: 10,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
				'./path-test/100pc_coverage_file.js': {
					group: './path-test/100pc_coverage_file.js',
					type: 'path',
					summary: {
						statements: {
							covered: 10,
							pct: 100,
							skipped: 0,
							total: 10,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
				global: {
					group: 'global',
					type: 'global',
					summary: {
						statements: {
							covered: 30,
							pct: 42.85,
							skipped: 0,
							total: 70,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
			});
		},
	);

	it('should unwrap glob pattern, and output coverage summary on each file, matching glob', async () => {
		const filepath = './path-test-files/glob-path/*.js';
		const result = await getGroupedCoverageSummary(coverageMap, {
			[filepath]: {
				statements: 100,
			},
		});

		const file1 = resolve(process.cwd(), './path-test-files/glob-path/file1.js');
		const file2 = resolve(process.cwd(), './path-test-files/glob-path/file2.js');

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'glob',
				summary: {
					[file1]: {
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
					[file2]: {
						statements: {
							covered: 5,
							pct: 50,
							skipped: 0,
							total: 10,
						},
						branchesTrue: expect.anything(),
						branches: emptyCoverage,
						functions: emptyCoverage,
						lines: emptyCoverage,
					},
				},
			},
		});
	});
});
