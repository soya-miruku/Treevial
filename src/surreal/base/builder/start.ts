import { IFilterable } from ".";

export class StartFilter<T extends number> implements IFilterable<T> {
	constructor(private start: T) {}

	parse(): `START ${T}` {
		return `START ${this.start}`;
	}
}
