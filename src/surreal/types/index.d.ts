import { SurrealTable } from "./tables";
import { SchemaDefinition, jazoInfer } from "./vial";

declare module "infer" {
	export type infer<T extends SurrealTable<SchemaDefinition<any, any>, any>> = jazoInfer<T["def"]>;
}
