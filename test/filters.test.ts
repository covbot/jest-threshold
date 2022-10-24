import { isFailedCheck, isSpecifiedCheck, isSucceededCheck } from '../src/filters';
import { ThresholdType } from '../src/ThresholdType';

describe('isFailedCheck', () => {
	it('should decline unspecified check', () => {
		expect(
			isFailedCheck({
				group: 'hello',
				type: ThresholdType.UNSPECIFIED,
			}),
		).toBe(false);

		expect(
			isFailedCheck({
				group: 'asdf',
				type: ThresholdType.UNSPECIFIED,
				entryType: 'branches',
			}),
		).toBe(false);
	});

	it('should decline global check, with lack of threshold data', () => {
		expect(
			isFailedCheck({
				group: 'global',
			}),
		).toBe(false);
	});

	it('should accept all other threshold groups, with lack of threshold data', () => {
		expect(
			isFailedCheck({
				group: 'asdf',
			}),
		).toBe(true);
	});

	it('should accept or decline UNIT/PERCENTAGE checks, depending on "pass" attribute', () => {
		expect(
			isFailedCheck({
				group: 'hello',
				type: ThresholdType.PERCENTAGE,
				pass: true,
			}),
		).toBe(false);

		expect(
			isFailedCheck({
				group: 'bye',
				type: ThresholdType.PERCENTAGE,
				pass: false,
			}),
		).toBe(true);

		expect(
			isFailedCheck({
				group: '1',
				type: ThresholdType.UNIT,
				pass: true,
			}),
		).toBe(false);

		expect(
			isFailedCheck({
				group: '2',
				type: ThresholdType.UNIT,
				pass: false,
			}),
		).toBe(true);
	});

	it('should throw error on unrecognized type', () => {
		expect(() => isFailedCheck({ group: 'a', type: 'asdf' as any })).toThrow();
	});
});

describe('isSucceededCheck', () => {
	it('should decline unspecified check', () => {
		expect(
			isSucceededCheck({
				group: 'hello',
				type: ThresholdType.UNSPECIFIED,
			}),
		).toBe(false);

		expect(
			isSucceededCheck({
				group: 'asdf',
				type: ThresholdType.UNSPECIFIED,
				entryType: 'branches',
			}),
		).toBe(false);
	});

	it('should accept global check, with lack of threshold data', () => {
		expect(
			isSucceededCheck({
				group: 'global',
			}),
		).toBe(true);
	});

	it('should decline all other threshold groups, with lack of threshold data', () => {
		expect(
			isSucceededCheck({
				group: 'asdf',
			}),
		).toBe(false);
	});

	it('should accept or decline UNIT/PERCENTAGE checks, depending on "pass" attribute', () => {
		expect(
			isSucceededCheck({
				group: 'hello',
				type: ThresholdType.PERCENTAGE,
				pass: true,
			}),
		).toBe(true);

		expect(
			isSucceededCheck({
				group: 'bye',
				type: ThresholdType.PERCENTAGE,
				pass: false,
			}),
		).toBe(false);

		expect(
			isSucceededCheck({
				group: '1',
				type: ThresholdType.UNIT,
				pass: true,
			}),
		).toBe(true);

		expect(
			isSucceededCheck({
				group: '2',
				type: ThresholdType.UNIT,
				pass: false,
			}),
		).toBe(false);
	});

	it('should throw error on unrecognized type', () => {
		expect(() => isSucceededCheck({ group: 'a', type: 'asdf' as any })).toThrow();
	});
});

describe('isSpecifiedCheck', () => {
	it('should accept all checks with type not UNSPECIFIED', () => {
		expect(
			isSpecifiedCheck({
				group: 'a',
				type: undefined,
			}),
		).toBe(true);

		expect(
			isSpecifiedCheck({
				group: 'b',
				type: ThresholdType.PERCENTAGE,
			}),
		).toBe(true);

		expect(
			isSpecifiedCheck({
				group: 'c',
				type: ThresholdType.UNIT,
			}),
		).toBe(true);
	});

	it('should decline checks with type UNSPECIFIED', () => {
		expect(
			isSpecifiedCheck({
				group: 'd',
				type: ThresholdType.UNSPECIFIED,
			}),
		).toBe(false);
	});
});
