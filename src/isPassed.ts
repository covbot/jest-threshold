import { isFailedCheck } from './filters';
import { flattenThresholdResult, type FlatThresholdResult } from './flattenThresholdResult';
import type { CheckThresholdResult } from './CheckThresholdResult';

export const isPassed = (result: CheckThresholdResult | Array<FlatThresholdResult>) => {
	const normalizedResult = Array.isArray(result) ? result : flattenThresholdResult(result);

	const failedChecks = normalizedResult.filter(isFailedCheck);

	return failedChecks.length === 0;
};
