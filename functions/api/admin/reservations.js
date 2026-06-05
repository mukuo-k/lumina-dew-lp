const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

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

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  if (!env.DB) {
    return json({ ok: false, message: "D1 database binding DB is not configured." }, 500);
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const status = url.searchParams.get("status") || "";

  let query =
    `SELECT
      id,
      name,
      email,
      skin_concern AS skinConcern,
      product_interest AS productInterest,
      message,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM reservations`;
  const binds = [];

  if (status) {
    query += " WHERE status = ?";
    binds.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  binds.push(limit);

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json({ ok: true, reservations: results || [] });
}
