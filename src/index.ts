/**
 * @name IsArrowFunction
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */

import { errLog, warnLog } from './logs';
import { getOriginalToString, canBeNewed } from './core';
import { FunctionType, GetFunctionType } from './types';
import { analyse } from './analyzer';

// TODO 将返回值改为一个对象，对象里包含了函数特征isXXX
const getFunctionType = ((fn: any): FunctionType => {
  if (typeof fn !== 'function') {
    return FunctionType.NotFunction;
  }

  if (canBeNewed(fn)) {
    if (fn.name.startsWith('bound ')) {
      return FunctionType.BoundNormalFunction;
    } else {
      return FunctionType.NormalFunction;
    }
  }

  // 先看是不是bind过
  if (fn.name.startsWith('bound ')) {
    warnLog('Binding makes it impossible to distinguish function types further.');
    return FunctionType.BoundFunction;
  }

  const toString = getOriginalToString();
  if (typeof toString !== 'function') {
    // 说明toString被篡改了
    errLog(toString);
    return FunctionType.Unknown;
  }

  const fnStr = toString.call(fn);
  const parsed = analyse(fnStr);

  if (
    parsed === FunctionType.AsyncArrowFunction ||
    parsed === FunctionType.ArrowFunction
  ) {
    return parsed;
  }

  const { isArrow, isAsync, isMember } = parsed;

  if (isAsync) {
    if (isArrow) {
      return FunctionType.AsyncArrowFunction;
    }
    if (isMember) {
      return FunctionType.AsyncMemberFunction;
    }
    return FunctionType.AsyncFunction;
  }

  if (isMember) {
    return FunctionType.MemberFunction;
  }
  return FunctionType.Unknown;
}) as GetFunctionType;

getFunctionType.PossibleResults = Object.keys(FunctionType).filter((k) =>
  isNaN(Number(k))
);

export = getFunctionType;
