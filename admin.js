const loginForm = document.querySelector("[data-admin-login]");
const tokenInput = document.querySelector("[data-admin-token]");
const tableBody = document.querySelector("[data-reservations]");
const statusFilter = document.querySelector("[data-status-filter]");
const notice = document.querySelector("[data-admin-notice]");
const refreshButton = document.querySelector("[data-refresh]");

const tokenKey = "lumina_admin_token";

function setNotice(message, type = "info") {
  notice.textContent = message;
  notice.dataset.type = type;
}

function getToken() {
  return sessionStorage.getItem(tokenKey) || "";
}

function setToken(token) {
  sessionStorage.setItem(tokenKey, token);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]
  ));
}

function statusLabel(status) {
  if (status === "contacted") return "対応済み";
  if (status === "archived") return "保留";
  return "新規";
}

async function requestAdmin(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "管理APIの取得に失敗しました。");
  }
  return data;
}

function renderRows(reservations) {
  if (!reservations.length) {
    tableBody.innerHTML = '<tr><td colspan="7">まだ送信はありません。</td></tr>';
    return;
  }

  tableBody.innerHTML = reservations
    .map((reservation) => `
      <tr>
        <td>#${reservation.id}</td>
        <td>${escapeHtml(reservation.createdAt)}</td>
        <td>
          <strong>${escapeHtml(reservation.name)}</strong><br />
          <span>${escapeHtml(reservation.email)}</span>
        </td>
        <td>${escapeHtml(reservation.skinConcern)}</td>
        <td>${escapeHtml(reservation.productInterest)}</td>
        <td>${escapeHtml(reservation.message || "-")}</td>
        <td>
          <select data-status="${reservation.id}">
            ${["new", "contacted", "archived"]
              .map((status) => `<option value="${status}" ${status === reservation.status ? "selected" : ""}>${statusLabel(status)}</option>`)
              .join("")}
          </select>
        </td>
      </tr>
    `)
    .join("");
}

async function loadReservations() {
  setNotice("読み込み中です...");
  const params = new URLSearchParams({ limit: "80" });
  if (statusFilter.value) params.set("status", statusFilter.value);
  const data = await requestAdmin(`/api/admin/reservations?${params.toString()}`);
  renderRows(data.reservations || []);
  setNotice("送信内容を読み込みました。", "success");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setToken(tokenInput.value.trim());
  try {
    await loadReservations();
  } catch (error) {
    setNotice(error.message, "error");
  }
});

refreshButton.addEventListener("click", () => {
  loadReservations().catch((error) => setNotice(error.message, "error"));
});

statusFilter.addEventListener("change", () => {
  loadReservations().catch((error) => setNotice(error.message, "error"));
});

tableBody.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-status]");
  if (!select) return;

  try {
    await requestAdmin(`/api/admin/reservations/${select.dataset.status}`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value }),
    });
    setNotice("ステータスを更新しました。", "success");
  } catch (error) {
    setNotice(error.message, "error");
  }
});

if (getToken()) {
  tokenInput.value = getToken();
  loadReservations().catch((error) => setNotice(error.message, "error"));
}
