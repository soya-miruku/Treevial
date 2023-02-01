import { DateLike, OfArray, ToString, UnionToArrayString } from "./base";
import { Input, surrealFields, SurrealOptions, SurrealTypes, SURREAL_ID, RelationType } from "./jazo.extend";
import { jazoInfer, jazoInferFull, jazoInferNormal, MultiSchema, ObjCollection, SchemaDefinition, VialAny, VialEnum, VialItems, VialObject, VialType, IFieldOptions } from "./vial";

export type SurrealTypeMap = {
	string: "string";
	number: "number";
	bool: "bool";
	date: "datetime";
	array: "array";
	object: "object";
	enum: "enum";
	relation: "relation";
	record: "record";
};

export type IsRecord<Type> = Type extends () => SchemaDefinition<any, any>
	? true
	: Type extends VialObject<any, () => SchemaDefinition<any, any>> | VialObject<any, () => SchemaDefinition<any, any>>[]
	? true
	: false;

export type GetRecord<Type> = IsRecord<Type> extends true
	? Type extends () => infer U
		? U
		: Type extends VialObject<any, () => infer U> | VialObject<any, () => infer U>[]
		? U
		: never
	: Type;

export type DefinedCollection<B extends MultiSchema<any>> = { [P in keyof B]: SurrealTable<B[P], P & string> };

export type ObjectList<T> = { [P in keyof T]: VialObject<any, any> };

export type SearchSchema<T extends SurrealTable<any, any>, S extends DefinedCollection<any>> = S extends object
	? S[{
			[P in keyof S]: S[P] extends T ? P : never;
	  }[keyof S]]
	: never;
export type SearchSchemaKey<T extends SurrealTable<any, any>, S extends DefinedCollection<any>> = S extends object
	? {
			[P in keyof S]: S[P] extends T ? P : never;
	  }[keyof S]
	: never;

export class Treevial<S extends MultiSchema<any>> {
	defined: DefinedCollection<S>;

	constructor(public defs: S) {
		this.defs = defs;

		this.defined = Object.keys(defs).reduce((acc, key) => {
			if (!defs[key]) return acc;
			(acc[key] as any) = new SurrealTable(defs[key] as SchemaDefinition<any, any>);
			return acc;
		}, {} as DefinedCollection<S>);
	}

	initialize() {
		Object.keys(this.defined).forEach((key) => {
			console.log("Initializing: ", key);
			if (!this.defined?.[key]) return;
			this.defined[key]?.initializeFields();
		});
	}

	static MultiDef<B extends ObjCollection<any>>(pipe: Input<B, SurrealTypes>): Treevial<MultiSchema<B>> {
		const results = pipe(surrealFields);
		const schemas = Object.keys(results).reduce((acc, key) => {
			if (!results[key]) return acc;
			(acc[key] as any) = new SchemaDefinition(results[key] as VialItems<any>, key);
			return acc;
		}, {} as MultiSchema<B>);

		return new Treevial(schemas);
	}

	static Define<T extends VialItems<any>, Name extends string>(obj: T, name: Name): SurrealTable<SchemaDefinition<T, Name>, Name> {
		return new SurrealTable(new SchemaDefinition(obj, name));
	}
}

export type ToSurrealType<T, IsUnionType extends boolean> = IsUnionType extends true
	? `string ASSERT $value INSIDE ${ToString<T>}`
	: T extends any[]
	? "array"
	: T extends DateLike
	? "datetime"
	: IsRecord<T> extends true
	? GetRecord<T> extends SchemaDefinition<any, infer Name>
		? `record(${Name})`
		: never
	: T extends object
	? "object"
	: T extends typeof SURREAL_ID
	? "string"
	: T extends string
	? "string"
	: T extends number
	? "number"
	: T extends boolean
	? "bool"
	: never;

export type BasicRelationType = { from: string; to: string; edge: any; tName: string; inverse: boolean };
export type FieldItem<T> = {
	field: T;
	index: string | false;
	isRequired: boolean;
	query: string;
	isRecord: boolean;
	relation: BasicRelationType | false;
	isArray: boolean;
	isObject: boolean;
	isDate: boolean;
	fieldName: string;
	recordName: string;
};

export type Fields<T, TableName extends string, FieldKey = null, ParentIsArray = false> = T extends VialType<infer Options, infer Type>
	? {
			field: Type extends DateLike
				? Type
				: OfArray<Type> extends { type: infer L }
				? L extends VialAny
					? L extends RelationType<infer E, infer N, infer RelName, infer Inverse>
						? RelName //Fields<E, RelName, "", true>
						: Fields<L, TableName, FieldKey, false>[]
					: never
				: GetRecord<Type> extends infer Result
				? Result extends SchemaDefinition<infer SX, infer Name>
					? `record(${Name})` //Fields<SX, Name>
					: Type extends VialAny
					? Type["computedType"]
					: Type extends object
					? {
							[P in keyof Type]: Fields<Type[P], TableName, `${ToString<FieldKey>}${ParentIsArray extends true ? ".*" : ""}.${ToString<P>}`, Type[P] extends any[] ? true : false>;
					  }
					: Type
				: Type;
			index: Options extends { index: infer val } ? val : false;
			isRecord: IsRecord<Type> extends true ? true : false;
			isRelation: Type extends RelationType<infer E, infer N, infer TName, infer I>[] ? true : false;
			relation: Type extends RelationType<infer E, infer N, infer TName, infer I>[]
				? { from: TableName; to: GetRecord<N> extends SchemaDefinition<any, infer Name> ? Name : never; edge: E; tName: TName; inverse: I }
				: false;
			isArray: Type extends RelationType<any, any, any, any>[] ? false : Type extends any[] ? true : false;
			isObject: Type extends object ? (Type extends any[] ? false : Type extends DateLike ? false : true) : false;
			isDate: Type extends DateLike ? true : false;
			fieldName: ToString<FieldKey>;
			recordName: IsRecord<Type> extends true ? (GetRecord<Type> extends SchemaDefinition<any, infer Name> ? Name : never) : TableName;
			isRequired: Options["required"] extends true ? true : false;
			query: string;
			// query: `DEFINE FIELD ${ParentIsArray extends true ? `${ToString<FieldKey>}.*` : ToString<FieldKey>} ON ${TableName} TYPE ${ToSurrealType<
			//   T extends VialEnum<any, any> ? UnionToArrayString<Type> : Type,
			//   T extends VialEnum<any, any> ? true : false
			// >};${Options["required"] extends true ? ` ASSERT $value != None;` : ""}${Options extends { index: infer val }
			//   ? `DEFINE INDEX ${ToString<val>} ON ${TableName} COLUMNS ${ToString<FieldKey>} UNIQUE;`
			//   : ""}`;
	  }
	: T extends object
	? {
			[P in keyof T]: Fields<T[P], TableName, P>;
	  }
	: never;

export class SurrealTable<T extends SchemaDefinition<any, string>, Name extends string> {
	fields: Fields<T["definition"], Name>;
	query: string;
	name: Name;
	constructor(public readonly def: T) {
		this.fields = {} as Fields<T["definition"], Name>;
		this.query = "";
		this.name = def.name as Name;
	}

	#isRecord(item: VialType<any, any>): boolean {
		return item instanceof VialObject && typeof item.type === "function";
	}

	#getRecord(item: VialType<any, any>): SchemaDefinition<any, any> | null {
		if (!this.#isRecord(item)) return null;
		return item.type();
	}

	#getRecordName(item: VialType<any, any>): string | null {
		if (!this.#isRecord(item)) return null;
		const record = this.#getRecord(item);
		if (!record) return null;
		return record.name;
	}

	#isRelation(item: VialType<any, any>): boolean {
		const keys = Object.keys(item);
		return keys.includes("edge") && keys.includes("out");
	}

	#toSurrealType<T, IS extends boolean>(item: T, isUnionType: IS) {
		if (isUnionType) return `string ASSERT $value INSIDE [${(item as any[]).map((i: any) => `"${i}"`).join(",")}]`;
		if (typeof item === "string") return "string";
		if (typeof item === "number") return "number";
		if (typeof item === "boolean") return "bool";
		if (item instanceof Date) return "datetime";
		if (Array.isArray(item)) return "array";
		if (typeof item === "object") {
			return "object";
		}
		return "any";
	}

	#mapFields<T extends object>(name: string, fields: T, fieldKey?: string, parentIsArray?: boolean, parent?: any): Fields<T, Name, typeof fieldKey, typeof parentIsArray> {
		let result: Record<string, Fields<any, Name, string, typeof parentIsArray>> = {};
		let tableName = name;
		if (fields instanceof VialType && fieldKey) {
			const options = fields.options;
			const type = fields.type;
			let isRecord = false;
			let relationRes: FieldItem<any>["relation"] = false;

			let field;

			if (fields instanceof VialEnum) {
				field = `enum(${fields.type})`;
			} else if (Array.isArray(type)) {
				const firstElem = type[0];
				if (this.#isRelation(firstElem.type)) {
					const options = firstElem.options;
					const from = tableName;
					const to = this.#getRecordName(firstElem.type.out);
					if (!to) throw new Error("Relation to record not found");
					const inverse = options.inverse;
					const tName = options.name;
					const edge = firstElem.type?.edge;
					field = this.#mapFields(tName, edge.type, "", false, null);
					relationRes = { from, to, edge: firstElem.type.edge, tName, inverse };
					// field = `${from}${inverse ? "<-" : "->"}${tName}${inverse ? "<-" : "->"}${to}`
				} else {
					field = Array(this.#mapFields(name || this.name, firstElem, fieldKey, true, fields));
				}
			} else {
				const name = this.#getRecordName(fields);
				if (name) {
					isRecord = true;
					field = `record(${name})`;
				} else if (typeof type === "object") {
					for (const innerKey in type) {
						type[innerKey] = this.#mapFields(name || this.name, type[innerKey], `${fieldKey}${parentIsArray ? "[*]" : ""}.${innerKey}`, parentIsArray, fields);
					}
					field = type;
				} else {
					field = this.#toSurrealType(type, options?.unionType);
				}
			}

			const defaultQ = options.default ? `VALUE ${ensureRegularFn(options.default.toString())}` : "";
			const selectPermions = options.permissions?.select ? `FOR SELECT ${options.permissions.select}` : "";
			const createPermions = options.permissions?.create ? `FOR CREATE ${options.permissions.create}` : "";
			const updatePermions = options.permissions?.update ? `FOR UPDATE ${options.permissions.update}` : "";
			const deletePermions = options.permissions?.delete ? `FOR DELETE ${options.permissions.delete}` : "";
			const permissions = options?.permissions ? `PERMISSIONS ${[selectPermions, createPermions, updatePermions, deletePermions].filter((i) => i).join(",")}` : "";
			const required = (parent?.options ? parent.options?.required && options.required : options.required) ? "ASSERT $value != None" : "";
			const index = options.index ? `DEFINE INDEX ${options.index} ON ${tableName} COLUMNS ${parentIsArray ? `${fieldKey}[*]` : `${fieldKey}`} UNIQUE;` : "";

			const fieldSection = parentIsArray ? `${fieldKey}[*]` : `${fieldKey}`;

			const isArray = Array.isArray(type) && !(fields instanceof VialEnum);
			const isDate = type instanceof Date;
			const isObject = typeof type === "object" && !isArray && !isDate;
			const fieldName = parentIsArray ? `${fieldKey}[*]` : `${fieldKey}`;
			const recordName = isRecord ? this.#getRecordName(fields) : tableName;

			const typeSection = isRecord ? field : this.#toSurrealType(type, fields instanceof VialEnum);
			const opts = [permissions, required, defaultQ].filter((i) => i).join(" ");
			const finalQuery = relationRes ? `DEFINE TABLE ${relationRes.tName} SCHEMALESS;` : `DEFINE FIELD ${fieldSection} ON ${tableName} TYPE ${typeSection} ${opts}; ${index}`;

			return {
				field,
				index: options.index,
				isRequired: options.required,
				isRecord: isRecord,
				isRelation: !!relationRes,
				relation: relationRes,
				isArray: isArray,
				isDate: isDate,
				isObject: isObject,
				fieldName: fieldName,
				recordName: recordName,
				query: finalQuery,
			} as Fields<typeof fields, Name, typeof fieldKey, typeof parentIsArray>;
		} else {
			for (const key in fields) {
				const item = fields[key];
				const itemRes = this.#mapFields(name || this.name, Array.isArray(item) ? item[0] : item, key, Array.isArray(item), fields);
				result[key] = itemRes;
			}
		}

		return result as any;
	}

	#fieldQueries(obj: any) {
		const queries: string[] = [];

		for (const key in obj) {
			if (key === "id") continue;
			const item = obj[key];
			if (typeof item === "object" && !item?.query) {
				const q = this.#fieldQueries(item);
				queries.push(...q);
				continue;
			}
			if (!item?.field) continue;
			if (Array.isArray(item.field)) {
				const q = this.#fieldQueries(item.field[0]);
				if (!item.query) {
					queries.push(item.field[0].query, ...q);
					continue;
				}
				queries.push(item.query, item.field[0].query, ...q);
			} else if (typeof item.field === "object") {
				const q = this.#fieldQueries(item.field);
				if (!item.query) {
					queries.push(...q);
					continue;
				}
				queries.push(item.query, ...q);
			} else {
				if (!item.query) continue;
				queries.push(item.query);
			}
		}

		return queries as any;
	}

	#initializeQueries(obj: any): string {
		const queries = this.#fieldQueries(obj);
		const query = `DEFINE TABLE ${this.name} SCHEMALESS; ${queries.join(" ")}`;
		return query;
	}

	initializeFields() {
		this.fields = this.#mapFields(this.name, this.def.definition) as any;
		this.query = this.#initializeQueries(this.fields);
	}
}

function ensureRegularFn(code: any) {
	if (code.includes("native code")) {
		throw new Error("Cannot parse native code");
	}

	const match = code.match(/^\(([^)]*)\)\s*=>\s*(.+)$/);
	if (!match) {
		return code;
	}

	const [, params, body] = match;
	return `function(${params}) { return ${body}; }`;
}

export type inferBasic<T extends SurrealTable<SchemaDefinition<any, any>, any>> = jazoInferNormal<T["def"]>;
export type inferFull<T extends SurrealTable<SchemaDefinition<any, any>, any>> = jazoInferFull<T["def"]>;
export type inferSurreal<T extends SurrealTable<SchemaDefinition<any, any>, any>> = jazoInfer<T["def"]>;
