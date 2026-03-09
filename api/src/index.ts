export interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function error(msg: string, status = 500) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // ─── Exam Sessions ────────────────────────────────────────────
      if (pathname === "/api/exam") {
        if (request.method === "GET") {
          const id = url.searchParams.get("id");
          if (id) {
            const row = await env.DB.prepare("SELECT * FROM exam_sessions WHERE id = ?").bind(id).first();
            return row ? json(row) : error("Not found", 404);
          }
          const rows = await env.DB.prepare("SELECT * FROM exam_sessions ORDER BY created_at DESC LIMIT 50").all();
          return json(rows.results);
        }

        if (request.method === "POST") {
          const body = await request.json() as { examiner_name: string; poomsae_type: string; dan_level: number };
          const id = crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO exam_sessions (id, examiner_name, poomsae_type, dan_level, status) VALUES (?, ?, ?, ?, 'waiting')"
          ).bind(id, body.examiner_name, body.poomsae_type, body.dan_level).run();
          return json({ id, ...body, status: "waiting" });
        }

        if (request.method === "PUT") {
          const body = await request.json() as Record<string, unknown>;
          const { id, ...updates } = body as { id: string } & Record<string, unknown>;
          const fields = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
          const values = Object.values(updates);
          if (updates.final_result) {
            await env.DB.prepare(
              `UPDATE exam_sessions SET ${fields}, completed_at = datetime('now'), status = 'completed' WHERE id = ?`
            ).bind(...values, id).run();
          } else {
            await env.DB.prepare(`UPDATE exam_sessions SET ${fields} WHERE id = ?`).bind(...values, id).run();
          }
          const updated = await env.DB.prepare("SELECT * FROM exam_sessions WHERE id = ?").bind(id).first();
          return json(updated);
        }
      }

      // ─── WebRTC Signaling ─────────────────────────────────────────
      if (pathname === "/api/webrtc/signal") {
        if (request.method === "GET") {
          const session_id = url.searchParams.get("session_id");
          if (!session_id) return error("session_id required", 400);

          const type = url.searchParams.get("type");
          const role = url.searchParams.get("role");
          const after = url.searchParams.get("after");

          if (after) {
            const rows = await env.DB.prepare(
              "SELECT * FROM webrtc_signals WHERE session_id = ? AND type = 'ice-candidate' AND role != ? AND created_at > ? ORDER BY created_at ASC"
            ).bind(session_id, role, after).all();
            return json(rows.results);
          }

          const row = await env.DB.prepare(
            "SELECT * FROM webrtc_signals WHERE session_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1"
          ).bind(session_id, type).first();
          return json(row || null);
        }

        if (request.method === "POST") {
          const body = await request.json() as { session_id: string; role: string; type: string; data: string };
          const id = crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO webrtc_signals (id, session_id, role, type, data) VALUES (?, ?, ?, ?, ?)"
          ).bind(id, body.session_id, body.role, body.type, body.data).run();
          return json({ id });
        }

        if (request.method === "DELETE") {
          const session_id = url.searchParams.get("session_id");
          if (!session_id) return error("session_id required", 400);
          await env.DB.prepare("DELETE FROM webrtc_signals WHERE session_id = ?").bind(session_id).run();
          return json({ ok: true });
        }
      }

      return error("Not found", 404);
    } catch (e) {
      console.error(e);
      return error(String(e));
    }
  },
};
