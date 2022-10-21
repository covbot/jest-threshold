import { branchSummarizer, functionSummarizer, lineSummarizer, statementSummarizer } from './summarizers';
import { CoverageMap, FileCoverageSummary } from './types';

/**
 * Function, which summarizes coverage of each file: it counts how many total and covered statements, functions,
 *   branches and lines are in file.
 * @param map a project's coverage map
 * @returns a map, where keys are names of files, described in coverage map, and values are summaries of their coverage
 */
export const summarizeCoverageMap = (map: CoverageMap): Record<string, FileCoverageSummary> => {
	const summary: Record<string, FileCoverageSummary> = {};

	for (const [filename, coverage] of Object.entries(map)) {
		summary[filename] = {
			statements: statementSummarizer(coverage),
			functions: functionSummarizer(coverage),
			branches: branchSummarizer(coverage),
			lines: lineSummarizer(coverage),
		};
	}

	return summary;
};
