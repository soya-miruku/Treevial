import { SurrealAdapter } from "../adapter";
import { GET_SETTINGS, SupportedDBType } from "./settings";
import { IngoOptions } from "./types";

export class AdapterFactory {
	public static Create<D extends SupportedDBType>(options: IngoOptions<D>) {
		switch (options.type) {
			case "surreal":
				return new SurrealAdapter(options as IngoOptions<"surreal">, GET_SETTINGS(options.type));
			default:
				throw new Error("Unsupported DB type");
		}
	}
}
