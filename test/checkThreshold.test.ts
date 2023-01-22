/**
 * Tests were ported from https://github.com/facebook/jest.
 * Altered to suit project's needs.
 */
import { checkThreshold } from '../src/checkThreshold';
import { resolve } from 'path';
import mockFs from 'mock-fs';
import { CoverageMap, CoverageSummary, createCoverageSummary, FileCoverage } from 'istanbul-lib-coverage';
import { ThresholdResult } from '../src/ThresholdResult';
import { isPassed } from '../src/isPassed';
import { getGroupedCoverageSummary } from '../src/getGroupedCoverageSummary';

beforeEach(() => {
	mockFs({
		[`${process.cwd()}/path-test-files`]: {
			'000pc_coverage_file.js': '',
			'050pc_coverage_file.js': '',
			'100pc_coverage_file.js': '',
			'full_path_file.js': '',
			'glob-path': {
				'file1.js': '',
				'file2.js': '',
			},
			'non_covered_file.js': '',
			'relative_path_file.js': '',
		},
		[`${process.cwd()}/path-test`]: {
			'100pc_coverage_file.js': '',
		},
	});
});

afterEach(() => mockFs.restore());

describe('checkThreshold', () => {
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

	it('should return a failure for global group, when threshold is not met', async () => {
		const threshold = {
			global: {
				statements: 100,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			global: {
				group: 'global',
				type: 'global',
				checks: {
					statements: {
						pass: false,
						threshold: 100,
						actual: 55.55,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should return a failure for groups, when thresholds are not met by files', async () => {
		const absolutePath = `${resolve(process.cwd())}/path-test-files/full_path_file.js`;
		const relativePath = './path-test-files/relative_path_file.js';

		const threshold = {
			global: {
				statements: 100,
			},
			[absolutePath]: {
				statements: 100,
			},
			[relativePath]: {
				statements: 100,
			},
		};

		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			global: expect.anything(),
			[absolutePath]: {
				group: absolutePath,
				type: 'path',
				checks: {
					statements: {
						pass: false,
						threshold: 100,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
			[relativePath]: {
				type: 'path',
				group: relativePath,
				checks: {
					statements: {
						pass: false,
						threshold: 100,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should return correct result, when all thresholds are met', async () => {
		const absolutePath = `${resolve(process.cwd())}/path-test-files/full_path_file.js`;
		const relativePath = './path-test-files/relative_path_file.js';

		const threshold = {
			global: {
				statements: 50,
			},
			[absolutePath]: {
				statements: 50,
			},
			[relativePath]: {
				statements: 50,
			},
		}

		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			global: expect.anything(),
			[absolutePath]: {
				group: absolutePath,
				type: 'path',
				checks: {
					statements: {
						pass: true,
						threshold: 50,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
			[relativePath]: {
				group: relativePath,
				type: 'path',
				checks: {
					statements: {
						pass: true,
						threshold: 50,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should return a special failure, when threshold is not met for non-covered file', async () => {
		const filepath = 'path-test-files/non_covered_file.js';
		const threshold = {
			[filepath]: {
				statements: 100,
			},
		}
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'unidentified',
			},
		});
	});

	it('should return a failure, when threshold is not met for directory', async () => {
		const filepath = './path-test-files/glob-path/';
		const threshold = {
			[filepath]: {
				statements: 100,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'path',
				checks: {
					statements: {
						pass: false,
						threshold: 100,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should return a success, when threshold is met for a directory', async () => {
		const filepath = './path-test-files/glob-path/';
		const threshold = {
			[filepath]: {
				statements: 40,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'path',
				checks: {
					statements: {
						pass: true,
						threshold: 40,
						actual: 50,
						type: 'percentage',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should mark a special failure, when there is no coverage data for a threshold', async () => {
		const filepath = './path/doesnt/exist';
		const threshold = {
			[filepath]: {
				statements: 40,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'unidentified',
			},
		});
	});

	it(
		'should return a success, when global threshold group is empty because PATH and GLOB threshold groups have' +
			'matched all the files in the coverage data.',
		async () => {
			const threshold = {
				['./path-test-files/']: {
					statements: 50,
				},
				['./path-test/']: {
					statements: 100,
				},
				global: {
					statements: 100,
				},
			};
			const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

			expect(result).toStrictEqual({
				['./path-test-files/']: {
					group: './path-test-files/',
					type: 'path',
					checks: {
						statements: {
							threshold: 50,
							actual: 50,
							pass: true,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
				['./path-test/']: {
					group: './path-test/',
					type: 'path',
					checks: {
						statements: {
							threshold: 100,
							actual: 100,
							pass: true,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
				global: {
					group: 'global',
					type: 'unidentified',
				},
			});
		},
	);

	it('should return success, when file and directory path threshold groups overlap', async () => {
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

		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, covThreshold), covThreshold);

		expect(isPassed(result)).toBeTruthy();
	});

	it(
		'should subtract coverage data for matching paths from overall coverage, when globs or paths are' +
			'specified alongside global',
		async () => {
			const threshold = {
				'./path-test-files/100pc_coverage_file.js': {
					statements: 100,
				},
				'./path-test/100pc_coverage_file.js': {
					statements: 100,
				},
				global: {
					statements: 50,
				},
			};
			const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

			expect(result).toStrictEqual({
				'./path-test-files/100pc_coverage_file.js': {
					group: './path-test-files/100pc_coverage_file.js',
					type: 'path',
					checks: {
						statements: {
							threshold: 100,
							actual: 100,
							pass: true,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
				'./path-test/100pc_coverage_file.js': {
					group: './path-test/100pc_coverage_file.js',
					type: 'path',
					checks: {
						statements: {
							threshold: 100,
							actual: 100,
							pass: true,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
				global: {
					group: 'global',
					type: 'global',
					checks: {
						statements: {
							threshold: 50,
							actual: 42.85,
							pass: false,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
			});
		},
	);

	it('should unwrap glob pattern, and output threshold checks on each file, matching glob', async () => {
		const filepath = './path-test-files/glob-path/*.js';
		const threshold = {
			[filepath]: {
				statements: 100,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		const file1 = resolve(process.cwd(), './path-test-files/glob-path/file1.js');
		const file2 = resolve(process.cwd(), './path-test-files/glob-path/file2.js');

		expect(result).toStrictEqual({
			[filepath]: {
				group: filepath,
				type: 'glob',
				checks: {
					[file1]: {
						statements: {
							pass: false,
							threshold: 100,
							actual: 50,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
					[file2]: {
						statements: {
							pass: false,
							threshold: 100,
							actual: 50,
							type: 'percentage',
						},
						branches: {
							type: 'unspecified',
						},
						functions: {
							type: 'unspecified',
						},
						lines: {
							type: 'unspecified',
						},
					},
				},
			},
		});
	});

	it('should return failure, when threshold by units is not passed', async () => {
		const threshold = {
			global: {
				statements: -3,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			global: {
				group: 'global',
				type: 'global',
				checks: {
					statements: {
						pass: false,
						threshold: 87, // expected statements to be covered (90 - 3)
						actual: 50, // actual covered statements
						type: 'unit',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});

	it('should return success, when threshold by units is passed', async () => {
		const group = './path-test/';
		const threshold = {
			[group]: {
				statements: -1,
			},
		};
		const result = checkThreshold(await getGroupedCoverageSummary(coverageMap, threshold), threshold);

		expect(result).toStrictEqual({
			[group]: {
				group,
				type: 'path',
				checks: {
					statements: {
						pass: true,
						threshold: 9, // expected statements to be covered (90 - 3)
						actual: 10, // actual covered statements
						type: 'unit',
					},
					branches: {
						type: 'unspecified',
					},
					functions: {
						type: 'unspecified',
					},
					lines: {
						type: 'unspecified',
					},
				},
			},
		});
	});
});
