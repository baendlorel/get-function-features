/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import { FeatureLogic, Analyser, tracker, FunctionFeatureResult } from '@/core';
import { err, logFn } from '@/misc';

/**
 * 分析JavaScript函数的特性，返回全面的功能特征报告
 *
 * 能够识别函数的多种特性，包括：
 * - 函数类型（箭头函数、类、构造函数、生成器、异步函数）
 * - 函数状态（是否被代理、绑定）
 * - 函数关系（成员方法）
 *
 * 同时执行多项逻辑校验，确保结果的一致性和可靠性。
 *
 * Analyzes JavaScript function features and returns a comprehensive feature report
 *
 * Can identify various function characteristics including:
 * - Function types (arrow functions, classes, constructors, generators, async functions)
 * - Function states (whether proxied, bound)
 * - Function relationships (member methods)
 *
 * Also performs multiple logical validations to ensure consistency and reliability of results.
 *
 * @param {any} fn - 要分析的函数对象
 * @throws {TypeError} 当输入不是函数时抛出
 * @throws {Error} 当函数特性的逻辑检查失败时抛出
 * @returns {FunctionFeatureResult} 函数特性结果，包含多种特性标识
 *
 * @example
 * ```typescript
 * // 分析普通函数
 * const features1 = getFunctionFeatures(function foo() {});
 * console.log(features1.isArrow); // false
 *
 * // 分析箭头函数
 * const features2 = getFunctionFeatures(() => {});
 * console.log(features2.isArrow); // true
 *
 * // 分析类
 * class MyClass {}
 * const features3 = getFunctionFeatures(MyClass);
 * console.log(features3.isClass); // true
 *
 * // 分析绑定的函数
 * function greet() { return `Hello, ${this.name}`; }
 * const boundGreet = greet.bind({ name: 'World' });
 * const features4 = getFunctionFeatures(boundGreet);
 * console.log(features4.isBound); // true
 * ```
 *
 * @see {@link FunctionFeatureResult} 获取返回对象的完整类型信息
 */
const getFunctionFeatures = (fn: any) => {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function, but got ${typeof fn}`);
  }

  const sc = tracker.getSource(fn);
  const analyser = new Analyser(sc);

  const features: FunctionFeatureResult = {
    target: fn,
    source: sc,

    // 这两个用fn和sc都可以
    isConstructor: analyser.isConstructor,
    isClass: analyser.isClass,
    isClassic: analyser.isConstructor && !analyser.isClass,

    // 这四个要用fn直接判定才行
    isProxy: tracker.isProxy(fn),
    isBound: tracker.isBound(fn),
    wasProxy: tracker.wasProxy(fn),
    wasBound: tracker.wasBound(fn),

    // 下面四个必须要对sc分析才能得知
    isArrow: analyser.isArrow,
    isAsync: analyser.isAsync,
    isMemberMethod: analyser.isMemberMethod,
    isGenerator: analyser.isGenerator,
  };

  // # 逻辑闭环校验
  const logic = new FeatureLogic(features);
  logic.nand('isArrow', 'isConstructor'); // 箭头函数不能new
  logic.nand('isArrow', 'isMemberMethod'); // 箭头函数不叫成员方法，而是纯粹的变量
  logic.nand('isArrow', 'isClass'); // 箭头函数肯定不是class
  logic.nand('isAsync', 'isConstructor'); // async函数不能new
  logic.nand('isAsync', 'isClass'); // async函数肯定不是类
  logic.nand('isMemberMethod', 'isConstructor'); // 成员方法不能new，会提示不是构造函数
  logic.nand('isMemberMethod', 'isClass'); // 自然也不是class
  logic.nand('isGenerator', 'isConstructor'); // 生成器函数不能new
  logic.nand('isGenerator', 'isClass'); // 生成器函数肯定不是class
  logic.nand('isProxy', 'isBound'); // fn当前的状态至多只可能isProxy和isBound二选一，但was版本可以同时存在

  logic.implies({ isClass: true }, { isConstructor: true });

  if (logic.errors.length > 0) {
    const msg = `Logic errors detected:\n
    - ${logic.errors.join('\n-')}\n${logFn(sc)}`;
    throw err(msg);
  }

  return Object.freeze(features);
};

export default getFunctionFeatures;
