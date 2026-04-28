import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const BUCKET_NAME = 'make-342e1137-medical-files';

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage bucket on startup
async function initStorage() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      });

      if (createError && createError.message !== 'The resource already exists') {
        console.error('Error creating bucket:', createError.message);
      } else if (!createError) {
        console.log('Storage bucket created successfully');
      } else {
        console.log('Storage bucket already exists');
      }
    } else {
      console.log('Storage bucket already exists');
    }
  } catch (error) {
    console.log('Error initializing storage (non-critical):', error instanceof Error ? error.message : String(error));
  }
}

// Don't await - let it run in the background
initStorage().catch(console.error);

// Health check endpoint
app.get("/make-server-342e1137/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all appointments
app.get("/make-server-342e1137/appointments", async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:');
    return c.json({ appointments: appointments || [] });
  } catch (error) {
    console.log('Error fetching appointments from KV store:', error);
    return c.json({ error: 'Failed to fetch appointments', details: String(error) }, 500);
  }
});

// Save a new appointment
app.post("/make-server-342e1137/appointments", async (c) => {
  try {
    const appointmentData = await c.req.json();
    const appointmentId = crypto.randomUUID();

    const appointment = {
      id: appointmentId,
      ...appointmentData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`appointment:${appointmentId}`, appointment);

    return c.json({ appointment });
  } catch (error) {
    console.log('Error saving appointment to KV store:', error);
    return c.json({ error: 'Failed to save appointment', details: String(error) }, 500);
  }
});

// Get all controls
app.get("/make-server-342e1137/controls", async (c) => {
  try {
    const controls = await kv.getByPrefix('control:');
    return c.json({ controls: controls || [] });
  } catch (error) {
    console.log('Error fetching controls from KV store:', error);
    return c.json({ error: 'Failed to fetch controls', details: String(error) }, 500);
  }
});

// Save a new control
app.post("/make-server-342e1137/controls", async (c) => {
  try {
    const controlData = await c.req.json();
    const controlId = crypto.randomUUID();

    const control = {
      id: controlId,
      ...controlData,
      createdAt: new Date().toISOString()
    };

    await kv.set(`control:${controlId}`, control);

    return c.json({ control });
  } catch (error) {
    console.log('Error saving control to KV store:', error);
    return c.json({ error: 'Failed to save control', details: String(error) }, 500);
  }
});

// Upload file to Supabase Storage
app.post("/make-server-342e1137/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const appointmentId = formData.get('appointmentId') as string;
    const documentId = formData.get('documentId') as string;

    if (!file || !appointmentId || !documentId) {
      return c.json({ error: 'Missing required fields: file, appointmentId, or documentId' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${appointmentId}/${documentId}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.log('Error uploading file to Supabase Storage:', uploadError);
      return c.json({ error: 'Failed to upload file', details: uploadError.message }, 500);
    }

    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 315360000); // 10 years

    return c.json({ fileUrl: signedUrlData?.signedUrl });
  } catch (error) {
    console.log('Error in upload endpoint:', error);
    return c.json({ error: 'Failed to upload file', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);