/**
 * The algorithm, written in this file, was shamelessly stolen from https://github.com/facebook/jest,
 *   which is licensed under MIT license (https://github.com/facebook/jest/blob/main/LICENSE).
 * It was refactored a bit to suit project's needs.
 */

import fs from 'fs';
import path from 'path';
import fastGlob from 'fast-glob';
import {
	CoverageMap,
	CoverageSummary,
	CoverageSummaryData,
	createCoverageSummary,
	FileCoverage,
} from 'istanbul-lib-coverage';
import { Threshold, ThresholdGroupMap, ThresholdGroupResult, ThresholdType } from './types';
import type { Config } from '@jest/types';

export type CheckThresholdResult = Record<string, ThresholdGroupResult>;

/**
 * Classify threshold groups into subgroups. This classification describes, which algorithm should be used to
 * validate thresholds.
 */
enum ThresholdGroupType {
	/**
	 * A glob pattern threshold group. Algorithm will perform separate checks for each file, that was matched by glob.
	 */
	GLOB = 'glob',
	/**
	 * A path threshold group. Could be a single file or a directory. All coverage summaries for files, that were
	 * matched by path, will be merged into one summary. Merged summary will be checked by specified threshold values.
	 */
	PATH = 'path',
	/**
	 * All unmatched files group. All summaries of files, that were not matched by other threshold group, will be
	 * conducted into one summary. Merged summary will be checked by specified threshold values.
	 */
	GLOBAL = 'global',
}

/**
 * Function, which takes threshold group specifier from configuration, and returns it's absolute path,
 *   preserving trailing slash.
 * @param thresholdGroup The threshold group specifier from configuration.
 * @returns Absolute threshold group specifier.
 */
const getAbsoluteThresholdGroup = (thresholdGroup: string): string => {
	const resolvedThresholdGroup = path.resolve(thresholdGroup);

	const isWindowsPlatform = process.platform === 'win32';

	// If it is not windows, then path should always end with system separator.
	if (!thresholdGroup.endsWith(path.sep) && !isWindowsPlatform) {
		return resolvedThresholdGroup;
	}

	// If it is windows, then path could end with both '/' and '\\' separators.
	if (isWindowsPlatform && !thresholdGroup.endsWith('/')) {
		return resolvedThresholdGroup;
	}

	// If resolved threshold group already ends with a separator, don't add another one.
	if (resolvedThresholdGroup.endsWith(path.sep)) {
		return resolvedThresholdGroup;
	}

	return resolvedThresholdGroup + path.sep;
};

/**
 * Create a "glob" function, but with cache.
 * Used to prevent unnecessary calls to file system.
 */
const createGlobWithCache = () => {
	const cacheStore = new Map<string, string[]>();

	return async (pattern: string) => {
		if (cacheStore.has(pattern)) {
			return cacheStore.get(pattern)!;
		}

		const files = await fastGlob(pattern.replace(/\\/g, '/'), { fs });
		const resolvedFiles = files.map((file) => path.resolve(file));
		cacheStore.set(pattern, resolvedFiles);
		return resolvedFiles;
	};
};

const summaryKeys = ['statements', 'branches', 'lines', 'functions'] as Array<keyof CoverageSummaryData>;

/**
 * Check one threshold group, from configuration.
 * @param summary The summary of files, included in threshold group
 * @param thresholds Threshold entries of threshold group, from the configuration
 * @returns Object, containing information about all checks, that were performed against specified coverage file.
 */
const checkSingleThresholdGroup = (
	summary: CoverageSummary,
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
				threshold,
				actual: uncoveredUnits,
				pass,
			};
		} else {
			// Check by percents

			/**
			 * Using percent value from istanbul-lib-coverage, as it will be always rounded value, ready for display.
			 * The rounded value is used to ensure predictable logic - it is better to compare what user actually sees.
			 *
			 * For instance:
			 *   We have 3 statements, where only 1 is covered. User will see 33.33% on the screen. User specifies
			 *   threshold for statements to `33.33`. By comparing rounded values, we don't have any issue - what
			 *   user sees, that they get. However, if we skip rounding, the actual coverage percentage is 0 dot 3
			 *   in period, which is slightly more than value, specified by user. In that case, user will see the
			 *   message: "Coverage threshold check failed: expected at least 33.33%, but got 33.33%".
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
 * Merges all FileCoverage summaries into one.
 * @param coverages An array of file coverage information.
 * @returns A combined summary of all file coverages, provided to the arguments.
 */
const mergeFileCoverages = (coverages: FileCoverage[]): CoverageSummary => {
	const emptySummary = createCoverageSummary();

	// eslint-disable-next-line unicorn/no-array-reduce
	return coverages.reduce((summary, coverage) => summary.merge(coverage.toSummary()), emptySummary);
};

/**
 * Create check results for a situation, where there is a lack of coverage information to check threshold group.
 * @returns The ThresholdGroupMap object, where all threshold check results are of type 'empty'.
 */
const createEmptyChecks = (): ThresholdGroupMap =>
	Object.fromEntries(summaryKeys.map((key) => [key, { type: ThresholdType.EMPTY }])) as ThresholdGroupMap;

/**
 * Validate threshold against specified coverage map. Returns an object, containing results on each threshold group.
 * @param coverageMap Istanbul coverage map.
 * @param threshold Thresholds from jest configuration file.
 * @returns The object, which has same keys as specified `threshold` parameter. Each value in this object represents
 * threshold check result.
 */
export const checkThreshold = async (coverageMap: CoverageMap, threshold: Threshold): Promise<CheckThresholdResult> => {
	const result: CheckThresholdResult = {};
	const coveredFiles = coverageMap.files();
	const glob = createGlobWithCache();

	const groups = Object.keys(threshold).map((initial) => [initial, getAbsoluteThresholdGroup(initial)] as const);

	const filesByGroup = Object.fromEntries(Object.keys(threshold).map((group) => [group, [] as string[]]));
	const groupTypes = new Map<string, ThresholdGroupType>();

	// Filter files by groups.
	for (const file of coveredFiles) {
		// Check if file was matched by one of groups.
		let fellIntoGroup = false;

		for (const [group, absoluteGroup] of groups) {
			if (file.indexOf(absoluteGroup) === 0) {
				// File path begins with absoluteGroup - the group is probably the directory matcher.
				filesByGroup[group].push(file);
				fellIntoGroup = true;
				groupTypes.set(group, ThresholdGroupType.PATH);
				continue;
			}

			// Trying to use absolute group path as a glob pattern.
			const globResult = await glob(absoluteGroup);
			if (globResult.includes(file)) {
				// File was matched by glob pattern - the group is probably a glob matcher.
				filesByGroup[group].push(file);
				fellIntoGroup = true;
				groupTypes.set(group, ThresholdGroupType.GLOB);
			}
		}

		// File was not matched by any threshold group - attach it to a global group.
		if (!fellIntoGroup && threshold.global) {
			filesByGroup['global'].push(file);
			groupTypes.set('global', ThresholdGroupType.GLOBAL);
		}
	}

	// Check each group's thresholds.
	for (const [group] of groups) {
		const type = groupTypes.get(group);

		switch (type) {
			// No files were matched by group - lack of coverage data detected.
			case undefined:
				result[group] = { group, checks: createEmptyChecks() };
				break;
			// Group is a glob - run threshold checks on each file.
			case ThresholdGroupType.GLOB:
				for (const file of filesByGroup[group]) {
					const summary = coverageMap.fileCoverageFor(file).toSummary();
					const checks = checkSingleThresholdGroup(summary, threshold[group]!);
					// FIXME: only last file matched by glob will be saved into results.
					result[group] = {
						group,
						checks,
					};
				}
				break;
			// Group is a PATH or GLOBAL specifier - merge coverage summaries and run check.
			case ThresholdGroupType.PATH:
			case ThresholdGroupType.GLOBAL:
				result[group] = {
					group,
					checks: checkSingleThresholdGroup(
						mergeFileCoverages(
							filesByGroup[group].map((filename) => coverageMap.fileCoverageFor(filename)),
						),
						threshold[group]!,
					),
				};
				break;
		}
	}

	return result;
};
