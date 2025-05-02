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
