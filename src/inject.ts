// 通过注入Proxy和bind来实现标记判定，这样的判定是100%准确的
let injectionFlag = false;

const proxySet = new WeakSet<Function>();
const boundSet = new WeakSet<Function>();
const sourceMap = new WeakMap<Function, Function>();

const recordSource = (target: Function, newFunction: Function) => {
  if (sourceMap.has(target)) {
    const source = sourceMap.get(target) as Function;
    sourceMap.set(newFunction, source);
    return;
  }
  sourceMap.set(newFunction, target);
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
      recordSource(target, p as Function);
      proxySet.add(p as Function);
    }
    console.log('new proxy made');
    return p;
  } as any;

  newProxy.revocable = function <T extends object>(target: T, handler: ProxyHandler<T>) {
    // 创建原版
    const revocable = oldProxy.revocable(target, handler);
    if (typeof target === 'function') {
      recordSource(target, revocable.proxy as Function);
      proxySet.add(revocable.proxy as Function);
    }
    console.log('new proxy made');
    return revocable;
  };
  Proxy = newProxy;

  const oldBind = Function.prototype.bind;
  Function.prototype.bind = function (this, thisArg: any, ...args: any[]) {
    const bound = oldBind.call(this, thisArg, ...args);
    recordSource(this, bound as Function);
    boundSet.add(bound as Function);
    return bound;
  };

  injectionFlag = true;
  console.log(`[GetFunctionType] Proxy, Bind Injected`);
};
inject();

export const hasProxyChain = (o: any) => proxySet.has(o);

export const hasBindChain = (o: any) => boundSet.has(o);

export const getSourceFunction = (o: Function) => sourceMap.get(o) ?? o;

export const isInjected = () => injectionFlag;
