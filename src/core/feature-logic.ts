import { FunctionFeature } from './types';

export class FeatureLogic {
  features: FunctionFeature;
  errors: string[];

  constructor(features: FunctionFeature) {
    this.features = features;
    this.errors = [];
  }

  /**
   * 表示条件一定要推出结论，否则记录错误
   * @param condition 条件
   * @param conclusion 结论
   * @example 如果是isArrow === 'yes' 那么一定有 isConstructor === 'no'
   */
  implies(condition: Partial<FunctionFeature>, conclusion: Partial<FunctionFeature>) {
    const conditionList = [] as string[];
    const conditionKeys = Object.keys(condition);
    for (const key of conditionKeys) {
      conditionList.push(`'${key}' = ${condition[key]}`);
      if (this.features[key] !== condition[key]) {
        return;
      }
    }

    const errorKeys = [] as string[];
    const conclusionKeys = Object.keys(conclusion);
    for (const key of conclusionKeys) {
      if (this.features[key] !== conclusion[key]) {
        errorKeys.push(
          `${key} is invalid, expect '${conclusion[key]}', got '${this.features[key]}'`
        );
      }
    }

    if (errorKeys.length > 0) {
      return `As ${conditionList.join(', ')}:\n ${errorKeys.join('.\n ')}`;
    }
  }

  /**
   * 异或：表示两者互斥，状态不能相同，否则记录错误
   * @param a
   * @param b
   */
  xor(a: keyof FunctionFeature, b: keyof FunctionFeature) {
    const f1 = this.features[a];
    const f2 = this.features[b];
    if (f1 === f2) {
      this.errors.push(`'${a}' and '${b}' cannot be both 'yes' or 'no'`);
    }
  }

  /**
   * 与非：表示两者不可同时为true
   * @param feature1
   * @param feature2
   */
  nand(a: keyof FunctionFeature, b: keyof FunctionFeature) {
    const f1 = this.features[a];
    const f2 = this.features[b];
    if (f1 === f2 && f1) {
      this.errors.push(`'${a as string}' and '${b as string}' cannot be both 'yes'`);
    }
  }
}
