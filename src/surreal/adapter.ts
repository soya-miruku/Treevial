import Surreal from "surrealdb.js";
import { ISurrealDBSettings, IngoOptions } from "./base";
import { SurrealRepository } from "./repository";
import { DefinedCollection, FieldItem, inferBasic, inferSurreal } from "./types";
import { SurrealResponse, InfoResult, TableResult } from "./types/responses";

export class SurrealAdapter {
	private readonly _client: Surreal;
	constructor(protected readonly _options: IngoOptions<"surreal">, protected readonly _dbSettings: ISurrealDBSettings) {
		this._client = Surreal.Instance;
	}

	async Connect<R extends DefinedCollection<any>>(schemas: R): Promise<ConnectedSurrealAdapter<R>> {
		if (!this._options.auth) throw new Error("Surreal requires authentication");
		const url = `http://${this._options.auth.host}:${this._options.auth.port}/rpc`;
		await Surreal.Instance.connect(url);

		const connect = await this._client.signin({
			user: this._options.auth.username,
			pass: this._options.auth.password,
		});

		console.log(`SurrealDB connected: ${connect} on ${url}`);
		// if (!connect) throw new Error(`Failed to connect to SurrealDB on ${url}`);

		await this._client.use(this._options.auth.namespace, this._options.auth.database);

		return Promise.resolve(new ConnectedSurrealAdapter(schemas, this._options, this._dbSettings, this._client));
	}
}

type KeyOfSchema<T extends DefinedCollection<any>, M> = M extends object
	? {
			[K in keyof T]: inferBasic<T[K]> extends M ? K : inferSurreal<T[K]> extends M ? K : never;
	  }[keyof T]
	: never;

type FindSchemaFromType<T extends DefinedCollection<any>, M> = M extends object
	? M extends inferBasic<T[KeyOfSchema<T, M>]>
		? M
		: M extends inferSurreal<T[KeyOfSchema<T, M>]>
		? M
		: never
	: never;

type SyncOptions = {
	removeTablesIfNotInSchema?: boolean;
};

export type SurrealDetails<S> = {
	[K in keyof S]: {
		table: { query: string; removed: boolean };
	};
};

export type From<A extends ConnectedSurrealAdapter<any>, T extends DefinedCollection<any>> = T extends object
	? {
			[K in keyof T as Capitalize<K & string>]: SurrealRepository<A, T[K]>;
	  }
	: never;

export class ConnectedSurrealAdapter<R extends DefinedCollection<any>> {
	From: From<this, R>;
	fieldSearcher: FieldSearcher<R>;
	constructor(public schemas: R, protected readonly options: IngoOptions<"surreal">, protected readonly _dbSettings: ISurrealDBSettings, public readonly _client: Surreal) {
		this.fieldSearcher = new FieldSearcher(schemas);
		this.From = Object.keys(schemas).reduce((a, b) => {
			const capitalizeKey = b.charAt(0).toUpperCase() + b.slice(1);
			const schema = schemas[b];
			if (!schema) throw new Error(`Schema ${b} is not defined`);
			a[capitalizeKey] = new SurrealRepository(this, schema);
			return a;
		}, {} as any);
	}

	Disconnect(): Promise<SurrealAdapter> {
		throw new Error("Method not implemented.");
	}

	async Sync(options: SyncOptions): Promise<boolean> {
		const dbInfo = await this.GetDetails();
		const tablesToRemove = Object.keys(dbInfo).filter((x) => dbInfo[x]?.table.removed);

		if (tablesToRemove.length > 0 && options.removeTablesIfNotInSchema) {
			const query = tablesToRemove.map((x) => `REMOVE TABLE ${x}`).join(";");

			const results = await Surreal.Instance.query(query);
			if (results.some((x) => x.error)) throw new Error("Failed to remove tables");
		}

		for (let i = 0; i < Object.keys(this.schemas).length; i++) {
			if (!this.schemas) throw new Error("Schemas not defined");
			const schema = this.schemas[Object.keys(this.schemas)[i] as any];
			if (!schema) throw new Error("Schema not defined");
			const currentTable = await this.InfoForTable(schema.name);
			if (!currentTable) {
				console.log(`------------------------------------------create (${schema.name}) table------------------------------------------`);
				console.log(schema.query);
				await Surreal.Instance.query(schema.query);
			} else {
				const fieldsToRemove = currentTable.fields.filter((x) => x.isMissing);
				if (fieldsToRemove.length > 0) {
					const query = fieldsToRemove.map((x) => `REMOVE FIELD ${x.name} ON ${schema.name}`).join(";");
					await Surreal.Instance.query(query);
				}
				const changedIndexes = currentTable.indexes.filter((x) => x.indexNameStatus.changed);
				if (changedIndexes.length > 0) {
					const removeQuery = changedIndexes.map((x) => `REMOVE INDEX ${x.indexNameStatus.oldName} ON ${schema.name}`).join(";");
					const addQuery = changedIndexes.map((x) => `DEFINE INDEX ${x.indexNameStatus.newName} ON ${schema.name} COLUMNS ${x.field}`).join(";");
					const query = `${removeQuery};${addQuery}`;
					await Surreal.Instance.query(query);
				}
				await Surreal.Instance.query(schema.query);
			}
		}

		return true;
	}

	async GetDetails(): Promise<SurrealDetails<R>> {
		const response = await this._client.query<SurrealResponse<InfoResult>[]>("INFO FOR DB");
		if (response.length <= 0 || response?.[0].status !== "OK") throw new Error("Failed to get details from SurrealDB");

		return {
			...Object.entries(response[0].result.tb).reduce((a, b) => {
				const [key, val] = b;
				a[key] = {
					table: {
						query: val,
						removed: this.schemas[key] === undefined,
					},
				};
				return a;
			}, {}),
		} as any as SurrealDetails<R>;
	}

	async InfoForTable<T extends keyof R>(table: T) {
		const response = await this._client.query<SurrealResponse<TableResult>[]>(`INFO FOR TABLE ${table as string}`);
		if (response.length <= 0 || response?.[0]?.status !== "OK") return null;

		// const fieldsForTable = this.schemas[table]?.fields;

		if (Object.keys(response[0].result["fd"]).length === 0 && Object.keys(response[0].result["ix"]).length === 0 && Object.keys(response[0].result["ev"]).length === 0) return null;

		return {
			fields: Object.entries(response[0].result["fd"]).map(([key, val]) => {
				const fieldFind = this.fieldSearcher.searchInSchema(table, key);
				// console.log(fieldFind, key);
				return {
					name: key,
					isMissing: fieldFind === undefined ? true : false,
					query: val,
					type: val.match(/(bool|string|datetime|object|array|record(\.*)|number)/)?.[0],
				};
			}),
			indexes: Object.entries(response[0].result["ix"]).map(([key, val]) => {
				const fieldKey = val.match(/FIELDS (.*?) UNIQUE/)?.[1];
				if (!fieldKey) throw new Error(`Failed to parse index ${key} for table ${table.toString()}`);

				const fieldFind = this.fieldSearcher.searchInSchema(table, fieldKey);
				const missing: boolean = fieldFind === undefined ? true : false;
				let indexNameStatus: { oldName: string; newName: string; changed: boolean } = { oldName: "", newName: "", changed: false };

				if (!missing) {
					const field = fieldFind;
					if (!field) throw new Error("Field not found");
					if (typeof field?.index === "string") {
						if (field?.index !== key) {
							indexNameStatus = { oldName: key, newName: field.index, changed: true };
						}
					}
				}
				return {
					missing,
					indexNameStatus,
					field: fieldKey,
					name: key,
					query: val,
				};
			}),
		};
	}

	FromByName<T extends keyof R>(table: T): SurrealRepository<this, R[T]> {
		return new SurrealRepository<this, R[T]>(this, this.schemas[table]);
	}

	FromByType<M extends X, X = FindSchemaFromType<R, M>, K extends keyof R = KeyOfSchema<R, M>>(table: K): SurrealRepository<this, R[K]> {
		return new SurrealRepository<this, R[K]>(this, this.schemas[table]);
	}
}

// export type DotNestedKeys<T, ALL extends Record<string, SurrealTable<any,any>>, AlreadyViewed extends any[] = []> = T extends DateLike
//   ? never
//   : OfArray<T> extends { type: infer U }
//   ? U extends { field: infer F; isRecord: infer IR; recordName: infer R; refObj: infer Ref }
//     ? IR extends true
//       ? `${DotNestedKeys<Ref, ALL>}`
//       : keyof F
//     : keyof U
//   : (
//       T extends object
//         ? {
//             [K in Exclude<keyof T, symbol>]: T[K] extends { isRecord: true; recordName: infer N }
//               ? ALL[N] extends { fields: infer F }
//                 ? Includes<AlreadyViewed, N> extends true
//                   ? ""
//                   : `${K}.${N}.${keyof F&string}` //`${K}${DotPrefix<DotNestedKeys<F, ALL, [...AlreadyViewed, N]>>}`
//                 : ""
//               : `${K}${DotPrefix<DotNestedKeys<T[K]["field"], ALL>>}`;
//           }[Exclude<keyof T, symbol>]
//         : ""
//     ) extends infer D
//   ? Extract<D, string>
//   : never;

export class FieldSearcher<R extends DefinedCollection<any>> {
	cachedResults: Record<string, FieldItem<any>> = {};
	constructor(private schemas: R) {}

	#findKeyInFields<K extends string>(fields: Record<string, FieldItem<any>>, key: K, splitKeys?: boolean): FieldItem<any> | false {
		let keys;
		if (splitKeys) {
			const splitKey = key.split(".");
			keys = splitKey;
		} else {
			keys = [key];
		}

		const results: FieldItem<any>[] = [];

		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!k) return false;
			if (i === 0) {
				results.push(fields[k] as FieldItem<any>);
			} else {
				const lastResult = results[i - 1];
				if (!lastResult) {
					return false;
				}
				const current = lastResult.isArray ? lastResult.field[0] : lastResult?.field[k];
				if (!current) return false;

				if (current.isRecord) {
					const recordName = current.recordName;
					if (!recordName) return false;
					if (key === current.fieldName) return current;
					const remainingKeys = keys.slice(lastResult.isArray ? i : i + 1).join(".");
					const result = this.searchInSchema(recordName, remainingKeys);
					if (result) {
						results.push(result);
						break;
					}
				}
				results.push(current);
			}
		}
		// return last result after checking for undefined
		return results[results.length - 1] ?? false;
	}

	searchInSchema<S extends keyof R, K extends string>(schemaKey: S, key: K) {
		if (this.cachedResults[key]) return this.cachedResults[key];
		if (!this.schemas) return undefined;
		if (!this.schemas[schemaKey]) return undefined;
		const fields = this.schemas[schemaKey]?.fields;
		if (!fields) return undefined;
		const result = this.#findKeyInFields(fields as any, key, true);
		if (result) this.cachedResults[key] = result;
		return result;
	}
}
