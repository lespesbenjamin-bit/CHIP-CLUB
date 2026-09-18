/* ============================================================
   CHIP CLUB — app.js
   Router + vues + logique d'interface.
   ============================================================ */

const $app = () => document.getElementById("app");
const fmt = (n, d = 1) => (n == null || isNaN(n) ? "—" : n.toFixed(d).replace(".", ","));
const fmtEUR = (n) => (n == null || isNaN(n) ? "—" : n.toFixed(2).replace(".", ",") + " €");
const escapeHTML = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const App = {
  wizard: null, // état volatile de la dégustation en cours

  init() {
    Store.load();
    window.addEventListener("hashchange", () => this.route());
    this.route();
  },

  route() {
    const hash = location.hash.slice(1) || "/";
    const parts = hash.split("/").filter(Boolean);
    window.scrollTo(0, 0);
    this.closeMenu();

    if (parts.length === 0) return this.renderDashboard();
    if (parts[0] === "soiree" && parts[1] === "new") return this.renderSoireeNew();
    if (parts[0] === "soiree" && parts[2] === "deguster") return this.renderDegustation(parts[1]);
    if (parts[0] === "soiree" && parts[1]) return this.renderSoireeRecap(parts[1]);
    if (parts[0] === "soirees") return this.renderSoireesList();
    if (parts[0] === "chips") return this.renderChipsList();
    if (parts[0] === "chip" && parts[1]) return this.renderChipDetail(parts[1]);
    if (parts[0] === "classement") return this.renderClassement();
    if (parts[0] === "halloffame") return this.renderHallOfFame();
    if (parts[0] === "degustateurs") return this.renderDegustateursList();
    if (parts[0] === "degustateur" && parts[1]) return this.renderProfil(parts[1]);
    if (parts[0] === "battle") return this.renderBattle();
    if (parts[0] === "stats") return this.renderStats();
    if (parts[0] === "settings") return this.renderSettings();
    return this.renderDashboard();
  },

  setNav(active) {
    document.querySelectorAll(".navbtn").forEach((b) => b.classList.toggle("active", b.dataset.nav === active));
  },
  closeMenu() {
    const m = document.getElementById("sideMenu");
    if (m) m.classList.remove("open");
    const ov = document.getElementById("menuOverlay");
    if (ov) ov.classList.remove("open");
  },
  toggleMenu() {
    document.getElementById("sideMenu").classList.toggle("open");
    document.getElementById("menuOverlay").classList.toggle("open");
  },

  /* ============================================================
     DASHBOARD
     ============================================================ */
  renderDashboard() {
    this.setNav("home");
    const stats = Calc.statsGlobales();
    const hof = Calc.hallOfFame();
    const podium = Calc.classement("note").slice(0, 3);
    const noData = stats.nbChips === 0;

    $app().innerHTML = `
      <div class="topbar">
        <button class="iconbtn" onclick="App.toggleMenu()">☰</button>
        <div class="brand"><span class="brand-title">CHIP CLUB</span><span class="brand-sub">Le classement très sérieux de chips pas très sérieuses.</span></div>
      </div>

      <div class="page">
        ${noData ? `
        <div class="card empty-card">
          <div class="empty-emoji">🥔</div>
          <h3>Bienvenue au club</h3>
          <p>Aucune chips dégustée pour l'instant. Lancez votre première soirée, ou chargez des données de démo pour explorer l'application.</p>
          <button class="btn btn-primary" onclick="location.hash='#/soiree/new'">+ Nouvelle dégustation</button>
          <button class="btn btn-ghost" onclick="App.loadDemo()">Charger des données de démo</button>
        </div>` : `
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-num">${stats.nbChips}</div><div class="stat-label">Chips dégustées</div></div>
          <div class="stat-tile"><div class="stat-num">${stats.nbSoirees}</div><div class="stat-label">Soirées</div></div>
          <div class="stat-tile"><div class="stat-num">${Store.getDegustateurs().length}</div><div class="stat-label">Dégustateurs</div></div>
          <div class="stat-tile"><div class="stat-num">${stats.nbMarques}</div><div class="stat-label">Marques testées</div></div>
        </div>
        <div class="avg-banner">
          <div class="avg-label">Note moyenne globale</div>
          <div class="avg-value">${fmt(stats.noteMoyenne)}<span>/10</span></div>
        </div>

        <div class="cta-row">
          <button class="btn btn-primary btn-lg" onclick="location.hash='#/soiree/new'">+ Nouvelle dégustation</button>
          <button class="btn btn-secondary btn-lg" onclick="location.hash='#/classement'">🏆 Voir le classement</button>
        </div>

        ${podium.length ? `<h3 class="section-title">Podium actuel</h3>${this.podiumHTML(podium)}` : ""}

        ${hof ? `
        <h3 class="section-title">En bref</h3>
        <div class="hof-grid">
          ${this.hofTile("🥇", "Meilleure de tous les temps", hof.meilleure)}
          ${this.hofTile("💀", "Pire chips", hof.pire)}
          ${this.hofTile("🔥", "Plus addictive", hof.addictive)}
          ${this.hofTile("🤯", "Plus originale", hof.originale)}
          ${this.hofTile("⚔️", "Divise le plus", hof.controversee)}
        </div>` : ""}
        `}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  hofTile(emoji, label, row) {
    if (!row) return "";
    return `<div class="hof-tile" onclick="location.hash='#/chip/${row.chip.id}'">
      <div class="hof-emoji">${emoji}</div>
      <div class="hof-label">${label}</div>
      <div class="hof-name">${escapeHTML(row.chip.marque)} — ${escapeHTML(row.chip.saveurLabel)}</div>
      <div class="hof-note">${fmt(row.note)}/10</div>
    </div>`;
  },

  podiumHTML(rows) {
    const p = [rows[1], rows[0], rows[2]]; // ordre visuel 2-1-3
    const heights = ["podium-2", "podium-1", "podium-3"];
    const medals = ["🥈", "🥇", "🥉"];
    return `<div class="podium">
      ${p.map((r, i) => r ? `
        <div class="podium-col ${heights[i]}" onclick="location.hash='#/chip/${r.chip.id}'">
          <div class="podium-medal">${medals[i]}</div>
          <div class="podium-card">
            <div class="podium-brand">${escapeHTML(r.chip.marque)}</div>
            <div class="podium-flavor">${escapeHTML(r.chip.saveurLabel)}</div>
            <div class="podium-note">${fmt(r.note)}</div>
          </div>
          <div class="podium-block"></div>
        </div>` : `<div class="podium-col ${heights[i]}"></div>`).join("")}
    </div>`;
  },

  loadDemo() {
    Demo.load();
    this.route();
  },

  /* ============================================================
     SOIRÉE — Création
     ============================================================ */
  renderSoireeNew() {
    this.setNav("");
    const tasters = Store.getDegustateurs();
    $app().innerHTML = `
      ${this.header("Nouvelle soirée", true)}
      <div class="page">
        <div class="card">
          <label class="field-label">Nom de la soirée</label>
          <input class="input" id="f-nom" placeholder="Chip Night #${Store.getSoirees().length + 1}" value="Chip Night #${Store.getSoirees().length + 1}">

          <label class="field-label">Date</label>
          <input class="input" id="f-date" type="date" value="${new Date().toISOString().slice(0, 10)}">

          <label class="field-label">Participants</label>
          <div class="chip-select" id="f-participants">
            ${tasters.map((t) => `<button type="button" class="chip-opt" data-id="${t.id}" onclick="App.toggleChipOpt(this)">${t.avatarEmoji} ${escapeHTML(t.nom)}</button>`).join("")}
          </div>
          <div class="inline-add">
            <input class="input" id="f-newtaster" placeholder="Ajouter un dégustateur…">
            <button class="btn btn-small" onclick="App.addTasterInline()">Ajouter</button>
          </div>

          <label class="field-label">Mode de dégustation</label>
          <div class="mode-select" id="f-mode">
            ${MODES_DEGUSTATION.map((m, i) => `
              <button type="button" class="mode-opt ${i === 0 ? "active" : ""}" data-id="${m.id}" onclick="App.selectMode(this)">
                <div class="mode-title">${m.label}</div>
                <div class="mode-desc">${m.description}</div>
              </button>`).join("")}
          </div>

          <button class="btn btn-primary btn-lg btn-block" onclick="App.startSoiree()">Commencer la dégustation</button>
        </div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  toggleChipOpt(btn) { btn.classList.toggle("active"); },
  selectMode(btn) {
    btn.parentElement.querySelectorAll(".mode-opt").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  },
  addTasterInline() {
    const input = document.getElementById("f-newtaster");
    const nom = input.value.trim();
    if (!nom) return;
    const t = Store.addDegustateur(nom);
    input.value = "";
    const container = document.getElementById("f-participants");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip-opt active";
    btn.dataset.id = t.id;
    btn.textContent = `${t.avatarEmoji} ${t.nom}`;
    btn.onclick = () => this.toggleChipOpt(btn);
    container.appendChild(btn);
  },

  startSoiree() {
    const nom = document.getElementById("f-nom").value.trim() || "Chip Night";
    const date = document.getElementById("f-date").value;
    const participantsIds = [...document.querySelectorAll("#f-participants .chip-opt.active")].map((b) => b.dataset.id);
    const mode = document.querySelector("#f-mode .mode-opt.active").dataset.id;
    if (!participantsIds.length) { alert("Sélectionne au moins un participant."); return; }
    const soiree = Store.addSoiree({ nom, date, participantsIds, mode });
    location.hash = `#/soiree/${soiree.id}/deguster`;
  },

  /* ============================================================
     DÉGUSTATION — flow d'ajout de chips + notation
     ============================================================ */
  renderDegustation(soireeId) {
    const soiree = Store.getSoiree(soireeId);
    if (!soiree) return this.renderDashboard();
    this.setNav("taste");

    if (this.wizard && this.wizard.soireeId === soireeId && this.wizard.step) {
      return this.renderWizardStep();
    }

    const degs = Store.getDegustationsBySoiree(soireeId);
    $app().innerHTML = `
      ${this.header(soiree.nom, true, `#/soiree/${soireeId}`)}
      <div class="page">
        <div class="card session-card">
          <div class="session-meta">
            <span>${soiree.date}</span>
            <span>${soiree.participantsIds.length} dégustateurs</span>
            <span class="badge ${soiree.mode === "aveugle" ? "badge-blind" : ""}">${soiree.mode === "aveugle" ? "À l'aveugle" : "Classique"}</span>
          </div>
          <div class="session-count">${degs.length} paquet${degs.length > 1 ? "s" : ""} dégusté${degs.length > 1 ? "s" : ""}</div>
        </div>

        ${degs.length ? `<div class="tasting-list">
          ${degs.map((d) => {
            const chip = Store.getChip(d.chipId);
            const note = Calc.noteChipClub(d.id);
            return `<div class="tasting-row">
              <div class="tr-name">${chip.marque} — ${d.revele || soiree.mode !== "aveugle" ? chip.saveurLabel : "🙈 caché"}</div>
              <div class="tr-note">${note != null ? fmt(note) : "…"}</div>
            </div>`;
          }).join("")}
        </div>` : `<p class="muted">Aucun paquet ajouté pour l'instant.</p>`}

        <button class="btn btn-primary btn-lg btn-block" onclick="App.newChipFlow('${soireeId}')">+ Ajouter un paquet à déguster</button>
        ${degs.length ? `<button class="btn btn-secondary btn-lg btn-block" onclick="location.hash='#/soiree/${soireeId}'">Terminer la soirée — voir le récap</button>` : ""}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  newChipFlow(soireeId) {
    this.wizard = { soireeId, step: "chipform" };
    this.renderWizardStep();
  },

  renderWizardStep() {
    const w = this.wizard;
    if (w.step === "chipform") return this.renderChipForm();
    if (w.step === "rating") return this.renderRatingStep();
    if (w.step === "reveal") return this.renderRevealStep();
  },

  cancelWizard() {
    const soireeId = this.wizard ? this.wizard.soireeId : null;
    this.wizard = null;
    location.hash = soireeId ? `#/soiree/${soireeId}/deguster` : "#/";
    this.route();
  },

  renderChipForm() {
    const allSaveurs = Store.getAllSaveurs();
    const allFamilles = Store.getAllFamilles();
    const saveursByFamille = {};
    allSaveurs.forEach((s) => {
      const fam = labelOf(FAMILLES_SAVEUR, s.familleId, "Autre");
      saveursByFamille[fam] = saveursByFamille[fam] || [];
      saveursByFamille[fam].push(s);
    });

    $app().innerHTML = `
      ${this.header("Nouveau paquet", true, null, () => this.cancelWizard())}
      <div class="page">
        <div class="card">
          <h3 class="form-section-title">📸 Identité</h3>
          <label class="field-label">Photo du paquet</label>
          <div class="photo-upload" id="photo-zone" onclick="document.getElementById('f-photo').click()">
            <span id="photo-placeholder">+ Ajouter une photo</span>
            <img id="photo-preview" style="display:none">
          </div>
          <input type="file" id="f-photo" accept="image/*" style="display:none" onchange="App.previewPhoto(event)">

          <label class="field-label">Marque *</label>
          <input class="input" id="f-marque" placeholder="Ex : Lay's" list="marques-list">
          <datalist id="marques-list">${Store.getMarques().map((m) => `<option value="${escapeHTML(m.nom)}">`).join("")}</datalist>

          <label class="field-label">Nom commercial</label>
          <input class="input" id="f-nomcommercial" placeholder="Ex : Strong">

          <label class="field-label">Saveur *</label>
          <select class="input" id="f-saveur">
            <option value="">— Choisir —</option>
            ${Object.entries(saveursByFamille).map(([fam, list]) => `
              <optgroup label="${fam}">
                ${list.map((s) => `<option value="${s.id}">${escapeHTML(s.label)}</option>`).join("")}
              </optgroup>`).join("")}
            <option value="__new__">+ Ajouter une saveur personnalisée</option>
          </select>

          <label class="field-label">Gamme (optionnel)</label>
          <input class="input" id="f-gamme" placeholder="Ex : Édition limitée">

          <label class="field-label">Pays d'origine</label>
          <input class="input" id="f-pays" placeholder="Ex : France">

          <label class="field-label">Magasin d'achat</label>
          <input class="input" id="f-magasin" placeholder="Ex : Carrefour">

          <div class="field-row">
            <div>
              <label class="field-label">Prix (€)</label>
              <input class="input" id="f-prix" type="number" step="0.01" min="0" placeholder="2.49">
            </div>
            <div>
              <label class="field-label">Poids (g)</label>
              <input class="input" id="f-poids" type="number" step="1" min="0" placeholder="150">
            </div>
          </div>
          <div class="price100g" id="price100g">Prix / 100g : —</div>

          <h3 class="form-section-title">🗂️ Classification</h3>
          <label class="field-label">Famille</label>
          <select class="input" id="f-famille">
            <option value="">— Choisir —</option>
            ${allFamilles.map((f) => `<option value="${f.id}">${f.emoji} ${escapeHTML(f.label)}</option>`).join("")}
            <option value="__new__">+ Créer une catégorie personnalisée</option>
          </select>

          <label class="field-label">Forme / découpe</label>
          <select class="input" id="f-forme">
            <option value="">— Optionnel —</option>
            ${FORMES.map((f) => `<option value="${f.id}">${escapeHTML(f.label)}</option>`).join("")}
          </select>

          <label class="field-label">Type de cuisson</label>
          <select class="input" id="f-cuisson">
            <option value="">— Optionnel —</option>
            ${CUISSONS.map((c) => `<option value="${c.id}">${escapeHTML(c.label)}</option>`).join("")}
          </select>

          <label class="field-label">Niveau de piquant</label>
          <input type="range" class="slider" id="f-piquant" min="0" max="5" step="1" value="0" oninput="document.getElementById('piquant-label').textContent = App.piquantLabel(this.value)">
          <div class="slider-value" id="piquant-label">${NIVEAUX_PIQUANT[0].label}</div>

          <button class="btn btn-primary btn-lg btn-block" onclick="App.confirmChipForm()">Commencer la dégustation</button>
        </div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
    document.getElementById("f-prix").addEventListener("input", this.updatePrice100g);
    document.getElementById("f-poids").addEventListener("input", this.updatePrice100g);
    document.getElementById("f-saveur").addEventListener("change", (e) => {
      if (e.target.value === "__new__") {
        const label = prompt("Nom de la nouvelle saveur :");
        if (!label) { e.target.value = ""; return; }
        const famLabel = prompt("Famille de saveur (ex: Épicé, Fromage, Premium, WTF...) :", "WTF");
        let fam = FAMILLES_SAVEUR.find((f) => f.label.toLowerCase().includes((famLabel || "").toLowerCase()));
        const sv = Store.addSaveurPerso(label, fam ? fam.id : "wtf");
        const opt = document.createElement("option");
        opt.value = sv.id; opt.textContent = sv.label; opt.selected = true;
        e.target.insertBefore(opt, e.target.lastElementChild);
      }
    });
    document.getElementById("f-famille").addEventListener("change", (e) => {
      if (e.target.value === "__new__") {
        const label = prompt("Nom de la nouvelle catégorie :");
        if (!label) { e.target.value = ""; return; }
        const f = Store.addFamillePerso(label);
        const opt = document.createElement("option");
        opt.value = f.id; opt.textContent = "❓ " + f.label; opt.selected = true;
        e.target.insertBefore(opt, e.target.lastElementChild);
      }
    });
  },

  piquantLabel(v) { return NIVEAUX_PIQUANT[+v].label + " " + NIVEAUX_PIQUANT[+v].emoji; },

  updatePrice100g() {
    const prix = parseFloat(document.getElementById("f-prix").value);
    const poids = parseFloat(document.getElementById("f-poids").value);
    const el = document.getElementById("price100g");
    if (prix && poids) {
      el.textContent = "Prix / 100g : " + fmtEUR((prix / poids) * 100);
    } else {
      el.textContent = "Prix / 100g : —";
    }
  },

  previewPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById("photo-preview");
      img.src = ev.target.result;
      img.style.display = "block";
      document.getElementById("photo-placeholder").style.display = "none";
      this._pendingPhoto = ev.target.result;
    };
    reader.readAsDataURL(file);
  },

  confirmChipForm() {
    const marque = document.getElementById("f-marque").value.trim();
    const saveurId = document.getElementById("f-saveur").value;
    if (!marque) return alert("La marque est obligatoire.");
    if (!saveurId || saveurId === "__new__") return alert("Choisis une saveur.");

    Store.addMarque(marque);
    const saveur = Store.getAllSaveurs().find((s) => s.id === saveurId);

    const chip = Store.addChip({
      photo: this._pendingPhoto || null,
      marque,
      nomCommercial: document.getElementById("f-nomcommercial").value.trim(),
      saveurId,
      saveurLabel: saveur.label,
      saveurFamilleId: saveur.familleId,
      gamme: document.getElementById("f-gamme").value.trim(),
      paysOrigine: document.getElementById("f-pays").value.trim(),
      magasin: document.getElementById("f-magasin").value.trim(),
      prix: parseFloat(document.getElementById("f-prix").value) || null,
      poids: parseFloat(document.getElementById("f-poids").value) || null,
      familleId: document.getElementById("f-famille").value || null,
      formeId: document.getElementById("f-forme").value || null,
      cuissonId: document.getElementById("f-cuisson").value || null,
      piquant: +document.getElementById("f-piquant").value
    });
    this._pendingPhoto = null;

    const soiree = Store.getSoiree(this.wizard.soireeId);
    const degustation = Store.addDegustation({ soireeId: soiree.id, chipId: chip.id });

    this.wizard = {
      soireeId: soiree.id, step: "rating",
      degustationId: degustation.id,
      chipId: chip.id,
      participants: soiree.participantsIds.slice(),
      participantIndex: 0,
      criteriaIndex: 0,
      bonusIndex: 0,
      current: this.emptyNote()
    };
    this.renderRatingStep();
  },

  emptyNote() {
    return { criteres: {}, racheter: null, survie: null, contextes: [], commentaire: "" };
  },

  /* ---------- Étapes de notation (progressives) ---------- */
  renderRatingStep() {
    const w = this.wizard;
    const soiree = Store.getSoiree(w.soireeId);
    const chip = Store.getChip(w.chipId);
    const tasterId = w.participants[w.participantIndex];
    const taster = Store.getDegustateur(tasterId);
    const totalSteps = CRITERES.length + 4; // critères + racheter + survie + contextes + commentaire
    const step = w.criteriaIndex; // 0..totalSteps-1
    const progressPct = Math.round((step / totalSteps) * 100);

    const showIdentity = soiree.mode !== "aveugle";

    let bodyHTML = "";
    if (step < CRITERES.length) {
      const c = CRITERES[step];
      const val = w.current.criteres[c.id] ?? 5;
      bodyHTML = `
        <div class="rate-question">
          <div class="rate-label">${escapeHTML(c.label)}</div>
          ${c.description ? `<div class="rate-desc">${escapeHTML(c.description)}</div>` : ""}
          <div class="rate-value" id="rate-value">${fmt(val)}</div>
          <input type="range" class="slider big" min="0" max="10" step="0.5" value="${val}" id="rate-slider"
            oninput="document.getElementById('rate-value').textContent = (+this.value).toFixed(1).replace('.', ',')">
        </div>
        <button class="btn btn-primary btn-lg btn-block" onclick="App.submitCriterion('${c.id}')">Suivant →</button>
      `;
    } else if (step === CRITERES.length) {
      bodyHTML = `
        <div class="rate-question">
          <div class="rate-label">Tu rachètes ?</div>
          <div class="option-grid">
            ${RACHETER_OPTIONS.map((o) => `<button class="option-btn" onclick="App.submitRacheter('${o.id}')"><span class="opt-emoji">${o.emoji}</span>${o.label}</button>`).join("")}
          </div>
        </div>
      `;
    } else if (step === CRITERES.length + 1) {
      bodyHTML = `
        <div class="rate-question">
          <div class="rate-label">Le paquet survit combien de temps ?</div>
          <div class="option-grid vertical">
            ${SURVIE_PAQUET.map((o) => `<button class="option-btn" onclick="App.submitSurvie(${o.valeur})">${o.valeur} — ${o.label}</button>`).join("")}
          </div>
        </div>
      `;
    } else if (step === CRITERES.length + 2) {
      bodyHTML = `
        <div class="rate-question">
          <div class="rate-label">Avec quoi tu la manges ?</div>
          <div class="chip-select" id="ctx-select">
            ${CONTEXTES.map((c) => `<button type="button" class="chip-opt" data-id="${c.id}" onclick="App.toggleChipOpt(this)">${escapeHTML(c.label)}</button>`).join("")}
          </div>
          <button class="btn btn-primary btn-lg btn-block" onclick="App.submitContextes()">Suivant →</button>
        </div>
      `;
    } else {
      bodyHTML = `
        <div class="rate-question">
          <div class="rate-label">Commentaire / punchline</div>
          <textarea class="input textarea" id="f-commentaire" placeholder="Le poulet n'a visiblement pas été consulté pour cette recette…"></textarea>
          <button class="btn btn-primary btn-lg btn-block" onclick="App.submitCommentaire()">Valider ma dégustation</button>
        </div>
      `;
    }

    $app().innerHTML = `
      ${this.header(`${taster.avatarEmoji} ${escapeHTML(taster.nom)} note`, true, null, () => this.cancelWizard())}
      <div class="page">
        <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
        ${showIdentity ? `<div class="chip-mini-card">
          <div class="cmc-brand">${escapeHTML(chip.marque)} ${chip.nomCommercial ? "— " + escapeHTML(chip.nomCommercial) : ""}</div>
          <div class="cmc-flavor">${escapeHTML(chip.saveurLabel)}</div>
        </div>` : `<div class="chip-mini-card blind">🙈 Dégustation à l'aveugle</div>`}
        <div class="card rate-card">
          ${bodyHTML}
        </div>
      </div>
    `;
  },

  submitCriterion(critereId) {
    const val = +document.getElementById("rate-slider").value;
    this.wizard.current.criteres[critereId] = val;
    this.wizard.criteriaIndex++;
    this.renderRatingStep();
  },
  submitRacheter(id) {
    this.wizard.current.racheter = id;
    this.wizard.criteriaIndex++;
    this.renderRatingStep();
  },
  submitSurvie(v) {
    this.wizard.current.survie = v;
    this.wizard.criteriaIndex++;
    this.renderRatingStep();
  },
  submitContextes() {
    const ids = [...document.querySelectorAll("#ctx-select .chip-opt.active")].map((b) => b.dataset.id);
    this.wizard.current.contextes = ids;
    this.wizard.criteriaIndex++;
    this.renderRatingStep();
  },
  submitCommentaire() {
    const w = this.wizard;
    w.current.commentaire = document.getElementById("f-commentaire").value.trim();

    Store.addNote({
      degustationId: w.degustationId,
      degustateurId: w.participants[w.participantIndex],
      criteres: w.current.criteres,
      racheter: w.current.racheter,
      survie: w.current.survie,
      contextes: w.current.contextes,
      commentaire: w.current.commentaire
    });

    if (w.participantIndex < w.participants.length - 1) {
      w.participantIndex++;
      w.criteriaIndex = 0;
      w.current = this.emptyNote();
      this.renderRatingStep();
    } else {
      w.step = "reveal";
      this.renderRevealStep();
    }
  },

  renderRevealStep() {
    const w = this.wizard;
    const soiree = Store.getSoiree(w.soireeId);
    const chip = Store.getChip(w.chipId);
    const note = Calc.noteChipClub(w.degustationId);
    const verdict = getVerdict(note);
    const isBlind = soiree.mode === "aveugle";
    const deg = Store.getDegustation(w.degustationId);

    const perParticipant = w.participants.map((id) => {
      const t = Store.getDegustateur(id);
      const m = Calc.degustateurMoyenne(w.degustationId, id);
      return { t, m };
    });

    $app().innerHTML = `
      ${this.header("Résultat", false)}
      <div class="page">
        <div class="card reveal-card">
          <div class="reveal-participants">
            ${perParticipant.map((p) => `<div class="rp-row"><span>${p.t.avatarEmoji} ${escapeHTML(p.t.nom)}</span><span>${fmt(p.m)}</span></div>`).join("")}
          </div>

          <div class="reveal-label">NOTE CHIP CLUB</div>
          <div class="reveal-note anim-pop">${fmt(note)}<span>/10</span></div>
          <div class="reveal-verdict">${verdict.emoji} ${verdict.label}</div>

          ${isBlind && !deg.revele ? `
            <div class="blind-box" id="blind-box">
              <div class="blind-hidden">🙈 Marque et saveur cachées</div>
              <button class="btn btn-primary btn-lg btn-block" onclick="App.revealChip()">👀 RÉVÉLER LA CHIPS</button>
            </div>
          ` : `
            <div class="reveal-identity anim-fadein">
              <div class="ri-brand">${escapeHTML(chip.marque)} ${chip.nomCommercial ? "— " + escapeHTML(chip.nomCommercial) : ""}</div>
              <div class="ri-flavor">${escapeHTML(chip.saveurLabel)}</div>
            </div>
          `}

          <button class="btn btn-secondary btn-lg btn-block" onclick="App.continueSoiree()">+ Ajouter un autre paquet</button>
          <button class="btn btn-ghost btn-block" onclick="App.finishSoireeFromWizard()">Terminer la soirée — voir le récap</button>
        </div>
      </div>
    `;
  },

  revealChip() {
    Store.revelerDegustation(this.wizard.degustationId);
    const box = document.getElementById("blind-box");
    box.classList.add("anim-fadeout");
    setTimeout(() => this.renderRevealStep(), 250);
  },

  continueSoiree() {
    const soireeId = this.wizard.soireeId;
    this.wizard = { soireeId, step: "chipform" };
    this.renderWizardStep();
  },
  finishSoireeFromWizard() {
    const soireeId = this.wizard.soireeId;
    this.wizard = null;
    location.hash = `#/soiree/${soireeId}`;
  },

  /* ============================================================
     LISTE SOIRÉES + RÉCAP
     ============================================================ */
  renderSoireesList() {
    this.setNav("");
    const soirees = Store.getSoirees();
    $app().innerHTML = `
      ${this.header("Soirées", true)}
      <div class="page">
        ${soirees.length ? soirees.map((s) => {
          const degs = Store.getDegustationsBySoiree(s.id);
          return `<div class="card list-card" onclick="location.hash='#/soiree/${s.id}'">
            <div class="lc-title">${escapeHTML(s.nom)}</div>
            <div class="lc-sub">${s.date} · ${degs.length} paquets · ${s.participantsIds.length} dégustateurs</div>
          </div>`;
        }).join("") : `<p class="muted">Aucune soirée pour l'instant.</p>`}
        <button class="btn btn-primary btn-lg btn-block" onclick="location.hash='#/soiree/new'">+ Nouvelle soirée</button>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  renderSoireeRecap(soireeId) {
    this.setNav("");
    const recap = Calc.recapSoiree(soireeId);
    if (!recap) return this.renderDashboard();
    const { soiree, rows } = recap;

    $app().innerHTML = `
      ${this.header(soiree.nom, true, "#/soirees")}
      <div class="page">
        <div class="card recap-header">
          <div class="recap-date">${soiree.date}</div>
          <div class="recap-stats">
            <span>${recap.nbParticipants} dégustateurs</span>
            <span>${recap.nbPaquets} paquets</span>
            <span>${recap.poidsTotalKg.toFixed(2)} kg testés</span>
          </div>
        </div>

        ${rows.length ? this.podiumHTML(rows.slice().sort((a, b) => b.note - a.note).slice(0, 3)) : ""}

        <div class="hof-grid">
          ${recap.accident ? this.hofTile("💀", "Accident industriel", recap.accident) : ""}
          ${recap.addictive ? this.hofTile("🔥", "Plus addictive", recap.addictive) : ""}
          ${recap.surprenante ? this.hofTile("🤯", "Plus surprenante", recap.surprenante) : ""}
          ${recap.debat ? this.hofTile("⚔️", "Plus gros débat", recap.debat) : ""}
          ${recap.qualitePrix ? this.hofTile("💰", "Meilleur qualité/prix", recap.qualitePrix) : ""}
        </div>

        <h3 class="section-title">Classement complet de la soirée</h3>
        ${this.rankTableHTML(rows.slice().sort((a, b) => b.note - a.note))}

        <button class="btn btn-primary btn-lg btn-block" onclick="location.hash='#/soiree/${soireeId}/deguster'">Continuer cette soirée</button>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  /* ============================================================
     LISTE DES CHIPS + DÉTAIL
     ============================================================ */
  renderChipsList() {
    this.setNav("chips");
    const chips = Store.getChips();
    const rows = Calc.allRows();
    const rowByChip = {};
    rows.forEach((r) => rowByChip[r.chip.id] = r);

    $app().innerHTML = `
      ${this.header("Toutes les chips", false)}
      <div class="page">
        <input class="input" id="chip-search" placeholder="🔍 Rechercher une marque, une saveur…" oninput="App.filterChipsList()">
        <div id="chips-grid" class="chips-grid">
          ${chips.map((c) => this.chipCardHTML(c, rowByChip[c.id])).join("")}
        </div>
        ${!chips.length ? `<p class="muted">Aucune chips enregistrée. Lance une dégustation pour commencer !</p>` : ""}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  chipCardHTML(chip, row) {
    const verdict = row ? getVerdict(row.note) : null;
    return `<div class="chip-card" data-search="${escapeHTML((chip.marque + " " + chip.saveurLabel + " " + (chip.nomCommercial || "")).toLowerCase())}" onclick="location.hash='#/chip/${chip.id}'">
      <div class="cc-photo">${chip.photo ? `<img src="${chip.photo}">` : `<span>🥔</span>`}</div>
      <div class="cc-body">
        <div class="cc-brand">${escapeHTML(chip.marque)}</div>
        <div class="cc-flavor">${escapeHTML(chip.saveurLabel)}</div>
        ${row ? `<div class="cc-note">${fmt(row.note)}/10 ${verdict.emoji}</div>` : `<div class="cc-note muted">Pas encore notée</div>`}
      </div>
    </div>`;
  },

  filterChipsList() {
    const q = document.getElementById("chip-search").value.toLowerCase();
    document.querySelectorAll("#chips-grid .chip-card").forEach((el) => {
      el.style.display = el.dataset.search.includes(q) ? "" : "none";
    });
  },

  renderChipDetail(chipId) {
    this.setNav("chips");
    const chip = Store.getChip(chipId);
    if (!chip) return this.renderChipsList();
    const row = Calc.battleRow(chipId);
    const deg = Store.getDegustations().find((d) => d.chipId === chipId);
    const notes = deg ? Store.getNotesByDegustation(deg.id) : [];

    $app().innerHTML = `
      ${this.header(chip.marque, true, "#/chips")}
      <div class="page">
        <div class="card chip-detail">
          <div class="cd-photo">${chip.photo ? `<img src="${chip.photo}">` : `<span>🥔</span>`}</div>
          <div class="cd-title">${escapeHTML(chip.marque)} ${chip.nomCommercial ? "— " + escapeHTML(chip.nomCommercial) : ""}</div>
          <div class="cd-flavor">${escapeHTML(chip.saveurLabel)} ${chip.gamme ? "· " + escapeHTML(chip.gamme) : ""}</div>

          ${row && row.note != null ? `
          <div class="reveal-note anim-pop small">${fmt(row.note)}<span>/10</span></div>
          <div class="reveal-verdict">${row.verdict.emoji} ${row.verdict.label}</div>
          <div class="criteria-bars">
            ${CRITERES.map((c) => `
              <div class="cbar-row">
                <span class="cbar-label">${c.label}</span>
                <div class="cbar-track"><div class="cbar-fill" style="width:${(row[c.id] || 0) * 10}%"></div></div>
                <span class="cbar-val">${fmt(row[c.id])}</span>
              </div>`).join("")}
          </div>` : `<p class="muted">Pas encore de note.</p>`}

          <div class="info-grid">
            <div><span>Famille</span><b>${labelOf(Store.getAllFamilles(), chip.familleId)}</b></div>
            <div><span>Forme</span><b>${labelOf(FORMES, chip.formeId, "—")}</b></div>
            <div><span>Cuisson</span><b>${labelOf(CUISSONS, chip.cuissonId, "—")}</b></div>
            <div><span>Piquant</span><b>${NIVEAUX_PIQUANT[chip.piquant || 0].emoji || "Aucun"}</b></div>
            <div><span>Pays</span><b>${escapeHTML(chip.paysOrigine) || "—"}</b></div>
            <div><span>Magasin</span><b>${escapeHTML(chip.magasin) || "—"}</b></div>
            <div><span>Prix</span><b>${fmtEUR(chip.prix)}</b></div>
            <div><span>Prix/100g</span><b>${fmtEUR(Calc.prixPour100g(chip))}</b></div>
          </div>

          ${notes.filter((n) => n.commentaire).length ? `
          <h3 class="form-section-title">💬 Commentaires</h3>
          ${notes.filter((n) => n.commentaire).map((n) => {
            const t = Store.getDegustateur(n.degustateurId);
            return `<div class="comment-row"><b>${t ? t.avatarEmoji + " " + escapeHTML(t.nom) : "?"}</b> — « ${escapeHTML(n.commentaire)} »</div>`;
          }).join("")}` : ""}
        </div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  /* ============================================================
     CLASSEMENT
     ============================================================ */
  renderClassement() {
    this.setNav("rank");
    const marques = [...new Set(Store.getChips().map((c) => c.marque))].sort();
    const familles = Store.getAllFamilles();
    const famillesSaveur = FAMILLES_SAVEUR;

    $app().innerHTML = `
      ${this.header("Classement", false)}
      <div class="page">
        <div class="filter-row">
          <select class="input select-sm" id="filter-sort" onchange="App.applyClassementFilters()">
            <option value="note">TOP global</option>
            <option value="gout">Goût</option>
            <option value="texture">Texture</option>
            <option value="addictivite">Addictivité</option>
            <option value="originalite">Originalité</option>
            <option value="qualite_prix">Rapport qualité/prix</option>
            <option value="intensite">Intensité</option>
            <option value="piquant">Piquant</option>
            <option value="prix100g">Prix</option>
            <option value="date">Date</option>
          </select>
          <select class="input select-sm" id="filter-marque" onchange="App.applyClassementFilters()">
            <option value="">Toutes les marques</option>
            ${marques.map((m) => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`).join("")}
          </select>
          <select class="input select-sm" id="filter-famille" onchange="App.applyClassementFilters()">
            <option value="">Toutes les familles</option>
            ${familles.map((f) => `<option value="${f.id}">${escapeHTML(f.label)}</option>`).join("")}
          </select>
          <select class="input select-sm" id="filter-famille-saveur" onchange="App.applyClassementFilters()">
            <option value="">Toutes saveurs (famille)</option>
            ${famillesSaveur.map((f) => `<option value="${f.id}">${escapeHTML(f.label)}</option>`).join("")}
          </select>
        </div>
        <div id="podium-zone"></div>
        <div id="rank-table"></div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
    this.applyClassementFilters();
  },

  applyClassementFilters() {
    const sort = document.getElementById("filter-sort").value;
    const marque = document.getElementById("filter-marque").value;
    const famille = document.getElementById("filter-famille").value;
    const familleSaveur = document.getElementById("filter-famille-saveur").value;
    const rows = Calc.classement(sort, famille || null, marque || null, familleSaveur || null);
    document.getElementById("podium-zone").innerHTML = rows.length >= 3 && sort === "note" ? this.podiumHTML(rows.slice(0, 3)) : "";
    document.getElementById("rank-table").innerHTML = rows.length ? this.rankTableHTML(rows) : `<p class="muted">Aucun résultat.</p>`;
  },

  rankTableHTML(rows) {
    return `<div class="rank-list">
      ${rows.map((r, i) => `
        <div class="rank-row" onclick="location.hash='#/chip/${r.chip.id}'">
          <div class="rank-pos">${i + 1}</div>
          <div class="rank-photo">${r.chip.photo ? `<img src="${r.chip.photo}">` : "🥔"}</div>
          <div class="rank-info">
            <div class="rank-brand">${escapeHTML(r.chip.marque)}</div>
            <div class="rank-flavor">${escapeHTML(r.chip.saveurLabel)}</div>
          </div>
          <div class="rank-note">${fmt(r.note)}</div>
        </div>
      `).join("")}
    </div>`;
  },

  /* ============================================================
     HALL OF FAME
     ============================================================ */
  renderHallOfFame() {
    this.setNav("");
    const hof = Calc.hallOfFame();
    $app().innerHTML = `
      ${this.header("🏛️ Chip Club Hall of Fame", false)}
      <div class="page">
        ${hof ? `
        <div class="hof-grid">
          ${this.hofTile("👑", "Meilleure de tous les temps", hof.meilleure)}
          ${this.hofTile("💀", "Pire chips de tous les temps", hof.pire)}
          ${this.hofTile("🔥", "Plus addictive", hof.addictive)}
          ${this.hofTile("🤯", "Plus originale", hof.originale)}
          ${this.hofTile("💰", "Meilleur rapport qualité/prix", hof.qualitePrix)}
          ${this.hofTile("😋", "Meilleur goût", hof.meilleurGout)}
          ${this.hofTile("🧱", "Meilleure texture", hof.meilleureTexture)}
          ${this.hofTile("🎯", "Saveur la plus fidèle", hof.plusFidele)}
          ${this.hofTile("🌶️", "Plus piquante", hof.plusPiquante)}
          ${this.hofTile("⚔️", "Plus controversée", hof.controversee)}
        </div>` : `<p class="muted">Pas encore assez de données pour établir le Hall of Fame.</p>`}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  /* ============================================================
     DÉGUSTATEURS
     ============================================================ */
  renderDegustateursList() {
    this.setNav("");
    const tasters = Store.getDegustateurs();
    const titres = Calc.titres();
    const titreParTaster = {};
    titres.forEach((t) => {
      titreParTaster[t.degustateur.id] = titreParTaster[t.degustateur.id] || [];
      titreParTaster[t.degustateur.id].push(t);
    });

    $app().innerHTML = `
      ${this.header("Dégustateurs", false)}
      <div class="page">
        ${titres.length ? `
        <h3 class="section-title">Titres du club</h3>
        <div class="titres-list">
          ${titres.map((t) => `<div class="titre-row"><span class="titre-emoji">${t.emoji}</span><div><div class="titre-label">${t.label}</div><div class="titre-name">${t.degustateur.avatarEmoji} ${escapeHTML(t.degustateur.nom)} · ${t.detail}</div></div></div>`).join("")}
        </div>` : ""}
        <h3 class="section-title">Profils</h3>
        <div class="tasters-grid">
          ${tasters.map((t) => `<div class="taster-card" onclick="location.hash='#/degustateur/${t.id}'">
            <div class="taster-avatar">${t.avatarEmoji}</div>
            <div class="taster-name">${escapeHTML(t.nom)}</div>
          </div>`).join("")}
        </div>
        ${!tasters.length ? `<p class="muted">Aucun dégustateur pour l'instant.</p>` : ""}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  renderProfil(id) {
    this.setNav("");
    const p = Calc.profil(id);
    const taster = Store.getDegustateur(id);
    if (!taster) return this.renderDegustateursList();

    $app().innerHTML = `
      ${this.header(taster.nom, true, "#/degustateurs")}
      <div class="page">
        <div class="card profil-header">
          <div class="profil-avatar">${taster.avatarEmoji}</div>
          <div class="profil-name">${escapeHTML(taster.nom)}</div>
          ${p ? `
          <div class="profil-stats">
            <div><b>${p.nbChips}</b><span>chips dégustées</span></div>
            <div><b>${fmt(p.moyenneDonnee)}</b><span>note moyenne donnée</span></div>
            <div><b>${Math.round(p.tauxRachat)}%</b><span>taux "je rachète"</span></div>
          </div>
          <div class="profil-prefs">
            <div>Saveur préférée : <b>${p.saveurPref ? escapeHTML(p.saveurPref.label) : "—"}</b></div>
            <div>Famille préférée : <b>${p.famillePref ? escapeHTML(p.famillePref.label) : "—"}</b></div>
            <div>Saveur la moins appréciée : <b>${p.saveurMoins ? escapeHTML(p.saveurMoins.label) : "—"}</b></div>
          </div>
          ` : `<p class="muted">Aucune dégustation enregistrée pour l'instant.</p>`}
        </div>

        ${p ? `
        <h3 class="section-title">🏆 Mon top 5</h3>
        <div class="rank-list">
          ${p.top5.map((r, i) => `<div class="rank-row" onclick="location.hash='#/chip/${r.chip.id}'">
            <div class="rank-pos">${i + 1}</div>
            <div class="rank-photo">${r.chip.photo ? `<img src="${r.chip.photo}">` : "🥔"}</div>
            <div class="rank-info"><div class="rank-brand">${escapeHTML(r.chip.marque)}</div><div class="rank-flavor">${escapeHTML(r.chip.saveurLabel)}</div></div>
            <div class="rank-note">${fmt(r.moyenne)}</div>
          </div>`).join("")}
        </div>

        <h3 class="section-title">💀 Mon flop 5</h3>
        <div class="rank-list">
          ${p.flop5.map((r, i) => `<div class="rank-row" onclick="location.hash='#/chip/${r.chip.id}'">
            <div class="rank-pos">${i + 1}</div>
            <div class="rank-photo">${r.chip.photo ? `<img src="${r.chip.photo}">` : "🥔"}</div>
            <div class="rank-info"><div class="rank-brand">${escapeHTML(r.chip.marque)}</div><div class="rank-flavor">${escapeHTML(r.chip.saveurLabel)}</div></div>
            <div class="rank-note">${fmt(r.moyenne)}</div>
          </div>`).join("")}
        </div>

        <h3 class="section-title">Mes saveurs préférées</h3>
        <div class="pref-tags">${p.saveursPref.map((s) => `<span class="pref-tag">${escapeHTML(s.label)} · ${fmt(s.avg)}</span>`).join("")}</div>

        <h3 class="section-title">Mes marques préférées</h3>
        <div class="pref-tags">${p.marquesPref.map((s) => `<span class="pref-tag">${escapeHTML(s.label)} · ${fmt(s.avg)}</span>`).join("")}</div>
        ` : ""}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  /* ============================================================
     CHIP BATTLE
     ============================================================ */
  renderBattle() {
    this.setNav("");
    const chips = Store.getChips();
    $app().innerHTML = `
      ${this.header("⚔️ Chip Battle", false)}
      <div class="page">
        <div class="battle-selectors">
          <select class="input" id="battle-a"><option value="">— Chips A —</option>${chips.map((c) => `<option value="${c.id}">${escapeHTML(c.marque)} — ${escapeHTML(c.saveurLabel)}</option>`).join("")}</select>
          <div class="vs">VS</div>
          <select class="input" id="battle-b"><option value="">— Chips B —</option>${chips.map((c) => `<option value="${c.id}">${escapeHTML(c.marque)} — ${escapeHTML(c.saveurLabel)}</option>`).join("")}</select>
        </div>
        <button class="btn btn-primary btn-lg btn-block" onclick="App.runBattle()">Comparer</button>
        <div id="battle-result"></div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  runBattle() {
    const idA = document.getElementById("battle-a").value;
    const idB = document.getElementById("battle-b").value;
    if (!idA || !idB || idA === idB) { alert("Choisis deux chips différentes."); return; }
    const a = Calc.battleRow(idA);
    const b = Calc.battleRow(idB);
    const criteresPlus = CRITERES.concat([]);

    const rowsHTML = (key, label, fmtFn) => {
      const av = a ? a[key] : null, bv = b ? b[key] : null;
      const aWin = av != null && bv != null && av > bv;
      const bWin = av != null && bv != null && bv > av;
      return `<div class="battle-row">
        <div class="bv ${aWin ? "win" : ""}">${fmtFn ? fmtFn(av) : fmt(av)}</div>
        <div class="bl">${label}</div>
        <div class="bv ${bWin ? "win" : ""}">${fmtFn ? fmtFn(bv) : fmt(bv)}</div>
      </div>`;
    };

    document.getElementById("battle-result").innerHTML = `
      <div class="card battle-card">
        <div class="battle-header">
          <div class="bh-name">${escapeHTML(a.chip.marque)}<br><span>${escapeHTML(a.chip.saveurLabel)}</span></div>
          <div class="bh-vs">VS</div>
          <div class="bh-name">${escapeHTML(b.chip.marque)}<br><span>${escapeHTML(b.chip.saveurLabel)}</span></div>
        </div>
        ${rowsHTML("note", "Note Chip Club")}
        ${criteresPlus.map((c) => rowsHTML(c.id, c.label)).join("")}
        ${rowsHTML("prix100g", "Prix / 100g", fmtEUR)}
        <div class="battle-row">
          <div class="bv">${fmtEUR(a.chip.prix)}</div>
          <div class="bl">Prix du paquet</div>
          <div class="bv">${fmtEUR(b.chip.prix)}</div>
        </div>
      </div>
    `;
  },

  /* ============================================================
     STATISTIQUES
     ============================================================ */
  renderStats() {
    this.setNav("stats");
    const stats = Calc.statsGlobales();
    const phrases = Calc.phrasesFun();

    $app().innerHTML = `
      ${this.header("Statistiques", false)}
      <div class="page">
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-num">${stats.nbChips}</div><div class="stat-label">Paquets testés</div></div>
          <div class="stat-tile"><div class="stat-num">${stats.nbMarques}</div><div class="stat-label">Marques</div></div>
          <div class="stat-tile"><div class="stat-num">${stats.nbSaveurs}</div><div class="stat-label">Saveurs</div></div>
          <div class="stat-tile"><div class="stat-num">${stats.nbSoirees}</div><div class="stat-label">Soirées</div></div>
        </div>
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-num">${fmtEUR(stats.budgetTotal)}</div><div class="stat-label">Budget total</div></div>
          <div class="stat-tile"><div class="stat-num">${(stats.poidsTotal / 1000).toFixed(1)} kg</div><div class="stat-label">Poids dégusté</div></div>
          <div class="stat-tile"><div class="stat-num">${fmtEUR(stats.prixMoyen)}</div><div class="stat-label">Prix moyen/paquet</div></div>
          <div class="stat-tile"><div class="stat-num">${fmt(stats.noteMoyenne)}</div><div class="stat-label">Note moyenne</div></div>
        </div>

        ${stats.nbChips ? `
        <div class="card facts-grid">
          <div><span>Saveur préférée du groupe</span><b>${stats.saveurPreferee ? escapeHTML(stats.saveurPreferee.label) : "—"}</b></div>
          <div><span>Famille de saveur préférée</span><b>${stats.familleSaveurPreferee ? escapeHTML(stats.familleSaveurPreferee.label) : "—"}</b></div>
          <div><span>Type de chips préféré</span><b>${stats.famillePreferee ? escapeHTML(stats.famillePreferee.label) : "—"}</b></div>
          <div><span>Marque préférée</span><b>${stats.marquePreferee ? escapeHTML(stats.marquePreferee.label) : "—"}</b></div>
          <div><span>Saveur la moins appréciée</span><b>${stats.saveurMoinsAimee ? escapeHTML(stats.saveurMoinsAimee.label) : "—"}</b></div>
          <div><span>Meilleur magasin</span><b>${stats.meilleurMagasin ? escapeHTML(stats.meilleurMagasin.label) : "—"}</b></div>
        </div>

        <h3 class="section-title">Notes par marque</h3>
        ${this.barChartHTML(stats.parMarque)}

        <h3 class="section-title">Notes par famille de saveur</h3>
        ${this.barChartHTML(stats.parFamilleSaveur)}

        <h3 class="section-title">Notes par famille de chips</h3>
        ${this.barChartHTML(stats.parFamille)}

        <h3 class="section-title">Prix vs note</h3>
        ${this.scatterHTML(stats.rows, "prix100g", "note", "Prix/100g (€)", "Note")}

        <h3 class="section-title">Addictivité vs note globale</h3>
        ${this.scatterHTML(stats.rows, "addictivite", "note", "Addictivité", "Note")}

        ${phrases.length ? `
        <h3 class="section-title">🤓 Stats absurdement sérieuses</h3>
        <div class="fun-facts">
          ${phrases.map((p) => `<div class="fun-fact">${escapeHTML(p)}</div>`).join("")}
        </div>` : ""}
        ` : `<p class="muted">Pas encore assez de données pour les statistiques.</p>`}
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  barChartHTML(data) {
    if (!data.length) return `<p class="muted">Pas assez de données.</p>`;
    const max = Math.max(...data.map((d) => d.avg), 10);
    return `<div class="bar-chart">
      ${data.slice(0, 10).map((d) => `
        <div class="bar-row">
          <div class="bar-label">${escapeHTML(d.label)} <span class="bar-n">(${d.n})</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(d.avg / max) * 100}%"></div></div>
          <div class="bar-val">${fmt(d.avg)}</div>
        </div>`).join("")}
    </div>`;
  },

  scatterHTML(rows, xKey, yKey, xLabel, yLabel) {
    const pts = rows.map((r) => ({ x: r[xKey], y: r[yKey], chip: r.chip })).filter((p) => p.x != null && p.y != null);
    if (pts.length < 2) return `<p class="muted">Pas assez de données.</p>`;
    const w = 300, h = 180, pad = 24;
    const xMax = Math.max(...pts.map((p) => p.x)) * 1.1 || 1;
    const yMax = 10;
    const sx = (x) => pad + (x / xMax) * (w - pad * 2);
    const sy = (y) => h - pad - (y / yMax) * (h - pad * 2);
    return `<div class="card chart-card">
      <svg viewBox="0 0 ${w} ${h}" class="scatter-svg">
        <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" class="axis"/>
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" class="axis"/>
        ${pts.map((p) => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4" class="scatter-pt"><title>${escapeHTML(p.chip.marque)}</title></circle>`).join("")}
      </svg>
      <div class="chart-axes"><span>${xLabel} →</span><span>↑ ${yLabel}</span></div>
    </div>`;
  },

  /* ============================================================
     SETTINGS
     ============================================================ */
  renderSettings() {
    this.setNav("");
    const demoLoaded = Store.isDemoLoaded();
    $app().innerHTML = `
      ${this.header("Paramètres", false)}
      <div class="page">
        <div class="card">
          <h3 class="form-section-title">💾 Sauvegarde</h3>
          <button class="btn btn-secondary btn-block" onclick="App.exportData()">Exporter les données (.JSON)</button>
          <label class="btn btn-secondary btn-block file-btn">
            Importer une sauvegarde
            <input type="file" accept="application/json" style="display:none" onchange="App.importData(event)">
          </label>
          <button class="btn btn-danger btn-block" onclick="App.resetApp()">Réinitialiser CHIP CLUB</button>
        </div>

        <div class="card">
          <h3 class="form-section-title">🧪 Données de démonstration</h3>
          ${demoLoaded
            ? `<button class="btn btn-secondary btn-block" onclick="App.removeDemo()">Supprimer les données de démo</button>`
            : `<button class="btn btn-secondary btn-block" onclick="App.loadDemo()">Charger des données de démo</button>`}
        </div>

        <div class="card">
          <h3 class="form-section-title">🎚️ Seuils de verdict</h3>
          <div id="seuils-editor">
            ${Store.getSeuils().map((s, i) => `
              <div class="seuil-row">
                <input class="input seuil-input" type="number" step="0.1" value="${s.min}" id="seuil-min-${i}">
                <span>→</span>
                <input class="input seuil-label" value="${escapeHTML(s.label)}" id="seuil-label-${i}">
                <input class="input seuil-emoji" value="${s.emoji}" id="seuil-emoji-${i}">
              </div>`).join("")}
          </div>
          <button class="btn btn-secondary btn-block" onclick="App.saveSeuils()">Enregistrer les seuils</button>
        </div>
      </div>
      ${this.bottomNav()}
      ${this.sideMenu()}
    `;
  },

  exportData() {
    const data = Store.exportJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chipclub-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        Store.importJSON(ev.target.result);
        alert("Import réussi !");
        this.route();
      } catch (err) {
        alert("Fichier invalide.");
      }
    };
    reader.readAsText(file);
  },
  resetApp() {
    if (!confirm("Es-tu sûr de vouloir réinitialiser CHIP CLUB ? Toutes les données seront perdues définitivement.")) return;
    if (!confirm("Dernière confirmation : toutes les chips, notes et soirées seront supprimées.")) return;
    Store.reset();
    location.hash = "#/";
    this.route();
  },
  removeDemo() {
    if (!confirm("Supprimer toutes les données de démonstration ?")) return;
    Store.removeDemoData();
    this.route();
  },
  saveSeuils() {
    const seuils = Store.getSeuils().map((s, i) => ({
      min: parseFloat(document.getElementById(`seuil-min-${i}`).value),
      max: s.max,
      label: document.getElementById(`seuil-label-${i}`).value,
      emoji: document.getElementById(`seuil-emoji-${i}`).value
    }));
    // recalcule les max = min du seuil supérieur
    seuils.sort((a, b) => b.min - a.min);
    for (let i = 1; i < seuils.length; i++) seuils[i].max = seuils[i - 1].min;
    seuils[0].max = 10.01;
    Store.setSeuils(seuils);
    alert("Seuils enregistrés.");
  },

  /* ============================================================
     COMPOSANTS COMMUNS
     ============================================================ */
  header(title, showBack, backHref, onBack) {
    return `<div class="topbar">
      ${showBack
        ? `<button class="iconbtn" onclick="${onBack ? "App._backCb()" : `location.hash='${backHref || "#/"}'`}">←</button>`
        : `<button class="iconbtn" onclick="App.toggleMenu()">☰</button>`}
      <div class="brand"><span class="brand-title">${escapeHTML(title)}</span></div>
    </div>` + (onBack ? (this._backCb = onBack, "") : "");
  },
  _backCb: null,

  bottomNav() {
    return `<nav class="bottomnav">
      <button class="navbtn" data-nav="home" onclick="location.hash='#/'"><span>🏠</span>Accueil</button>
      <button class="navbtn" data-nav="chips" onclick="location.hash='#/chips'"><span>🥔</span>Chips</button>
      <button class="navbtn navbtn-cta" data-nav="taste" onclick="location.hash='#/soiree/new'"><span>➕</span>Déguster</button>
      <button class="navbtn" data-nav="rank" onclick="location.hash='#/classement'"><span>🏆</span>Classement</button>
      <button class="navbtn" data-nav="stats" onclick="location.hash='#/stats'"><span>📊</span>Stats</button>
    </nav>`;
  },

  sideMenu() {
    return `
    <div class="menu-overlay" id="menuOverlay" onclick="App.toggleMenu()"></div>
    <div class="side-menu" id="sideMenu">
      <div class="side-menu-title">CHIP CLUB</div>
      <button class="side-menu-item" onclick="location.hash='#/soirees'">📅 Soirées</button>
      <button class="side-menu-item" onclick="location.hash='#/degustateurs'">🙋 Dégustateurs</button>
      <button class="side-menu-item" onclick="location.hash='#/halloffame'">🏛️ Hall of Fame</button>
      <button class="side-menu-item" onclick="location.hash='#/battle'">⚔️ Chip Battle</button>
      <button class="side-menu-item" onclick="location.hash='#/settings'">⚙️ Paramètres</button>
    </div>`;
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
