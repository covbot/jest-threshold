/**
 * The algorithm, written in this file, was shamelessly stolen from https://github.com/facebook/jest,
 *   which is licensed under MIT license (https://github.com/facebook/jest/blob/main/LICENSE).
 * It was refactored a bit to suit project's needs.
 */

import path from 'path';
import fastGlob, { FileSystemAdapter } from 'fast-glob';
import { CoverageMap, CoverageSummary, createCoverageSummary, FileCoverage } from 'istanbul-lib-coverage';
import { Volume, createFsFromVolume } from 'memfs';
import { CoverageGroupSummary } from './CoverageGroupSummary';
import { Threshold } from './Threshold';
import { ThresholdGroupType } from './ThresholdGroupType';

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
 * Initially, in jest codebase this code was used to perform glob in real filesystem.
 * However, as we can get all files already (from coverageMap), we can create in-memory filesystem,
 * and perform globbing there. Potentially, that would improve performance.
 */
const createGlobWithCache = (coverageFiles: string[]) => {
	const volume = Volume.fromJSON(Object.fromEntries(coverageFiles.map((filename) => [filename, ''])), process.cwd());
	const fs = createFsFromVolume(volume);

	const cacheStore = new Map<string, string[]>();

	return async (pattern: string) => {
		if (cacheStore.has(pattern)) {
			return cacheStore.get(pattern)!;
		}

		const files = await fastGlob(pattern.replace(/\\/g, '/'), { fs: fs as Partial<FileSystemAdapter> });
		const resolvedFiles = files.map((file) => path.resolve(file));
		cacheStore.set(pattern, resolvedFiles);
		return resolvedFiles;
	};
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
 * Function, which merges coverage summaries, according to jest threshold checking algorithm. Handful for comparing
 * coverages. Also, used to check threshold information, via checkThreshold function.
 *
 * @param coverageMap Istanbul coverage map.
 * @param threshold Thresholds from jest configuration file.
 * @returns Object, which has the same keys as specified "threshold" parameter. Each value in this object is a
 * coverage summary.
 */
export const getGroupedCoverageSummary = async (
	coverageMap: CoverageMap,
	threshold: Threshold,
): Promise<Record<string, CoverageGroupSummary>> => {
	const coveredFiles = coverageMap.files();
	const glob = createGlobWithCache(coveredFiles);

	const result: Record<string, CoverageGroupSummary> = {};

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

	// Collect coverage for each threshold group
	for (const [group] of groups) {
		const type = groupTypes.get(group);

		switch (type) {
			// No files were matched by group - lack of coverage data detected.
			case ThresholdGroupType.UNIDENTIFIED:
			case undefined:
				result[group] = { group, type: ThresholdGroupType.UNIDENTIFIED };
				break;
			// Group is a glob - threshold checks must run on each file.
			case ThresholdGroupType.GLOB: {
				const groupResult: CoverageGroupSummary = {
					type: ThresholdGroupType.GLOB,
					group,
					summary: {},
				};
				for (const file of filesByGroup[group]) {
					groupResult.summary[file] = createCoverageSummary()
						.merge(coverageMap.fileCoverageFor(file).toSummary())
						.toJSON();
				}
				result[group] = groupResult;
				break;
			}
			// Group is a PATH or GLOBAL specifier - merge coverage summaries.
			case ThresholdGroupType.PATH:
			case ThresholdGroupType.GLOBAL:
				result[group] = {
					group,
					type,
					summary: mergeFileCoverages(
						filesByGroup[group].map((filename) => coverageMap.fileCoverageFor(filename)),
					).toJSON(),
				};
				break;
		}
	}

	return result;
};
