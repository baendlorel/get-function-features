export enum FunctionType {
  AsyncFunction = 'AsyncFunction',
  ArrowFunction = 'ArrowFunction',
  AsyncArrowFunction = 'AsyncArrowFunction',
  NormalFunction = 'NormalFunction',
  MemberFunction = 'MemberFunction',
  AsyncMemberFunction = 'AsyncMemberFunction',
  BoundFunction = 'BoundFunction',
  BoundNormalFunction = 'BoundNormalFunction',
  NotFunction = 'NotFunction',
  Unknown = 'Unknown',
}

export interface GetFunctionType {
  (fn: any): FunctionType;
  PossibleResults: string[];
}

export type CheckResult = 'yes' | 'no' | 'unknown' | 'maybe';
export type Features = {
  notFunction: boolean;
  isConstructor: CheckResult;
  isProxy: CheckResult;
  isArrow: CheckResult;
  isAsync: CheckResult;
  isClassMember: CheckResult;
  isBound: CheckResult;
};

export const createFeatureResult = (): Features => ({
  notFunction: false,
  isConstructor: 'unknown',
  isProxy: 'unknown',
  isArrow: 'unknown',
  isAsync: 'unknown',
  isClassMember: 'unknown',
  isBound: 'unknown',
});
