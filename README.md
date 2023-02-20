
<h1 align="center">
  <br>
  <a href="https://en.wikipedia.org/wiki/Yggdrasil"><img src="https://the-public-domain-review.imgix.net/collections/yggdrasil-the-sacred-ash-tree-of-norse-mythology/oct_19_new_prints_00008.jpg?w=257" alt="Markdownify" width="200" style="border-radius:100%;"></a>
  <br>
  Treevial
  <br>
</h1>

<h4 align="center">ORM for <a href="https://surrealdb.com/" target="_blank">SurrealDB</a>.</h4>

> **Note**
><h4>NOTE: UPDATE/UPDATE feature has not yet been implemented, i am now working on LUCID which will provide more rich features, however since the API would be different, i am pushing this code here, incase anyone would like to use/expand upon it.</h4>
<br>
<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#license">License</a>
</p>

## Key Features

* Define Schemas, with fields and relationships as well as indexes and constraints
* Sync Data model (though basic atm), renames, adds, drops, etc.
* Flexible with data types, supports all of SurrealDB's data types and a Prisma-like query builder 
* Fully typesafe, easily infer your data model when doing a simple select or a more complex count or boolean query
* SELECT, DELETE, DELETE MANY, CREATE, CREATE MANY
* Framework agnostic, use it with any framework
* Easily handle recursive relationships without any hassle of circular references
* And a lot more


## How To Use

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone git@github.com:soya-miruku/Treevial.git

# Go into the repository
$ cd Treevial

# Install dependencies
$ bun install

# Run the tests
$ bun run src/tests
```

## Usage

```ts
import { AdapterFactory, inferFull Treevial } from './surreal';

// first we will need to define a model, currently we can use the MultiDef class to do so (ideally it would be good to have a Define class which would be used to define a single model)

const schemas = Treevial.MultiDef(({ number, string, date, array, record, relation, object, enums }) => ({
  User: {
    id: string(), //ideally we should have an id type
    name: string(),
		email: string({ required: true, index: 'idx_user_email' }),
    password: string(),
		createdOn: date({ required: false, default: () => new Date() }),
    updatedAt: date(),
		posts: array(record(() => schemas.defs.post)),
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
  },
  Post: {
		id: string({ required: true }),
		createdOn: date({ required: false }),
		content: string({ required: false }),
  },
});

// if you want to infer the basic type/ full type of a model you can use the inferFull function or the inferBasic function and there are also a few more
type User = inferFull<typeof schemas.defined.user>;

// initialise the client (still need to work on creating a proper connection)
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

const client = await adapter.Connect({ ...schemas.defined }); //creates the client with all the schemas

// now we can use the client to do queries or whatever else, if you are familiar with Prisma, this works alot like that
--------------------------------------------
// FIND MANY
const user = await client.User.FindMany({
  select: {
    id: true,
    name: true,
    email: true,
    posts: {
      _count: true,
      as: 'postCount',
    },
    following: {
      _count: true,
      as: 'followingCount',
    },
  },
  where: {
    age: { gt: 10 },
  }
})

--------------------------------------------
// CREATE
const user = await client.User.Create({
  data: {
    name: 'myname',
    email: 'something@gmail.com',
  }
}) // fields marked as required will be (...well) required XD

```

## You may also like...

- [Lucid](https://github.com/itsezc/lucid) - A full fledged ORM for SurrealDB

## License

MIT

---

> GitHub [@soya-miruku](https://github.com/soya-miruku)
