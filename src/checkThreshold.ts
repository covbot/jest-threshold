/**
 * The algorithm, written in this file, was shamelessly stolen from https://github.com/facebook/jest,
 *   which is licensed under MIT license (https://github.com/facebook/jest/blob/main/LICENSE).
 * It was refactored a bit to suit project's needs.
 */

import fs from 'node:fs';
import { resolve, sep } from 'node:path';
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

enum ThresholdGroupType {
	GLOB = 'glob',
	GLOBAL = 'global',
	PATH = 'path',
}

/**
 * Function, which takes threshold group specifier from configuration, and returns it's absolute path,
 *   preserving trailing slash.
 * @param thresholdGroup The threshold group specifier from configuration
 * @returns Absolute threshold group specifier.
 */
const getAbsoluteThresholdGroup = (thresholdGroup: string): string => {
	const resolvedThresholdGroup = resolve(thresholdGroup);

	const isWindowsPlatform = process.platform === 'win32';

	// If it is not windows, then path should always end with system separator.
	if (!thresholdGroup.endsWith(sep) && !isWindowsPlatform) {
		return resolvedThresholdGroup;
	}

	// If it is windows, then path could end with both '/' and '\\' separators.
	if (isWindowsPlatform && !thresholdGroup.endsWith('/')) {
		return resolvedThresholdGroup;
	}

	// If resolved threshold group already ends with a separator, don't add another one.
	if (resolvedThresholdGroup.endsWith(sep)) {
		return resolvedThresholdGroup;
	}

	return resolvedThresholdGroup + sep;
};

const createGlobWithCache = () => {
	const cacheStore = new Map<string, string[]>();

	return async (pattern: string) => {
		if (cacheStore.has(pattern)) {
			return cacheStore.get(pattern)!;
		}

		const files = await fastGlob(pattern.replace(/\\/g, '/'), { fs });
		const resolvedFiles = files.map((path) => resolve(path));
		cacheStore.set(pattern, resolvedFiles);
		return resolvedFiles;
	};
};

const summaryKeys = ['statements', 'branches', 'lines', 'functions'] as Array<keyof CoverageSummaryData>;

const checkSingleThreshold = (
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

		// Check by units
		if (threshold < 0) {
			const uncoveredUnits = summary[key].total - summary[key].covered;
			const pass = uncoveredUnits <= -threshold;

			result[key] = {
				type: ThresholdType.UNIT,
				expected: threshold,
				received: uncoveredUnits,
				pass,
			};

			continue;
		}

		const pass = summary[key].pct >= threshold;
		result[key] = {
			type: ThresholdType.PERCENTAGE,
			expected: threshold,
			received: summary[key].pct,
			pass,
		};
	}

	return result as ThresholdGroupMap;
};

const mergeSummaries = (coverages: FileCoverage[]): CoverageSummary => {
	const emptySummary = createCoverageSummary();

	// eslint-disable-next-line unicorn/no-array-reduce
	return coverages.reduce((summary, coverage) => summary.merge(coverage.toSummary()), emptySummary);
};

const createEmptyChecks = (): ThresholdGroupMap =>
	Object.fromEntries(summaryKeys.map((key) => [key, { type: ThresholdType.EMPTY }])) as ThresholdGroupMap;

export const checkThreshold = async (coverageMap: CoverageMap, threshold: Threshold): Promise<CheckThresholdResult> => {
	const result: CheckThresholdResult = {};
	const coveredFiles = coverageMap.files();
	const glob = createGlobWithCache();

	const groups = Object.keys(threshold).map((initial) => [initial, getAbsoluteThresholdGroup(initial)] as const);

	const filesByGroup = Object.fromEntries(Object.keys(threshold).map((group) => [group, [] as string[]]));
	const groupTypes = new Map<string, ThresholdGroupType>();

	for (const file of coveredFiles) {
		let fellIntoGroup = false;

		for (const [group, absoluteGroup] of groups) {
			if (file.indexOf(absoluteGroup) === 0) {
				filesByGroup[group].push(file);
				fellIntoGroup = true;
				groupTypes.set(group, ThresholdGroupType.PATH);
				continue;
			}

			const globResult = await glob(absoluteGroup);
			if (globResult.includes(file)) {
				filesByGroup[group].push(file);
				fellIntoGroup = true;
				groupTypes.set(group, ThresholdGroupType.GLOB);
				continue;
			}
		}

		if (!fellIntoGroup && threshold.global) {
			filesByGroup['global'].push(file);
			groupTypes.set('global', ThresholdGroupType.GLOBAL);
		}
	}

	for (const [group] of groups) {
		const type = groupTypes.get(group);

		switch (type) {
			case undefined:
				result[group] = { group, checks: createEmptyChecks() };
				break;
			case ThresholdGroupType.GLOB:
				for (const file of filesByGroup[group]) {
					const summary = coverageMap.fileCoverageFor(file).toSummary();
					const checks = checkSingleThreshold(summary, threshold[group]!);
					result[group] = {
						group,
						checks,
					};
				}
				break;
			case ThresholdGroupType.PATH:
			case ThresholdGroupType.GLOBAL:
				result[group] = {
					group,
					checks: checkSingleThreshold(
						mergeSummaries(filesByGroup[group].map((filename) => coverageMap.fileCoverageFor(filename))),
						threshold[group]!,
					),
				};
				break;
		}
	}

	return result;
};
