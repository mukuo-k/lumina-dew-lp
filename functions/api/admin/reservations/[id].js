const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const allowedStatuses = new Set(["new", "contacted", "archived"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function authorized(request, env) {
  const token = env.ADMIN_TOKEN;
  const auth = request.headers.get("authorization") || "";
  return Boolean(token && auth === `Bearer ${token}`);
}

export async function onRequestPatch({ request, env, params }) {
  if (!authorized(request, env)) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  if (!env.DB) {
    return json({ ok: false, message: "D1 database binding DB is not configured." }, 500);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ ok: false, message: "Invalid reservation id." }, 400);
  }

  const payload = await request.json();
  const status = typeof payload.status === "string" ? payload.status : "";

  if (!allowedStatuses.has(status)) {
    return json({ ok: false, message: "Invalid status." }, 400);
  }

  await env.DB.prepare(
    "UPDATE reservations SET status = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(status, id)
    .run();

  return json({ ok: true });
}
