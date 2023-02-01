import { mapMathFun } from "./math";
import { mapStringFun } from "./strings";

export function mapFun(obj: any, key: string) {
	return mapMathFun(obj, key) || mapStringFun(obj, key);
}
