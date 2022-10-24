import type { Config } from '@jest/types';

export type Threshold = Partial<Required<Config.GlobalConfig>['coverageThreshold']>;
