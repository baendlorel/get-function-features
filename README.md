# js-is-arrow-function

A precise way to judge if a function is an arrow function.

Can be used both on javascript and typescript projects.

## Requirement

Your environment must support Proxy.

## Mechanism

Arrow functions an not be newed (for doing so will cause a TypeError said "xxx is not a constructor"). By our try to new it, we can tell wether it is or not.

We use Proxy to prevent the function to be really executed. In order not to cause trouble by running the function at an unexpected time.

## Usage

### import

```typescript
import isArrowFunction from 'js-is-arrow-function';
// or
const isArrowFunction = require('js-is-arrow-function');
```

### Use

normal mode: If the given argument is not a function, return false.

```typescript
isArrowFunction(function () {}) === false;
isArrowFunction(null) === false;
isArrowFunction((a, b) => a * b) === true;
isArrowFunction(() => 42) === true;
isArrowFunction((x) => x * x) === true;
isArrowFunction((x) => () => x * x) === true;
```

strict mode: If the given argument is not a function, throw an error.

```typescript
isArrowFunction.strict(function () {}) === false;
isArrowFunction.strict((a, b) => a * b) === true;
isArrowFunction.strict(null); // throw TypeError
isArrowFunction.strict(2); // throw TypeError
```

## LICENSE

MIT
