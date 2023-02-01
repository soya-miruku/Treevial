import { IFilterable } from ".";
export class LimitFilter<T extends number> implements IFilterable<T> {
	constructor(private limit: T) {}

	parse(): `LIMIT ${T}` {
		return `LIMIT ${this.limit}`;
	}
}
