import { IFilterable } from ".";
import { DateLike, OfArray } from "../../types/base";
import { ParentItem } from "./select";
import { FieldSearcher } from "../../adapter";
import { OfDateOrNumberOperators, OfStringOperators, mapOperator } from "./utils/operations";

export type ExtractRelevant<T> = OfArray<T> extends { type: infer U; isPrimitive: infer P }
	? P extends true
		? ExtractRelevant<U>
		: WhereSelector<U>
	: T extends DateLike | number
	? OfDateOrNumberOperators | ((item: T) => boolean)
	: T extends string
	? OfStringOperators | string
	: T extends boolean
	? boolean
	: T extends object
	? WhereSelector<T>
	: never;

export type WhereSelector<M> = M extends object
	?
			| { AND: WhereSelector<M> }
			| { OR: WhereSelector<M> }
			| { NOT: WhereSelector<M> }
			| Partial<{
					[P in keyof M]: ExtractRelevant<M[P]>;
			  }>
	: never;

export class WhereFilter<T extends WhereSelector<object>, Parent extends ParentItem | null = null> implements IFilterable<T> {
	constructor(private obj: T, private selector: { currentSchema: string; fieldSearcher: FieldSearcher<any> }, private previous?: Parent, private nested?: boolean) {}
	parse() {
		let result = "";
		const _this = this;
		const { AND, OR, NOT, ...rest } = this.obj as any;

		if (rest) {
			const keys = Object.keys(rest);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const value = rest[key as keyof typeof rest];
				if (value === undefined) continue;
				if (!key) continue;

				function GetKey() {
					return _this.previous && !_this.nested ? `${_this.previous.parent}.${key}` : key;
				}

				if (i > 0) result += " AND ";
				const opts = mapOperator(value, GetKey());
				if (opts) {
					result += opts;
					continue;
				}

				const field = this.selector.fieldSearcher.searchInSchema(this.selector.currentSchema, this.previous?.parent ? `${this.previous.parent}.${key}` : key);
				if (field) {
					const parentItem = {
						key,
						parent: this.previous ? `${this.previous.parent}.${key}` : key,
						fieldItem: field,
					} as ParentItem;

					const IsArray = field.isArray;
					const isObject = field.isObject;
					const isPrimitive = !(IsArray || isObject);

					if (isPrimitive) {
						if (typeof value === "function") {
							const funcString = value.toString().replace(/\(.*\)\s*=>\s*/, "");
							result += `${funcString}`;
							continue;
						}
						result += `${GetKey()} = ${typeof value === "string" && value.includes(":") ? value : JSON.stringify(value)}`;
					} else if (isObject) {
						const where = new WhereFilter(value, this.selector, parentItem);
						result += where.parse();
					} else if (IsArray) {
						const where = new WhereFilter(value, this.selector, parentItem, true);
						result += `${key}[WHERE ${where.parse()}]`;
					}
				} else {
					console.log("NO FIELD", key, this.previous, value, this.selector.currentSchema);
				}
			}
		}

		if (AND) {
			result += " AND ";
			if (Array.isArray(AND)) {
				for (let i = 0; i < AND.length; i++) {
					const element = AND[i];
					if (i > 0) result += " AND ";
					result += new WhereFilter(element, this.selector, this.previous).parse();
				}
			} else if (typeof AND === "object") result += new WhereFilter(AND, this.selector, this.previous, this.nested).parse();
		}
		if (OR) {
			result += " OR ";
			if (Array.isArray(OR)) {
				for (let i = 0; i < OR.length; i++) {
					const element = OR[i];
					if (i > 0) result += " OR ";
					result += new WhereFilter(element, this.selector, this.previous, this.nested).parse();
				}
			} else if (typeof OR === "object") result += new WhereFilter(OR, this.selector, this.previous, this.nested).parse();
		}
		if (NOT) {
			result += " NOT ";
			if (Array.isArray(NOT)) {
				for (let i = 0; i < NOT.length; i++) {
					const element = NOT[i];
					if (i > 0) result += " NOT ";
					result += new WhereFilter(element, this.selector, this.previous).parse();
				}
			} else if (typeof NOT === "object") result += new WhereFilter(NOT, this.selector, this.previous, this.nested).parse();
		}
		return result;
	}
}
