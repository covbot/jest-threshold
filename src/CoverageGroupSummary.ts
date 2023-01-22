import { CoverageSummaryData } from 'istanbul-lib-coverage';
import { ThresholdGroupType } from './ThresholdGroupType';

export type CoverageGroupSummary =
	| {
			group: string;
			type: ThresholdGroupType.PATH | ThresholdGroupType.GLOBAL;
			summary: CoverageSummaryData;
	  }
	| {
			group: string;
			type: ThresholdGroupType.GLOB;
			summary: Record<string, CoverageSummaryData>;
	  }
	| {
			group: string;
			type: ThresholdGroupType.UNIDENTIFIED;
	  };
