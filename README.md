# Get-function-type

JS/TS functions are divided into arrow functions, normal functions, member functions, async functions, and bound functions. This package aims to know which type it is.

Can be used both on javascript and typescript projects.

## Requirement

Your environment must support Proxy.

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
