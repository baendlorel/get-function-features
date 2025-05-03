/**
 * @name GetFunctionFeatures
 * @author Kasukabe Tsumugi <futami16237@gmail.com>
 * @license MIT
 */
import './inject';
import { FunctionFeature } from './feature.class';

const getFunctionFeatures = (fn: Function | any) => new FunctionFeature(fn).toResult();

export = getFunctionFeatures;
