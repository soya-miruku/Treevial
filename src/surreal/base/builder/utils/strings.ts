import { Includes } from "type-fest";
import { DotPrefix, OfArray } from "../../../types/base";
export const $concat = <K extends string>(key: K): `string::concat(${K})` => {
	return `string::concat(${key})`;
};

export const $endsWith = <K extends string>(key: K, value: string): `string::endswith(${K}, ${string})` => {
	return `string::endswith(${key}, ${value})`;
};

export const $startsWith = <K extends string>(key: K, value: string): `string::startswith(${K}, ${string})` => {
	return `string::startswith(${key}, ${value})`;
};

export const $join = <K extends string>(key: K, value: string): `string::join(${K}, ${string})` => {
	return `string::join(${key}, ${value})`;
};

export const $length = <K extends string>(key: K): `string::length(${K})` => {
	return `string::length(${key})`;
};

export const $lowercase = <K extends string>(key: K): `string::tolower(${K})` => {
	return `string::tolower(${key})`;
};

export const $uppercase = <K extends string>(key: K): `string::toupper(${K})` => {
	return `string::toupper(${key})`;
};

export const $repeat = <K extends string>(key: K, value: number): `string::repeat(${K}, ${number})` => {
	return `string::repeat(${key}, ${value})`;
};

export const $trim = <K extends string>(key: K): `string::trim(${K})` => {
	return `string::trim(${key})`;
};

export const stringFunTypes = {
	$concat,
	$endsWith,
	$startsWith,
	$join,
	$length,
	$lowercase,
	$uppercase,
	$repeat,
	$trim,
};

export type StringFunTypes = typeof stringFunTypes;
export type StringFunInputs<T> = {
	$concat?: boolean;
	$endsWith?: string;
	$startsWith?: string;
	// $join?: { field: DotNestedKeys<T>; delimiter: string } | boolean;
};

export function mapStringFun(obj: any, key: string) {
	if (typeof obj === "string") {
		return obj;
	}
	const keys = Object.keys(obj);
	if (keys.length === 1) {
		const [k] = keys;
		if (!(k && k in stringFunTypes)) return null;
		const v = obj[k];
		if (k in stringFunTypes) {
			return stringFunTypes[k](key, v);
		}
	}
	return null;
}

// export type DotNestedKeys<T, AlreadyViewed extends any[] = [], Dot extends string = "."> = Includes<AlreadyViewed, T> extends true
// 	? ""
// 	: (
// 			OfArray<T> extends { type: infer U }
// 				? U extends object
// 					? "" //DotNestedKeys<U, [...AlreadyViewed, T], ".*.">
// 					: never
// 				: T extends object
// 				? {
// 						[K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K], [...AlreadyViewed, K]>, Dot>}`;
// 				  }[Exclude<keyof T, symbol>]
// 				: ""
// 	  ) extends infer D
// 	? Extract<D, string>
// 	: never;
