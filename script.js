const STORAGE_KEY = "ocorrencias_v1";
      let records = [];
      let editingId = null;
      let activeFilter = "todos";
      let searchTerm = "";
      let sortMode = "newer";
      let currentPage = 1;
      const itemsPerPage = 5;

      function load() {
        try {
          records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
          records = [];
        }
      }
      function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      }
      function genId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      }

      function fmtDate(d) {
        if (!d) return null;
        const [y, m, dia] = d.split("-");
        return `${dia}/${m}/${y}`;
      }
      function fmtVal(v) {
        if (v === "" || v === null || v === undefined || isNaN(v)) return null;
        return (
          "R$ " +
          parseFloat(v).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
      function statusLabel(s) {
        return (
          {
            pendente: "Pendente",
            andamento: "Em andamento",
            urgente: "Urgente",
            resolvido: "Resolvido",
          }[s] || s
        );
      }

      function today() {
        return new Date().toISOString().slice(0, 10);
      }

      function toast(msg, type = "success") {
        const el = document.getElementById("toast");
        const icon = document.getElementById("toast-icon");
        document.getElementById("toast-msg").textContent = msg;
        el.className = `toast ${type} show`;
        if (type === "success")
          icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        else
          icon.innerHTML =
            '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
        setTimeout(() => el.classList.remove("show"), 2800);
      }

      function updateStats() {
        document.getElementById("stat-total").textContent = records.length;
        document.getElementById("stat-pendente").textContent = records.filter(
          (r) => r.status === "pendente",
        ).length;
        document.getElementById("stat-urgente").textContent = records.filter(
          (r) => r.status === "urgente",
        ).length;
      }

      function getFiltered() {
        let r = [...records];
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          r = r.filter((x) => x.cliente.toLowerCase().includes(s));
        }
        if (activeFilter !== "todos")
          r = r.filter((x) => x.status === activeFilter);
        if (sortMode === "newer") r.sort((a, b) => b.id.localeCompare(a.id));
        else if (sortMode === "older")
          r.sort((a, b) => a.id.localeCompare(b.id));
        else if (sortMode === "client")
          r.sort((a, b) => a.cliente.localeCompare(b.cliente, "pt-BR"));
        return r;
      }

  function render() {
  const filtered = getFiltered();
  const list = document.getElementById("list");
  const cnt = document.getElementById("search-count");
  const pagination = document.getElementById("pagination");

  cnt.textContent = `${filtered.length} registro${filtered.length !== 1 ? "s" : ""}`;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
      <strong>${searchTerm || activeFilter !== "todos" ? "Nenhum resultado encontrado" : "Nenhuma ocorrência cadastrada"}</strong>
      <p>${searchTerm ? "Tente outro nome de cliente." : activeFilter !== "todos" ? "Sem registros com esse filtro." : "Use o painel ao lado para adicionar a primeira ocorrência."}</p>
    </div>`;

    pagination.innerHTML = "";
    updateStats();
    return;
  }

  list.innerHTML = paginated
    .map((r) => {
      const val = fmtVal(r.valor);
      const dateFmt = fmtDate(r.data);
      const retFmt = fmtDate(r.retorno);

      return `<div class="occ-card status-${r.status}" data-id="${r.id}">
        <div class="occ-top">
          <div class="occ-client">${esc(r.cliente)}</div>
          <div class="occ-actions">
            <button class="btn btn-ghost" title="Editar" onclick="openEdit('${r.id}')">
              <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger" title="Excluir" onclick="deleteRec('${r.id}')">
              <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>

        <div class="occ-desc">${esc(r.desc)}</div>

        <div class="occ-meta">
          <span class="badge badge-${r.status}">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ${statusLabel(r.status)}
          </span>

          ${
            dateFmt
              ? `<span class="badge badge-date">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${dateFmt}
              </span>`
              : ""
          }

          ${
            val
              ? `<span class="badge badge-value">
                <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                ${val}
              </span>`
              : ""
          }

          ${
            retFmt
              ? `<span class="badge badge-return">
                <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Retorno: ${retFmt}
              </span>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");

  pagination.innerHTML = `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
      Anterior
    </button>

    <span>Página ${currentPage} de ${totalPages}</span>

    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
      Próxima
    </button>
  `;

  updateStats();
}

      function changePage(page) {
  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  render();
}

      function esc(str) {
        return (str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      // SAVE
      document.getElementById("btn-salvar").addEventListener("click", () => {
        const cliente = document.getElementById("f-cliente").value.trim();
        const desc = document.getElementById("f-desc").value.trim();
        const valor = document.getElementById("f-valor").value;
        const status = document.getElementById("f-status").value;
        const data = document.getElementById("f-data").value;
        const retorno = document.getElementById("f-retorno").value;

        if (!cliente) {
          toast("Informe o nome do cliente.", "error");
          document.getElementById("f-cliente").focus();
          return;
        }
        if (!desc) {
          toast("Informe a descrição da ocorrência.", "error");
          document.getElementById("f-desc").focus();
          return;
        }
        if (!data) {
          toast("Informe a data da ocorrência.", "error");
          document.getElementById("f-data").focus();
          return;
        }

        const rec = {
          id: genId(),
          cliente,
          desc,
          valor: valor !== "" ? parseFloat(valor) : "",
          status,
          data,
          retorno,
          criadoEm: new Date().toISOString(),
        };
        records.unshift(rec);
        save();
        render();

        document.getElementById("f-cliente").value = "";
        document.getElementById("f-desc").value = "";
        document.getElementById("f-valor").value = "";
        document.getElementById("f-status").value = "pendente";
        document.getElementById("f-data").value = "";
        document.getElementById("f-retorno").value = "";
        document.getElementById("f-cliente").focus();
        toast("Ocorrência salva com sucesso!");
      });

      // DELETE
      window.deleteRec = function (id) {
        if (!confirm("Deseja excluir esta ocorrência?")) return;
        records = records.filter((r) => r.id !== id);
        save();
        render();
        toast("Ocorrência excluída.");
      };

      // EDIT
      window.openEdit = function (id) {
        const r = records.find((x) => x.id === id);
        if (!r) return;
        editingId = id;
        document.getElementById("e-cliente").value = r.cliente;
        document.getElementById("e-desc").value = r.desc;
        document.getElementById("e-valor").value =
          r.valor !== "" ? r.valor : "";
        document.getElementById("e-status").value = r.status;
        document.getElementById("e-data").value = r.data;
        document.getElementById("e-retorno").value = r.retorno || "";
        document.getElementById("modal").classList.add("open");
      };

      document
        .getElementById("modal-close")
        .addEventListener("click", closeModal);
      document.getElementById("modal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeModal();
      });
      function closeModal() {
        document.getElementById("modal").classList.remove("open");
        editingId = null;
      }

      document.getElementById("btn-update").addEventListener("click", () => {
        const cliente = document.getElementById("e-cliente").value.trim();
        const desc = document.getElementById("e-desc").value.trim();
        if (!cliente || !desc) {
          toast("Preencha os campos obrigatórios.", "error");
          return;
        }
        const idx = records.findIndex((r) => r.id === editingId);
        if (idx === -1) return;
        const valor = document.getElementById("e-valor").value;
        records[idx] = {
          ...records[idx],
          cliente,
          desc,
          valor: valor !== "" ? parseFloat(valor) : "",
          status: document.getElementById("e-status").value,
          data: document.getElementById("e-data").value,
          retorno: document.getElementById("e-retorno").value,
        };
        save();
        render();
        closeModal();
        toast("Ocorrência atualizada!");
      });

      // SEARCH
      
      // FILTER TABS
      document.getElementById("filter-tabs").addEventListener("click", (e) => {
        const tab = e.target.closest(".filter-tab");
        if (!tab) return;
        document
          .querySelectorAll(".filter-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        activeFilter = tab.dataset.filter;
currentPage = 1;
render();
      });

      // SORT
      document.getElementById("sort-select").addEventListener("change", (e) => {
        sortMode = e.target.value;
currentPage = 1;
render();
      });

// EXPORTAR BACKUP
document.getElementById('btn-exportar').addEventListener('click', () => {
  const dados = localStorage.getItem(STORAGE_KEY) || '[]';

  const hoje = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `backup-ocorrencias-${hoje}.json`;

  const blob = new Blob([dados], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);

  toast('Backup exportado com sucesso!');
});

// IMPORTAR BACKUP
document.getElementById('input-importar').addEventListener('change', (event) => {
  const arquivo = event.target.files[0];

  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function(e) {
    try {
      const dadosImportados = JSON.parse(e.target.result);

      if (!Array.isArray(dadosImportados)) {
        toast('Arquivo de backup inválido.', 'error');
        return;
      }

      const confirmar = confirm(
        'Deseja importar este backup? Isso vai substituir os registros atuais.'
      );

      if (!confirmar) return;

      records = dadosImportados;
      save();
      render();

      toast('Backup importado com sucesso!');
    } catch (erro) {
      toast('Erro ao importar o backup.', 'error');
    }
  };

  leitor.readAsText(arquivo);

  event.target.value = '';
});

      // INIT
      document.getElementById("f-data").value = today();
      load();
      render();
