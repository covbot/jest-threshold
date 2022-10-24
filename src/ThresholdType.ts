/**
 * Enum, which helps to determine what kind of check was performed for threshold group.
 */
export enum ThresholdType {
	/**
	 * Threshold was set to the positive value in configuration, comparing percentage.
	 */
	PERCENTAGE = 'percentage',
	/**
	 * Threshold was set to the negative value in configuration, comparing by units.
	 *
	 * For instance, if threshold is specified to -10, it means that at most 10 statements could be
	 *   uncovered in file.
	 */
	UNIT = 'unit',
	/**
	 * There is nothing to check - threshold was not specified.
	 */
	UNSPECIFIED = 'unspecified',
}
