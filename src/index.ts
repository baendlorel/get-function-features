/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import './inject';
import { Features } from './feature.class';

const getFunctionFeatures = (fn: any) => new Features(fn);

export = getFunctionFeatures;
