export const $sum = <K extends string>(key: K): `math::sum(${K})` => {
	return `math::sum(${key})`;
};

export const $mean = <K extends string>(key: K): `math::mean(${K})` => {
	return `math::mean(${key})`;
};

export const $min = <K extends string>(key: K): `math::min(${K})` => {
	return `math::min(${key})`;
};

export const $max = <K extends string>(key: K): `math::max(${K})` => {
	return `math::max(${key})`;
};

export const $median = <K extends string>(key: K): `math::median(${K})` => {
	return `math::median(${key})`;
};

export const $abs = <K extends string>(key: K): `math::abs(${K})` => {
	return `math::abs(${key})`;
};

export const $round = <K extends string>(key: K): `math::round(${K})` => {
	return `math::round(${key})`;
};

export const $floor = <K extends string>(key: K): `math::floor(${K})` => {
	return `math::floor(${key})`;
};

export const $ceil = <K extends string>(key: K): `math::ceil(${K})` => {
	return `math::ceil(${key})`;
};

export const $sqrt = <K extends string>(key: K): `math::sqrt(${K})` => {
	return `math::sqrt(${key})`;
};

export const $fixed = <K extends string>(key: K, digits: number): `math::fixed(${K}, ${number})` => {
	return `math::fixed(${key}, ${digits})`;
};

export const $product = <K extends string>(key: K): `math::product(${K})` => {
	return `math::product(${key})`;
};

export const mathFunTypes = {
	$sum,
	$mean,
	$min,
	$max,
	$median,
	$abs,
	$round,
	$floor,
	$ceil,
	$sqrt,
	$fixed,
	$product,
};

export type MathFunTypes = typeof mathFunTypes;
export type MathFunInputs<T> = {
	$sum?: boolean;
	$mean?: boolean;
	$min?: boolean;
	$max?: boolean;
	$median?: boolean;
	$abs?: boolean;
	$round?: boolean;
	$floor?: boolean;
	$ceil?: boolean;
	$sqrt?: boolean;
	$fixed?: number;
	$product?: boolean;
};

export function mapMathFun(obj: any, key: string) {
	if (typeof obj === "string") {
		return obj;
	}
	const keys = Object.keys(obj);
	if (keys.length === 1) {
		const [k] = keys;
		if (!(k && k in mathFunTypes)) return null;
		const v = obj[k];
		if (k in mathFunTypes) {
			return mathFunTypes[k](key, v);
		}
	}
	return null;
}
