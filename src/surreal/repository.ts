import { ConnectedSurrealAdapter } from "./adapter";
import { DefinedCollection, SurrealTable } from "./types";
import { createId } from "@paralleldrive/cuid2";
import { SurrealResponse } from "./types/responses";
import { isPrimitive } from "./base/builder/utils/helpers";
import { QueryOfTheBuild, Selector } from "../surreal/base/builder/select";
import { SelectOptions, Selection, SelectionResult, CreateOptions, CreateOutput, ReturnQueryType } from "./types/repository.types";
import { WhereFilter, WhereSelector } from "./base/builder/where";
import { OfArray, OmitObj, DateLike } from "./types/base";
import { MultiSchema, SchemaDefinition, VialAny, VialItems } from "./types/vial";
import { Fields, inferFull } from "./types/tables";
import { SimplifyObject } from "./base/builder/select";

type AnyTable = SurrealTable<any, string>;

export type ExcludeRelationOnFields<T extends Fields<any, any>> = {
	[K in keyof T as T[K] extends { relation: false } ? K : never]: T[K];
};

export type OnlyRelationOnFields<T extends Fields<any, any>> = {
	[K in keyof T as T[K] extends { relation: false } ? never : K]: T[K];
};

export type SubTableWithoutRelation<T extends AnyTable, K = keyof OnlyRelationOnFields<T["fields"]>> = T extends SurrealTable<infer U, infer V>
	? U extends SchemaDefinition<infer Items, any>
		? SurrealTable<SchemaDefinition<OmitObj<Items, K & string>, any>, V>
		: never
	: never;

export type SubTableRelation<T extends AnyTable, K = keyof ExcludeRelationOnFields<T["fields"]>> = T extends SurrealTable<infer U, infer V>
	? U extends SchemaDefinition<infer Items, any>
		? SurrealTable<SchemaDefinition<OmitObj<Items, K & string>, any>, V>
		: never
	: never;

type UpdateInput<T> = {
	$set?: T;
	$add?: OnlyArrayItems<T>;
	$remove?: OnlyArrayItems<T>;
	$replace?: T;
};

// type RawOutput<T, Q extends string, R> = T extends unknown ? R : T; //(Includes<Split<Q, " ">, "SELECT"> extends true ? R[] : R) : T;

export class Update<T, Schema extends SurrealTable<any, any>> {
	constructor(private readonly schema: Schema) {}

	Where(where: WhereSelector<T>): UpdateWhere<T, Schema> {
		return new UpdateWhere<T, Schema>(where, this.schema);
	}
}

export type OnlyArrayItems<T> = T extends object
	? {
			[P in keyof T as OfArray<T[P]> extends { type: infer U } ? P : never]: T[P];
	  }
	: never;

type ExtractDataResponse = {
	recordName: string;
	recordItems: any;
	keyRef: string;
	variableName: string;
	query: string;
};

type BasicRelationResult<T> = T extends DateLike
	? T
	: T extends object
	? {
			[P in keyof T]: NonNullable<T[P]> extends { edge?: infer E; out?: infer Out }[] ? BasicRelationResult<Out>[] : BasicRelationResult<T[P]>;
	  }
	: T;

type RelationTableName<S extends AnyTable> = keyof {
	[K in keyof SubTableRelation<S>["fields"] as SubTableRelation<S>["fields"][K] extends { field: infer U } ? U & string : never]: SubTableRelation<S>["fields"][K];
};
export class SurrealRepository<
	A extends ConnectedSurrealAdapter<DefinedCollection<MultiSchema<any>>>,
	S extends SurrealTable<SchemaDefinition<VialItems<VialAny>, string>, string>,
	WRel = inferFull<SubTableRelation<S>>,
	WithoutRel = inferFull<SubTableWithoutRelation<S>>,
	SFields = S["fields"],
	X = S["def"]["outputAll"],
	M = BasicRelationResult<X>,
> {
	//todo add subtable for relations
	// Relations: SurrealRepository<ConnectedSurrealAdapter<SimplifyObject<A['schemas'] & {[K in RelationTableName<S>]: SubTableRelation<S>}>>, >

	constructor(protected readonly adapter: A, protected readonly schema: S) {}

	#handleResponse<R extends SurrealResponse<T>[], T>(resp: R): T | [] {
		if (resp.length === 0) return [];
		if (resp.some((s) => s.status !== "OK")) {
			throw new Error("AN ERROR HAS OCCURED!!\n" + JSON.stringify(resp));
		}

		return resp[resp.length - 1]?.result || [];
	}

	#makeCreateQuery(columns: string[], rows: unknown, variableName: string, tableName: string, setVariable = true) {
		const header = columns.join(", ");
		if (header.length === 0) return "";
		let vals: unknown;
		if (Array.isArray(rows)) {
			// allow for multiple values to be inserted
			const values = rows.map((row) => {
				const rowValues = Object.values(row);
				return rowValues.map((item) => {
					if (!item) return "null";
					const json = JSON.stringify(item);
					// remove double quotes around $variables
					const parsed = json.replace(/"(\$[a-zA-Z0-9_]+)"/g, "$1");
					return parsed;
				});
			});

			if (!setVariable) return `INSERT INTO ${tableName} (${header}) VALUES (${values.join("), (")})`;
			return `LET ${variableName} = (INSERT INTO ${tableName} (${header}) VALUES (${values.join("), (")}))`;
		} else if (typeof rows === "object") {
			const values = Object.values(rows);
			vals = values.map((item) => {
				const json = JSON.stringify(item);
				// remove double quotes around $variables
				const parsed = json.replace(/"(\$[a-zA-Z0-9_]+)"/g, "$1");
				return parsed;
			});

			if (!setVariable) return `INSERT INTO ${tableName} (${header}) VALUES (${vals})`;
			return `LET ${variableName} = (INSERT INTO ${tableName} (${header}) VALUES (${vals}))`;
		} else {
			throw new Error("Invalid rows type");
		}
	}

	#extractData<Data extends Record<string, any>>(data: Data, fields: any, array: ExtractDataResponse[] = []): Record<string, any> {
		if (isPrimitive(data)) return data;

		if (Array.isArray(data)) {
			return data.map((item) => this.#extractData(item, fields, array));
		}

		const dataKeys = Object.keys(data);
		const item: Record<string, any> = {};

		for (const key of dataKeys) {
			if (!fields[key]) continue;
			const field = fields[key];
			if (field.isRecord) {
				const recordFields = field.recordName !== this.schema.name ? this.adapter.FromByName(field.recordName).schema.fields : this.schema.fields;
				const record = this.#extractData(data[key], recordFields, array);
				const variableName = `$${field.recordName}_${createId()}`;
				array.push({
					recordName: field.recordName,
					recordItems: record,
					keyRef: key,
					variableName,
					query: this.#makeCreateQuery(Object.keys(record), record, variableName, field.recordName),
				});
				item[key] = variableName;
			} else if (field.isArray) {
				item[key] = [];
				let variableName: string | null = null;
				const recordsItems: any[] = [];

				for (const arr of data[key]) {
					const arrField = field.field[0];
					if (arrField.isRecord) {
						const recordFields = arrField.recordName !== this.schema.name ? this.adapter.FromByName(arrField.recordName).schema.fields : this.schema.fields;
						const record = this.#extractData(arr, recordFields, array);
						variableName = variableName ? variableName : `$${arrField.recordName}_${createId()}`;
						if (record === null) continue;
						recordsItems.push({
							recordName: arrField.recordName,
							recordItems: record,
							keyRef: key,
							variableName,
						});
						if (item[key]?.includes(variableName)) continue;
						item[key] = data[key]?.length > 1 ? variableName : [variableName];
						continue;
					}
					const arrItem = this.#extractData(arr, arrField.field, array);
					if (item[key]) {
						item[key]?.push(arrItem);
					} else {
						item[key] = [arrItem];
					}
				}
				if (recordsItems.length > 0 && variableName) {
					const recordName = recordsItems[0].recordName;
					const items = recordsItems.map((x) => x.recordItems);
					const { columns, values } = this.#buildColumnAndValuesForArray(items);
					array.push({
						recordName,
						recordItems: items,
						keyRef: key,
						variableName,
						query: this.#makeCreateQuery(columns, values, variableName, recordName),
					});
				}
			} else if (field.isObject) {
				const obj = this.#extractData(data[key], field.field, array);
				item[key] = obj;
			} else {
				item[key] = data[key];
			}
		}
		return item;
	}

	#buildColumnAndValues(data: object) {
		const columns = Object.keys(data);
		return { columns, values: data };
	}

	#buildColumnAndValuesForArray(data: object[]) {
		const totalKeys = [...new Set(data.flatMap((x) => Object.keys(x)))];
		const mapped = data.map((x) => {
			const obj: Record<string, any> = {};
			for (const key of totalKeys) {
				obj[key] = x[key];
			}
			return obj;
		});
		const columns = Object.keys(mapped[0]);
		const values = mapped.map((x) => Object.values(x));
		return { columns, values };
	}

	#createQuery<Data extends object>(data: Data) {
		const items: ExtractDataResponse[] = [];
		const result = this.#extractData(data, this.schema.fields, items);

		const ids = items.map((x) => ({
			v: x.variableName,
			a: x.recordItems.length > 1,
			key: x.keyRef,
		}));
		const q = items
			.map((x) => x.query)
			.filter((x) => x)
			.join(";");

		const { columns, values } = Array.isArray(result) ? this.#buildColumnAndValuesForArray(result) : this.#buildColumnAndValues(result);
		const mainQ = this.#makeCreateQuery(columns, values, "", this.schema.name, false);

		const query = [q, mainQ].filter((x) => x).join(";");
		return { query, ids };
	}

	#parseUpdate<Item>(data: UpdateInput<Item>) {
		const { $add, $remove, $set, $replace } = data;
		if ($set) {
			const records: {
				recordName: string;
				recordItems: any;
				keyRef: string;
				variableName: string;
				query: string;
			}[] = [];
			const test = this.#extractData($set, this.schema.fields, records);

			console.log(test, records);
			process.exit(0);
		}
		//todo if inner item is record, then will need to update that record first, chain commands, similar to create
	}

	async Find(id: string): Promise<S["def"]["output"]> {
		const result = this.$raw(`SELECT * FROM ${this.schema.name} WHERE id = '${id}' LIMIT 1`);
		return result;
	}

	async FindOne(where: WhereSelector<M>): Promise<M | undefined> {
		const whereQuery = new WhereFilter(where as object, { currentSchema: this.schema.name, fieldSearcher: this.adapter.fieldSearcher }).parse();
		const query = `SELECT * FROM ${this.schema.name} ${whereQuery} LIMIT 1`;
		const result = await this.$raw<S, typeof query, M[]>(query);
		return result[0];
	}

	async FindMany<Data extends QueryOfTheBuild<M, Limit, Start, AS>, AS extends string, Limit extends number, Start extends number, P extends boolean>(
		select?: Data,
		selectOptions?: SelectOptions<P>,
	): Promise<SelectionResult<Data, M, SFields>[]> {
		const parallelQ = selectOptions?.parallel ? "PARALLEL" : "";
		if (!select) {
			const selection = `SELECT * FROM ${this.schema.name}`;
			const query = [selection, parallelQ].filter((x) => x).join(" ");
			const response = await this.$raw<Selection<Data, M, SFields>[], typeof query>(query);
			return response as SelectionResult<Data, M, SFields>[];
		}
		const query = new Selector(select, this.adapter.fieldSearcher, this.schema.name).parse();
		console.log(query);
		const response = await this.$raw<SelectionResult<Data, M, SFields>[], typeof query>(query);
		return response as SelectionResult<Data, M, SFields>[];
	}

	async CreateMany<Data extends WithoutRel, Options extends CreateOptions<F, R>, R extends ReturnQueryType, F extends boolean>(
		data: Data[],
		fetch?: Options,
	): Promise<CreateOutput<SFields, Data, Options>[]> {
		const { query, ids } = this.#createQuery(data);
		const inputQ = fetch ? `${query} RETURN *, ${ids.map((rc) => `(SELECT * FROM ${rc.v} ${rc.a ? "" : "LIMIT 1"}) as ${rc.key}`)};` : `${query};`;

		const queryTransaction = `BEGIN TRANSACTION; ${inputQ} COMMIT TRANSACTION;`;
		const resp = await this.$raw<CreateOutput<SFields, Data, Options>[], string>(queryTransaction);
		return resp;
	}

	async Create<Data extends WithoutRel, Options extends CreateOptions<F, R>, R extends ReturnQueryType, F extends boolean>(
		data: Data,
		options?: CreateOptions<F, R>,
	): Promise<CreateOutput<SFields, Data, Options>> {
		const { query, ids } = this.#createQuery(data as object);
		const inputQ = options?.fetch && !options?.return ? `${query} RETURN *, ${ids.map((rc) => `(SELECT * FROM ${rc.v} ${rc.a ? "" : "LIMIT 1"}) as ${rc.key}`)};` : `${query};`;
		const queryTransaction = `BEGIN TRANSACTION; ${inputQ} COMMIT TRANSACTION;`;
		console.log(queryTransaction);
		const resp = await this.$raw<CreateOutput<SFields, Data, Options>[], string>(queryTransaction);
		return resp[0] as CreateOutput<SFields, Data, Options>;
	}

	// async Update<Data extends RecursiveOptional<M>>(where: WhereSelector<M>, data: UpdateInput<Data>): Promise<M> {
	// 	const parsed = this.#parseUpdate(data);
	// 	console.log(parsed);
	// }

	async Delete(id: string): Promise<void> {
		const query = `DELETE FROM ${this.schema.name} WHERE id = '${id}';`;
		const result = await this.$raw(query);
	}

	async DeleteMany(where: WhereSelector<M>): Promise<boolean> {
		const whereQuery = new WhereFilter(where as object, { currentSchema: this.schema.name, fieldSearcher: this.adapter.fieldSearcher }).parse();
		const query = `DELETE FROM ${this.schema.name} WHERE ${whereQuery};`;
		console.log(query);
		const result = await this.$raw<M[], typeof query>(query);
		return result ? true : false;
	}

	async Relate<R extends keyof WRel, F extends `${FromK<SFields, R> & string}:${string}`, T extends `${ToK<SFields, R> & string}:${string}`>(
		key: R,
		fromId: F,
		toId: T,
		content?: RelEdge<WRel[R]>,
	): Promise<SimplifyObject<{ [K in keyof RelEdge<WRel[R]>]: RelEdge<WRel[R]>[K] } & { id: string; in: string; out: string }>[]> {
		const rel = this.adapter.fieldSearcher.searchInSchema(this.schema.name, key as string);
		if (!rel) {
			throw new Error("relation not found");
		}

		if (!fromId) {
			throw new Error("fromId is required");
		}
		if (!toId) {
			throw new Error("toId is required");
		}

		if (!(rel as any)?.relation) {
			throw new Error("relation is required");
		}

		const inverse = (rel as any).relation.inverse;
		const tName = (rel as any).relation.tName;
		const direction = inverse ? "<-" : "->";
		const query = `RELATE ${fromId}${direction}${tName}${direction}${toId} ${content ? `CONTENT ${JSON.stringify(content)}` : ""};`;
		return await this.$raw(query);
	}

	async RelateMany<R extends keyof WRel, F extends `${FromK<SFields, R> & string}:${string}`[], T extends `${ToK<SFields, R> & string}:${string}`[]>(
		rel: R,
		from: F,
		to: T,
		content?: RelEdge<WRel[R]>,
	): Promise<SimplifyObject<{ [K in keyof RelEdge<WRel[R]>]: RelEdge<WRel[R]>[K] } & { id: string; in: string; out: string }>[]> {
		const relSchema = this.adapter.fieldSearcher.searchInSchema(this.schema.name, rel as string);
		if (!relSchema) {
			throw new Error("relation not found");
		}

		if (!from || from.length < 1) {
			throw new Error("from is required");
		}

		if (!to || to.length < 1) {
			throw new Error("to is required");
		}

		if (!(relSchema as any)?.relation) {
			throw new Error("relation is required");
		}

		const inverse = (relSchema as any).relation.inverse;
		const tName = (relSchema as any).relation.tName;
		const direction = inverse ? "<-" : "->";

		const query = `RELATE (SELECT * FROM [${from.join(",")}])${direction}${tName}${direction}(SELECT * FROM [${to.join(",")}]) ${
			content ? `CONTENT ${JSON.stringify(content)}` : ""
		}`;

		return await this.$raw(query);
	}

	async $raw<T, Q extends string, R = S["def"]["output"]>(query: Q): Promise<T> {
		const res = await this.adapter._client.query<SurrealResponse<T>[]>(query);
		const surrealResponse = this.#handleResponse(res) as T;
		if (!Array.isArray(surrealResponse)) {
			return [surrealResponse] as T;
		}

		return surrealResponse;
	}
}

export type FromK<T, Key extends keyof T> = T[Key] extends { relation: { from: infer FROM } } ? FROM : never;
export type ToK<T, Key extends keyof T> = T[Key] extends { relation: { to: infer TO } } ? TO : never;
export type RelEdge<T> = NonNullable<T> extends (infer U)[] ? (U extends { edge?: infer E; out?: any } ? E : U) : never;
export class UpdateWhere<T, Schema extends SurrealTable<any, any>> {
	constructor(private readonly where: WhereSelector<T>, private readonly schema: Schema) {}

	Set(data: Partial<T>): Promise<T> {}

	Add(data: Partial<OnlyArrayItems<T>>): Promise<T> {}

	Remove(data: Partial<OnlyArrayItems<T>>): Promise<T> {}

	Replace(data: Partial<T>): Promise<T> {}
}
