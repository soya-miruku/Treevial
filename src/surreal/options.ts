import { IDBAuthOptions } from "./base/settings";

export interface SurrealAuthOptions extends IDBAuthOptions {
	username: string;
	password: string;
	namespace: string;
	database: string;
}
