/**
 * The algorithm, written in this file, was shamelessly stolen from https://github.com/facebook/jest,
 *   which is licensed under MIT license (https://github.com/facebook/jest/blob/main/LICENSE).
 * It was refactored a bit to suit project's needs.
 */

import { CoverageSummaryData } from 'istanbul-lib-coverage';
import { CheckThresholdResult } from './CheckThresholdResult';
import { CoverageGroupSummary } from './CoverageGroupSummary';
import { ThresholdGroupType } from './ThresholdGroupType';
import { ThresholdType } from './ThresholdType';
import type { Threshold } from './Threshold';
import type { ThresholdGroupMap } from './ThresholdGroupMap';
import type { ThresholdGroupResult } from './ThresholdGroupResult';
import type { Config } from '@jest/types';

const summaryKeys = ['statements', 'branches', 'lines', 'functions'] as Array<keyof CoverageSummaryData>;

/**
 * Check one threshold group, from configuration.
 * @param summary The summary of files, included in threshold group
 * @param thresholds Threshold entries of threshold group, from the configuration
 * @returns Object, containing information about all checks, that were performed against specified coverage file.
 */
const checkSingleThresholdGroup = (
	summary: CoverageSummaryData,
	thresholds: Config.CoverageThresholdValue,
): ThresholdGroupMap => {
	const result: Partial<ThresholdGroupMap> = {};

	for (const key of summaryKeys) {
		const threshold = thresholds[key];
		if (threshold === undefined) {
			result[key] = {
				type: ThresholdType.UNSPECIFIED,
			};
			continue;
		}

		if (threshold < 0) {
			// Check by units
			const uncoveredUnits = summary[key].total - summary[key].covered;
			const pass = uncoveredUnits <= -threshold;

			result[key] = {
				type: ThresholdType.UNIT,
				threshold: summary[key].total + threshold,
				actual: summary[key].covered,
				pass,
			};
		} else {
			// Check by percents

			/**
			 * Using percent value from istanbul-lib-coverage, as it will be always rounded value, ready for display.
			 * The rounded value is used to ensure predictable logic - it is better to compare what user actually sees.
			 *
			 * For instance:
			 *   We have 3 statements, where only 2 are covered. User will see 66.67% on the screen. User specifies
			 *   threshold for statements to `66.67`. By comparing rounded values, we don't have any issue - what
			 *   user sees, that they get. However, if we skip rounding, the actual coverage percentage is 0 dot 6
			 *   in period, which is slightly less than value, specified by user. In that case, user will see the
			 *   message: "Coverage threshold check failed: expected at least 66.67%, but got 66.67%".
			 */
			const pass = summary[key].pct >= threshold;
			result[key] = {
				type: ThresholdType.PERCENTAGE,
				threshold,
				actual: summary[key].pct,
				pass,
			};
		}
	}

	return result as ThresholdGroupMap;
};

/**
 * Validate threshold against specified coverage summary. Returns an object, containing results on each threshold group.
 * @param coverageSummary Grouped coverage summaries, received from getGroupedCoverageSummaries function.
 * @param threshold Thresholds from jest configuration file.
 * @returns The object, which has same keys as specified `threshold` parameter. Each value in this object represents
 * threshold check result.
 */
export const checkThreshold = (
	coverageSummary: Record<string, CoverageGroupSummary>,
	threshold: Threshold,
): CheckThresholdResult => {
	const result: CheckThresholdResult = {};

	const groupSummaries = Object.values(coverageSummary);

	for (const groupSummary of groupSummaries) {
		switch (groupSummary.type) {
			// Lack of coverage data
			case ThresholdGroupType.UNIDENTIFIED:
				result[groupSummary.group] = groupSummary;
				break;
			// Run threshold check on each file, matched by glob
			case ThresholdGroupType.GLOB: {
				const groupResult: ThresholdGroupResult = {
					type: ThresholdGroupType.GLOB,
					group: groupSummary.group,
					checks: {},
				};
				const files = Object.entries(groupSummary.summary);
				const groupThreshold = threshold[groupSummary.group]!;
				for (const [filename, summary] of files) {
					const checks = checkSingleThresholdGroup(summary, groupThreshold);
					groupResult.checks[filename] = checks;
				}
				result[groupResult.group] = groupResult;
				break;
			}
			// Run check for merged coverage data
			case ThresholdGroupType.PATH:
			case ThresholdGroupType.GLOBAL:
				result[groupSummary.group] = {
					group: groupSummary.group,
					type: groupSummary.type,
					checks: checkSingleThresholdGroup(groupSummary.summary, threshold[groupSummary.group]!),
				};
		}
	}

	return result;
};
