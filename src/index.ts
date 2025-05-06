/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import { FeatureLogic, Analyser, tracker, FunctionFeatureResult } from '@/core';
import { err, errLog, logFn } from '@/misc';

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
