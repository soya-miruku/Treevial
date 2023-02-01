import { SupportedDBType, AuthMap } from "./settings";

export interface IngoOptions<D extends SupportedDBType> {
	readonly type?: D;
	readonly auth?: AuthMap[D];
	usePrisma?: D extends "postgres" ? boolean : never;
}
