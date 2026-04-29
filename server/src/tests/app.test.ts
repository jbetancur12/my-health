import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../app/create-app.js';
import type { AppointmentPayload, NotificationPreferencePayload } from '../../../shared/contracts/http.js';

async function withTestServer(
  run: (baseUrl: string) => Promise<void>,
) {
  const app = createApp({
    clientOrigin: 'http://localhost:5173',
    nodeEnv: 'test',
    uploadsRoot: path.join(os.tmpdir(), 'citasmedicas-test-uploads'),
  });

  const server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test('GET /health returns status and environment', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as { status: string; environment: string };

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: 'ok', environment: 'test' });
  });
});

test('POST /api/appointments rejects invalid payloads before touching persistence', async () => {
  await withTestServer(async (baseUrl) => {
    const invalidPayload: Partial<AppointmentPayload> = {
      date: new Date().toISOString(),
      specialty: 'Cardiologia',
      documents: [],
    };

    const response = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const body = (await response.json()) as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'Appointment doctor is required');
  });
});

test('PUT /api/notification-preferences rejects invalid reminder day values', async () => {
  await withTestServer(async (baseUrl) => {
    const invalidPayload: NotificationPreferencePayload = {
      email: 'test@example.com',
      phone: '3001234567',
      emailEnabled: true,
      smsEnabled: false,
      reminderDays: [7, Number.NaN],
    };

    const response = await fetch(`${baseUrl}/api/notification-preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const body = (await response.json()) as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'Notification reminderDays must contain numbers');
  });
});
