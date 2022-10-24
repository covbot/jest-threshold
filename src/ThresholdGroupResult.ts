import type { ThresholdGroupMap } from './ThresholdGroupMap';
import type { ThresholdGroupType } from './ThresholdGroupType';

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
