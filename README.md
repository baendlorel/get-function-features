# Get-function-type

JS/TS functions have many features, this package will show every feature it can detect.

Can be used both on javascript and typescript projects.

## Requirement

Your environment must support Proxy.

## Return value

The return value of `getFunctionFeatures` would be like this:

```typescript
const result = {
  notFunction: false,
  isConstructor: 'yes',
  isClass: 'yes',
  isProxy: 'no',
  isBound: 'no',
  isArrow: 'no',
  isAsync: 'no',
  isMemberMethod: 'no',
  isGenerator: 'no',
};
```

- `notFunction`: if the input is not a function, the result would be like this:

```typescript
const result = {
  notFunction: true,
  isConstructor: 'unknown',
  isClass: 'unknown',
  isProxy: 'unknown',
  isBound: 'unknown',
  isArrow: 'unknown',
  isAsync: 'unknown',
  isMemberMethod: 'unknown',
  isGenerator: 'unknown',
};
```

## Mechanism

Arrow functions an not be newed (for doing so will cause a TypeError said "xxx is not a constructor"). By our try to new it, we can tell wether it is or not.

We use Proxy to prevent the function to be really executed. In order not to cause trouble by running the function at an unexpected time.

## Usage

### import

```typescript
import getFunctionType from 'get-function-type';
// or
const getFunctionType = require('get-function-type');
```

### Use

```typescript

```

## LICENSE

MIT
