/**
 * 从对象及其原型链上获取所有函数名
 * @param obj 要检查的对象
 * @param options 配置选项
 * @returns 函数名数组
 */
function getAllFunctionNames(
  obj: any,
  options: {
    includeNonEnumerable?: boolean; // 是否包含不可枚举属性
    stopAtPrototype?: any; // 原型链遍历到哪个原型时停止
    includeSymbols?: boolean; // 是否包含Symbol键
  } = {}
): string[] {
  const {
    includeNonEnumerable = true,
    stopAtPrototype = Object.prototype,
    includeSymbols = false,
  } = options;

  const result = new Set<string>();
  let currentObj = obj;

  // 遍历整个原型链
  while (currentObj !== null && currentObj !== undefined) {
    // 获取当前对象的所有属性名
    let propertyNames: (string | symbol)[] = [];

    if (includeNonEnumerable) {
      // 获取包括不可枚举属性在内的所有属性
      propertyNames = Object.getOwnPropertyNames(currentObj);

      // 如果需要，也包含Symbol键
      if (includeSymbols) {
        propertyNames = [...propertyNames, ...Object.getOwnPropertySymbols(currentObj)];
      }
    } else {
      // 仅获取可枚举属性
      for (const key in currentObj) {
        if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
          propertyNames.push(key);
        }
      }

      // 如果需要，也包含可枚举的Symbol键
      if (includeSymbols) {
        const symbols = Object.getOwnPropertySymbols(currentObj).filter(
          (sym) => Object.getOwnPropertyDescriptor(currentObj, sym)?.enumerable
        );
        propertyNames = [...propertyNames, ...symbols];
      }
    }

    // 过滤出函数类型的属性并添加到结果集
    for (const name of propertyNames) {
      try {
        const prop = currentObj[name];
        if (typeof prop === 'function') {
          result.add(String(name));
        }
      } catch (e) {
        // 某些属性可能不允许访问，忽略错误
        console.warn(`无法访问属性 ${String(name)}:`, e);
      }
    }

    // 移动到原型对象
    currentObj = Object.getPrototypeOf(currentObj);

    // 如果到达了停止原型，则退出循环
    if (currentObj === stopAtPrototype) {
      break;
    }
  }

  return Array.from(result).sort();
}

// 使用示例
// const documentFunctions = getAllFunctionNames(window.document);
// console.log(documentFunctions);

// 只获取可枚举函数
// const enumFunctions = getAllFunctionNames(window.document, { includeNonEnumerable: false });

// 在 HTMLDocument.prototype 处停止遍历
// const limitedFunctions = getAllFunctionNames(window.document, {
//   stopAtPrototype: HTMLDocument.prototype
// });

// 包含Symbol键函数
// const withSymbols = getAllFunctionNames(window.document, { includeSymbols: true });

export default getAllFunctionNames;
