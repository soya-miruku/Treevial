import { DateLike } from "./base";
import {
	CustomInit,
	IFieldOptions,
	ObjCollection,
	SchemaDefinition,
	VialArray,
	VialAs,
	VialBoolean,
	VialDate,
	VialEnum,
	VialItems,
	VialNumber,
	VialObject,
	VialString,
	VialType,
	VialAny,
} from "./vial";

type PermissionOption = "NONE" | "ALL";
type SelPermOptions = PermissionOption | string;
type PermArea = "select" | "create" | "update" | "delete";
//allow for "select,create,update,delete" or "select,create" or "select" or "NONE" or "ALL"

export interface SurrealOptions<T, I extends string> extends IFieldOptions {
	permissions?: PermissionOption | { select?: SelPermOptions; create?: SelPermOptions; update?: SelPermOptions; delete?: SelPermOptions };
	index?: I;
	default?: () => T;
}

export type RecordLink<T> = T;

export function recordLink<T extends VialItems<any>>(obj: RecordLink<T>): VialObject<{ required: false }, RecordLink<T>> {
	const refObj = VialObject.create(obj, { required: false });
	return refObj;
}

export const SURREAL_ID = "SURREAL_ID";

export class SurrealId<O extends { required: false }> extends VialType<O, typeof SURREAL_ID> {
	computedType: string;
	constructor(options?: O) {
		super(options);
		this.computedType = "SURREAL_ID";
		this.type = SURREAL_ID;
	}

	static create(): SurrealId<{ required: false }> {
		return new SurrealId();
	}
}

export type Relation<VEdge extends VialObject<any, any>, VNode extends VialAny, Name extends string, inverse extends boolean> = {
	edge: VEdge;
	out: VNode;
	name: Name;
	inverse: inverse;
};

export type RelationType<VEdge, VNode, Name extends string, Inverse extends boolean> = VialObject<{ required: false; name: Name; inverse: Inverse }, { edge: VEdge; out: VNode }>;

export function relation<VEdge extends VialObject<any, any>, VNode extends VialAny, Name extends string, Inverse extends boolean, Options extends SurrealOptions<any, any>>(
	obj: Relation<VEdge, VNode, Name, Inverse>,
	options?: Options,
): VialArray<Options, RelationType<VEdge, VNode, Name, Inverse>> {
	const res = VialArray.create(VialObject.create({ edge: obj.edge, out: obj.out }, { required: false, name: obj.name, inverse: obj.inverse }), options);
	return res;
}

const SurrealOnlyTypes = {
	relation: relation,
	record: recordLink,
	id: SurrealId.create,
};

export const surrealFields = CustomInit(() => ({
	...SurrealOnlyTypes,
	string: <O extends SurrealOptions<string, I>, I extends string>(options?: O) => VialString.create(options),
	number: <O extends SurrealOptions<number, I>, I extends string>(options?: O) => VialNumber.create(options),
	bool: <O extends SurrealOptions<boolean, I>, I extends string>(options?: O) => VialBoolean.create(options),
	date: <O extends SurrealOptions<DateLike, I>, I extends string>(options?: O) => VialDate.create(options),
	array: <O extends SurrealOptions<T[], I>, I extends string, T extends VialItems<any>>(item: T, options?: O) => VialArray.create(item, options),
	object: <O extends SurrealOptions<T, I>, I extends string, T extends VialItems<any>>(item: T, options?: O) => VialObject.create(item, options),
	enums: <O extends SurrealOptions<T, I>, I extends string, T extends string>(item: T[], options?: O) => VialEnum.create(item, options),
	As:
		<T>() =>
		<S extends VialItems<any>, I extends string, O extends SurrealOptions<T, I> = { required: true }>(schema: S, options?: O) =>
			VialAs.create<T, S, O>(schema, options),
}));

export type SurrealTypes = typeof surrealFields;
export type Input<B extends ObjCollection<any>, T extends SurrealTypes> = (db: T) => B;
