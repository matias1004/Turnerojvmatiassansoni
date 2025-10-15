// ========= Turnero · Sansoni =========
// DOM + Eventos + LocalStorage (sin consola)

(() => {
  // ------ State & Constantes ------
  const LS_KEY = "turnero:turnos";
  /** @type {Array<{id:string,nombre:string,telefono:string,servicio:string,fecha:string,hora:string,notas:string,estado:'pendiente'|'completado'|'cancelado'}>} */
  let turnos = [];

  // ------ DOM refs ------
  const form = document.getElementById("turnoForm");
  const turnoId = document.getElementById("turnoId");
  const nombre = document.getElementById("nombre");
  const telefono = document.getElementById("telefono");
  const servicio = document.getElementById("servicio");
  const fecha = document.getElementById("fecha");
  const hora = document.getElementById("hora");
  const notas = document.getElementById("notas");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnReset = document.getElementById("btnReset");
  const formTitle = document.getElementById("formTitle");

  const q = document.getElementById("q");
  const fFecha = document.getElementById("fFecha");
  const fEstado = document.getElementById("fEstado");

  const list = document.getElementById("turnoList");
  const empty = document.getElementById("emptyState");

  const statTotal = document.getElementById("statTotal");
  const statPend = document.getElementById("statPend");
  const statComp = document.getElementById("statComp");
  const statCanc = document.getElementById("statCanc");

  const btnExport = document.getElementById("btnExport");
  const inputImport = document.getElementById("inputImport");
  const btnClearAll = document.getElementById("btnClearAll");
  const toast = document.getElementById("toast");

  // ------ Utilidades ------
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(turnos));
  const load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      turnos = raw ? JSON.parse(raw) : [];
    } catch { turnos = []; }
  };
  const showToast = (msg, type = "info") => {
    toast.textContent = msg;
    toast.style.background = type === "ok" ? "#dcfce7"
      : type === "warn" ? "#fef9c3"
      : type === "err" ? "#fee2e2" : "#dbeafe";
    toast.style.borderColor = type === "ok" ? "#86efac"
      : type === "warn" ? "#fde047"
      : type === "err" ? "#fecaca" : "#93c5fd";
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  // Validación básica
  const validar = (data) => {
    const errors = [];
    if (!data.nombre.trim()) errors.push("Ingresá el nombre.");
    if (!data.telefono.trim()) errors.push("Ingresá el teléfono.");
    if (!data.servicio) errors.push("Seleccioná el servicio.");
    if (!data.fecha) errors.push("Seleccioná la fecha.");
    if (!data.hora) errors.push("Seleccioná la hora.");
    // Chequeo de solapado (mismo servicio + fecha + hora, salvo si es edición y soy el mismo id)
    const solapa = turnos.find(t =>
      t.servicio === data.servicio && t.fecha === data.fecha && t.hora === data.hora && t.id !== data.id && t.estado !== "cancelado"
    );
    if (solapa) errors.push("Ya existe un turno para ese servicio, fecha y hora.");
    return errors;
  };

  // ------ Render ------
  const renderStats = () => {
    statTotal.textContent = turnos.length;
    statPend.textContent = turnos.filter(t => t.estado === "pendiente").length;
    statComp.textContent = turnos.filter(t => t.estado === "completado").length;
    statCanc.textContent = turnos.filter(t => t.estado === "cancelado").length;
  };

  const badge = (estado) => {
    const map = { pendiente: "badge--pend", completado: "badge--comp", cancelado: "badge--canc" };
    return `<span class="badge ${map[estado]}">${estado}</span>`;
  };

  const matchesFilters = (t) => {
    const term = q.value.trim().toLowerCase();
    const byText = !term || t.nombre.toLowerCase().includes(term) || t.telefono.toLowerCase().includes(term);
    const byFecha = !fFecha.value || t.fecha === fFecha.value;
    const byEstado = !fEstado.value || t.estado === fEstado.value;
    return byText && byFecha && byEstado;
  };

  const renderList = () => {
    list.innerHTML = "";
    const filtered = turnos.filter(matchesFilters).sort((a,b) => (a.fecha+a.hora).localeCompare(b.fecha+b.hora));
    if (filtered.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    const frag = document.createDocumentFragment();
    filtered.forEach(t => {
      const li = document.createElement("li");
      li.className = "item";
      li.dataset.id = t.id;
      li.innerHTML = `
        <div class="item__row">
          <div class="item__title">${t.nombre} · ${t.telefono}</div>
          <div class="item__meta">
            <span>🗓️ ${t.fecha}</span>
            <span>⏰ ${t.hora}</span>
            <span>💼 ${t.servicio}</span>
            ${badge(t.estado)}
          </div>
          ${t.notas ? `<div class="item__meta">📝 ${t.notas}</div>` : ""}
        </div>
        <div class="item__actions">
          <button class="btn btn--ok" data-action="done">✔️</button>
          <button class="btn btn--warn" data-action="edit">✏️</button>
          <button class="btn btn--danger" data-action="cancel">🗑️</button>
        </div>
      `;
      frag.appendChild(li);
    });
    list.appendChild(frag);
    renderStats();
  };

  const resetForm = () => {
    turnoId.value = "";
    form.reset();
    btnSubmit.textContent = "➕ Agendar";
    formTitle.textContent = "Nuevo turno";
  };

  // ------ CRUD ------
  const addTurno = (data) => {
    turnos.push(data);
    save(); renderList();
  };

  const updateTurno = (data) => {
    const idx = turnos.findIndex(t => t.id === data.id);
    if (idx >= 0) {
      turnos[idx] = data;
      save(); renderList();
    }
  };

  const setEstado = (id, estado) => {
    const t = turnos.find(x => x.id === id);
    if (!t) return;
    t.estado = estado;
    save(); renderList();
  };

  // ------ Eventos ------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      id: turnoId.value || uid(),
      nombre: nombre.value.trim(),
      telefono: telefono.value.trim(),
      servicio: servicio.value,
      fecha: fecha.value,
      hora: hora.value,
      notas: notas.value.trim(),
      estado: turnoId.value ? (turnos.find(t => t.id === turnoId.value)?.estado || "pendiente") : "pendiente",
    };
    const errs = validar(data);
    if (errs.length) {
      showToast(errs[0], "warn");
      return;
    }
    if (turnoId.value) {
      updateTurno(data);
      showToast("Turno actualizado ✔️", "ok");
    } else {
      addTurno(data);
      showToast("Turno agendado ✔️", "ok");
    }
    resetForm();
  });

  btnReset.addEventListener("click", resetForm);

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const li = e.target.closest(".item");
    const id = li?.dataset.id;
    const action = btn.dataset.action;

    if (action === "edit") {
      const t = turnos.find(x => x.id === id);
      if (!t) return;
      turnoId.value = t.id;
      nombre.value = t.nombre;
      telefono.value = t.telefono;
      servicio.value = t.servicio;
      fecha.value = t.fecha;
      hora.value = t.hora;
      notas.value = t.notas;
      btnSubmit.textContent = "💾 Guardar cambios";
      formTitle.textContent = "Editar turno";
      showToast("Editando turno…");
    }
    if (action === "cancel") {
      setEstado(id, "cancelado");
      showToast("Turno cancelado 🗑️", "warn");
    }
    if (action === "done") {
      setEstado(id, "completado");
      showToast("Turno completado ✔️", "ok");
    }
  });

  [q, fFecha, fEstado].forEach(el => el.addEventListener("input", renderList));

  btnExport.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(turnos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "turnos.json";
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
    showToast("Exportado como turnos.json", "ok");
  });

  inputImport.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Formato inválido");
        // Sanitizar
        turnos = data.map(t => ({
          id: t.id || uid(),
          nombre: String(t.nombre || ""),
          telefono: String(t.telefono || ""),
          servicio: String(t.servicio || ""),
          fecha: String(t.fecha || ""),
          hora: String(t.hora || ""),
          notas: String(t.notas || ""),
          estado: ["pendiente","completado","cancelado"].includes(t.estado) ? t.estado : "pendiente"
        }));
        save(); renderList();
        showToast("Importación exitosa ✔️", "ok");
      } catch {
        showToast("Archivo inválido", "err");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  btnClearAll.addEventListener("click", () => {
    if (!confirm("¿Borrar TODOS los turnos?")) return;
    turnos = []; save(); renderList(); resetForm();
    showToast("Base de turnos vaciada", "warn");
  });

  // ------ Init ------
  load();
  renderList();

  // Sugerencia UX: poner min de fecha = hoy
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  fecha.min = `${yyyy}-${mm}-${dd}`;
})();
