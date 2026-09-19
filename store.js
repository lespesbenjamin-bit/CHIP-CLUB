/* ============================================================
   CHIP CLUB — store.js
   Couche de persistance localStorage.
   Schéma pensé "table par table" pour faciliter une migration
   future vers Supabase (chaque collection = future table SQL,
   chaque id = future clé primaire, chaque *_id = future clé étrangère).
   ============================================================ */

const STORAGE_KEY = "chipclub_v1";

/* Le club fondateur : ces dégustateurs sont créés automatiquement au premier
   lancement, pour ne pas avoir à les ressaisir à chaque nouvelle soirée. */
const DEFAULT_TASTERS = [
  { nom: "Benjamin", avatarEmoji: "🦊" },
  { nom: "Adam", avatarEmoji: "🐺" },
  { nom: "Pierre Louis", avatarEmoji: "🦁" },
  { nom: "Carla", avatarEmoji: "🐼" }
];

const DEFAULT_STATE = {
  meta: {
    version: 1,
    createdAt: null
  },
  degustateurs: [],   // { id, nom, avatarEmoji, createdAt }
  marques: [],        // { id, nom }
  saveursPerso: [],    // saveurs personnalisées ajoutées par l'utilisateur, même forme que SAVEURS
  famillesPerso: [],   // familles de chips personnalisées, même forme que FAMILLES
  soirees: [],         // { id, nom, date, participantsIds[], mode, createdAt }
  chips: [],           // fiche produit (identité + classification), voir schéma plus bas
  degustations: [],    // une dégustation = une chips dans une soirée: { id, soireeId, chipId, revele, createdAt }
  notes: [],           // { id, degustationId, degustateurId, criteres:{...}, racheter, survie, contextes[], commentaire, createdAt }
  seuils: null,        // override des seuils de verdict, sinon défault
  settings: {
    demoLoaded: false
  }
};

/* Schéma d'une "chips" (fiche produit) :
{
  id, createdAt,
  photo: dataURL|null,
  marque, nomCommercial, saveurId, saveurLabel, saveurFamilleId,
  gamme, paysOrigine, magasin, prix, poids,
  familleId, formeId, cuissonId,
  piquant: 0-5,
  isDemo: bool
}
*/

const Store = {
  _state: null,

  load() {
    if (this._state) return this._state;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._state = JSON.parse(raw);
        // merge defaults for forward-compat (nouvelles clés ajoutées après coup)
        this._state = Object.assign({}, DEFAULT_STATE, this._state);
        for (const k of Object.keys(DEFAULT_STATE)) {
          if (this._state[k] === undefined) this._state[k] = DEFAULT_STATE[k];
        }
      } else {
        this._state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this._state.meta.createdAt = new Date().toISOString();
        this._seedDefaultTasters();
        this.save();
      }
    } catch (e) {
      console.error("Erreur de lecture du stockage, réinitialisation.", e);
      this._state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this._state.meta.createdAt = new Date().toISOString();
      this._seedDefaultTasters();
      this.save();
    }
    return this._state;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.error("Erreur d'écriture du stockage", e);
      alert("Impossible de sauvegarder : stockage plein ou indisponible.");
    }
  },

  reset() {
    this._state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this._state.meta.createdAt = new Date().toISOString();
    this._seedDefaultTasters();
    this.save();
  },

  _seedDefaultTasters() {
    for (const t of DEFAULT_TASTERS) {
      if (!this._state.degustateurs.some((d) => d.nom.toLowerCase() === t.nom.toLowerCase())) {
        this._state.degustateurs.push({
          id: uid("taster"), nom: t.nom, avatarEmoji: t.avatarEmoji,
          createdAt: new Date().toISOString(), isDemo: false
        });
      }
    }
  },

  /* ---------- Dégustateurs ---------- */
  getDegustateurs() {
    return this.load().degustateurs;
  },
  addDegustateur(nom, avatarEmoji) {
    const s = this.load();
    let existing = s.degustateurs.find((d) => d.nom.toLowerCase() === nom.toLowerCase());
    if (existing) return existing;
    const d = { id: uid("taster"), nom, avatarEmoji: avatarEmoji || pickAvatar(nom), createdAt: new Date().toISOString() };
    s.degustateurs.push(d);
    this.save();
    return d;
  },
  getDegustateur(id) {
    return this.load().degustateurs.find((d) => d.id === id);
  },

  /* ---------- Marques ---------- */
  addMarque(nom) {
    const s = this.load();
    let existing = s.marques.find((m) => m.nom.toLowerCase() === nom.toLowerCase());
    if (existing) return existing;
    const m = { id: uid("brand"), nom };
    s.marques.push(m);
    this.save();
    return m;
  },
  getMarques() {
    return this.load().marques;
  },

  /* ---------- Saveurs personnalisées ---------- */
  addSaveurPerso(label, familleId) {
    const s = this.load();
    const id = "perso-" + label.toLowerCase().normalize("NFD").replace(/\p{Mark}/gu, "").replace(/[^a-z0-9]+/g, "-");
    let existing = s.saveursPerso.find((sv) => sv.id === id);
    if (existing) return existing;
    const sv = { id, label, familleId };
    s.saveursPerso.push(sv);
    this.save();
    return sv;
  },
  getAllSaveurs() {
    return SAVEURS.concat(this.load().saveursPerso);
  },

  /* ---------- Familles personnalisées ---------- */
  addFamillePerso(label) {
    const s = this.load();
    const id = "perso-fam-" + label.toLowerCase().normalize("NFD").replace(/\p{Mark}/gu, "").replace(/[^a-z0-9]+/g, "-");
    let existing = s.famillesPerso.find((f) => f.id === id);
    if (existing) return existing;
    const f = { id, label, emoji: "❓" };
    s.famillesPerso.push(f);
    this.save();
    return f;
  },
  getAllFamilles() {
    return FAMILLES.concat(this.load().famillesPerso);
  },

  /* ---------- Soirées ---------- */
  addSoiree(soiree) {
    const s = this.load();
    const o = Object.assign({ id: uid("night"), createdAt: new Date().toISOString() }, soiree);
    s.soirees.push(o);
    this.save();
    return o;
  },
  getSoirees() {
    return this.load().soirees.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  getSoiree(id) {
    return this.load().soirees.find((s) => s.id === id);
  },

  /* ---------- Chips (fiches produit) ---------- */
  addChip(chip) {
    const s = this.load();
    const c = Object.assign({ id: uid("chip"), createdAt: new Date().toISOString() }, chip);
    s.chips.push(c);
    this.save();
    return c;
  },
  getChips() {
    return this.load().chips;
  },
  getChip(id) {
    return this.load().chips.find((c) => c.id === id);
  },

  /* ---------- Dégustations (chips x soirée) ---------- */
  addDegustation(deg) {
    const s = this.load();
    const d = Object.assign({ id: uid("tasting"), revele: false, createdAt: new Date().toISOString() }, deg);
    s.degustations.push(d);
    this.save();
    return d;
  },
  getDegustations() {
    return this.load().degustations;
  },
  getDegustation(id) {
    return this.load().degustations.find((d) => d.id === id);
  },
  getDegustationsBySoiree(soireeId) {
    return this.load().degustations.filter((d) => d.soireeId === soireeId);
  },
  revelerDegustation(id) {
    const s = this.load();
    const d = s.degustations.find((x) => x.id === id);
    if (d) { d.revele = true; this.save(); }
    return d;
  },

  /* ---------- Notes individuelles ---------- */
  addNote(note) {
    const s = this.load();
    const n = Object.assign({ id: uid("note"), createdAt: new Date().toISOString() }, note);
    s.notes.push(n);
    this.save();
    return n;
  },
  getNotes() {
    return this.load().notes;
  },
  getNotesByDegustation(degustationId) {
    return this.load().notes.filter((n) => n.degustationId === degustationId);
  },
  getNotesByDegustateur(degustateurId) {
    return this.load().notes.filter((n) => n.degustateurId === degustateurId);
  },

  /* ---------- Seuils verdict ---------- */
  getSeuils() {
    const s = this.load();
    return s.seuils && s.seuils.length ? s.seuils : SEUILS_VERDICT;
  },
  setSeuils(seuils) {
    const s = this.load();
    s.seuils = seuils;
    this.save();
  },

  /* ---------- Export / Import / Reset ---------- */
  exportJSON() {
    return JSON.stringify(this.load(), null, 2);
  },
  importJSON(json) {
    const parsed = JSON.parse(json);
    this._state = Object.assign({}, DEFAULT_STATE, parsed);
    this.save();
  },

  /* ---------- Démo ---------- */
  isDemoLoaded() {
    return !!this.load().settings.demoLoaded;
  },
  setDemoLoaded(v) {
    const s = this.load();
    s.settings.demoLoaded = v;
    this.save();
  },
  removeDemoData() {
    const s = this.load();
    const demoChipIds = s.chips.filter((c) => c.isDemo).map((c) => c.id);
    const demoSoireeIds = s.soirees.filter((so) => so.isDemo).map((so) => so.id);
    const demoDegIds = s.degustations.filter((d) => demoChipIds.includes(d.chipId) || demoSoireeIds.includes(d.soireeId)).map((d) => d.id);
    s.notes = s.notes.filter((n) => !demoDegIds.includes(n.degustationId));
    s.degustations = s.degustations.filter((d) => !demoDegIds.includes(d.id));
    s.chips = s.chips.filter((c) => !c.isDemo);
    s.soirees = s.soirees.filter((so) => !so.isDemo);
    s.degustateurs = s.degustateurs.filter((d) => !d.isDemo);
    s.settings.demoLoaded = false;
    this.save();
  }
};

const AVATAR_EMOJIS = ["🦊", "🐼", "🐸", "🐨", "🦁", "🐵", "🐺", "🦝", "🐯", "🐰", "🦄", "🐷"];
function pickAvatar(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = (hash * 31 + nom.charCodeAt(i)) % AVATAR_EMOJIS.length;
  return AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length];
}
