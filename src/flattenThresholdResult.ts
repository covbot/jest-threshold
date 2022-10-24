import { CoverageSummaryData } from 'istanbul-lib-coverage';
import { ThresholdGroupType } from './ThresholdGroupType';
import type { CheckThresholdResult } from './CheckThresholdResult';
import type { ThresholdResult } from './ThresholdResult';

/**
 * Entry of flattened CheckThresholdResult array.
 * If all fields of ThresholdResult are undefined, it means that group was unidentified, due to lack of coverage data.
 */
export type FlatThresholdResult = Partial<ThresholdResult> & {
	group: string;
	entryType?: keyof CoverageSummaryData;
};

const attachGroupName = (groupName: string) => {
	return ([entryType, result]: [string, ThresholdResult]): FlatThresholdResult => {
		return {
			group: groupName,
			entryType: entryType as keyof CoverageSummaryData,
			...result,
		};
	};
};

/**
 * Convert nested object, returned by checkThreshold, into flat array.
 * Useful for output.
 * @param thresholdResult output from checkThreshold function.
 * @returns flattened output of checkThreshold function.
 */
export const flattenThresholdResult = (thresholdResult: CheckThresholdResult): Array<FlatThresholdResult> => {
	const output: Array<FlatThresholdResult> = [];

	for (const [group, result] of Object.entries(thresholdResult)) {
		switch (result.type) {
			case ThresholdGroupType.UNIDENTIFIED:
				output.push({
					group,
				});
				break;
			case ThresholdGroupType.GLOBAL:
			case ThresholdGroupType.PATH:
				output.push(...Object.entries(result.checks).map(attachGroupName(group)));
				break;
			case ThresholdGroupType.GLOB:
				for (const [fileName, fileCheck] of Object.entries(result.checks)) {
					output.push(...Object.entries(fileCheck).map(attachGroupName(fileName)));
				}
				break;
		}
	}

	return output;
};
