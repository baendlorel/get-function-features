/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import './inject';
import { analyse, isAsync, isConstructor, isProxy, isBound, pbconfuse } from './analyzer';
import { createFeatureResult, Features } from './types';

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
