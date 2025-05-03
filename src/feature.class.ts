import {
  analyse,
  isAsync,
  isBound,
  isClass,
  isConstructor,
  isGenerator,
  isProxy,
} from './analyzer';
import { getSourceFunction } from './inject';

const yesno = (b: boolean) => (b ? 'yes' : 'no');

export type CheckResult = 'yes' | 'no' | 'unknown';

type FeatureName =
  | 'isConstructor'
  | 'isClass'
  | 'isProxy'
  | 'isBound'
  | 'isArrow'
  | 'isAsync'
  | 'isMemberMethod'
  | 'isGenerator';

export class FunctionFeature {
  readonly notFunction: boolean;

  /**
   * Whether can be used with 'new' operator. Like 'new fn()'.
   */
  readonly isConstructor: CheckResult;

  /**
   * Whether the given 'fn' can be only used with 'new' operator, and cannot be called directly.
   */
  readonly isClass: CheckResult;

  /**
   * Whether the given function is wrapped by Proxy
   */
  readonly isProxy: CheckResult;

  /**
   * Whether the given 'fn' is obtained by 'otherFn.bind'
   */
  readonly isBound: CheckResult;

  // 下面是需要解析函数原文才能知道的内容
  /**
   * Whether the given 'fn' is an arrow function.
   */
  readonly isArrow: CheckResult;

  /**
   * Whether the given 'fn is an async function.
   */
  readonly isAsync: CheckResult;

  /**
   * Whether the given 'fn' is a member method of an object/class.
   */
  readonly isMemberMethod: CheckResult;

  /**
   * Whether the given 'fn' is a generator function.
   */
  readonly isGenerator: CheckResult;

  /**
   * The source function of the given 'fn'.
   * @description If 'fn' is proxied or bound, this will be the original function.
   */
  readonly source: Function;

  private readonly errors: string[];

  constructor(fn: any) {
    this.errors = [];
    this.notFunction = typeof fn !== 'function';
    this.isConstructor = 'unknown';
    this.isClass = 'unknown';
    this.isProxy = 'unknown';
    this.isArrow = 'unknown';
    this.isAsync = 'unknown';
    this.isMemberMethod = 'unknown';
    this.isBound = 'unknown';
    this.isGenerator = 'unknown';
    this.source = getSourceFunction(fn);
    if (this.notFunction) {
      return;
    }

    // source肯定不是bound或proxy的，需要用给定的函数来判定
    this.isProxy = yesno(isProxy(fn));
    this.isBound = yesno(isBound(fn));

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
    this.xor('isArrow', 'isConstructor');
    this.xor('isArrow', 'isClass');
    this.xor('isArrow', 'isMemberMethod');
    this.xor('isAsync', 'isConstructor');
    this.xor('isAsync', 'isClass');

    // 类一定是构造函数
    this.implies({ isClass: 'yes' }, { isConstructor: 'yes' });
  }

  get isNormalFunction() {
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
   * 表示两者互斥，状态不能相同，否则记录错误
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
}
