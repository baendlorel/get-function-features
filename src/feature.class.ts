import {
  analyse,
  isAsync,
  isBound,
  isClass,
  isConstructor,
  isGenerator,
  isProxy,
  wasBound,
  wasProxy,
} from '@/analyzer';
import core from '@/core';
import { err, errLog } from '@/misc';

const yesno = (b: boolean) => (b ? 'yes' : 'no');

export type CheckResult = 'yes' | 'no' | 'unknown';

type FeatureName =
  | 'isConstructor'
  | 'isClass'
  | 'isProxy'
  | 'isBound'
  | 'wasProxy'
  | 'wasBound'
  | 'isArrow'
  | 'isAsync'
  | 'isMemberMethod'
  | 'isGenerator';

export class FunctionFeature {
  readonly notFunction: boolean;

  /**
   * 表示是否能像`new fn()`这样当作构造函数用 \
   * Whether can be used with 'new' operator. Like `new fn()`.
   */
  readonly isConstructor: CheckResult;

  /**
   * 表示是否能且仅能像构造函数那样用，不能直接像函数那样用 \
   * Whether `fn` can be only used with 'new' operator, and cannot be called directly.
   */
  readonly isClass: CheckResult;

  /**
   * 判断`fn`是否是一个被代理的函数 \
   * Whether `fn` is wrapped by Proxy
   */
  readonly isProxy: CheckResult;

  /**
   * 判断`fn`是否是一个被别的函数绑定而来的，比如`fn = otherFn.bind(someObject)` \
   * Whether `fn` is obtained by 'otherFn.bind'
   */
  readonly isBound: CheckResult;

  /**
   * 判断`fn`是否在生成的过程中曾经被Proxy代理过 \
   * Whether `fn` was once wrapped by Proxy
   * @example
   * ```typescript
   * const f1 = function () {};
   * const f2 = new Proxy(f1,{ apply(target,handler){ return something; } });
   * const f3 = f2.bind({});
   * const feats = getFunctionFeatures(f3);
   * feats.wasProxy === 'yes'; // true
   * ```
   */
  readonly wasProxy: CheckResult;

  /**
   * 判断`fn`是否在生成的过程中曾经被bind过 \
   * Whether `fn` was once bound
   * @example
   * ```typescript
   * const f1 = function () {};
   * const f2 = f1.bind({});
   * const f3 = new Proxy(f2,{ apply(target,handler){ return something; } });
   * const feats = getFunctionFeatures(f3);
   * feats.wasBound === 'yes'; // true
   * ```
   */
  readonly wasBound: CheckResult;

  // 下面是需要解析函数原文才能知道的内容
  /**
   * 判断`fn`是否是箭头函数 \
   * Whether `fn` is an arrow function.
   */
  readonly isArrow: CheckResult;

  /**
   * 判断`fn`是否为异步函数 \
   * Whether `fn` is an async function.
   */
  readonly isAsync: CheckResult;

  /**
   * 判断`fn`是否是某个类或者某个对象里的成员函数 \
   * Whether `fn` is a member method of an object/class.
   */
  readonly isMemberMethod: CheckResult;

  /**
   * 判断`fn`是否是一个生成器函数 \
   * Whether `fn` is a generator function.
   */
  readonly isGenerator: CheckResult;

  /**
   * The source function of `fn`.
   * @description If 'fn' is proxied or bound, this will be the original function.
   */
  readonly source: Function;

  readonly target: Function;

  private readonly errors: string[];

  constructor(fn: any) {
    this.target = fn;
    this.notFunction = typeof fn !== 'function';
    this.isConstructor = 'unknown';
    this.isClass = 'unknown';
    this.isProxy = 'unknown';
    this.isBound = 'unknown';
    this.wasProxy = 'unknown';
    this.wasBound = 'unknown';
    this.isArrow = 'unknown';
    this.isAsync = 'unknown';
    this.isMemberMethod = 'unknown';
    this.isGenerator = 'unknown';
    this.errors = [];
    this.source = core.getSource(fn);
    if (this.notFunction) {
      return;
    }

    // source肯定不是bound或proxy的，需要用给定的函数来判定
    this.isProxy = yesno(isProxy(fn));
    this.isBound = yesno(isBound(fn));
    this.wasProxy = yesno(wasProxy(fn));
    this.wasBound = yesno(wasBound(fn));

    // # 下面的判定由原函数完成，某些也可以由给定函数完成
    const sc = this.source;
    this.isConstructor = yesno(isConstructor(sc));
    this.isClass = yesno(isClass(sc));

    // 下面是需要解析函数原文才能知道的内容
    const parsed = analyse(sc);

    this.isArrow = yesno(parsed.isArrow);
    this.isMemberMethod = yesno(parsed.isMemberMethod);
    this.isAsync = yesno(isAsync(sc));
    this.isGenerator = yesno(isGenerator(sc));

    // # 逻辑闭环
    // 互斥组

    // 不可同时为真
    this.nand('isArrow', 'isConstructor');
    this.nand('isArrow', 'isMemberMethod');
    this.nand('isArrow', 'isClass');
    this.nand('isAsync', 'isConstructor');
    this.nand('isAsync', 'isClass');
    this.nand('isMemberMethod', 'isConstructor');
    this.nand('isMemberMethod', 'isClass');
    this.nand('isGenerator', 'isConstructor');
    this.nand('isGenerator', 'isClass');

    // 类一定是构造函数
    this.implies({ isClass: 'yes' }, { isConstructor: 'yes' });

    if (this.errors.length > 0) {
      errLog('logic errors:\n', this.errors.join('\n'));
      throw err('Logic errors detected');
    }
  }

  /**
   * Whether 'fn' is a normal function, defined by `function fn() { }`.
   */
  get isNormal() {
    return yesno(this.isConstructor === 'yes' && this.isClass === 'no');
  }

  // # 下面的函数用于校验Feature结果的逻辑自洽性

  /**
   * 表示条件一定要推出结论，否则记录错误
   * @param condition 条件
   * @param conclusion 结论
   * @example 如果是isArrow === 'yes' 那么一定有 isConstructor === 'no'
   */
  private implies(
    condition: Partial<FunctionFeature>,
    conclusion: Partial<FunctionFeature>
  ) {
    const conditionList = [] as string[];
    const conditionKeys = Object.keys(condition) as FeatureName[];
    for (const key of conditionKeys) {
      conditionList.push(`'${key}' = ${condition[key]}`);
      if (this[key] !== condition[key]) {
        return;
      }
    }

    const errorKeys = [] as string[];
    const conclusionKeys = Object.keys(conclusion) as FeatureName[];
    for (const key of conclusionKeys) {
      if (this[key] !== conclusion[key]) {
        errorKeys.push(
          `${key} is invalid, expect '${conclusion[key]}', got '${this[key]}'`
        );
      }
    }

    if (errorKeys.length > 0) {
      this.errors.push(`As ${conditionList.join(', ')}:\n ${errorKeys.join('.\n ')}`);
    }
  }

  /**
   * 异或：表示两者互斥，状态不能相同，否则记录错误
   * @param feature1
   * @param feature2
   */
  private xor(feature1: FeatureName, feature2: FeatureName) {
    const f1 = this[feature1];
    const f2 = this[feature2];
    if (f1 === f2 && (f1 === 'no' || f1 === 'yes')) {
      this.errors.push(`'${feature1}' and '${feature2}' cannot be both 'yes' or 'no'`);
    }
  }

  /**
   * 与非：表示两者不可同时为yes
   * @param feature1
   * @param feature2
   */
  private nand(feature1: FeatureName, feature2: FeatureName) {
    const f1 = this[feature1];
    const f2 = this[feature2];
    if (f1 === f2 && f1 === 'yes') {
      this.errors.push(`'${feature1}' and '${feature2}' cannot be both 'yes'`);
    }
  }

  public toResult() {
    const result = Object.create(null) as {
      notFunction: boolean;
      isConstructor: CheckResult;
      isClass: CheckResult;
      isProxy: CheckResult;
      isBound: CheckResult;
      wasProxy: CheckResult;
      wasBound: CheckResult;
      isArrow: CheckResult;
      isAsync: CheckResult;
      isMemberMethod: CheckResult;
      isGenerator: CheckResult;
      source: Function;
      target: Function;
    };
    result.source = this.source;
    result.target = this.target;
    result.notFunction = this.notFunction;
    result.isConstructor = this.isConstructor;
    result.isClass = this.isClass;
    result.isProxy = this.isProxy;
    result.isBound = this.isBound;
    result.wasProxy = this.wasProxy;
    result.wasBound = this.wasProxy;
    result.isArrow = this.isArrow;
    result.isAsync = this.isAsync;
    result.isMemberMethod = this.isMemberMethod;
    result.isGenerator = this.isGenerator;
    return result;
  }
}
