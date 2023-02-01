import { IFilterable } from ".";
import { OfDateOrNumberOperators, mapNumberOrDateOperator } from "./utils/operations";

export type CountProps = { [K in keyof OfDateOrNumberOperators]: OfDateOrNumberOperators[K] } | boolean;

export class CountFilter<T extends CountProps, K extends string | undefined> implements IFilterable<T> {
	constructor(private count: T, private key: K) {}

	parse(): string {
		if (typeof this.count === "boolean") {
			return `count(${this.key})`;
		}
		return `count(${this.key})${mapNumberOrDateOperator(this.count)}`;
	}
}
