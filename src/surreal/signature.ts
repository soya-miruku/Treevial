import { OfArray } from "./types/base";
import { RecordLink, Relation } from "./types";

export type IsRelationType<T> = T extends Relation<infer I, infer O> ? Relation<I, O> : T;
export type IsRecordType<T> = T extends RecordLink<infer U> ? RecordLink<U> : T;

export type SurrealSelectSignature<CurrentType> = OfArray<CurrentType> extends { isPrimitive: infer P; type: infer T }
	? T
	: // : IsRecordType<CurrentType> extends RecordLink<infer RecordItem>
	  // ? SurrealSelectSignature<RecordItem>
	  // : IsRelationType<CurrentType> extends Relation<infer InDir, infer OutDir>
	  // ? Relation<ExtractArrayType<InDir>, ExtractArrayType<OutDir>>
	  CurrentType;

// export type SurrealWhereSignature<CurrentType> = IsArray<CurrentType> extends (infer ItemInArray)[]
