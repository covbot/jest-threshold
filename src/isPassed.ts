import { CheckThresholdResult } from './checkThreshold';
import { isFailedCheck } from './filters';
import { flattenThresholdResult, FlatThresholdResult } from './flattenThresholdResult';

export const isPassed = (result: CheckThresholdResult | Array<FlatThresholdResult>) => {
	const normalizedResult = Array.isArray(result) ? result : flattenThresholdResult(result);

	const failedChecks = normalizedResult.filter(isFailedCheck);

	return failedChecks.length === 0;
};
