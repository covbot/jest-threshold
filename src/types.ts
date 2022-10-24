import type { Config } from '@jest/types';
import type { CoverageSummaryData } from 'istanbul-lib-coverage';

export type Threshold = Partial<Required<Config.GlobalConfig>['coverageThreshold']>;

/**
 * Enum, which helps to determine what kind of check was performed for threshold group.
 */
export enum ThresholdType {
	/**
	 * Threshold was set to the positive value in configuration, comparing percentage.
	 */
	PERCENTAGE = 'percentage',
	/**
	 * Threshold was set to the negative value in configuration, comparing by units.
	 *
	 * For instance, if threshold is specified to -10, it means that at most 10 statements could be
	 *   uncovered in file.
	 */
	UNIT = 'unit',
	/**
	 * There is nothing to check - threshold was not specified.
	 */
	UNSPECIFIED = 'unspecified',
}

/**
 * Classify threshold groups into subgroups. This classification describes, which algorithm should be used to
 * validate thresholds.
 */
export enum ThresholdGroupType {
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
	/**
	 * Unidentified group. This means that there was a lack of coverage data, or in other words, there are no files,
	 * matching this threshold group.
	 */
	UNIDENTIFIED = 'unidentified',
}

export type ThresholdResult =
	| {
			type: ThresholdType.PERCENTAGE | ThresholdType.UNIT;
			threshold: number;
			actual: number;
			pass: boolean;
	  }
	| {
			type: ThresholdType.UNSPECIFIED;
	  };

export type ThresholdGroupMap = Record<keyof CoverageSummaryData, ThresholdResult>;

export type ThresholdGroupResult =
	| {
			group: string;
			type: ThresholdGroupType.PATH | ThresholdGroupType.GLOBAL;
			checks: ThresholdGroupMap;
	  }
	| {
			group: string;
			type: ThresholdGroupType.GLOB;
			checks: Record<string, ThresholdGroupMap>;
	  }
	| {
			group: string;
			type: ThresholdGroupType.UNIDENTIFIED;
	  };
