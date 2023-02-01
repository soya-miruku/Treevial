import { DateLike } from "../../../types/base";

export const QLOperators = {
	equals: "=",
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<=",
	eeq: "==",
	any: "?=",
	all: "*=",
	feq: "~",
	fany: "*~",
	contains: "CONTAINS",
	containsAll: "CONTAINSALL",
	containsAny: "CONTAINSANY",
	containsOne: "CONTAINSNONE",
	inside: "INSIDE",
	notInside: "NOTINSIDE",
	allInside: "ALLINSIDE",
	anyInside: "ANYINSIDE",
	noneInside: "NONEINSIDE",
	outside: "OUTSIDE",
	intersects: "INTERSECTS",
};

export type QLOperator = keyof typeof QLOperators;

export type OfDateOrNumberOperators = {
	eq?: number | DateLike;
	gt?: number | DateLike;
	gte?: number | DateLike;
	lt?: number | DateLike;
	lte?: number | DateLike;
};

export function mapNumberOrDateOperator(value: any, key?: string) {
	if (value?.gt) return `${key ? key : ""} > ${value.gt}`;
	if (value?.lt) return `${key ? key : ""} < ${value.lt}`;
	if (value?.gte) return `${key ? key : ""} >= ${value.gte}`;
	if (value?.lte) return `${key ? key : ""} <= ${value.lte}`;
	return null;
}

export const OfDateOrNumberOperators = ["eq", "gt", "gte", "lt", "lte"] as const;

export type OfStringOperators = {
	eq?: string;
	contains?: string[] | string;
	containsAny?: string[] | string;
	containsAll?: string[] | string;
	containsNone?: string[] | string;
};

export const OfStringOperators = ["eq", "contains", "containsAny", "containsAll", "containsNone"] as const;

export function mapStringOperator(value: any, key?: string) {
	if (value?.contains) {
		if (Array.isArray(value?.contains)) {
			return `${key ? key : ""} CONTAINS [${value.contains.map((v: any) => `"${v}"`).join(",")}]`;
		} else {
			return `${key ? key : ""} CONTAINS "${value.contains}"`;
		}
	}
	if (value?.containsAny) {
		if (Array.isArray(value?.containsAny)) {
			return `${key ? key : ""} CONTAINSANY [${value.containsAny.map((v: any) => `"${v}"`).join(",")}]`;
		} else {
			return `${key ? key : ""} CONTAINSANY "${value.containsAny}"`;
		}
	}
	if (value?.containsAll) {
		if (Array.isArray(value?.containsAll)) {
			return `${key ? key : ""} CONTAINSALL [${value.containsAll.map((v: any) => `"${v}"`).join(",")}]`;
		} else {
			return `${key ? key : ""} CONTAINSALL "${value.containsAll}"`;
		}
	}
	if (value?.containsNone) {
		if (Array.isArray(value?.containsNone)) {
			return `${key ? key : ""} CONTAINSNONE [${value.containsNone.map((v: any) => `"${v}"`).join(",")}]`;
		} else {
			return `${key ? key : ""} CONTAINSNONE "${value.containsNone}"`;
		}
	}
	return null;
}

export type OfBooleanOperators = {
	eq?: boolean;
};

export const OfBooleanOperators = ["eq"] as const;

export function mapBooleanOperator(value: any, key?: string) {
	if (value?.eq) return `${key ? key : ""} = ${value.eq}`;
	return null;
}

export const mapOperator = (value: any, key?: string) => {
	return mapNumberOrDateOperator(value, key) || mapStringOperator(value, key) || mapBooleanOperator(value, key);
};
