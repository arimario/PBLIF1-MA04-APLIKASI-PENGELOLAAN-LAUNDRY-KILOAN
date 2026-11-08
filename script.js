const $ = (selector) => document.querySelector(selector);

let currentRole = "";
let customers = [
  { name: "Ari Mario", phone: "082168024195" },
  { name: "Zaskya Ramahdani", phone: "0882017702143" },
  { name: "Ariansyah Padillah", phone: "0895630963311" }
];
let services = [
  { name: "Cuci", price: 5000, days: 1 },
  { name: "Setrika", price: 4000, days: 1 },
  { name: "Cuci + Setrika", price: 8000, days: 2 }
];
let orders = [
  { code: "ORD-001", customer: "Ari Mario", service: "Cuci + Setrika", weight: 3, total: 24000, status: "Diterima", date: "2026-10-10" },
  { code: "ORD-002", customer: "Zaskya Ramahdani", service: "Cuci", weight: 5, total: 25000, status: "Dicuci", date: "2026-10-10" },
  { code: "ORD-003", customer: "Ariansyah Padillah", service: "Setrika", weight: 2, total: 8000, status: "Selesai", date: "2026-10-11" }
];

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = $("#username").value.trim();
  const password = $("#password").value;
  if (password === "123" && ["pemilik", "petugas"].includes(username.toLowerCase())) {
    currentRole = username.toLowerCase();
    $("#roleLabel").textContent = currentRole === "pemilik" ? "Pemilik" : "Petugas Laundry";
    $("#loginPage").classList.add("hidden");
    $("#appPage").classList.remove("hidden");
    document.querySelectorAll(".owner-only").forEach(el => {
      el.classList.toggle("hidden", currentRole !== "pemilik");
    });
    renderPage("dashboard");
  } else {
    $("#loginError").textContent = "Username atau password salah. Gunakan akun demo yang tersedia.";
  }
});

$("#logoutBtn").addEventListener("click", () => {
  $("#appPage").classList.add("hidden");
  $("#loginPage").classList.remove("hidden");
  $("#loginForm").reset();
  $("#loginError").textContent = "";
});

$("#navigation").addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;
  if (button.dataset.page === "reports" && currentRole !== "pemilik") return;
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
  renderPage(button.dataset.page);
});

function money(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
function statusTag(status) {
  return `<span class="status ${status}">${status}</span>`;
}
function renderPage(page) {
  const titles = { dashboard: "Dashboard", orders: "Order Laundry", customers: "Data Pelanggan", services: "Jenis Layanan", reports: "Laporan Pendapatan" };
  $("#pageTitle").textContent = titles[page] || "Dashboard";
  const content = $("#pageContent");
  if (page === "dashboard") {
    const income = orders.reduce((sum, order) => sum + order.total, 0);
    content.innerHTML = `
      <div class="cards">
        <div class="stat-card"><p>Total Pelanggan</p><strong>${customers.length}</strong></div>
        <div class="stat-card"><p>Total Order</p><strong>${orders.length}</strong></div>
        <div class="stat-card"><p>Total Pendapatan</p><strong>${money(income)}</strong></div>
        <div class="stat-card"><p>Order Selesai</p><strong>${orders.filter(o => o.status === "Selesai" || o.status === "Diambil").length}</strong></div>
      </div>
      <div class="panel"><h2>Order Terbaru</h2>${ordersTable(orders.slice().reverse())}</div>
      <p class="notice">Selamat datang, ${currentRole === "pemilik" ? "Pemilik" : "Petugas Laundry"}. Data yang tampil adalah data contoh dan tersimpan sementara di memori browser.</p>`;
  } else if (page === "orders") {
    content.innerHTML = `
      <div class="panel">
        <div class="toolbar"><h2>Daftar Order</h2><button id="showOrderForm">+ Tambah Order</button></div>
        <input id="orderSearch" placeholder="Cari kode order, nama pelanggan, atau status">
        <div id="ordersTable">${ordersTable(orders)}</div>
      </div>
      <div id="orderFormPanel" class="panel hidden">
        <h2>Tambah Order Laundry</h2>
        <form id="orderForm">
          <div class="form-grid">
            <div><label for="orderCustomer">Pelanggan</label><select id="orderCustomer" required>${customers.map(c => `<option>${escapeHtml(c.name)}</option>`).join("")}</select></div>
            <div><label for="orderService">Layanan</label><select id="orderService">${services.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} — ${money(s.price)}/kg</option>`).join("")}</select></div>
            <div><label for="orderWeight">Berat (kg)</label><input id="orderWeight" type="number" min="0.1" step="0.1" required></div>
            <div><label for="orderDate">Tanggal masuk</label><input id="orderDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>
          </div>
          <div class="form-actions"><button type="submit">Simpan Order</button><button type="button" id="cancelOrder" class="secondary">Batal</button></div>
        </form>
      </div>`;
    $("#showOrderForm").addEventListener("click", () => $("#orderFormPanel").classList.remove("hidden"));
    $("#cancelOrder").addEventListener("click", () => $("#orderFormPanel").classList.add("hidden"));
    $("#orderForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const customer = $("#orderCustomer").value;
      const serviceName = $("#orderService").value;
      const service = services.find(s => s.name === serviceName);
      const weight = Number($("#orderWeight").value);
      orders.push({ code: `ORD-${String(orders.length + 1).padStart(3, "0")}`, customer, service: serviceName, weight, total: Math.round(weight * service.price), status: "Diterima", date: $("#orderDate").value });
      renderPage("orders");
    });
    $("#orderSearch").addEventListener("input", () => {
      const query = $("#orderSearch").value.toLowerCase();
      $("#ordersTable").innerHTML = ordersTable(orders.filter(o => `${o.code} ${o.customer} ${o.status} ${o.date}`.toLowerCase().includes(query)));
      attachStatusHandlers();
    });
    attachStatusHandlers();
  } else if (page === "customers") {
    content.innerHTML = `
      <div class="panel">
        <div class="toolbar"><h2>Data Pelanggan</h2><button id="showCustomerForm">+ Tambah Pelanggan</button></div>
        <div id="customerTable">${customersTable()}</div>
      </div>
      <div id="customerFormPanel" class="panel hidden">
        <h2>Tambah Pelanggan</h2>
        <form id="customerForm" class="form-grid">
          <div><label for="customerName">Nama lengkap</label><input id="customerName" required></div>
          <div><label for="customerPhone">Nomor HP</label><input id="customerPhone" type="tel" required></div>
          <div class="form-actions"><button type="submit">Simpan</button></div>
        </form>
      </div>`;
    $("#showCustomerForm").addEventListener("click", () => $("#customerFormPanel").classList.remove("hidden"));
    $("#customerForm").addEventListener("submit", event => {
      event.preventDefault();
      customers.push({ name: $("#customerName").value.trim(), phone: $("#customerPhone").value.trim() });
      renderPage("customers");
    });
  } else if (page === "services") {
    content.innerHTML = `
      <div class="panel">
        <div class="toolbar"><h2>Daftar Jenis Layanan</h2><button id="showServiceForm">+ Tambah Layanan</button></div>
        <div id="serviceTable">${servicesTable()}</div>
      </div>
      <div id="serviceFormPanel" class="panel hidden">
        <h2>Tambah Layanan</h2>
        <form id="serviceForm" class="form-grid">
          <div><label for="serviceName">Nama layanan</label><input id="serviceName" required></div>
          <div><label for="servicePrice">Harga per kg (Rp)</label><input id="servicePrice" type="number" min="0" required></div>
          <div><label for="serviceDays">Estimasi hari</label><input id="serviceDays" type="number" min="1" required></div>
          <div class="form-actions"><button type="submit">Simpan</button></div>
        </form>
      </div>`;
    $("#showServiceForm").addEventListener("click", () => $("#serviceFormPanel").classList.remove("hidden"));
    $("#serviceForm").addEventListener("submit", event => {
      event.preventDefault();
      services.push({ name: $("#serviceName").value.trim(), price: Number($("#servicePrice").value), days: Number($("#serviceDays").value) });
      renderPage("services");
    });
  } else if (page === "reports") {
    if (currentRole !== "pemilik") { renderPage("dashboard"); return; }
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    content.innerHTML = `<div class="cards">
      <div class="stat-card"><p>Total Pendapatan</p><strong>${money(total)}</strong></div>
      <div class="stat-card"><p>Total Order</p><strong>${orders.length}</strong></div>
      <div class="stat-card"><p>Rata-rata per Order</p><strong>${money(orders.length ? total / orders.length : 0)}</strong></div>
      <div class="stat-card"><p>Order Diambil</p><strong>${orders.filter(o => o.status === "Diambil").length}</strong></div>
    </div><div class="panel"><h2>Rincian Pendapatan</h2>${ordersTable(orders)}</div>`;
  }
}

function ordersTable(list) {
  if (!list.length) return "<p>Belum ada data order.</p>";
  return `<table><thead><tr><th>Kode</th><th>Pelanggan</th><th>Layanan</th><th>Berat</th><th>Total</th><th>Status</th>${currentRole === "pemilik" || currentRole === "petugas" ? "<th>Aksi</th>" : ""}</tr></thead><tbody>
  ${list.map(o => `<tr><td>${escapeHtml(o.code)}</td><td>${escapeHtml(o.customer)}</td><td>${escapeHtml(o.service)}</td><td>${o.weight} kg</td><td>${money(o.total)}</td><td>${statusTag(o.status)}</td><td><select class="status-select" data-code="${escapeHtml(o.code)}" aria-label="Ubah status ${escapeHtml(o.code)}">${["Diterima","Dicuci","Selesai","Diambil"].map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")}
  </tbody></table>`;
}
function customersTable() {
  return `<table><thead><tr><th>No.</th><th>Nama Pelanggan</th><th>Nomor HP</th></tr></thead><tbody>${customers.map((c,i) => `<tr><td>${i+1}</td><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.phone)}</td></tr>`).join("")}</tbody></table>`;
}
function servicesTable() {
  return `<table><thead><tr><th>No.</th><th>Nama Layanan</th><th>Harga/kg</th><th>Estimasi</th></tr></thead><tbody>${services.map((s,i) => `<tr><td>${i+1}</td><td>${escapeHtml(s.name)}</td><td>${money(s.price)}</td><td>${s.days} hari</td></tr>`).join("")}</tbody></table>`;
}
function attachStatusHandlers() {
  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", () => {
      const order = orders.find(o => o.code === select.dataset.code);
      if (order) order.status = select.value;
      const table = $("#ordersTable");
      if (table) {
        const query = ($("#orderSearch")?.value || "").toLowerCase();
        table.innerHTML = ordersTable(orders.filter(o => `${o.code} ${o.customer} ${o.status} ${o.date}`.toLowerCase().includes(query)));
        attachStatusHandlers();
      }
    });
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
