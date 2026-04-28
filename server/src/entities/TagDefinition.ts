import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'tag_definitions' })
export class TagDefinition {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  color!: string;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();
}
