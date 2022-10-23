import type { Config } from '@jest/types';
import type { FileCoverageData } from 'istanbul-lib-coverage';

export type CoverageMap = Record<string, FileCoverageData>;

export type HitMap = FileCoverageData['f'];

export type BranchHitMap = FileCoverageData['b'];

export type CoverageStat = {
	total: number;
	covered: number;
};

export type FileCoverageSummary = {
	statements: CoverageStat;
	functions: CoverageStat;
	branches: CoverageStat;
	lines: CoverageStat;
};

export type Threshold = Partial<Required<Config.GlobalConfig>['coverageThreshold']>;
