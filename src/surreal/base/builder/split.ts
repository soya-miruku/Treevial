import { IFilterable } from ".";

export type SplitByOptions = boolean;
export type NestedSplitBy = { [key: string]: Record<string, SplitByOptions> };
export type SplitByParseResult<T, Parent extends string> = T extends NestedSplitBy
	? {
			[P in keyof T]: ReturnType<SplitByFilter<T[P], P & string>["parse"]>;
	  }[keyof T]
	: Parent extends ""
	? `SPLIT BY ${keyof T & string}`
	: `SPLIT BY ${Parent}.${keyof T & string}`;

export class SplitByFilter<T extends Record<string, SplitByOptions> | NestedSplitBy, Parent extends string = ""> implements IFilterable<T> {
	constructor(private split: T, private parent?: Parent) {}

	parse(): SplitByParseResult<T, Parent> {
		return `SPLIT BY ${Object.keys(this.split)
			.map((key) => {
				const value = this.split[key];
				if (typeof value === "boolean") {
					return this.parent ? `${this.parent}.${key}` : key;
				} else {
					return new SplitByFilter(value, this.parent ? `${this.parent}.${key}` : key).parse();
				}
			})
			.join(", ")}` as SplitByParseResult<T, Parent>;
	}
}
