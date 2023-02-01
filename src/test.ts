import { AdapterFactory, inferFull, Treevial } from './surreal';

const schemas = Treevial.MultiDef(({ number, string, date, array, record, relation, object, enums }) => ({
	user: {
		id: string({ required: true }),
		name: string({
			required: true,
			index: 'idx_user_name',
			permissions: {
				select: 'NONE',
				create: 'where $auth.id = id',
			},
		}),
		email: string({ required: true, index: 'idx_user_email' }),
		createdOn: date({ required: false, default: () => new Date() }),
		posts: array(record(() => schemas.defs.post)),
		age: number(),
		following: relation({
			edge: object({
				createdAt: date({ default: () => new Date() }),
				how: enums(['post', 'search'], { required: true }),
			}),
			out: object(() => schemas.defs.user),
			name: 'follows',
			inverse: false,
		}),
		followers: relation({
			edge: object({ createdAt: date({ default: () => new Date() }), how: enums(['post', 'search']) }),
			out: object(() => schemas.defs.user),
			name: 'follows',
			inverse: true,
		}),
		intersts: array(string()),
	},
	comment: {
		id: string({ required: true }),
		createdOn: date({ required: true }),
		msg: string({ required: true }),
		children: array(record(() => schemas.defs.comment)),
	},
	post: {
		id: string({ required: true }),
		createdOn: date({ required: false }),
		content: string({ required: false }),
		comments: array(record(() => schemas.defs.comment)),
	},
}));

type User = inferFull<typeof schemas.defined.user>;
function itTakesThisLong(fn: () => Promise<void>) {
	const start = Date.now();
	return fn().then(() => Date.now() - start);
}

async function main() {
	schemas.initialize();
	const adapter = AdapterFactory.Create({
		type: 'surreal',
		auth: {
			username: 'root',
			password: 'root',
			port: 8000,
			host: '127.0.0.1',
			database: 'ttest',
			namespace: 'ttest',
		},
	});

	const client = await adapter.Connect({ ...schemas.defined });

	const time = await itTakesThisLong(async () => {
		const find = await client.From.User.FindMany({
			select: {
				id: true,
				name: true,
				email: true,
				posts: {
					_count: true,
					as: 'postCount',
				},
				following: true,
				followers: {
					select: {
						id: true,
					},
				},
			},
			where: {
				age: { gt: 10 },
				AND: [
					{
						name: { contains: 'lever' },
					},
				],
			},
		});
		// const created = await client.From.User.CreateMany([
		// 	{
		// 		name: "testing",
		// 		email: "my testing",
		// 	},
		// 	{
		// 		name: "testing2",
		// 		email: "my testing2",
		// 	},
		// ]);

		// console.log(created);

		// const ids = created.map((u) => u.id as `user:${string}`);
		// const rel = await client.From.User.Relate("following", ids[0], ids[1], {
		// 	how: "post",
		// });

		// console.log(rel);

		const results = await client.From.User.DeleteMany({ email: 'er', name: 'llll', AND: { name: { contains: 'lever' } } });
		console.log(results);
	});

	console.log(`It took ${time}ms`);
	return;
}

main()
	.then(async () => {
		process.exit(0);
	})
	.catch(async (e) => {
		console.error(e);
		process.exit(1);
	});
