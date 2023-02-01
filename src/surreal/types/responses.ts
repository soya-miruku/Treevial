export type SurrealResponse<T> = {
	time: string;
	status: string;
	result: T;
};
export type SurrealErrorResponse = {
	time: string;
	status: string;
	detail: string;
};
export type InfoResult = {
	dl: { [key: string]: string };
	dt: { [key: string]: string };
	sc: { [key: string]: string };
	tb: { [key: string]: string };
};

export type TableResult = {
	ev: { [key: string]: string };
	fd: { [key: string]: string };
	ft: { [key: string]: string };
	ix: { [key: string]: string };
};
