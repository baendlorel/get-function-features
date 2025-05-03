// 通过注入Proxy和bind来实现标记判定，这样的判定是100%准确的
let injectionFlag = false;

const proxiedFns = new WeakSet<Function>();
const boundFns = new Set<Function>();
const sourceMap = new WeakMap<Function, Function>();

const setSource = (target: Function, newFn: Function) => {
  // 如果target也有源头，那么设置为target的源头
  if (sourceMap.has(target)) {
    const source = sourceMap.get(target) as Function;
    sourceMap.set(newFn, source);
    return;
  }

  // target就是源头，那么设置新函数映射到target
  sourceMap.set(newFn, target);
};

const inject = () => {
  // 下面开始注入这两个东西
  const oldProxy = Proxy;
  const newProxy: ProxyConstructor = function <T extends object>(
    target: T,
    handler: ProxyHandler<T>
  ) {
    const p = new oldProxy(target, handler);
    if (typeof target === 'function') {
      setSource(target, p as Function);
      proxiedFns.add(p as Function);
    }
    return p;
  } as any;

  newProxy.revocable = function <T extends object>(target: T, handler: ProxyHandler<T>) {
    // 创建原版
    const revocable = oldProxy.revocable(target, handler);
    if (typeof target === 'function') {
      setSource(target, revocable.proxy as Function);
      proxiedFns.add(revocable.proxy as Function);
    }
    return revocable;
  };
  // 改写
  Proxy = newProxy;

  const oldBind = Function.prototype.bind;
  // 改写
  Function.prototype.bind = function (this, thisArg: any, ...args: any[]) {
    const newFn = oldBind.call(this, thisArg, ...args);
    setSource(this, newFn);
    boundFns.add(newFn);
    return newFn;
  };

  injectionFlag = true;
  console.log(`[GetFunctionType] Proxy, Bind Injected`);

  return {
    createProxyDirectly: function <T extends object>(
      target: T,
      handler: ProxyHandler<T>
    ) {
      return new oldProxy(target, handler);
    },
    bindDirectly: function (this: any, thisArg: any, ...args: any[]) {
      return oldBind.call(this, thisArg, ...args);
    },
  };
};
export const { createProxyDirectly, bindDirectly } = inject();

export const isInProxySet = (o: any) => proxiedFns.has(o);

export const isInBoundSet = (o: any) => boundFns.has(o);

export const getSourceFunction = (o: Function) => sourceMap.get(o) ?? o;

export const isInjected = () => injectionFlag;
