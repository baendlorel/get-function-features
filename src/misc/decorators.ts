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

/**
 * 把变量改为不可变更的
 * @param value
 * @param context
 * @returns
 */
export const immutable = <T>(value: any, context: ClassFieldDecoratorContext<T>) => {
  if (context.kind !== 'field') {
    throw new TypeError(`@immutable decorator can only be used on fields.`);
  }
  return function (this: T, initialValue: any) {
    const d = Object.getOwnPropertyDescriptor(this, context.name);
    if (d) {
      d.writable = false;
      d.configurable = false;
    }
    return initialValue;
  };
};
