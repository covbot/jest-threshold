import { ThresholdType } from './ThresholdType';
import type { FlatThresholdResult } from './flattenThresholdResult';

/**
 * Check if flattened threshold result entry is a failed check.
 */
export const isFailedCheck = (result: FlatThresholdResult) => {
	if (!isSpecifiedCheck(result)) {
		return false;
	}

	if (result.type === undefined) {
		return result.group !== 'global';
	}

	if (result.type === ThresholdType.PERCENTAGE || result.type === ThresholdType.UNIT) {
		return !result.pass;
	}

	throw new Error(`Unrecognized type ${result.type}.`);
};

/**
 * Check if flattened threshold result is a passed check.
 */
export const isSucceededCheck = (result: FlatThresholdResult) => {
	return !isFailedCheck(result) && isSpecifiedCheck(result);
};

/**
 * Check if flattened threshold result should be visible for a user.
 */
export const isSpecifiedCheck = (result: FlatThresholdResult) => {
	return result.type !== ThresholdType.UNSPECIFIED;
};
