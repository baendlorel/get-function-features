import { expect } from '@jest/globals';
import { describe, it } from './injected-jest';
import getFunctionFeatures from '../src/index';
import { FunctionFeature } from '../src/feature.class';
import { extractToStringProto } from '../src/misc';

describe('刁钻边界测试用例', () => {
  const expectFeature = (fn: Function, expected: Partial<FunctionFeature>) =>
    expect(getFunctionFeatures(fn)).toEqual(expect.objectContaining(expected));

  describe('篡改', () => {
    it('Function.prototype.toString 被篡改的情况', () => {
      const originalToString = Function.prototype.toString;
      try {
        // 修改 Function.prototype.toString
        Function.prototype.toString = function () {
          return '被修改了';
        };
        expect(() => extractToStringProto()).toThrowError();
      } finally {
        // 恢复原状
        Function.prototype.toString = originalToString;
      }
    });
  });

  describe('通常的函数情形', () => {
    it('包含注释和引号的箭头函数', () => {
      // 包含所有三种引号和注释的箭头函数
      const fn = eval(`() => {
      /* 这是一个多行注释 '使用单引号' "使用双引号" */
      const a = 'single quotes';
      const b = "double quotes";
      const c = \`backticks\`;
      // 这是单行注释
      return { a, b, c };
   
    }`);
      expectFeature(fn, {
        notFunction: false,
        isArrow: 'yes',
        isAsync: 'no',
        isMemberMethod: 'no',
        isConstructor: 'no',
        isProxy: 'no',
        isBound: 'no',
      });
    });

    it('混合了正则表达式的函数', () => {
      // 函数体包含正则表达式，正则中又包含括号
      const fn = function (regex = /function\s*\(\)\s*\{/) {
        return regex.test('function() {');
      };

      expectFeature(fn, {
        isArrow: 'no',
        isAsync: 'no',
        isMemberMethod: 'no',
        isConstructor: 'yes',
        isProxy: 'no',
        isBound: 'no',
      });
    });

    it('嵌套多层括号的箭头函数', () => {
      // 箭头函数参数包含多层括号的解构
      const fn = eval(`([{a: {b: {c: {d}}}}]) => ({...d})`);
      console.log('嵌套多', fn, fn.toString());
      expectFeature(fn, {
        isArrow: 'yes',
      });
    });

    it('有名箭头函数的赋值表达式', () => {
      // 带名字的箭头函数（虽然箭头函数自身无法命名，但赋值给变量算是一种"命名"）
      const fn = () => {};
      expectFeature(fn, {
        isArrow: 'yes',
        isConstructor: 'no',
      });
    });

    it('模拟构造函数调用 new Function()', () => {
      // 使用 new Function 创建的函数
      const fn = new Function('a', 'b', 'return a + b');
      expectFeature(fn, {
        isArrow: 'no',
        isConstructor: 'yes',
      });
    });

    it('具有复杂方括号符号的函数', () => {
      // 具有复杂方括号符号名称的方法
      const obj = {
        ['complex[name]'](a, b) {
          return a + b;
        },
      };
      expectFeature(obj['complex[name]'], {
        isArrow: 'no',
        isConstructor: 'no',
        isMemberMethod: 'yes',
      });
    });

    it('对象方法简写语法', () => {
      // 使用对象方法简写语法
      const obj = {
        method() {
          return this;
        },
      };
      expectFeature(obj.method, {
        isArrow: 'no',
        isConstructor: 'no',
        isMemberMethod: 'yes',
      });
    });

    it('成员函数', () => {
      class A {
        fn() {}
      }

      const a = new A();
      const fn = a.fn;

      expectFeature(fn, {
        isArrow: 'no',
        isConstructor: 'no',
        isMemberMethod: 'yes',
        isGenerator: 'no',
      });
    });

    it('异步生成器函数', () => {
      // 异步生成器函数
      async function* fn() {
        yield 1;
        yield 2;
      }

      expectFeature(fn, {
        isArrow: 'no',
        isAsync: 'yes',
        isConstructor: 'no',
        isMemberMethod: 'no',
        isGenerator: 'yes',
      });
    });

    it('带默认参数的箭头函数', () => {
      // 带默认参数和解构的箭头函数
      const fn = ({ a = 1, b = 2 } = {}) => a + b;

      expectFeature(fn, {
        isArrow: 'yes',
        isAsync: 'no',
        isConstructor: 'no',
        isMemberMethod: 'no',
        isGenerator: 'no',
      });
    });

    it('Symbol为名的函数', () => {
      // 带默认参数和解构的箭头函数
      const asymbol = Symbol('a');
      const fn = {
        [asymbol]: () => {},
      }[asymbol];

      expectFeature(fn, {
        isArrow: 'yes',
      });
    });

    it('全局Symbol为名的函数，赋予变量的全局Symbol', () => {
      // 带默认参数和解构的箭头函数
      const asymbol = Symbol.for('a');
      const fn = {
        [asymbol]: () => {},
      }[asymbol];

      expectFeature(fn, {
        isArrow: 'yes',
      });
    });

    it('全局Symbol为名的函数，直接使用的全局Symbol', () => {
      // 带默认参数和解构的箭头函数
      const fn = {
        [Symbol.for('a')]: () => {},
      }[Symbol.for('a')];

      expectFeature(fn, {
        isArrow: 'yes',
      });
    });
  });

  describe('绑定与代理', () => {
    it('绑定的函数', () => {
      // 多次绑定的函数
      const fn = function () {
        return this;
      };
      const boundOnce = fn.bind({ x: 1 });
      expectFeature(boundOnce, {
        isBound: 'yes',
        isProxy: 'no',
        isArrow: 'no',
        isAsync: 'no',
        isConstructor: 'yes',
        isMemberMethod: 'no',
        isGenerator: 'no',
      });
    });

    it('代理函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = () => {};
      const proxiedFn = new Proxy(originalFn, {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(proxiedFn, {
        isBound: 'no',
        isProxy: 'yes',
        isArrow: 'yes',
        isAsync: 'no',
        isConstructor: 'no',
        isMemberMethod: 'no',
        isGenerator: 'no',
      });
    });

    it('代理和绑定并用的函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const proxiedFn = new Proxy(originalFn.bind({}), {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(proxiedFn, {
        isBound: 'yes',
        isProxy: 'yes',
        isArrow: 'no',
      });
    });

    it('代理过绑定过，但只检测代理的函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const boundFn = originalFn.bind({});
      const revocable = Proxy.revocable(originalFn, {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(revocable.proxy, {
        isBound: 'no',
        isProxy: 'yes',
        isArrow: 'no',
      });
    });

    it('先代理后绑定，看看能否看出代理过', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const proxiedFn = new Proxy(originalFn.bind({}), {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      const boundFn = proxiedFn.bind({});
      expectFeature(boundFn, {
        isBound: 'yes',
        isProxy: 'yes',
        isArrow: 'no',
      });
    });
  });
});

// describe('nothing', () => {
//   it('nothing', () => {
//     expect(1).toBe(1);
//   });
// });
