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
	/**
	 * The check was skipped, due to lack of coverage data.
	 *
	 * That is a synonym of "failure" for all threshold groups, except "global".
	 * If global threshold group resulted in "empty" state, this means success, as all other files were
	 * checked via other threshold groups.
	 */
	EMPTY = 'empty',
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
	  }
	| {
			type: ThresholdType.EMPTY;
	  };

export type ThresholdGroupMap = Record<keyof CoverageSummaryData, ThresholdResult>;

export type ThresholdGroupResult = {
	group: string;
	checks: ThresholdGroupMap;
};
