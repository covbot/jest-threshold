import type { Config } from '@jest/types';
import type { FileCoverageData } from 'istanbul-lib-coverage';

export type HitMap = FileCoverageData['f'];

export type BranchHitMap = FileCoverageData['b'];

export type Threshold = Partial<Required<Config.GlobalConfig>['coverageThreshold']>;
