import { IsEmptyObject } from "type-fest";
import { NonFunction, Primitives, TupleToUnion, DateLike, OfArray, UnionToArray } from "./base";
import { PartialOnUndefinedDeep } from "./custom.type.fest";
export type RecordString<Name extends string> = { [P in Name]: string };

export const DEFAULT_REQUIRED_STATE = false;
export type ReplaceSelfProperty<T, V> = {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	[P in keyof T]: T[P] extends VialSRef<any, any> ? V : T[P];
};

export type HandleType = "self" | "circular";
export type VialSRef<Type extends HandleType, Key> = { __handler: Type; __key: Key };
export type OrUndefined<Options extends IFieldOptions, T> = Options extends { required: true } ? T : T | undefined;

export type Ref<T> = { __ref: T };

export type BreakingTS<T, OG = NonNullable<T>, Expanded extends boolean = false, K = null> = T extends object
	? {
			[P in keyof T]: OfArray<T[P]> extends { type: infer U; isUndefined: infer IU }
				? U extends VialSRef<infer typeArr, infer key>
					? typeArr extends "circular"
						? HandleRecursive<OG, key, Expanded>[]
						: HandleRecursive<T, key, Expanded>[]
					: Expanded extends true
					? BreakingTS<U, OG, Expanded, K>[]
					: string[]
				: NonNullable<T[P]> extends VialSRef<infer type, infer key>
				? type extends "circular"
					? HandleRecursive<OG, key, Expanded>
					: HandleRecursive<T, key, Expanded>
				: NonNullable<T[P]> extends DateLike
				? T[P]
				: NonNullable<T[P]> extends object
				? Expanded extends true
					? BreakingTS<T[P], OG, Expanded, K>
					: string
				: T[P];
	  }
	: T;

export type HandleRecursive<T, Name, Expanded extends boolean = false, T3 = BreakingTS<T, T, Expanded, Name>> = T extends object
	? Name extends null
		? T3
		: Expanded extends true
		? T3
		: string
	: T;

export type Build<T extends SchemaDefinition<VialItems<VialAny>, string>> = T["schema"]["computedType"];
export type Output<
	T extends SchemaDefinition<any, any>,
	Expanded extends boolean = false,
	TB = Build<T>,
	TM = PartialOnUndefinedDeep<TB, { recurseIntoArrays: true }>,
	TR = HandleRecursive<TM, null, Expanded>,
> = TR;

export interface IFieldOptions {
	required?: boolean;
}

export type RequiredType<T> = {
	type: T;
};

export type OptionalType<T> = {
	type?: T | undefined;
};

export type Schema<T extends VialItems<any>, Name extends string> = VialObject<{ required: true }, T, null, null, Name>;
export type ItemsCollection<T> = T extends object ? { [P in keyof T]: VialAny } : never;
export type ObjCollection<T extends ItemsCollection<Record<string, VialAny>>> = { [P in keyof T]: VialItems<T[P]> };
export type MultiSchema<T extends ObjCollection<any>> = { [P in keyof T]: SchemaDefinition<T[P], P & string> };

export class SchemaDefinition<T extends VialItems<any>, Name extends string> {
	schema: Schema<T, Name>;

	basic: Output<this>;
	output: Output<this>;
	outputAll: Output<this, true>;

	computedRef: this["output"];
	computed: this["schema"]["computedType"];

	constructor(public definition: T, public name: Name) {
		this.name = name;
		this.basic = {} as Output<this>;
		this.output = {} as Output<this>;
		this.outputAll = {} as Output<this, true>;
		this.computedRef = {} as this["output"];
		this.computed = {} as this["schema"]["computedType"];
		this.schema = new VialObject({ required: true }, definition) as unknown as Schema<T, Name>;
	}
}

export type TypeOf<O, T> = O extends { required: true } ? RequiredType<T> : OptionalType<T>;

export type VialItems<T extends VialAny> = Record<string, T>;

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export type VialAny = VialType<any, any>;

export type OptionsParams<T, U> = {
	[P in keyof T]: P extends keyof U ? T[P] : never;
};

export class VialType<Options extends IFieldOptions, T> {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	args?: any;
	type: T;
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	computedType: any;
	options: Options;

	constructor(options?: Options) {
		this.type = "any" as T;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as Options);
	}
}

export class VialPrimitive<O extends IFieldOptions, T extends Primitives> extends VialType<O, T> {
	computedType: TypeOf<O, T>["type"];
	// brand!: `VialPrimitive_${T}`;

	constructor(options?: O) {
		super();
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = undefined as any;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}
}

export class VialSelf<O extends IFieldOptions, T> extends VialType<O, T> {
	computedType: T;
	constructor(options?: O) {
		super(options);
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = undefined as any;
	}
}

export class VialString<O extends IFieldOptions> extends VialPrimitive<O, string> {
	constructor(options?: O) {
		super(options);
		this.type = "string";
	}

	static create<O extends IFieldOptions>(options?: O): VialString<O> {
		return new VialString<O>(options);
	}
}

export class VialNumber<O extends IFieldOptions> extends VialPrimitive<O, number> {
	constructor(options?: O) {
		super(options);
		this.type = 0;
	}

	static create<O extends IFieldOptions>(options?: O): VialNumber<O> {
		return new VialNumber<O>(options);
	}
}

export class VialBoolean<O extends IFieldOptions> extends VialPrimitive<O, boolean> {
	constructor(options?: O) {
		super(options);
		this.type = true;
	}

	static create<O extends IFieldOptions>(options?: O): VialBoolean<O> {
		return new VialBoolean<O>(options);
	}
}

export class VialDate<O extends IFieldOptions> extends VialType<O, DateLike> {
	type: DateLike;
	computedType: TypeOf<O, DateLike>["type"];
	brand!: "VialDate";

	constructor(options?: O) {
		super();
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = undefined as any;
		this.type = new Date();
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}

	static create<O extends IFieldOptions>(options?: O): VialDate<O> {
		return new VialDate<O>(options);
	}
}

export class VialArray<O extends IFieldOptions, T, Parent = null> extends VialType<O, T[]> {
	type: T[];
	computedType: T extends Parent
		? VialSRef<"self", "Parent">
		: T extends () => VialObject<infer X, infer P>
		? VialObject<X, P, T>["computedType"][]
		: T extends () => infer X
		? X extends VialAny
			? OrUndefined<O, X["computedType"][]>
			: never
		: T extends VialObject<infer X, infer Obj>
		? OrUndefined<X, VialObject<X, Obj, Parent>["computedType"][]>
		: T extends VialAny
		? OrUndefined<O, T["computedType"][]>
		: T extends SchemaDefinition<infer SItems, infer SName> // i know i don't need to infer these...
		? T["computedRef"]
		: "NOT ACCOUNTED FOR ARR";
	brand!: "VialArray";

	constructor(type: T, options?: O) {
		super();
		this.type = [type];
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = undefined as any;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}

	static create<O extends IFieldOptions, T>(obj: T, options?: O): VialArray<O, T> {
		return new VialArray<O, T>(obj, options);
	}
}

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export class VialObject<O extends IFieldOptions, T extends VialItems<any>, Parent = null, TopestParent = null, Name extends string | null = null> extends VialType<O, T> {
	type: T;
	isEmpty: IsEmptyObject<T>;
	schema: SchemaDefinition<T, string>;

	computedType: TopestParent extends T
		? VialSRef<"circular", Name>
		: Parent extends T
		? VialSRef<"self", Name>
		: T extends SchemaDefinition<infer Obj, infer ObjName>
		? VialObject<O, Obj, Parent, TopestParent, ObjName>["computedType"]
		: T extends object
		? {
				[K in keyof T]: T[K] extends Parent
					? VialSRef<"circular", Name>
					: T[K] extends TopestParent
					? VialSRef<"self", Name>
					: T[K] extends T
					? VialSRef<"self", Name>
					: T[K] extends VialArray<infer ArrayOptions, VialObject<infer VOpts, () => infer X>>
					? X extends Parent
						? VialSRef<"circular", Name>
						: X extends TopestParent
						? VialSRef<"self", Name>
						: X extends T
						? VialSRef<"self", Name>
						: X extends SchemaDefinition<infer SItems, infer OName>
						? OrUndefined<ArrayOptions, VialObject<{ required: true }, X["schema"]["type"], T, TopestParent extends null ? T : TopestParent, OName>["computedType"][]>
						: X extends VialObject<infer O, infer Obj>
						? "NOT YET" //OrUndefined<ArrayOptions, VialObject<{ required: true }, Obj, T, TopestParent extends null ? T : TopestParent>["computedType"][]>
						: "OBJ ARR NOT ACCOUNTED FOR"
					: T[K] extends VialObject<infer FuncOptions, () => infer X>
					? X extends T
						? VialSRef<"self", Name>
						: X extends VialObject<infer ObjectOptions, infer OBJ>
						? "NOT YET" //OrUndefined<FuncOptions, VialObject<ObjectOptions, OBJ, T, TopestParent extends null ? T : TopestParent>["computedType"]>
						: X extends SchemaDefinition<infer Obj, infer OName>
						? OrUndefined<FuncOptions, VialObject<{ required: true }, Obj, T, TopestParent extends null ? T : TopestParent, OName>["computedType"]>
						: "NOT ACCOUNTED FOR"
					: T[K] extends VialObject<infer InnerOptions, infer OBJ>
					? OrUndefined<InnerOptions, VialObject<InnerOptions, OBJ, Parent>["computedType"]>
					: T[K] extends () => infer X
					? X extends T
						? VialSRef<"self", Name>
						: X extends SchemaDefinition<infer Obj, infer OName>
						? OrUndefined<{ required: true }, VialObject<{ required: true }, Obj, T, TopestParent extends null ? T : TopestParent, OName>["computedType"]>
						: "OBJECT NOT ACCOUNTED FOR"
					: T[K] extends VialAny
					? T[K]["computedType"]
					: T[K];
		  }
		: never;

	brand!: "VialObject";

	constructor(obj: T, options?: O) {
		super();
		this.type = obj;
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = obj as any;
		this.isEmpty = isEmptyObject(obj);
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.schema = undefined as any;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}

	static create<O extends IFieldOptions, T extends VialItems<VialAny>>(obj: T, options?: O): VialObject<O, T> {
		return new VialObject(obj, options);
	}
}

export class VialScalarLiteral<O extends IFieldOptions, T extends Primitives> extends VialPrimitive<O, T> {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	args?: any;
	options: O;
	type: T;
	computedType: TypeOf<O, T>["type"];

	constructor(type: T, options?: O) {
		super(options);
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
		this.computedType = type;
		this.type = type;
	}

	static create<O extends IFieldOptions, T extends Primitives>(type: T, options?: O): VialScalarLiteral<O, T> {
		return new VialScalarLiteral<O, T>(type, options);
	}
}

export type PickType<T, K extends keyof T> = T[K];

export class VialAs<T, S extends VialItems<VialAny>, O extends IFieldOptions> extends VialType<O, T> {
	computedType: TypeOf<O, T>["type"];
	brand!: "VialAs";
	schema: S;

	constructor(schema: S, options?: O) {
		super();
		this.computedType = schema as any;
		this.schema = schema;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}

	static create<T, S extends VialItems<VialAny>, O extends IFieldOptions>(schema: S, options?: O): VialAs<T, S, O> {
		return new VialAs<T, S, O>(schema, options);
	}
}

export class VialEnum<O extends IFieldOptions, T> extends VialType<O, T> {
	computedType: TypeOf<O, T>["type"];
	asArray: UnionToArray<T>;
	brand!: "VialEnum";

	constructor(type: T, options?: O) {
		super();
		this.type = type;
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.computedType = type as any;
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.asArray = Object.values(type as any) as UnionToArray<T>;
		this.options = options || ({ required: DEFAULT_REQUIRED_STATE } as O);
	}

	static create<O extends IFieldOptions, T extends string, X extends T[]>(obj: X, options?: O): VialEnum<O, TupleToUnion<X>> {
		const objToUnion = obj as TupleToUnion<X>;
		return new VialEnum(objToUnion, options);
	}
}

export function CustomInit<T extends { [k: string]: JazoReturn }>(x: () => { [K in keyof T]: T[K] }) {
	return x();
}

export function CustomInitializer<OptionExtra extends IFieldOptions, TX>(AdditionalTypes: TX) {
	return {
		...AdditionalTypes,
		String: <O extends OptionExtra>(options?: O): VialString<O> => {
			return VialString.create(options);
		},
		Number: <O extends OptionExtra>(options?: O): VialNumber<O> => {
			return VialNumber.create(options);
		},
		Boolean: <O extends OptionExtra>(options?: O): VialBoolean<O> => {
			return VialBoolean.create(options);
		},
		Date: <O extends OptionExtra>(options?: O): VialDate<O> => {
			return VialDate.create(options);
		},
		Array: <O extends OptionExtra, T>(obj: T, options?: O): VialArray<O, T> => {
			return VialArray.create(obj, options);
		},
		Object: <O extends OptionExtra, T extends VialItems<VialAny>>(obj: T, options?: O): VialObject<O, T> => {
			return VialObject.create(obj, options);
		},
		Enums: <O extends OptionExtra, T extends string, X extends T[]>(obj: X, options?: O): VialEnum<O, TupleToUnion<X>> => {
			return VialEnum.create(obj, options);
		},
		As: <T, S extends VialItems<VialAny>, O extends OptionExtra>(schema: S, options?: O): VialAs<T, S, O> => {
			return VialAs.create(schema, options);
		},
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		Self: <O extends OptionExtra>(options?: O): NonFunction<O, VialSelf<any, VialSRef<any, any>>> => {
			// rome-ignore lint/suspicious/noExplicitAny: <explanation>
			return options as any;
		},
		Literal: <O extends OptionExtra, T extends Primitives>(type: T, options?: O): VialScalarLiteral<O, T> => {
			return VialScalarLiteral.create(type, options);
		},
	};
}

export const defaultJazoTypes = {
	String: VialString.create,
	Number: VialNumber.create,
	Boolean: VialBoolean.create,
	Date: VialDate.create,
	Array: VialArray.create,
	Object: VialObject.create,
	Enums: VialEnum.create,
	As: VialAs.create,
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	Self: <O>(options: O): NonFunction<O, VialSelf<any, VialSRef<any, any>>> => {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		return options as any;
	},
	Literal: VialScalarLiteral.create,
};

export type JazoTypes = typeof defaultJazoTypes;

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export type JazoReturn =
	| (<O extends IFieldOptions>(options?: O) => VialType<O, any>)
	| (<O extends IFieldOptions, T>(type: T, options?: O) => VialType<O, T>)
	| ((...args: any[]) => VialAny)
	| (<T>() => JazoReturn);

function isEmptyObject<T extends VialItems<VialAny>>(obj: T): IsEmptyObject<T> {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	return (Object.keys(obj).length === 0) as any;
}

export type jazoInfer<T extends SchemaDefinition<VialItems<VialAny>, string>> = Pick<T["output"], keyof T["output"]>;
export type jazoInferBasic<T extends SchemaDefinition<VialItems<VialAny>, string>> = Pick<T["computed"], keyof T["computed"]>;
export type jazoInferUndefined<T> = PartialOnUndefinedDeep<T>;
export type jazoInferNormal<T extends SchemaDefinition<VialItems<VialAny>, string>> = jazoInferUndefined<jazoInferBasic<T>>;
export type jazoInferFull<T extends SchemaDefinition<VialItems<VialAny>, string>> = T["outputAll"];
