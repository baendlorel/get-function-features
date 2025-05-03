export type FunctionFeature = {
  /**
   * 表示是否能像`new fn()`这样当作构造函数用 \
   * Whether can be used with 'new' operator. Like `new fn()`.
   */
  readonly isConstructor: boolean;

  /**
   * 表示是否能且仅能像构造函数那样用，不能直接像函数那样用 \
   * Whether `fn` can be only used with 'new' operator, and cannot be called directly.
   */
  readonly isClass: boolean;

  /**
   * 是否为一个传统函数，可以`fn()`，也可以`new fn()`，但它不是class \
   * Whether `fn` is a classic function, which can be called with `fn()` or `new fn()`, but it is not a class.
   */
  readonly isClassic: boolean;

  /**
   * 判断`fn`是否是一个被代理的函数 \
   * Whether `fn` is wrapped by Proxy
   */
  readonly isProxy: boolean;

  /**
   * 判断`fn`是否是一个被别的函数绑定而来的，比如`fn = otherFn.bind(someObject)` \
   * Whether `fn` is obtained by 'otherFn.bind'
   */
  readonly isBound: boolean;

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
  readonly wasProxy: boolean;

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
  readonly wasBound: boolean;

  // 下面是需要解析函数原文才能知道的内容
  /**
   * 判断`fn`是否是箭头函数 \
   * Whether `fn` is an arrow function.
   */
  readonly isArrow: boolean;

  /**
   * 判断`fn`是否为异步函数 \
   * Whether `fn` is an async function.
   */
  readonly isAsync: boolean;

  /**
   * 判断`fn`是否是某个类或者某个对象里的成员函数 \
   * Whether `fn` is a member method of an object/class.
   */
  readonly isMemberMethod: boolean;

  /**
   * 判断`fn`是否是一个生成器函数 \
   * Whether `fn` is a generator function.
   */
  readonly isGenerator: boolean;
};

export type FunctionFeatureResult = FunctionFeature & {
  /**
   * The given function `fn`
   */
  readonly target: Function;

  /**
   * The source function of `fn`.
   * @description If 'fn' is proxied or bound, this will be the original function.
   */
  readonly source: Function;
};
