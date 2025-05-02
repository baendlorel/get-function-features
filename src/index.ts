/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */

import { analyse, isAsync, isConstructor, isProxy, isBound, pbconfuse } from './analyzer';
import { createFeatureResult, Features } from './types';

// TODO 将返回值改为一个对象，对象里包含了函数特征isXXX
const getFunctionFeatures = (fn: any): Features => {
  const result = createFeatureResult();
  if (typeof fn !== 'function') {
    result.notFunction = true;
    return result;
  }
  const parsed = analyse(fn);
  result.isProxy = isProxy(fn);
  result.isBound = isBound(fn);
  result.isConstructor = isConstructor(fn);

  const isProxyOrBound = result.isProxy === 'yes' || result.isBound === 'yes';
  result.isAsync = isAsync(fn) || parsed.isAsync;
  result.isClassMember = pbconfuse(isProxyOrBound, parsed.isClassMember ? 'yes' : 'no');

  return result;
};

export = getFunctionFeatures;
