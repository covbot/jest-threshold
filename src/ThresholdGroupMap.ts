import type { ThresholdResult } from './ThresholdResult';
import type { CoverageSummaryData } from 'istanbul-lib-coverage';

export type ThresholdGroupMap = Record<keyof CoverageSummaryData, ThresholdResult>;
