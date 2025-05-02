import { err } from './logs';
import { CheckResult } from './types';

export const nativeCode = (functionName?: string) =>
  `function ${functionName ?? ''}() { [native code] }`;

export const isNode = () => {
  return typeof process?.versions?.node !== 'undefined';
};

export const justify = (str: string) => {
  return str.trim().replace(/\s+/g, ' ');
};

export const protoToString = (() => {
  const _toString = Function.prototype.toString;

  if (typeof _toString !== 'function') {
    throw err(
      'Function.prototype.toString is not a function. It is definitly been tampered!'
    );
  }

  if (typeof _toString.call !== 'function') {
    throw err(
      'Function.prototype.toString.call is not a function. It is definitly been tampered!'
    );
  }

  const toStringStr = _toString.call(_toString);

  if (typeof toStringStr !== 'string') {
    throw err(
      'Function.prototype.toString.toString() is not a string. It is definitly been tampered!'
    );
  }

  if (
    toStringStr !== nativeCode('toString') &&
    toStringStr.indexOf('native code') === -1
  ) {
    throw err(
      'Function.prototype.toString.toString() is not native code. It is definitly been tampered!'
    );
  }

  const map = new WeakMap<Function, string>();
  return (fn: Function) => {
    let s = map.get(fn);
    if (s === undefined) {
      s = justify(_toString.call(fn));
      map.set(fn, s);
    }
    return s;
  };
})();
