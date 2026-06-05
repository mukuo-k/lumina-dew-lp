const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const allowedSkinConcerns = new Set(["乾燥", "ハリ不足", "乾燥くすみ印象", "キメの乱れ"]);
const allowedProducts = new Set(["Day Serum", "Night Serum", "Ritual Set"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function boolValue(value) {
  return value === "on" || value === "true" || value === true || value === "1";
}

async function readPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function validate(payload) {
  const botField = textValue(payload["bot-field"] || payload.botField);
  if (botField) {
    return { spam: true };
  }

  const reservation = {
    name: textValue(payload.name),
    email: textValue(payload.email).toLowerCase(),
    skinConcern: textValue(payload["skin-concern"] || payload.skinConcern),
    productInterest: textValue(payload["product-interest"] || payload.productInterest),
    message: textValue(payload.message).slice(0, 2000),
    demoConfirmation: boolValue(payload["demo-confirmation"] || payload.demoConfirmation),
  };

  const errors = [];
  if (!reservation.name || reservation.name.length > 120) errors.push("お名前を入力してください。");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservation.email)) errors.push("メールアドレスを確認してください。");
  if (!allowedSkinConcerns.has(reservation.skinConcern)) errors.push("気になる肌印象を選択してください。");
  if (!allowedProducts.has(reservation.productInterest)) errors.push("気になるアイテムを選択してください。");
  if (!reservation.demoConfirmation) errors.push("見本用LPであることの確認が必要です。");

  return { reservation, errors };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ ok: false, message: "D1 database binding DB is not configured." }, 500);
  }

  const payload = await readPayload(request);
  const result = validate(payload);

  if (result.spam) {
    return json({ ok: true });
  }

  if (result.errors?.length) {
    return json({ ok: false, errors: result.errors }, 400);
  }

  const { reservation } = result;
  const insert = await env.DB.prepare(
    `INSERT INTO reservations
      (name, email, skin_concern, product_interest, message, demo_confirmation, user_agent, cf_country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      reservation.name,
      reservation.email,
      reservation.skinConcern,
      reservation.productInterest,
      reservation.message,
      reservation.demoConfirmation ? 1 : 0,
      request.headers.get("user-agent") || "",
      request.cf?.country || ""
    )
    .run();

  const id = insert.meta.last_row_id;
  return json({ ok: true, id }, 201);
}
