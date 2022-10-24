import type { ThresholdType } from './ThresholdType';

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
