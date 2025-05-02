import { err } from './error';

export const applyStrict = (strict: boolean, message: string) => {
  if (strict) {
    throw err(message);
  } else {
    console.warn('[isArrowFunction] ' + message);
    return false;
  }
};

let toString = null as (() => string) | null;
export const getOriginalToString = (): (() => string) | string => {
  if (toString !== null) {
    return toString;
  }

  const origin = Function.prototype.toString;

  if (typeof origin !== 'function') {
    return 'Function.prototype.toString is not a function. It is definitly been tampered!';
  }

  if (typeof origin.call !== 'function') {
    return 'Function.prototype.toString.call is not a function. It is definitly been tampered!';
  }

  const toStringStr = origin.call(origin);

  if (typeof toStringStr !== 'string') {
    return 'Function.prototype.toString.toString() is not a string. It is definitly been tampered!';
  }

  if (
    toStringStr !== `function toString() { [native code] }` &&
    toStringStr.indexOf('native code') === -1
  ) {
    return 'Function.prototype.toString.toString() is not native code. It is definitly been tampered!';
  }

  toString = origin;
  return origin;
};

/**
 * 经过研究，使用new操作符是最为确定的判断方法，箭头函数无法new \
 * 此处用proxy拦截构造函数，防止普通函数真的作为构造函数运行 \
 * After some research, using new operator to distinct arrow functions from normal functions is the best approach. \
 * We use proxy here to avoid truely running the constructor normal function(while arrow function cannot be newed)
 * @param fn
 * @returns
 */
export const canBeNewed = (fn: any) => {
  try {
    const fp = new Proxy(fn, {
      construct(target, args) {
        return {};
      },
    });
    new fp();
    return true;
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes('is not a constructor')
    ) {
      return false;
    }
    console.error(
      '[isArrowFunction]',
      '发生了未知错误。An unknown error occurred.',
      'fn:',
      fn
    );
    throw error;
  }
};
