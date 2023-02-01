import { UnionToIntersection } from "type-fest";
import { DateLike, DeepRequired, OfArray } from "./base";
import { Fields } from "./tables";
import { QueryOfTheBuild } from "../base/builder/select";

export type ReturnQueryType = "NONE" | "DIFF" | "BEFORE" | "AFTER"; //add selections of fields

export interface GeneralOptions<R extends ReturnQueryType> {
	return?: R;
}
export interface CreateOptions<F extends boolean, R extends ReturnQueryType> extends GeneralOptions<R> {
	fetch?: F;
}

export interface SelectOptions<P extends boolean> {
	parallel?: P;
}

export type CreateOutput<CI extends Fields<any, any>, T, Options extends CreateOptions<any, any>> = CI extends object
	? {
			[K in keyof CI as K extends keyof T ? K : never]: K extends keyof T
				? Options extends { fetch?: false }
					? CI[K] extends { isArray: true; isRecord: true }
						? string[]
						: CI[K] extends { isRecord: true }
						? string
						: Options extends { fetch?: true }
						? T[K]
						: T[K]
					: T[K]
				: never;
	  } & { id: string }
	: never;

type IsOfCountType = { _count: true | object };

export type Selection<T extends QueryOfTheBuild<any, any, any, any>, M, CI, QB = DeepRequired<NonNullable<T>>> = QB extends object
	? {
			[P in
				keyof M as QB extends { select: infer S }
					? P extends keyof S
						? S[P] extends { _count: true | object; as: infer ReKey }
							? ReKey extends never
								? `${P & string}_count`
								: ReKey
							: S[P] extends { as: infer ReKey }
							? ReKey
							: P
						: never
					: QB extends IsOfCountType
					? never
					: P]: QB extends {
				select: infer S;
			}
				? OfArray<M[P]> extends { type: infer U }
					? P extends keyof S
						? P extends keyof CI
							? CI[P] extends { isRelation: true; relation: infer D }
								? OfArray<M[P]> extends { type: infer MU }
									? NonNullable<S[P]> extends true
										? string[]
										: NonNullable<S[P]> extends IsOfCountType
										? number
										: Selection<S[P], MU, CI>[]
									: never
								: CI[P] extends { isArray: true; isRecord: true; field: any }
								? UnionToIntersection<S[P]> extends never
									? string[]
									: S[P] extends true
									? string[] //Selection<S[P], U & { id: string }, CI[P]>
									: S[P] extends IsOfCountType
									? number
									: Selection<S[P], U & { id: string }, CI[P]["field"][0]["field"]>[]
								: S[P] extends IsOfCountType
								? number
								: Selection<S[P], U, CI[P]>[]
							: M[P]
						: never
					: P extends keyof S
					? P extends keyof CI
						? CI[P] extends { isRelation: true; relation: infer D }
							? Selection<S[P], M[P], CI[P]>
							: CI[P] extends { isRecord: true }
							? UnionToIntersection<S[P]> extends never
								? string
								: S[P] extends true
								? S[P] extends IsOfCountType
									? number
									: Selection<S[P], M[P] & { id: string }, CI[P]>
								: Selection<S[P], M[P] & { id: string }, CI[P]>
							: S[P] extends IsOfCountType
							? number
							: Selection<S[P], M[P], CI[P]>
						: M[P]
					: P extends "id"
					? string
					: never
				: never;
	  }
	: M;

export type SelectionResult<T extends QueryOfTheBuild<any, any, any, any>, M, CI, QB = DeepRequired<NonNullable<T>>> = QB extends { _count: true }
	? { _count: number }
	: Selection<T, M, CI, QB>;
