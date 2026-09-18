/* ============================================================
   CHIP CLUB — calc.js
   Toutes les fonctions de calcul : moyennes, classement,
   hall of fame, profils, stats, chip battle.
   Rien ici ne touche au DOM.
   ============================================================ */

const Calc = {

  /* Moyenne d'un critère pour une dégustation donnée (toutes notes confondues) */
  degustationCriteriaAvg(degustationId, critereId) {
    const notes = Store.getNotesByDegustation(degustationId);
    if (!notes.length) return null;
    const vals = notes.map((n) => n.criteres[critereId]).filter((v) => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  },

  /* Note globale d'une dégustation = moyenne des moyennes-participant sur GOUT
     mais la "Note Chip Club" spec = moyenne des moyennes-participants (moyenne
     de la moyenne globale /10 par participant, calculée sur l'ensemble des critères) */
  degustateurMoyenne(degustationId, degustateurId) {
    const notes = Store.getNotesByDegustation(degustationId).filter((n) => n.degustateurId === degustateurId);
    if (!notes.length) return null;
    // moyenne de tous les critères pour ce participant sur cette dégustation (normalement 1 note)
    const n = notes[notes.length - 1];
    const vals = CRITERES.map((c) => n.criteres[c.id]).filter((v) => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  },

  /* Note Chip Club = moyenne des moyennes de chaque dégustateur */
  noteChipClub(degustationId) {
    const notes = Store.getNotesByDegustation(degustationId);
    if (!notes.length) return null;
    const ids = [...new Set(notes.map((n) => n.degustateurId))];
    const moyennes = ids.map((id) => this.degustateurMoyenne(degustationId, id)).filter((v) => v != null);
    if (!moyennes.length) return null;
    return moyennes.reduce((a, b) => a + b, 0) / moyennes.length;
  },

  /* Écart-type simple des moyennes participants -> indicateur "controverse" */
  ecartControverse(degustationId) {
    const notes = Store.getNotesByDegustation(degustationId);
    const ids = [...new Set(notes.map((n) => n.degustateurId))];
    const moyennes = ids.map((id) => this.degustateurMoyenne(degustationId, id)).filter((v) => v != null);
    if (moyennes.length < 2) return 0;
    return Math.max(...moyennes) - Math.min(...moyennes);
  },

  /* Prix / 100g pour une chip */
  prixPour100g(chip) {
    const prix = parseFloat(chip.prix);
    const poids = parseFloat(chip.poids);
    if (!prix || !poids) return null;
    return (prix / poids) * 100;
  },

  /* Construit une "row" enrichie pour une dégustation donnée (utilisée partout) */
  buildRow(degustation) {
    const chip = Store.getChip(degustation.chipId);
    if (!chip) return null;
    const note = this.noteChipClub(degustation.id);
    const row = {
      degustation, chip,
      note,
      verdict: getVerdict(note),
      controverse: this.ecartControverse(degustation.id),
      prix100g: this.prixPour100g(chip)
    };
    for (const c of CRITERES) {
      row[c.id] = this.degustationCriteriaAvg(degustation.id, c.id);
    }
    return row;
  },

  allRows() {
    return Store.getDegustations()
      .map((d) => this.buildRow(d))
      .filter((r) => r && r.note != null);
  },

  /* ---------- Classement / filtres ---------- */
  classement(sortKey = "note", famille = null, marque = null, familleSaveur = null) {
    let rows = this.allRows();
    if (famille) rows = rows.filter((r) => r.chip.familleId === famille);
    if (marque) rows = rows.filter((r) => r.chip.marque === marque);
    if (familleSaveur) rows = rows.filter((r) => r.chip.saveurFamilleId === familleSaveur);
    rows.sort((a, b) => {
      if (sortKey === "prix100g") return (a.prix100g ?? 1e9) - (b.prix100g ?? 1e9);
      if (sortKey === "date") return new Date(b.chip.createdAt) - new Date(a.chip.createdAt);
      if (sortKey === "piquant") return (b.chip.piquant || 0) - (a.chip.piquant || 0);
      const av = a[sortKey], bv = b[sortKey];
      return (bv ?? -1) - (av ?? -1);
    });
    return rows;
  },

  /* ---------- Hall of Fame ---------- */
  hallOfFame() {
    const rows = this.allRows();
    if (!rows.length) return null;
    const best = (key) => rows.slice().sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1))[0];
    const worst = (key) => rows.slice().sort((a, b) => (a[key] ?? 999) - (b[key] ?? 999))[0];
    const withPrix = rows.filter((r) => r.prix100g != null);
    const bestValue = withPrix.length
      ? withPrix.slice().sort((a, b) => (b.note / b.prix100g) - (a.note / a.prix100g))[0]
      : null;
    return {
      meilleure: best("note"),
      pire: worst("note"),
      addictive: best("addictivite"),
      originale: best("originalite"),
      qualitePrix: bestValue,
      meilleurGout: best("gout"),
      meilleureTexture: best("texture"),
      plusFidele: best("fidelite"),
      plusPiquante: rows.slice().sort((a, b) => (b.chip.piquant || 0) - (a.chip.piquant || 0))[0],
      controversee: rows.slice().sort((a, b) => b.controverse - a.controverse)[0]
    };
  },

  /* ---------- Profil dégustateur ---------- */
  profil(degustateurId) {
    const allNotes = Store.getNotesByDegustateur(degustateurId);
    if (!allNotes.length) return null;
    const rows = allNotes.map((n) => {
      const deg = Store.getDegustation(n.degustationId);
      const chip = deg ? Store.getChip(deg.chipId) : null;
      if (!chip) return null;
      const vals = CRITERES.map((c) => n.criteres[c.id]).filter((v) => v != null);
      const moyenne = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return { note: n, deg, chip, moyenne };
    }).filter(Boolean);

    const nbChips = rows.length;
    const moyenneDonnee = rows.reduce((a, r) => a + (r.moyenne || 0), 0) / nbChips;

    const parSaveur = {};
    const parFamille = {};
    const parMarque = {};
    for (const r of rows) {
      const sav = r.chip.saveurLabel || "?";
      parSaveur[sav] = parSaveur[sav] || [];
      parSaveur[sav].push(r.moyenne);
      const fam = labelOf(Store.getAllFamilles(), r.chip.familleId);
      parFamille[fam] = parFamille[fam] || [];
      parFamille[fam].push(r.moyenne);
      const marque = r.chip.marque || "?";
      parMarque[marque] = parMarque[marque] || [];
      parMarque[marque].push(r.moyenne);
    }
    const avgMap = (map) => Object.entries(map).map(([k, v]) => ({ label: k, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }));
    const saveurPref = avgMap(parSaveur).sort((a, b) => b.avg - a.avg)[0];
    const saveurMoins = avgMap(parSaveur).sort((a, b) => a.avg - b.avg)[0];
    const famillePref = avgMap(parFamille).sort((a, b) => b.avg - a.avg)[0];
    const marquesPref = avgMap(parMarque).sort((a, b) => b.avg - a.avg).slice(0, 5);
    const saveursPref = avgMap(parSaveur).sort((a, b) => b.avg - a.avg).slice(0, 5);

    const racheteOui = rows.filter((r) => r.note.racheter === "oui").length;
    const tauxRachat = nbChips ? (racheteOui / nbChips) * 100 : 0;

    const top5 = rows.slice().sort((a, b) => b.moyenne - a.moyenne).slice(0, 5);
    const flop5 = rows.slice().sort((a, b) => a.moyenne - b.moyenne).slice(0, 5);

    return {
      degustateur: Store.getDegustateur(degustateurId),
      nbChips, moyenneDonnee, saveurPref, saveurMoins, famillePref,
      marquesPref, saveursPref, tauxRachat, top5, flop5
    };
  },

  /* Titres automatiques entre dégustateurs */
  titres() {
    const degustateurs = Store.getDegustateurs();
    const profils = degustateurs.map((d) => this.profil(d.id)).filter(Boolean);
    if (profils.length < 2) return [];
    const titres = [];
    const genereux = profils.slice().sort((a, b) => b.moyenneDonnee - a.moyenneDonnee)[0];
    titres.push({ emoji: "😇", label: "Le plus généreux", degustateur: genereux.degustateur, detail: genereux.moyenneDonnee.toFixed(1) });
    const critique = profils.slice().sort((a, b) => a.moyenneDonnee - b.moyenneDonnee)[0];
    titres.push({ emoji: "🧐", label: "Le critique gastronomique", degustateur: critique.degustateur, detail: critique.moyenneDonnee.toFixed(1) });

    // opposant : le plus souvent en désaccord avec la moyenne du groupe
    const ecarts = {};
    for (const d of degustateurs) ecarts[d.id] = [];
    for (const deg of Store.getDegustations()) {
      const note = this.noteChipClub(deg.id);
      if (note == null) continue;
      for (const n of Store.getNotesByDegustation(deg.id)) {
        const m = this.degustateurMoyenne(deg.id, n.degustateurId);
        if (m != null) ecarts[n.degustateurId] && ecarts[n.degustateurId].push(Math.abs(m - note));
      }
    }
    const ecartsAvg = Object.entries(ecarts).filter(([, v]) => v.length).map(([id, v]) => ({ id, avg: v.reduce((a, b) => a + b, 0) / v.length }));
    if (ecartsAvg.length) {
      const opposant = ecartsAvg.sort((a, b) => b.avg - a.avg)[0];
      titres.push({ emoji: "⚔️", label: "L'opposant", degustateur: Store.getDegustateur(opposant.id), detail: "±" + opposant.avg.toFixed(1) });
    }

    const acheteur = profils.slice().sort((a, b) => b.tauxRachat - a.tauxRachat)[0];
    titres.push({ emoji: "🛒", label: "L'acheteur compulsif", degustateur: acheteur.degustateur, detail: Math.round(acheteur.tauxRachat) + "%" });

    // plus facile à rendre accro : moyenne addictivité la plus élevée donnée
    const addictAvg = degustateurs.map((d) => {
      const notes = Store.getNotesByDegustateur(d.id);
      const vals = notes.map((n) => n.criteres.addictivite).filter((v) => v != null);
      return { d, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    }).filter((x) => x.avg != null);
    if (addictAvg.length) {
      const accro = addictAvg.sort((a, b) => b.avg - a.avg)[0];
      titres.push({ emoji: "🔥", label: "Le plus facile à rendre accro", degustateur: accro.d, detail: accro.avg.toFixed(1) });
    }
    return titres;
  },

  /* ---------- Récap de soirée ---------- */
  recapSoiree(soireeId) {
    const soiree = Store.getSoiree(soireeId);
    if (!soiree) return null;
    const degs = Store.getDegustationsBySoiree(soireeId);
    const rows = degs.map((d) => this.buildRow(d)).filter((r) => r && r.note != null);
    const poidsTotal = rows.reduce((a, r) => a + (parseFloat(r.chip.poids) || 0), 0);
    const sorted = rows.slice().sort((a, b) => b.note - a.note);
    return {
      soiree, rows,
      nbParticipants: (soiree.participantsIds || []).length,
      nbPaquets: rows.length,
      poidsTotalKg: poidsTotal / 1000,
      gagnante: sorted[0],
      deuxieme: sorted[1],
      troisieme: sorted[2],
      accident: sorted[sorted.length - 1],
      addictive: rows.slice().sort((a, b) => (b.addictivite ?? -1) - (a.addictivite ?? -1))[0],
      surprenante: rows.slice().sort((a, b) => (b.originalite ?? -1) - (a.originalite ?? -1))[0],
      debat: rows.slice().sort((a, b) => b.controverse - a.controverse)[0],
      qualitePrix: rows.filter((r) => r.prix100g).sort((a, b) => (b.note / b.prix100g) - (a.note / a.prix100g))[0]
    };
  },

  /* ---------- Statistiques globales ---------- */
  statsGlobales() {
    const chips = Store.getChips();
    const rows = this.allRows();
    const soirees = Store.getSoirees();
    const marquesSet = new Set(chips.map((c) => c.marque).filter(Boolean));
    const saveursSet = new Set(chips.map((c) => c.saveurId).filter(Boolean));
    const budgetTotal = chips.reduce((a, c) => a + (parseFloat(c.prix) || 0), 0);
    const poidsTotal = chips.reduce((a, c) => a + (parseFloat(c.poids) || 0), 0);
    const prixMoyen = chips.length ? budgetTotal / chips.length : 0;
    const noteMoyenne = rows.length ? rows.reduce((a, r) => a + r.note, 0) / rows.length : null;

    const groupAvg = (keyFn) => {
      const map = {};
      for (const r of rows) {
        const k = keyFn(r);
        if (!k) continue;
        map[k] = map[k] || [];
        map[k].push(r.note);
      }
      return Object.entries(map).map(([k, v]) => ({ label: k, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }));
    };

    const parMarque = groupAvg((r) => r.chip.marque).sort((a, b) => b.avg - a.avg);
    const parFamilleSaveur = groupAvg((r) => labelOf(FAMILLES_SAVEUR, r.chip.saveurFamilleId)).sort((a, b) => b.avg - a.avg);
    const parFamille = groupAvg((r) => labelOf(Store.getAllFamilles(), r.chip.familleId)).sort((a, b) => b.avg - a.avg);
    const parSaveur = groupAvg((r) => r.chip.saveurLabel).sort((a, b) => b.avg - a.avg);
    const parMagasin = groupAvg((r) => r.chip.magasin).sort((a, b) => b.avg - a.avg);

    return {
      nbChips: chips.length, nbMarques: marquesSet.size, nbSaveurs: saveursSet.size,
      nbSoirees: soirees.length, budgetTotal, poidsTotal, prixMoyen, noteMoyenne,
      parMarque, parFamilleSaveur, parFamille, parSaveur, parMagasin,
      saveurPreferee: parSaveur[0], familleSaveurPreferee: parFamilleSaveur[0],
      famillePreferee: parFamille[0], marquePreferee: parMarque[0],
      saveurMoinsAimee: parSaveur.slice().sort((a, b) => a.avg - b.avg)[0],
      meilleurMagasin: parMagasin[0],
      rows
    };
  },

  /* Phrases fun générées seulement si calculables */
  phrasesFun() {
    const phrases = [];
    const stats = this.statsGlobales();
    if (stats.poidsTotal > 0) {
      phrases.push(`Vous avez dégusté ${(stats.poidsTotal / 1000).toFixed(1)} kg de chips.`);
    }
    if (stats.budgetTotal > 0) {
      phrases.push(`Vous avez dépensé ${stats.budgetTotal.toFixed(2)} € pour la science.`);
    }
    const bbq = stats.parFamilleSaveur.find((f) => f.label === "Barbecue / fumé");
    const vin = stats.parFamilleSaveur.find((f) => f.label === "Vinaigre / acidulé");
    if (bbq && vin) {
      const diff = bbq.avg - vin.avg;
      phrases.push(`Le barbecue obtient en moyenne ${Math.abs(diff).toFixed(1)} point${Math.abs(diff) >= 2 ? "s" : ""} ${diff >= 0 ? "de plus" : "de moins"} que le vinaigre.`);
    }
    for (const d of Store.getDegustateurs()) {
      const notes = Store.getNotesByDegustateur(d.id);
      if (notes.length < 3) continue;
      const vals = notes.map((n) => {
        const vs = CRITERES.map((c) => n.criteres[c.id]).filter((v) => v != null);
        return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
      }).filter((v) => v != null);
      if (!vals.length || stats.noteMoyenne == null) continue;
      const perso = vals.reduce((a, b) => a + b, 0) / vals.length;
      const diff = perso - stats.noteMoyenne;
      if (Math.abs(diff) >= 0.3) {
        phrases.push(`${d.nom} note en moyenne ${Math.abs(diff).toFixed(1)} point ${diff < 0 ? "plus sévèrement" : "plus généreusement"} que le groupe.`);
      }
    }
    const rows = stats.rows;
    const plus8 = rows.filter((r) => r.note > 8);
    if (plus8.length >= 3) {
      const notesAvecRachat = plus8.filter((r) => {
        const notes = Store.getNotesByDegustation(r.degustation.id);
        return notes.some((n) => n.racheter === "oui");
      });
      const pct = (notesAvecRachat.length / plus8.length) * 100;
      phrases.push(`${Math.round(pct)} % des chips notées plus de 8/10 ont été rachetées.`);
    }
    return phrases;
  },

  /* ---------- Chip Battle ---------- */
  battleRow(chipId) {
    const deg = Store.getDegustations().find((d) => d.chipId === chipId);
    if (!deg) return null;
    return this.buildRow(deg);
  }
};
