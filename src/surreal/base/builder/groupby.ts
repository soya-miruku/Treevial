import { IFilterable } from ".";

export type GroupByOptions = boolean;

type NestedGroupBy = { [key: string]: Record<string, GroupByOptions> };
export type GroupByParseResult<T, Parent extends string> = T extends NestedGroupBy
	? {
			[P in keyof T]: ReturnType<GroupByFilter<T[P], P & string>["parse"]>;
	  }[keyof T]
	: Parent extends ""
	? `GROUP BY ${keyof T & string}`
	: `GROUP BY ${Parent}.${keyof T & string}`;

export class GroupByFilter<T extends Record<string, GroupByOptions> | NestedGroupBy, Parent extends string = ""> implements IFilterable<T> {
	constructor(private group: T, private parent?: Parent) {}

	parse(): GroupByParseResult<T, Parent> {
		return `GROUP BY ${Object.keys(this.group)
			.map((key) => {
				const value = this.group[key];
				if (typeof value === "boolean") {
					return this.parent ? `${this.parent}.${key}` : key;
				} else {
					return new GroupByFilter(value, this.parent ? `${this.parent}.${key}` : key).parse();
				}
			})
			.join(", ")}` as GroupByParseResult<T, Parent>;
	}
}
