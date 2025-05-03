/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import { analyser, FeatureLogic, FunctionFeatureResult, tracker } from '@/core';
import { err, errLog } from '@/misc';

const getFunctionFeatures = (fn: any) => {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function, but got ${typeof fn}`);
  }

  const sc = tracker.getSource(fn);
  const parsed = analyser(sc);
  const features: FunctionFeatureResult = {
    target: fn,
    source: sc,

    // 这两个用fn和sc都可以
    isConstructor: analyser.isConstructor(sc),
    isClass: analyser.isClass(sc),
    get isClassic() {
      return features.isConstructor && !features.isClass;
    },

    // 这四个要用fn直接判定才行
    isProxy: tracker.isProxy(fn),
    isBound: tracker.isBound(fn),
    wasProxy: tracker.wasProxy(fn),
    wasBound: tracker.wasBound(fn),

    // 下面四个必须要对sc分析才能得知
    isArrow: parsed.isArrow,
    isAsync: analyser.isAsync(sc),
    isMemberMethod: parsed.isMemberMethod,
    isGenerator: analyser.isGenerator(sc),
  };

  // # 逻辑闭环校验

  const logic = new FeatureLogic(features);
  logic.nand('isArrow', 'isConstructor');
  logic.nand('isArrow', 'isMemberMethod');
  logic.nand('isArrow', 'isClass');
  logic.nand('isAsync', 'isConstructor');
  logic.nand('isAsync', 'isClass');
  logic.nand('isMemberMethod', 'isConstructor');
  logic.nand('isMemberMethod', 'isClass');
  logic.nand('isGenerator', 'isConstructor');
  logic.nand('isGenerator', 'isClass');

  logic.implies({ isClass: true }, { isConstructor: true });

  if (logic.errors.length > 0) {
    errLog('Logic errors:\n', logic.errors.join('\n'));
    throw err('Logic errors detected');
  }

  return features;
};

export = getFunctionFeatures;
