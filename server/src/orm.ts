import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import config from './mikro-orm.config.js';

let ormPromise: Promise<MikroORM> | undefined;

export function getOrm() {
  if (!ormPromise) {
    ormPromise = MikroORM.init(config);
  }

  return ormPromise;
}
