import { FieldSearcher } from '../../adapter';
import { DateLike, Nullable, OfArray } from '../../types/base';
import { GroupByOptions, GroupByFilter } from './groupby';
import { LimitFilter } from './limit';
import { OrderByOptions, OrderByFilter } from './orderby';
import { SplitByFilter, SplitByOptions } from './split';
import { StartFilter } from './start';
import { WhereFilter, WhereSelector } from './where';
import { BasicRelationType, FieldItem } from '../../types/tables';
import { CountFilter, CountProps } from './count';
import { StringFunInputs } from './utils/strings';
import { OfDateOrNumberOperators, mapOperator } from './utils/operations';
import { mapFun } from './utils/funs';

export type SimplifyObject<T> = T extends object ? { [KeyType in keyof T]: T[KeyType] } : T;

export type NestedQuery<T, L extends number, S extends number, AS extends string, N = T> = N extends object
	? {
			[P in keyof N]?: OfArray<N[P]> extends { type: infer U }
				? QueryOfTheBuild<U, L, S, AS> | boolean
				: N[P] extends DateLike
				? never
				: N[P] extends Nullable<object>
				? QueryOfTheBuild<N[P], L, S, AS> | boolean
				: N[P] extends object
				? QueryOfTheBuild<N[P], L, S, AS> | boolean
				: NonNullable<N[P]> extends boolean
				? boolean
				: NonNullable<N[P]> extends string
				? ({ [P in keyof StringFunInputs<N>]: StringFunInputs<N>[P] } & { as?: AS }) | boolean
				: ({ [P in keyof OfDateOrNumberOperators]: OfDateOrNumberOperators[P] } & { as?: AS }) | boolean | ((item: NonNullable<N[P]>) => boolean);
	  }
	: N;

export type FallBackByQuerySelector<T, Fallback> = T extends object
	? {
			[P in keyof T]?: T[P] extends DateLike
				? Fallback
				: OfArray<T[P]> extends { type: infer U }
				? FallBackByQuerySelector<SimplifyObject<U>, Fallback> | (Fallback | { _count: Fallback }) | Fallback
				: NonNullable<T[P]> extends object
				? FallBackByQuerySelector<T[P], Fallback> | Fallback
				: Fallback;
	  }
	: T;

export type QueryOfTheBuild<M, L extends number, S extends number, AS extends string> = {
	limit?: L;
	start?: S;
	orderRandom?: boolean;
	expanded?: boolean;
	orderBy?: FallBackByQuerySelector<M, OrderByOptions>;
	groupBy?: FallBackByQuerySelector<M, GroupByOptions>;
	splitBy?: FallBackByQuerySelector<M, SplitByOptions>;
	where?: WhereSelector<M>;
	select?: NestedQuery<M, L, S, AS>;
	as?: AS;
	_count?: CountProps;
};

type SelectorParseResults<T extends QueryOfTheBuild<any, any, any, any>> = T;

type SelectResult = {
	limit?: string;
	where?: string;
	orderRandom?: boolean;
	expanded?: boolean;
	orderBy?: string;
	groupBy?: string;
	select?: SelectedItems[];
	splitBy?: string;
	start?: string;
	as?: string;
	_count?: CountProps;
};

type SelectedItems = SelectResult | string;
export type ParentItem = {
	key: string;
	parent: string;
	fieldItem: FieldItem<any> | null;
	relation: BasicRelationType | null;
};

export class Selector<T extends QueryOfTheBuild<any, any, any, any>, F extends FieldSearcher<any>, N extends string, Parent extends ParentItem | null = null> {
	selectedItems: SelectedItems[] = [];
	constructor(private obj: T, private fieldSearcher: F, private currentSchema: N, private nestedParent?: Parent, private parent?: string) {}

	//todo: seperate this into smaller functions, this is too big, for example records, relations, and regular fields
	parse(): string {
		const { limit, start, orderRandom, orderBy, groupBy, select, splitBy, expanded, where, as, _count } = this.obj;
		const orderRand = orderRandom ? 'ORDER RAND()' : undefined;
		const limter = limit ? new LimitFilter(limit).parse() : undefined;
		const starter = start ? new StartFilter(start).parse() : undefined;
		const order = orderBy ? new OrderByFilter(orderBy).parse() : undefined;
		const group = groupBy ? new GroupByFilter(groupBy).parse() : undefined;
		const split = splitBy ? new SplitByFilter(splitBy).parse() : undefined;
		const count = _count ? new CountFilter(_count, this?.parent).parse() : undefined;
		const withAs = as ? `AS ${as}` : undefined;

		let nested = !!limter || !!starter || !!order || !!group || !!split || !!orderRand;
		const whereFilter = where
			? `WHERE ${new WhereFilter(
					where,
					{ currentSchema: this.currentSchema, fieldSearcher: this.fieldSearcher },
					this.nestedParent,
					!this.nestedParent?.relation && (nested || !!this.parent),
			  ).parse()}`
			: undefined;
		nested = (!!whereFilter || nested || !!expanded) && this.nestedParent?.fieldItem !== null;

		let query = '';
		if (select) {
			query += `${Object.keys(select)
				.map((key) => {
					const field = this.fieldSearcher.searchInSchema(this.currentSchema, this.nestedParent ? `${this.nestedParent.parent}.${key}` : key);
					if (typeof field === 'boolean') {
						if (typeof select[key] === 'object') {
							const parentItem = {
								key,
								parent: this.nestedParent ? `${this.nestedParent.parent}.${key}` : key,
								fieldItem: null,
							} as ParentItem;
							return new Selector(select[key], this.fieldSearcher, this.currentSchema, parentItem, key).parse();
						}
						return this.nestedParent?.fieldItem && !nested
							? this.nestedParent?.relation
								? `${this.nestedParent.relation.inverse ? `out.${key} as ${key}` : `in.${key} as ${key}`}`
								: `${this.nestedParent.key}.${key}`
							: this.nestedParent?.relation
							? `${this.nestedParent.relation.inverse ? `out.${key} as ${key}` : `in.${key} as ${key}`}`
							: key;
					}

					const isRelation = !!field?.relation;
					const name = field?.recordName ? field.recordName : this.currentSchema;
					if (typeof select[key] === 'function') {
						const funcString = select[key].toString().replace(/\(.*\)\s*=>\s*/, '');
						return `${funcString} AS ${key}`;
					}
					if (typeof select[key] === 'boolean') {
						if (isRelation) {
							const rel = field?.relation as BasicRelationType;
							const dir = rel.inverse ? '<-' : '->';

							return `${dir}${rel.tName}${dir}${rel.to} AS ${key}`;
						} else if (this.nestedParent?.fieldItem?.isArray) {
							return this.nestedParent && !nested ? `${this.parent}.*.${key}` : key;
						} else {
							return this.nestedParent && !nested ? `${this.nestedParent.parent}.${key}` : key;
						}
					} else {
						const { as, ...rest } = select[key] as any;
						let selKey = key;
						if (isRelation) {
							const rel = field?.relation as BasicRelationType;
							// const dir = rel.inverse ? "<-" : "->";
							selKey = rel.inverse ? 'out' : 'in'; //`${dir}${rel.tName}${dir}${rel.to}`;
						}
						const funResults = mapFun(rest, this.nestedParent && !nested ? `${this.nestedParent.parent}.${selKey}` : selKey);
						if (funResults) {
							return `${funResults}${as ? ` AS ${as}` : ''}`;
						}
						const operatorResult = mapOperator(rest);

						if (operatorResult) {
							return `${this.nestedParent && !nested ? `${this.nestedParent.parent}.${selKey}` : selKey}${operatorResult}${as ? ` AS ${as}` : ''}`;
						}
						const parentItem = {
							key: selKey,
							parent: this.nestedParent ? `${this.nestedParent.parent}.${selKey}` : selKey,
							fieldItem: field,
							relation: field?.relation,
						} as ParentItem;
						return new Selector(select[key], this.fieldSearcher, name, parentItem, selKey).parse();
					}
				})
				.join(', ')}`;
		} else {
			if (!(nested || count)) query += '*';
		}

		const endQuery = [split, count, whereFilter, group, order, orderRand, limter, starter].filter((v) => v).join(' ');
		if (this.nestedParent?.relation) {
			const rel = this.nestedParent.relation as BasicRelationType;
			const relQuery = `SELECT ${query} FROM ${rel.tName} WHERE ${rel.inverse ? 'out=$parent.id' : 'in=$parent.id'}`;
			return `(${relQuery}${endQuery ? ` ${endQuery.replace('WHERE', 'AND')}` : ''} FETCH ${rel.inverse ? 'out' : 'in'}) ${
				!withAs ? `AS ${this.nestedParent.key}` : `${withAs}`
			}`.trim();
		}
		if (nested && this.nestedParent && this.parent) {
			return `(SELECT ${query} FROM $parent.${this.parent}${endQuery ? ` ${endQuery}` : ''}) ${!withAs ? `AS ${this.nestedParent.key}` : `${withAs}`}`.trim();
		}

		return `${!this.nestedParent ? 'SELECT ' : ''}${query} ${!this.nestedParent ? `FROM ${this.currentSchema}` : ''} ${endQuery}${withAs ? ` ${withAs}` : ''}`.trim();
	}
}
