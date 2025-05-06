/**
 * 缓存装饰器，用于缓存getter的计算结果
 * @returns PropertyDescriptor
 */
export const cached = <T, R = any>(
  value: (this: T, ...args: any[]) => R,
  context: ClassGetterDecoratorContext<T, R>
) => {
  if (context.kind !== 'getter') {
    throw new TypeError(`@cached decorator can only be used on getters.`);
  }
  return function (this: T) {
    const result = value.call(this);
    Object.defineProperty(this, context.name, {
      value: result,
      writable: false,
    });
    return result;
  };
};

//装饰器函数返回类型“(initialValue: any) => void”不可分配
// 到类型“void | ((this: Analyser, value: boolean) => boolean)”。
// 不能将类型“(initialValue: any) => void”分配给类型“(this: Analyser, value: boolean) => boolean”。
//   不能将类型“void”分配给类型“boolean”。
export const immutable = <T>(value: any, context: ClassFieldDecoratorContext<T>) => {
  if (context.kind !== 'field') {
    throw new TypeError(`@readonly decorator can only be used on fields.`);
  }
  return function (this: T, initialValue: any) {
    Object.defineProperty(this, context.name, {
      value: initialValue,
      writable: false,
      configurable: false,
    });
    return initialValue;
  };
};
