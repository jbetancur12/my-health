import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'notification_preferences' })
export class NotificationPreference {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', nullable: true })
  email?: string;

  @Property({ type: 'string', nullable: true })
  phone?: string;

  @Property({ type: 'boolean' })
  emailEnabled = false;

  @Property({ type: 'boolean' })
  smsEnabled = false;

  @Property({ type: 'boolean' })
  whatsappEnabled = false;

  @Property({ type: 'boolean' })
  whatsappOptIn = false;

  @Property({ type: 'json' })
  reminderDays: number[] = [7, 3, 1];

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt = new Date();
}
