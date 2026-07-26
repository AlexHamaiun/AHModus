import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type DatabaseExecutor = Pick<NodePgDatabase, 'delete' | 'insert' | 'select' | 'update'>;

export {type DatabaseExecutor};
