import { IFilterable } from ".";

export type OrderByOptions = "asc" | "desc";
type NestedOrder = { [key: string]: Record<string, OrderByOptions> };

type OrderByParseResult<T, Parent extends string> = T extends NestedOrder
	? {
			[P in keyof T]: ReturnType<OrderByFilter<T[P], P & string>["parse"]>;
	  }[keyof T]
	: Parent extends ""
	? `ORDER BY ${keyof T & string} ${T[keyof T] & string}`
	: `ORDER BY ${Parent}.${keyof T & string} ${T[keyof T] & string}`;

export class OrderByFilter<T extends Record<string, OrderByOptions> | NestedOrder, Parent extends string = ""> implements IFilterable<T> {
	constructor(private order: T, private parent?: Parent) {}

	parse(): OrderByParseResult<T, Parent> {
		return `ORDER BY ${Object.keys(this.order)
			.map((key) => {
				const value = this.order[key];
				if (typeof value === "string") {
					return this.parent ? `${this.parent}.${key} ${value}` : `${key} ${value}`;
				} else {
					return new OrderByFilter(value, this.parent ? `${this.parent}.${key}` : key).parse();
				}
			})
			.join(", ")}` as OrderByParseResult<T, Parent>;
	}
}
