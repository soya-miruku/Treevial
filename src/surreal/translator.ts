export class SurrealTranslator {
	translateTableSchema<T extends unknown>(schema: T): string {
		throw new Error("Method not implemented.");
	}

	translate(query: any): string {
		return "";
	}
}
