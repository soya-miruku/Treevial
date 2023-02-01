export function isSameKeys(obj1: any, obj2: any) {
	const obj1Keys = Object.keys(obj1);
	const obj2Keys = Object.keys(obj2);

	if (obj1Keys.length !== obj2Keys.length) {
		return false;
	}

	for (let i = 0; i < obj1Keys.length; i++) {
		if (obj1Keys[i] !== obj2Keys[i]) {
			return false;
		}
	}

	return true;
}

export function isPrimitive(val: any) {
	return val === null || (typeof val !== "function" && typeof val !== "object");
}

export function isPrimitiveArray(val: any) {
	return Array.isArray(val) && val.every(isPrimitive);
}

export function stringifyWithIgnore(obj: object | any[], ignoreList: string[]): string {
	return JSON.stringify(obj, (key, value) => {
		if (ignoreList.includes(key)) return undefined;
		return value;
	});
}

export function stringifyWithoutIgnoreList(obj: any): string {
	let json = JSON.stringify(obj);
	const testRegex = /\"\$(.*?)\"/gm;
	const matches = json.match(new RegExp(testRegex, "g"));
	if (matches) {
		for (const match of matches) {
			const newMatch = match.replace(/\"/g, "");
			json = json.replace(match, newMatch);
		}
	}
	return json;
}

export function ensureRegularFn(code: string) {
	if (code.includes("native code")) {
		throw new Error("Cannot parse native code");
	}

	const match = code.match(/^\(([^)]*)\)\s*=>\s*(.+)$/);
	if (!match) {
		return code;
	}

	const [, params, body] = match;
	return `function(${params}) { return ${body}; }`;
}
