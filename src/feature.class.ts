import {
  analyse,
  isAsync,
  isBound,
  isConstructor,
  isGenerator,
  isProxy,
} from './analyzer';
import { getSourceFunction } from './inject';

const yesno = (b: boolean) => (b ? 'yes' : 'no');

export type CheckResult = 'yes' | 'no' | 'unknown';

export class FunctionFeature {
  notFunction: boolean;
  isConstructor: CheckResult;
  isProxy: CheckResult;
  isBound: CheckResult;

  // 下面是需要解析函数原文才能知道的内容
  isArrow: CheckResult;
  isAsync: CheckResult;
  isClassMember: CheckResult;
  isGenerator: CheckResult;
  source: Function;

  constructor(fn: any) {
    this.notFunction = typeof fn !== 'function';
    this.isConstructor = 'unknown';
    this.isProxy = 'unknown';
    this.isArrow = 'unknown';
    this.isAsync = 'unknown';
    this.isClassMember = 'unknown';
    this.isBound = 'unknown';
    this.isGenerator = 'unknown';
    this.source = getSourceFunction(fn);
    if (this.notFunction) {
      return;
    }
    const sc = this.source;
    this.isConstructor = yesno(isConstructor(sc));
    this.isProxy = yesno(isProxy(sc));
    this.isBound = yesno(isBound(sc));

    // 下面是需要解析函数原文才能知道的内容
    const parsed = analyse(sc);
    this.isArrow = yesno(parsed.isArrow);
    this.isClassMember = yesno(parsed.isClassMember);
    this.isAsync = yesno(isAsync(sc));
    this.isGenerator = yesno(isGenerator(sc));
  }
}
