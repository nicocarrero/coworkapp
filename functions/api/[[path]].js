export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\//, ''); 
    const method = request.method;
  
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
  
    try {
      // 1. TURNOS (Appointments)
      if (path === "appointments") {
        if (method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM appointments").all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
        if (method === "POST") {
          const data = await request.json();
          await env.DB.prepare(
            `INSERT INTO appointments (id, patientId, patientName, patientPhone, date, time, category, variant, price, duration, status, professionalId, customInstructions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
             status=excluded.status, date=excluded.date, time=excluded.time, customInstructions=excluded.customInstructions`
          ).bind(data.id, data.patientId, data.patientName, data.patientPhone, data.date, data.time, data.category, data.variant, data.price, data.duration, data.status, data.professionalId, data.customInstructions).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
  
      // 2. PACIENTES (Patients)
      if (path === "patients") {
        if (method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM patients").all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
        if (method === "POST") {
          const data = await request.json();
          await env.DB.prepare(
            `INSERT INTO patients (id, name, phone, email, notes, instagram) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone, email=excluded.email, notes=excluded.notes, instagram=excluded.instagram`
          ).bind(data.id, data.name, data.phone, data.email, data.notes, data.instagram).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
  
      // 3. HISTORIAL CLÍNICO (Treatment History)
      if (path === "history") {
        if (method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM treatment_history").all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
        if (method === "POST") {
          const data = await request.json();
          await env.DB.prepare(
            `INSERT INTO treatment_history (id, patientId, date, professionalId, professionalName, category, variant, notes, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(data.id, data.patientId, data.date, data.professionalId, data.professionalName, data.category, data.variant, data.notes, data.attachments).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
  
      // 4. CATEGORÍAS
      if (path === "categories") {
        if (method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM categories").all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
        if (method === "POST") {
          const data = await request.json();
          for (const cat of data) {
            await env.DB.prepare("INSERT INTO categories (id, name, color) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color").bind(cat.id, cat.name, cat.color).run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
  
      return new Response("Ruta no encontrada", { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  }