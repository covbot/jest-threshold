/**
 * Classify threshold groups into subgroups. This classification describes, which algorithm should be used to
 * validate thresholds.
 */
export enum ThresholdGroupType {
	/**
	 * A glob pattern threshold group. Algorithm will perform separate checks for each file, that was matched by glob.
	 */
	GLOB = 'glob',
	/**
	 * A path threshold group. Could be a single file or a directory. All coverage summaries for files, that were
	 * matched by path, will be merged into one summary. Merged summary will be checked by specified threshold values.
	 */
	PATH = 'path',
	/**
	 * All unmatched files group. All summaries of files, that were not matched by other threshold group, will be
	 * conducted into one summary. Merged summary will be checked by specified threshold values.
	 */
	GLOBAL = 'global',
	/**
	 * Unidentified group. This means that there was a lack of coverage data, or in other words, there are no files,
	 * matching this threshold group.
	 */
	UNIDENTIFIED = 'unidentified',
}
