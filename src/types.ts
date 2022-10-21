export type Location = {
	column?: number;
	line: number;
};

export type Range = {
	start?: Location;
	end?: Location;
};

export type CoverageMap = Record<string, FileCoverage>;

export type FileCoverage = {
	path: string;
	statementMap: StatementMap;
	fnMap: FunctionMap;
	branchMap: BranchMap;
	s: HitMap;
	f: HitMap;
	b: ArrayHitMap;
};

export type StatementMap = Record<number, StatementCoverage>;

export type StatementCoverage = {
	start: Location;
	end: Location;
};

export type FunctionMap = Record<number, FunctionCoverage>;

export type FunctionCoverage = {
	name: string;
	decl: Range;
	loc: Range;
};

export type BranchMap = Record<number, BranchCoverage>;

export type BranchCoverage = {
	loc: Range;
	type: string;
	locations?: Range[];
};

export type HitMap = Record<number, number>;

export type ArrayHitMap = Record<number, number[]>;

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
