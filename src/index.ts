/**
 * @name IsArrowFunction
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */

import { analyse } from './analyzer';
import { getOriginalToString, canBeNewed, applyStrict } from './core';
import { err } from './error';

const isArrowFunction = (fn: any, options?: { strict?: boolean }) => {
  const strict = options?.strict ?? false;
  const toString = getOriginalToString();

  if (typeof toString !== 'function') {
    return applyStrict(strict, toString);
  }

  // 下面开始逐项测试
  // 1、是否为函数
  if (typeof fn !== 'function') {
    return applyStrict(strict, `fn is not a function`);
  }

  const fnStr = toString.call(fn);
  // 其实前期已经在getOriginalToString中使用过toString.call，这里不太可能不是string
  // 严谨起见这里加上判定
  if (typeof fnStr !== 'string') {
    throw err(`fn.toString() does not return a string`);
  }

  // 2、包裹参数的括号两侧的情况
  const result = analyse(fnStr);
  if (result === true) {
    return true;
  }
  return result.body.startsWith('=>');
};

const getFunctionType = (
  fn: any
): 'ArrowFunction' | 'NormalFunction' | 'MemberFunction' | 'NotFunction' => {
  if (typeof fn !== 'function') {
    return 'NotFunction';
  }

  if (isArrowFunction(fn)) {
    return 'ArrowFunction';
  }

  if (canBeNewed(fn)) {
    return 'NormalFunction';
  }

  return 'MemberFunction';
};

export = { isArrowFunction, getFunctionType };
