import { FunctionType } from './types';
import { err } from './logs';

export const scanForNext = (str: string, char: string) => {
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === char) {
      return i;
    }
  }
  return -1;
};

const justify = (str: string) => {
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * 如果toString一个函数，默认值用到了单、双、反这三种引号的组合。那么会出现：\
 * 1、使用了单引号，那么结果会用双引号包裹 \
 * 2、双引号或反引号,会用单引号包裹 \
 * 3、如果使用了两种引号，那么会用第三种没用过的引号包裹 \
 * 4、如果三种都用，那么会用单引号包裹，并将单引号转义
 * @param fnStr
 * @returns
 */
export const analyse = (fnStr: string) => {
  let leftParenthesesIndex = -1;
  let rightParenthesesIndex = -1;
  let bracketLevel = 0;
  let nameSymbolLeftIndex = -1;
  let nameSymbolRightIndex = -1;

  const inNameSymbolBracket = () =>
    nameSymbolLeftIndex !== -1 && nameSymbolRightIndex === -1;

  // 可以合法出现单边括号的地方有
  // 字符串内部、正则表达式、注释文本
  for (let i = 0; i < fnStr.length; i++) {
    const c = fnStr[i];

    if (c === '[' && nameSymbolLeftIndex === -1) {
      nameSymbolLeftIndex = i;
      continue;
    }

    if (c === ']' && nameSymbolLeftIndex !== -1 && nameSymbolRightIndex === -1) {
      nameSymbolRightIndex = i;
      continue;
    }

    // 1 圆括号
    if (c === '(' && !inNameSymbolBracket()) {
      bracketLevel++;
      if (bracketLevel === 1 && leftParenthesesIndex === -1) {
        leftParenthesesIndex = i;
      }
      continue;
    }

    if (c === ')' && !inNameSymbolBracket() && leftParenthesesIndex !== -1) {
      bracketLevel--;
      if (bracketLevel === 0 && rightParenthesesIndex === -1) {
        rightParenthesesIndex = i;
        break;
      }
      continue;
    }

    // 2.1 多行注释
    if (c === '/' && fnStr[i + 1] === '*') {
      i++;
      while (i < fnStr.length) {
        if (fnStr[i] === '*' && fnStr[i + 1] === '/') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 2.2 单行注释
    if (c === '/' && fnStr[i + 1] === '/') {
      i++;
      while (i < fnStr.length) {
        if (fnStr[i] === '\n') {
          break;
        }
        i++;
      }
      continue;
    }

    // 下面开始判定函数声明中存在的字符串
    // 不需要处理反引号里面转义单引号的情况，因为对字符串、正则表达式的判定一定是基于一个首先出现的标志性字母的
    // 首先作为开头的字母肯定不需要转义，
    // 3 引号、正则表达式
    if (c === `'` || c === `"` || c === '`' || c === '/') {
      const rest = fnStr.slice(i);
      const nextIndex = scanForNext(rest, c);
      if (nextIndex === -1) {
        throw err(
          `There is an unmatched [${c}] in the function string, cannot parse the function.`
        );
      }
      i += nextIndex; // 这里无需另外+1，因为会在for循环中+1
      continue;
    }
  }

  if (inNameSymbolBracket()) {
    throw err(
      `There is an unmatched [${fnStr[nameSymbolLeftIndex]}] in the function string, cannot parse the function.`
    );
  }

  // 现在fn确认是函数了，但没有括号，只有单参数箭头函数满足这个情况
  if (leftParenthesesIndex === -1 || rightParenthesesIndex === -1) {
    if (fnStr.includes('=>')) {
      if (fnStr.trim().startsWith('async')) {
        return FunctionType.AsyncArrowFunction;
      } else {
        return FunctionType.ArrowFunction;
      }
    } else {
      throw err(`There is no bracket in the function string, cannot parse the function.`);
    }
  }

  const symbolName =
    nameSymbolLeftIndex !== -1 && nameSymbolRightIndex !== -1
      ? justify(fnStr.slice(nameSymbolLeftIndex, nameSymbolRightIndex + 1))
      : undefined;

  // 解析三个部分
  const name = justify(fnStr.slice(0, leftParenthesesIndex));
  const params = justify(fnStr.slice(leftParenthesesIndex, rightParenthesesIndex + 1));
  const body = justify(fnStr.slice(rightParenthesesIndex + 1));

  // 返回解析结果
  return {
    symbolName,
    name,
    params,
    body,
    isArrow: body.startsWith('=>'),
    isAsync: name.startsWith('async'),
    isMember: !body.startsWith('=>') && !name.startsWith('function'),
  };
};
