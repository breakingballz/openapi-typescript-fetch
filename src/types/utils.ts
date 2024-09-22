type AddQuestionMarks<
  T extends object,
  K extends keyof T = Extract<
    { [key in keyof T]: undefined extends T[key] ? key : never }[keyof T],
    keyof T
  >,
> = Omit<T, K> & Partial<Pick<T, K>>;

type OptionalKeys<T extends object> = {
  [key in keyof T]: undefined extends T[key] ? key : never;
}[keyof T];

type CanBeOptional<T> = T extends object
  ? keyof T extends OptionalKeys<T>
    ? undefined
    : never
  : never;

export type Optionalize<T extends object> = AddQuestionMarks<{
  [key in keyof T]: T[key] | CanBeOptional<T[key]>;
}>;

export type Merge<A, B> = B extends object
  ? {
      [key in keyof A as key extends keyof B ? never : key]: A[key];
    } & {
      [key in keyof B as key]: key extends keyof A ? Merge<A[key], B[key]> : B[key];
    } extends infer T
    ? { [key in keyof T]: T[key] }
    : never
  : B;
