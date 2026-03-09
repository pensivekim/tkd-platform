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

      // ─── Training Sessions ────────────────────────────────────────
      if (pathname === "/api/training") {
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT * FROM training_sessions ORDER BY created_at DESC LIMIT 50"
          ).all();
          return json(rows.results);
        }
        if (request.method === "POST") {
          const body = await request.json() as { instructor_name: string; title: string; poomsae_type: string; max_trainees?: number };
          const id = crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO training_sessions (id, instructor_name, title, poomsae_type, max_trainees) VALUES (?, ?, ?, ?, ?)"
          ).bind(id, body.instructor_name, body.title, body.poomsae_type, body.max_trainees ?? 30).run();
          return json({ id, instructor_name: body.instructor_name, title: body.title, poomsae_type: body.poomsae_type, status: "waiting" });
        }
      }

      // GET /api/training/:id
      const trainingMatch = pathname.match(/^\/api\/training\/([^/]+)$/);
      if (trainingMatch && request.method === "GET") {
        const id = trainingMatch[1];
        const row = await env.DB.prepare("SELECT * FROM training_sessions WHERE id = ?").bind(id).first();
        return row ? json(row) : error("Not found", 404);
      }

      // POST /api/training/:id/join
      const joinMatch = pathname.match(/^\/api\/training\/([^/]+)\/join$/);
      if (joinMatch && request.method === "POST") {
        const sessionId = joinMatch[1];
        const body = await request.json() as { trainee_name: string; dojang_name?: string };
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO training_participants (id, session_id, trainee_name, dojang_name) VALUES (?, ?, ?, ?)"
        ).bind(id, sessionId, body.trainee_name, body.dojang_name ?? "").run();
        return json({ id, session_id: sessionId, trainee_name: body.trainee_name });
      }

      // GET /api/training/:id/participants
      const participantsMatch = pathname.match(/^\/api\/training\/([^/]+)\/participants$/);
      if (participantsMatch && request.method === "GET") {
        const sessionId = participantsMatch[1];
        const rows = await env.DB.prepare(
          "SELECT * FROM training_participants WHERE session_id = ? ORDER BY joined_at ASC"
        ).bind(sessionId).all();
        return json(rows.results);
      }

      // Training signaling: GET + POST /api/training/:id/signal
      const signalMatch = pathname.match(/^\/api\/training\/([^/]+)\/signal$/);
      if (signalMatch) {
        const sessionId = signalMatch[1];

        if (request.method === "GET") {
          const toId = url.searchParams.get("to_id");
          const fromId = url.searchParams.get("from_id");
          const type = url.searchParams.get("type");
          const after = url.searchParams.get("after");

          if (!toId || !type) return error("to_id and type required", 400);

          if (type === "offer") {
            // Return all unprocessed offers sent to instructor
            const rows = await env.DB.prepare(
              "SELECT * FROM training_signals WHERE session_id = ? AND to_id = ? AND type = 'offer' ORDER BY created_at ASC"
            ).bind(sessionId, toId).all();
            return json(rows.results);
          }

          if (type === "answer") {
            const row = await env.DB.prepare(
              "SELECT * FROM training_signals WHERE session_id = ? AND to_id = ? AND from_id = ? AND type = 'answer' ORDER BY created_at DESC LIMIT 1"
            ).bind(sessionId, toId, fromId ?? "").first();
            return json(row || null);
          }

          if (type === "ice-candidate" || type === "ice-candidate-to-trainee") {
            const rows = await env.DB.prepare(
              "SELECT * FROM training_signals WHERE session_id = ? AND to_id = ? AND from_id = ? AND type = ? AND created_at > ? ORDER BY created_at ASC"
            ).bind(sessionId, toId, fromId ?? "", type, after ?? new Date(0).toISOString()).all();
            return json(rows.results);
          }

          return json([]);
        }

        if (request.method === "POST") {
          const body = await request.json() as { from_id: string; to_id: string; type: string; data: string };
          const id = crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO training_signals (id, session_id, from_id, to_id, type, data) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(id, sessionId, body.from_id, body.to_id, body.type, body.data).run();
          return json({ id });
        }
      }

      // PUT /api/training/:id/score
      const scoreMatch = pathname.match(/^\/api\/training\/([^/]+)\/score$/);
      if (scoreMatch && request.method === "PUT") {
        const sessionId = scoreMatch[1];
        const body = await request.json() as { participant_id: string; score: number };
        await env.DB.prepare(
          "UPDATE training_participants SET score = ? WHERE id = ? AND session_id = ?"
        ).bind(body.score, body.participant_id, sessionId).run();
        return json({ ok: true });
      }

      return error("Not found", 404);
    } catch (e) {
      console.error(e);
      return error(String(e));
    }
  },
};
