import { ConditionalExcept, IsEmptyObject } from "type-fest";
import { VialSRef } from "./vial";

export type IsEmptyString<T> = T extends string ? (T extends "" ? true : false) : false;
export type NonEmptyString<T extends string> = T extends "" ? never : T;

export declare type EnumLike = {
	[k: string]: string | number;
	[nu: number]: string;
};

export type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
export type ToString<T> = T & string;

export type Constructor = { new (...args: any[]): any };
export type InstanceOf<T> = T extends new (...args: any) => infer R ? R : never;

export type IsEmptyObjectOrArray<T> = OfArray<T> extends { type: infer L; isUndefined: infer _; isPrimitive: infer _ } ? IsEmptyObject<L> : IsEmptyObject<T>;
export declare type TupleToUnion<T> = T extends (infer U)[] ? U : never;
export declare type DateLike = Date;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type UnionToOvlds<U> = UnionToIntersection<U extends any ? (f: U) => void : never>;
export type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A : never;
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
export type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]> : [T, ...A];
export type TailOfStrArray<T extends string[]> = ((...args: T) => any) extends (head: any, ...tail: infer I) => any ? I : never;

export type ArrayToStrings<T extends any[]> = T extends [infer a]
	? a extends string
		? `"${a}"`
		: a
	: T extends [infer A, ...infer B]
	? A extends string
		? `"${A}", ${ArrayToStrings<B>}`
		: never
	: "";

export type UnionToArrayString<T, TA extends any[] = UnionToArray<T>, TS extends string = ArrayToStrings<TA>> = `[${TS}]`;

export type ObjValueTuple<T, KS extends any[] = UnionToArray<keyof T>, R extends any[] = []> = KS extends [infer K, ...infer KT] ? ObjValueTuple<T, KT, [...R, T[K & keyof T]]> : R;

export type WithDefault<T, D> = T;
export type TailFn<T extends any[]> = ((...t: T) => void) extends (h: any, ...r: infer R) => void ? R : never;
export type Head<T> = T extends [infer I, ...infer _Rest] ? I : never;
export type Tail<T extends any[]> = T extends [infer _I, ...infer Rest] ? Rest : never;
export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export type NonFunction<T, Fallback> = T extends (...args: any[]) => any ? Fallback : T;

export type isNullable<T, OG = T> = T extends null | undefined ? OG : never;
export type NonUndefined<T> = undefined extends T ? never : T;
export type Undefined<T> = undefined extends T ? T : never;
export type IsUndefined<T> = undefined extends T ? true : false;

export type Length<T extends any[]> = T extends { length: infer L } ? (L extends 100 ? 100 : L) : never;
export type EQ<A, B> = A extends B ? (B extends A ? true : false) : false;
export type AtTerminus<A extends number, B extends number> = A extends 0 ? true : B extends 0 ? true : false;
export type LT<A extends number, B extends number> = AtTerminus<A, B> extends true
	? EQ<A, B> extends true
		? false
		: A extends 0
		? true
		: false
	: LT<Subtract<A, 1>, Subtract<B, 1>>;

export type BuildTuple<L, T extends any[] = []> = T extends { length: L } ? T : BuildTuple<L, [...T, any]>;

export type Add<A extends number, B extends number> = Length<[...BuildTuple<A>, ...BuildTuple<B>]>;
export type IsArrayEmpty<A extends T[], T> = A extends [T] ? true : false;

export type TupleArray<T extends any[], Item> = [...T, Item];

export type Subtract<A extends number, B extends number> = BuildTuple<A> extends [...infer U, ...BuildTuple<B>] ? Length<U> : never;
export type IsSameType<T, U> = T extends U ? (U extends T ? true : false) : false;

export type NonArray<T> = T extends any[] ? never : T;
export type Union<T, T2> = {
	[K in keyof T]: K extends keyof T2 ? T[K] | T2[K] : T[K];
};

export type Intersection<T, T2> = {
	[K in keyof T]: K extends keyof T2 ? T[K] & T2[K] : never;
};

export type IsPrimitive<T> = T extends Primitives ? true : false;
export type GetArrayElem<T> = IsUndefined<T> extends true ? (NonNullable<T> extends (infer U)[] ? U : never) : T extends (infer U)[] ? U : never;

export type OfArray<T> = IsUndefined<T> extends true
	? NonNullable<T> extends ReadonlyArray<infer U>
		? { type: U; isReadonly: true; isUndefined: true; isPrimitive: NonNullable<U> extends Primitives ? true : false }
		: NonNullable<T> extends (infer U)[]
		? { type: U; isReadonly: false; isUndefined: true; isPrimitive: NonNullable<U> extends Primitives ? true : false }
		: T
	: T extends ReadonlyArray<infer U>
	? { type: U; isReadonly: true; isUndefined: false; isPrimitive: NonNullable<U> extends Primitives ? true : false }
	: T extends (infer U)[]
	? { type: U; isReadonly: false; isUndefined: false; isPrimitive: NonNullable<U> extends Primitives ? true : false }
	: T;

export type GetArray<T> = IsUndefined<T> extends true ? (NonNullable<T> extends (infer U)[] ? U[] | undefined : never) : T extends (infer U)[] ? U[] : never;

export type IsArray<T> = NonNullable<T> extends infer X ? (X extends any[] ? true : false) : false;

export type IsScalarArrayWithoutMixedTypes<T> = T extends (infer U)[] ? (U extends string | number | boolean | bigint | symbol ? U : never) : T;
export type IsComplexArray<T> = T extends (infer U)[] ? (U extends string | number | boolean | bigint | symbol ? never : U) : T;
export type IsScalarArray<T> = T extends (infer U)[] ? (U extends string | number | boolean | bigint | symbol ? true : false) : false;

export type ExtractArrayType<T> = T extends (infer U)[] ? U : T;
export type Exactly<T, U> = T & Record<Exclude<keyof U, keyof T>, never>;
export type UnwrapPick<T> = T extends Pick<infer U, infer S> ? (U extends (infer X)[] ? X : T) : T;
export type ExtractPartialType<T> = T extends Partial<infer U> ? U : T;

export type Primitive = string | number | symbol;
export type Primitives = string | number | bigint | boolean;

export type Util<Obj, Props extends ReadonlyArray<Primitive>> = Props extends []
	? Obj
	: Props extends [infer First]
	? First extends keyof Obj
		? Obj[First]
		: never
	: Props extends [infer Fst, ...infer Tail]
	? Fst extends keyof Obj
		? Tail extends string[]
			? Util<Obj[Fst], Tail>
			: never
		: never
	: never;

export type IsNeverType<T> = [T] extends [never] ? true : false;

export type IsAllowed<T> = IsNeverType<T> extends true ? false : true;
export type Validator<T extends boolean | string> = T extends true ? [] : [never];
export type ValuesUnion<T, Cache = T> = T extends Primitive
	? T
	: {
			[P in keyof T]: Cache | T[P] | ValuesUnion<T[P], Cache | T[P]>;
	  }[keyof T];

export type Nullable<T> = T | undefined;

export const hasProperty = <Obj, Prop extends Primitive>(obj: Obj, prop: Prop): obj is Obj & Record<Prop, any> => Object.prototype.hasOwnProperty.call(obj, prop);

export type RecursivelyNonNullable<T> = T extends object
	? {
			[K in keyof T]: T[K] extends Primitives | DateLike
				? T[K]
				: Nullable<T[K]> extends T[K]
				? never
				: NonNullable<T[K]> extends (infer U)[]
				? RecursivelyNonNullable<U>[] | undefined
				: T[K] extends DateLike
				? T[K]
				: T[K] extends object
				? RecursivelyNonNullable<T[K]>
				: never;
	  }
	: T;

export type MergeProperties<T> = T extends object
	? {
			[K in keyof T]: OfArray<T[K]> extends { type: infer U; isUndefined: infer I }
				? MergeProperties<U>[]
				: T[K] extends () => any
				? T[K]
				: T[K] extends VialSRef<any, any>
				? T[K]
				: T[K] extends DateLike
				? T[K]
				: T[K] extends object
				? MergeProperties<T[K]>
				: T[K];
	  }
	: T;

export type DeepOmitNever<T> = OfArray<T> extends { type: infer L; isReadonly: infer IR; isUndefined: infer R; isPrimitive: infer S }
	? S extends true
		? L extends never
			? never
			: R extends true
			? L[] | undefined
			: L[]
		: R extends true
		? DeepOmitNever<L>[] | undefined
		: DeepOmitNever<L>[]
	: T extends () => any
	? T
	: T extends VialSRef<any, any>
	? T
	: T extends DateLike
	? T
	: T extends object
	? {
			[K in keyof T as IsEmptyObjectOrArray<DeepOmitNever<T[K]>> extends true ? never : T[K] extends never ? never : K]: DeepOmitNever<T[K]>;
	  }
	: T;

export type ArrayToString<T> = T extends (infer U)[] ? (U extends string | number | boolean | bigint | symbol ? U : never) : never;

export type RecursiveOptional<T> = T extends VialSRef<any, any>
	? T
	: T extends object
	? {
			[P in keyof T]?: OfArray<T[P]> extends { type: infer U; isReadonly: infer IR; isUndefined: infer R; isPrimitive: infer S }
				? S extends true
					? U[]
					: RecursiveOptional<U>[]
				: T[P] extends Nullable<DateLike>
				? T[P]
				: T[P] extends Primitives
				? T[P]
				: NonNullable<T[P]> extends T
				? RecursiveOptional<T[P]>
				: RecursiveOptional<T[P]>;
	  }
	: T;

export type DefinedProps<T> = OnlyNonNullable<T>;
export type UndefinedProps<T> = RecursiveOptional<OnlyNullable<T>>;
export type UndefinedKeys<T> = NullableKeys<T>;

export type NullableKeys<T> = T extends object
	? {
			[P in keyof T]: T[P] extends Primitives | DateLike
				? isNullable<T[P]> extends true
					? never
					: P
				: T[P] extends (infer U)[]
				? NullableKeys<U>
				: T[P] extends object
				? NullableKeys<T[P]>
				: P;
	  }[keyof T]
	: never;

export type GetObjDifferentKeys<
	T,
	U,
	T0 = Omit<T, DeepKeyOf<U>> & Omit<U, DeepKeyOf<T>>,
	T1 = {
		[K in keyof T0]: T0[K];
	},
> = T1;

export type DeepKeyOf<T, Pos = keyof T> = T extends VialSRef<any, any>
	? Pos
	: T extends DateLike
	? Pos
	: T extends (infer U)[]
	? DeepKeyOf<U, Pos>
	: T extends object
	? {
			[K in keyof T]: K | DeepKeyOf<Exclude<T[K], Extract<T, T[K]>>, K>;
	  }[keyof T]
	: never;

export type DeepDifferentKeys<T, U> = {
	[K in keyof T]: K extends keyof U
		? T[K] extends U[K]
			? NonNullable<T[K]> extends (infer I)[]
				? NonNullable<U[K]> extends (infer L)[]
					? keyof NonNullable<L> & keyof NonNullable<I>
					: never
				: never //NonNullable<T[K]> extends (infer X)[] ? keyof X extends keyof U ? keyof X : keyof U : never
			: K
		: K;
}[keyof T];

export type PartialObj<T> = T extends object ? { [P in keyof T]?: T[P] } : T;
export type OmitObj<T, K extends keyof any> = T extends object ? PickObj<T, Exclude<keyof T, K>> : T;

export type PickObj<T, K extends keyof T> = T extends object
	? {
			[P in K]: T[P];
	  }
	: T;

export type DifferentKeys<T, U> = T extends object ? OmitObj<T, keyof U> & OmitObj<U, keyof T> : T;
export type GetObjSameKeys<T, U> = Omit<T | U, keyof GetObjDifferentKeys<T, U>>;

export type DeepPickDot<T, K extends string> = K extends `${infer Head}.${infer Tail}`
	? {
			[P in Head]: P extends keyof T ? (T[P] extends object ? DeepPickDot<T[P], Tail> : T[P]) : never;
	  }[Head]
	: K extends keyof T
	? T[K]
	: never;

export type DotPrefix<T extends string, Prefix extends string = "."> = T extends "" ? "" : `${Prefix}${T}`;

export type DotNestedKeys<T> = (T extends object ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>] : "") extends infer D
	? Extract<D, string>
	: never;

/* testing */

export type AllKeyPathsArray<T> = T extends Primitive ? never : { [K in keyof T]: [K] | [...ExtractNestedKeyPaths<NonNullable<T[K]>, K>] }[keyof T];

type ExtractNestedKeyPaths<T, P> = IsPrimitive<T> extends true
	? never
	: T extends DateLike
	? never
	: T extends (infer U)[]
	? IsPrimitive<U> extends true
		? never
		: {
				[K in keyof U]: [...[P], K] | [...[P], ...ExtractNestedKeyPaths<NonNullable<U[K]>, K>];
		  }[keyof U]
	: {
			[K in keyof T]: [...[P], K] | [...[P], ...ExtractNestedKeyPaths<NonNullable<T[K]>, K>];
	  }[keyof T];

export type OmitByValue<T, V> = T extends object ? Pick<T, { [K in keyof T]: T[K] extends V ? never : K }[keyof T]> : T;

export type Diff<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

export type ReplaceProperty<T, K extends keyof T, V> = T extends object
	? {
			[P in keyof T]: P extends K ? V : T[P];
	  }
	: T;

export type AddProperty<T, K extends string, V> = T extends object
	? {
			[P in keyof T | K]: P extends keyof T ? T[P] : V;
	  }
	: T;

export type RecursivePartial<T> = {
	[P in keyof T]: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type MarkAllNonNullableAsNever<T> = T extends object
	? {
			[P in keyof T]: NonNullable<T[P]> extends VialSRef<any, any>
				? T[P]
				: NonNullable<T[P]> extends DateLike
				? Undefined<T[P]>
				: OfArray<T[P]> extends { type: infer L; isReadonly: infer IR; isUndefined: infer R; isPrimitive: infer S }
				? R extends true
					? S extends true
						? L[] | undefined
						: MarkAllNonNullableAsNever<L>[] | undefined
					: S extends true
					? never
					: MarkAllNonNullableAsNever<L>[]
				: NonNullable<T[P]> extends object
				? MarkAllNonNullableAsNever<T[P]>
				: Undefined<T[P]>;
	  }
	: never;

export type MarkAllNullableAsNever<T> = T extends object
	? {
			[P in keyof T]: NonNullable<T[P]> extends VialSRef<any, any>
				? T[P]
				: NonNullable<T[P]> extends DateLike
				? NonUndefined<T[P]>
				: OfArray<T[P]> extends { type: infer L; isReadonly: infer IR; isUndefined: infer R; isPrimitive: infer S }
				? R extends true
					? S extends true
						? never
						: MarkAllNullableAsNever<L>[] | undefined
					: S extends true
					? L[]
					: MarkAllNullableAsNever<L>[]
				: NonNullable<T[P]> extends object
				? MarkAllNullableAsNever<T[P]>
				: NonUndefined<T[P]>;
	  }
	: T;

export type OnlyNullable<T, T1 = MarkAllNonNullableAsNever<T>> = DeepOmitNever<T1>;
export type OnlyNonNullable<T, T1 = MarkAllNullableAsNever<T>> = DeepOmitNever<T1>;

export type EmptyKeyof<T> = T extends object
	? {
			[P in keyof T]: IsEmptyObject<T[P]> extends true
				? never
				: T[P] extends DateLike
				? IsEmptyObject<T[P]> extends true
					? never
					: P
				: OfArray<T[P]> extends { type: infer L; isReadonly: infer IR; isUndefined: infer R; isPrimitive: infer S }
				? S extends true
					? P
					: IsEmptyObject<L> extends true
					? never
					: L extends object
					? EmptyKeyof<L>
					: P
				: T[P] extends object
				? EmptyKeyof<T[P]>
				: IsEmptyObject<T[P]> extends true
				? never
				: P;
	  }[keyof T]
	: T;

export type DeepRequired<T> = T extends object ? { [P in keyof T]-?: DeepRequired<T[P]> } : T;

export type DeepOmitEmptyObject<T> = ConditionalExcept<T, EmptyKeyof<T>>;
