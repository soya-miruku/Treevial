import { SurrealAuthOptions } from '../options';
import { SurrealSelectSignature } from '../signature';
import { SurrealTranslator } from '../translator';
import { SurrealValidator } from '../validator';

//Was gonna do more dbs initially, but I'm not sure if I'll ever get around to it since Surreal does the whole job
export type SupportedDBType = 'surreal';

export interface IDBSettings {
	translator: any;
	validator: any;
}

export interface ISurrealDBSettings extends IDBSettings {
	translator: SurrealTranslator;
	validator: SurrealValidator;
}

export interface IDBAuthOptions {
	host: string;
	port: number;
}

export interface ISelectSignature {}

export type SelectSignatureMap<T> = {
	surreal: SurrealSelectSignature<T>;
};

export type OptionsMap = {
	surreal: ISurrealDBSettings;
};

export type AuthMap = {
	surreal: SurrealAuthOptions;
};

export const GET_SETTINGS = <D extends SupportedDBType>(type: D) => {
	switch (type) {
		case 'surreal':
			return {
				translator: new SurrealTranslator(),
				validator: new SurrealValidator(),
			};
		// case 'postgres':
		// 	throw new Error('Not implemented');
		// case 'neo4j':
		// 	throw new Error('Not implemented');
		// case 'redis':
		// 	throw new Error('Not implemented');
		default:
			throw new Error('Unsupported DB type');
	}
};
