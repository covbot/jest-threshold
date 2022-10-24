import { isPassed } from '../src/isPassed';
import { ThresholdGroupType } from '../src/ThresholdGroupType';
import { ThresholdType } from '../src/ThresholdType';

describe('isPassed', () => {
	it('should return true, when there are no threshold failures', () => {
		expect(
			isPassed([
				{
					group: 'global',
				},
			]),
		).toBe(true);

		expect(
			isPassed([
				{
					group: 'global',
					type: ThresholdType.PERCENTAGE,
					pass: true,
				},
			]),
		).toBe(true);
	});

	it('should return true, when empty array is passed', () => {
		expect(isPassed([])).toBe(true);
	});

	it('should return false, when there is at least one failed check', () => {
		expect(
			isPassed([
				{
					group: 'a',
					type: ThresholdType.PERCENTAGE,
					pass: true,
				},
				{
					group: 'b',
					type: ThresholdType.PERCENTAGE,
					pass: false,
				},
			]),
		).toBe(false);
	});

	it('should accept both nested & flat threshold result', () => {
		expect(
			isPassed({
				a: {
					group: 'a',
					type: ThresholdGroupType.PATH,
					checks: {
						branches: {
							type: ThresholdType.PERCENTAGE,
							pass: true,
							actual: 100,
							threshold: 100,
						},
						functions: {
							type: ThresholdType.UNSPECIFIED,
						},
						statements: {
							type: ThresholdType.UNSPECIFIED,
						},
						lines: {
							type: ThresholdType.UNSPECIFIED,
						},
					},
				},
			}),
		).toBe(true);
	});
});
