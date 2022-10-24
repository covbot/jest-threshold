# Output format

This section contains description about `checkThreshold` function's return result.

## Return type

A `checkThreshold` function tries to provide as much information as possible. It returns the results for each threshold group, that was specified. To make the output more obvious, returned object will have the same "structure", as thresholds. So, let's look at the type. For example:

<table>
<thead>
<tr>
<td>
Threshold
</td>
<td>
Result
</td>
</tr>
</thead>
<tbody>
<tr>
<td>

```ts
const threshold = {
	'./some/fancy-file.js': {
		// ...
	},
	'./some/fancy-directory/': {
		// ...
	},
	'./some/fancy-glob/*.js': {
		// ...
	},
};
```

</td>
<td>

```ts
const result = {
	'./some/fancy-file.js': {
		// ...
	},
	'./some/fancy-directory/': {
		// ...
	},
	'./some/fancy-glob/*.js': {
		// ...
	},
};
```

</td>
</tr>
</tbody>
</table>

_Each threshold group has corresponding result in output object_

Okay, I think you get the idea. So now, let's look closer at a return type:

<<< @./../src/CheckThresholdResult.ts

As you can see, each thresholdGroup has is of type `ThresholdGroupResult`. Let's examine this type.

## ThresholdGroupResult

<<< @./../src/ThresholdGroupResult.ts

Looks complex? That's because jest uses **3 different algorithms** for validating threshold groups. The `type` field helps to determine, which algorithm was performed on threshold group.

### ThresholdGroupType.PATH

The simplest algorithm - take all paths that begin with thresholdGroup, combine their coverage data and validate among specified threshold. For example:

```ts
const threshold = {
	'./directory/': {
		statements: 50,
	},
};

const summaryMap = {
	'./directory/hello.js': {
		statements: {
			total: 10,
			covered: 7,
		},
	},
	'./directory/bye.js': {
		statements: {
			total: 10,
			covered: 2,
		},
	},
	'./file.js': {
		statements: {
			total: 10,
			covered: 8,
		},
	},
};
```

The algorithm will combine coverage summaries for `./directory/hello.js` and `./directory/bye.js`, and will validate this summary:

```ts
const combined = {
	statements: {
		total: 20,
		covered: 9,
	},
};
```

And will not pass, as `9/20` is less than `50%`.

### ThresholdGroupType.GLOBAL

The same algorithm as [ThresholdGroupType.PATH](#thresholdgrouptype-path), but combines coverage of **all files, that were not matched by any other threshold group**. For instance:

```ts
const threshold = {
	'./directory/': {
		// some thresholds
	},
	global: {
		statements: 50,
	},
};

const summaryMap = {
	'./directory/hello.js': {
		statements: {
			total: 10,
			covered: 7,
		},
	},
	'./directory/bye.js': {
		statements: {
			total: 10,
			covered: 2,
		},
	},
	'./file.js': {
		statements: {
			total: 10,
			covered: 8,
		},
	},
};
```

As there is only one unmatched file `./file.js`, the threshold will pass as `8/10` is more than `50%`.

### ThresholdGroupType.GLOB

Check threshold against **each** file, that was matched by glob pattern. Unlike [ThresholdGroupType.PATH](#thresholdgrouptype-path) and [ThresholdGroupType.GLOBAL](#thresholdgrouptype-global), this algorithm doesn't combine coverage data - it runs threshold check for each file separately. Because of that, the results also have different structure:

```ts
const threshold = {
	'./directory/*.js': {
		statements: 30,
	},
};

const summaryMap = {
	'./directory/hello.js': {
		statements: {
			total: 10,
			covered: 7,
		},
	},
	'./directory/bye.js': {
		statements: {
			total: 10,
			covered: 2,
		},
	},
	'./file.js': {
		statements: {
			total: 10,
			covered: 8,
		},
	},
};
```

The threshold above will pass for file `./directory/hello.js` and fail for `./directory/bye.js`.

### ThresholdGroupType.UNIDENTIFIED

A special type, meaning that there was no single file, that matched specified group. For all threshold groups, except "global", it means failure, as there is a lack of coverage data.
