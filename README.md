# Get-Function-Features

JS/TS functions have many features, and this package will show every feature it can detect.

Can be used both on javascript and typescript projects.

## Requirement

Your environment must support Proxy.

Import this package first (before your own modules) for better accuracy. [Learn why](#tracking-proxy-and-bind)

## Usage

### import

```typescript
import getFunctionFeatures from 'get-function-features';
// or
const getFunctionFeatures = require('get-function-features');
```

### Use

```typescript
const fn = function () {};
const result = getFunctionFeatures(fn);
```

## Return value

The return value of `getFunctionFeatures` would be like this:

- if `fn` is not a function, it will throw a `TypeError`

```typescript
const result = {
  target: fn, // the function itself
  source: sourceFn, // the function before proxied or bound
  isConstructor: true, // can be newed
  isClass: true, // a class, cannot be called like `fn()`
  isProxy: true, // wrapped by Proxy
  isBound: false, // bound by `otherFn.bind`
  isArrow: false, // functions like `() => {}`
  isAsync: false, // async functions
  isMemberMethod: false, // a method of some class instance or an object
  isGenerator: false, // generator function like `function* () {}`
}; // This result object is freezed
```

## How it works

Assume we are checking the features of a target function `fn`. There are 3 main approaches below.

It is possible to deceive this package and get the result you need (like rewrite the `toString` method or detect some native code).

### Phantom Call

_无副作用试调_

By using `Proxy` to intercept the calling of `fn`, we can prevent it to be actually executed. Since `Proxy` preserves some original features of `fn`, we can test it without triggering side effects.

- if `fn` cannot be used with the new operator, neither can its proxied version (intercepting `construct`). We can tell `fn` is not a class or a constructor.

- However, if `fn` is a class, proxying its `apply` method will actually change its behavior. The class that once could not be called like `fn()` will become callable now. It appears that `Proxy` bypasses the `TypeError` that would normally occur when calling a class directly. Note that the key word `extends` cannot distinguish a classic function with a class.

### Tracking Proxy and Bind

_跟踪代理与绑定_

There is almost no way to check if a function is bound or proxied. When a function is bound or Proxied, the `toString` method will only return `function () { [native code] }`. It loses all features in definition such as function name, async flag, arrow, etc. Only browsers and NodeJS themselves know it and will show words like 'Proxy(fn)' when using `console.log`. In Nodejs, we have `util.types.isProxy`, but it is not available in browsers. Name of a bound function will start with 'bound' and be like `bound fn`, but it is not a standard behavior.

Thanks to the flexibility of Javascript/Typescript, we can rewrite `Proxy` and `Function.prototype.bind` to record these operations.
**So it is why we recommend you to import this package at an early position**. You can use these two methods as usual, for they will give you the original result. But they will record the source function and Proxied/Bound history. And the history is saved in a `WeakMap<Function, PBState>`.

```typescript
// PBStates look like this:
const IS_PROXIED = 0b0001;
const IS_BOUND = 0b0010;
const WAS_PROXIED = 0b0100;
const WAS_BOUND = 0b1000;
```

And the `PBState` is calculated by these flags using logical operators.

The override of these 2 methods brings us accurate information of `fn`.

### Function Definition Analysis

_函数定义分析_

Some features must be determined by the function definition, such as `isArrow`, `isAsync`, `isGenerator`.

First, we find the source function `sourceFn` of `fn`. Then, by stringifying `sourceFn`, we split the string into 3 parts: functionName, parameters, and body.

It is obvious that async functions start with `async`,arrow functions shall have `=>` at the beginning of their body and generator functions have `*` before their names. Other features can also be detected in the same way.

## Purpose

It might be frustrating that there are few practical usages of this package, as it was designed primarily for theoretical investigation and fun.

A fact not widely known is that almost all functions of `document` are classic. And a mock function created by `jest.fn()` is also classic, not arrowed. There is no arrow function in browser APIs and NodeJS modules.

## LICENSE

MIT
