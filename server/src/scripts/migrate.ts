import 'dotenv/config';
import { getOrm } from '../orm.js';

async function main() {
  const orm = await getOrm();
  const command = process.argv[2] ?? 'up';
  const name = process.argv[3];

  try {
    if (process.env.NODE_ENV !== 'production') {
      await orm.getSchemaGenerator().ensureDatabase();
    }

    const migrator = orm.getMigrator();

    if (command === 'up') {
      await migrator.up();
      console.log('Migrations applied successfully.');
      return;
    }

    if (command === 'down') {
      await migrator.down();
      console.log('Migration rollback completed.');
      return;
    }

    if (command === 'create') {
      const result = await migrator.createMigration(undefined, false, false, name);
      console.log(`Migration created: ${result.fileName}`);
      return;
    }

    throw new Error(`Unsupported migration command: ${command}`);
  } finally {
    await orm.close(true);
  }
}

main().catch((error) => {
  console.error('Migration command failed:', error);
  process.exit(1);
});
