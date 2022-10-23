import { CoverageStat, HitMap } from './types';
import type { FileCoverageData } from 'istanbul-lib-coverage';

/**
 * A function, which takes raw information about file coverage, and returns
 *   single stat summary.
 * For instance, `statementSummarizer` returns amount of total and covered
 *   statements in file.
 */
export type Summarizer = (coverage: FileCoverageData) => CoverageStat;

/**
 * This function summarizes hit map, using simple algorithm:
 *   total - amount of entries in hitMap.
 *   covered - amount of values in hitMap that are greater than 0.
 * That is a utility function for internal purposes.
 * @param hitMap a map which describes how many times entries were hit in tests
 * @returns summarized coverage stat
 */
const summarizeHitMap = (hitMap: HitMap) => {
	const hitEntries: number[] = Object.values(hitMap);
	const total = hitEntries.length;
	const covered = hitEntries.reduce((covered, hits) => covered + Number(hits > 0), 0);

	return { total, covered };
};

/**
 * Calculates amount of total and covered statements.
 *
 * Few examples, of what counts as a statement, and what is not:
 * ```js
 * // [-] That's a variable declaration, not statement.
 * let a;
 * // [+] That's a variable assignment statement.
 * let b = 3;
 *
 * // [-] That's a function declaration, not a statement.
 * function b() {}
 * // [+] That's a function call statement.
 * b();
 * ```
 * If you want to learn more about what is a statement, check this source:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements#difference_between_statements_and_declarations
 * @param coverage coverage map of single file
 * @returns amount of total and covered statements.
 */
export const statementSummarizer: Summarizer = (coverage) => {
	return summarizeHitMap(coverage.s);
};

/**
 * Calculates amount of total and covered functions. Function counts as covered,
 *   if it was called at least once. Unlike statements, functions are being counted
 *   by declarations.
 * So, if function returns `{ total: 3, covered: 2 }`, it means that file has 3 functions,
 *   2 of which were called in test suite.
 * @param coverage coverage map of single file.
 * @returns amount of total and covered functions.
 */
export const functionSummarizer: Summarizer = (coverage) => {
	return summarizeHitMap(coverage.f);
};

/**
 * Calculates amount of total and covered branches. The branch is:
 * ```js
 * // if / else blocks are branches.
 * if(condition) {            // [+] that is the beginning of first branch of first branch group.
 *    console.log("truthy");  // [-] that is a statement.
 * } else {                   // [+] that is the beginning of second branch of first branch group.
 *    console.log("falsy");
 * }
 *
 * // switch / case statements are branches too!
 * switch(condition) {        // that is the beginning of second branch group.
 *     case 0:                // that is the beginning first branch of second branch group.
 *         break;
 *     case 1:                // that is the beginning second branch of second branch group.
 *         break;
 *     default:               // that is the beginning third branch of second branch group.
 *         break;
 * }
 *
 * // Ternary operators are also branches.
 * condition ?                // that is the beginning of third branch group.
 *     truthy :               // that is the first branch of third branch group.
 *     falsy                  // that is the second branch of third branch group.
 * ```
 * @param coverage coverage map of single file.
 * @returns amount of total and covered branches.
 */
export const branchSummarizer: Summarizer = (coverage) => {
	const hitEntries = Object.values(coverage.b);
	const total = hitEntries.reduce((total, branches) => total + branches.length, 0);

	let covered = 0;

	for (const branches of hitEntries) {
		// Count how many branches of statement root are covered
		const coveredBranches = branches.reduce((accumulator, hits) => accumulator + Number(hits > 0), 0);

		covered += coveredBranches;
	}

	return {
		total,
		covered,
	};
};

/**
 * Calculates amount of total and covered lines. A line is counted for each statement beginning.
 * @param coverage coverage map of single file.
 * @returns amount of total and covered lines.
 */
export const lineSummarizer: Summarizer = (coverage) => {
	// Originally created by @jlim9333 in https://github.com/ArtiomTr/jest-coverage-report-action/pull/119
	// Moved to a separate package and refactored by sirse.

	const lineHitMap: HitMap = {};

	for (const statementKey in coverage.s) {
		const hits = coverage.s[statementKey];
		const statement = coverage.statementMap[Number(statementKey)];

		if (statement !== undefined) {
			const { line } = statement.start;
			const previousValue = lineHitMap[line];
			if (previousValue === undefined || previousValue < hits) {
				lineHitMap[line] = hits;
			}
		}
	}

	return summarizeHitMap(lineHitMap);
};
