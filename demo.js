/* ============================================================
   CHIP CLUB — demo.js
   Génère des données de démonstration : 4 dégustateurs,
   2 soirées, 10+ chips variées avec notes complètes.
   ============================================================ */

const Demo = {
  load() {
    const s = Store.load();

    // Dégustateurs
    const noms = [
      { nom: "Benjamin", emoji: "🦊" },
      { nom: "Paul", emoji: "🐼" },
      { nom: "Lucas", emoji: "🐸" },
      { nom: "Thomas", emoji: "🐨" }
    ];
    const tasters = noms.map((n) => {
      const d = { id: uid("taster"), nom: n.nom, avatarEmoji: n.emoji, createdAt: new Date().toISOString(), isDemo: true };
      s.degustateurs.push(d);
      return d;
    });

    const chipsData = [
      { marque: "Lay's", nomCommercial: "Classic", saveurId: "nature", familleId: "pdt-classique", formeId: "fine-classique", cuissonId: "frite-classique", pays: "France", magasin: "Carrefour", prix: 1.99, poids: 130, piquant: 0 },
      { marque: "Lorenz", nomCommercial: "Crunchips", saveurId: "barbecue", familleId: "pdt-ondulee", formeId: "ondulee", cuissonId: "frite-classique", pays: "Allemagne", magasin: "Leclerc", prix: 2.29, poids: 150, piquant: 1 },
      { marque: "Tyrrell's", nomCommercial: "Hand Cooked", saveurId: "sel-vinaigre", familleId: "pdt-epaisse", formeId: "epaisse", cuissonId: "kettle", pays: "Royaume-Uni", magasin: "Monoprix", prix: 3.49, poids: 150, piquant: 0 },
      { marque: "Brets", nomCommercial: "Rôtisserie", saveurId: "poulet-roti", familleId: "pdt-artisanale", formeId: "irreguliere", cuissonId: "chaudron", pays: "France", magasin: "Intermarché", prix: 2.79, poids: 125, piquant: 0 },
      { marque: "Tyrrell's", nomCommercial: "Truffle", saveurId: "truffe-noire", familleId: "pdt-artisanale", formeId: "epaisse", cuissonId: "kettle", pays: "Royaume-Uni", magasin: "Monoprix", prix: 4.99, poids: 150, piquant: 0, gamme: "Premium" },
      { marque: "Doritos", nomCommercial: "Tortilla", saveurId: "cheddar", familleId: "tortilla-mais", formeId: "triangle", cuissonId: "frite-classique", pays: "Belgique", magasin: "Carrefour", prix: 2.49, poids: 170, piquant: 1 },
      { marque: "Doritos", nomCommercial: "Tortilla", saveurId: "sweet-chili", familleId: "tortilla-mais", formeId: "triangle", cuissonId: "frite-classique", pays: "Belgique", magasin: "Carrefour", prix: 2.49, poids: 170, piquant: 2 },
      { marque: "Tostitos", nomCommercial: "Hint of Jalapeño", saveurId: "jalapeno", familleId: "tortilla-triangle", formeId: "triangle", cuissonId: "frite-classique", pays: "États-Unis", magasin: "Grand Frais", prix: 3.19, poids: 185, piquant: 3 },
      { marque: "Lay's", nomCommercial: "Strong", saveurId: "sour-cream-onion", familleId: "pdt-classique", formeId: "fine-classique", cuissonId: "frite-classique", pays: "France", magasin: "Carrefour", prix: 1.99, poids: 130, piquant: 0 },
      { marque: "Croky", nomCommercial: "Mystère", saveurId: "saveur-inconnue", familleId: "pdt-ondulee", formeId: "ondulee", cuissonId: "frite-classique", pays: "Belgique", magasin: "Aldi", prix: 1.49, poids: 150, piquant: 0, gamme: "Édition limitée WTF" },
      { marque: "Kettle Chips", nomCommercial: "Sea Salt", saveurId: "sel-mer", familleId: "pdt-epaisse", formeId: "epaisse", cuissonId: "kettle", pays: "Royaume-Uni", magasin: "Biocoop", prix: 2.99, poids: 130, piquant: 0 },
      { marque: "Vico", nomCommercial: "Chips de Légumes", saveurId: "herbes-provence", familleId: "legumes", formeId: "fine-classique", cuissonId: "four", pays: "France", magasin: "Leclerc", prix: 2.19, poids: 100, piquant: 0 }
    ];

    const chips = chipsData.map((c) => {
      const chip = {
        id: uid("chip"),
        createdAt: new Date().toISOString(),
        photo: null,
        marque: c.marque,
        nomCommercial: c.nomCommercial,
        saveurId: c.saveurId,
        saveurLabel: labelOf(SAVEURS, c.saveurId),
        saveurFamilleId: (findById(SAVEURS, c.saveurId) || {}).familleId,
        gamme: c.gamme || "",
        paysOrigine: c.pays,
        magasin: c.magasin,
        prix: c.prix,
        poids: c.poids,
        familleId: c.familleId,
        formeId: c.formeId,
        cuissonId: c.cuissonId,
        piquant: c.piquant,
        isDemo: true
      };
      s.chips.push(chip);
      return chip;
    });

    // 2 soirées
    const soiree1 = {
      id: uid("night"), nom: "Chip Night #01", date: daysAgo(21),
      participantsIds: tasters.map((t) => t.id), mode: "classique",
      createdAt: new Date().toISOString(), isDemo: true
    };
    const soiree2 = {
      id: uid("night"), nom: "Chip Night #02", date: daysAgo(5),
      participantsIds: tasters.map((t) => t.id), mode: "aveugle",
      createdAt: new Date().toISOString(), isDemo: true
    };
    s.soirees.push(soiree1, soiree2);

    const contextesPool = ["apero", "film-serie", "biere", "soiree"];
    const commentaires = [
      "Le goût barbecue arrive avec trois chips de retard.",
      "Incroyable pendant 30 secondes puis beaucoup trop salée.",
      "Je pourrais finir le paquet avant que les autres aient voté.",
      "Le poulet n'a visiblement pas été consulté pour cette recette.",
      "Un classique qui ne déçoit jamais.",
      "Trop discret, on dirait des chips nature déguisées.",
      "La truffe justifie presque le prix. Presque.",
      "Attention, paquet en voie de disparition.",
      "Verdict unanime : on en reprend.",
      "Ça pique plus que prévu, respect.",
      "Le sachet a fini vide avant le générique.",
      "On dirait un accident de laboratoire, mais un bon accident."
    ];

    // Répartir les 12 chips sur les deux soirées (6 chacune)
    chips.forEach((chip, i) => {
      const soiree = i < 6 ? soiree1 : soiree2;
      const deg = {
        id: uid("tasting"), soireeId: soiree.id, chipId: chip.id,
        revele: true, createdAt: new Date().toISOString()
      };
      s.degustations.push(deg);

      // notes de chaque dégustateur avec un peu de variabilité réaliste
      const base = 4.5 + Math.random() * 5; // profil de qualité de la chips
      tasters.forEach((t, ti) => {
        const perso = (Math.random() - 0.5) * 2.2; // variabilité individuelle
        const clamp = (v) => Math.max(0, Math.min(10, Math.round((v + perso) * 10) / 10));
        const criteres = {
          gout: clamp(base),
          texture: clamp(base + (Math.random() - 0.5) * 2),
          fidelite: clamp(base + (Math.random() - 0.5) * 2),
          intensite: clamp(base + (Math.random() - 0.5) * 2),
          originalite: clamp(chip.saveurId === "saveur-inconnue" || chip.saveurId === "truffe-noire" ? base + 1.5 : base),
          addictivite: clamp(base + (Math.random() - 0.5) * 2),
          qualite_prix: clamp(base - (chip.prix > 3 ? 1 : 0))
        };
        const rachAvg = (criteres.gout + criteres.addictivite) / 2;
        const racheter = rachAvg >= 7 ? "oui" : rachAvg >= 5 ? "peut-etre" : "non";
        s.notes.push({
          id: uid("note"),
          degustationId: deg.id,
          degustateurId: t.id,
          criteres,
          racheter,
          survie: Math.min(5, Math.max(1, Math.round(6 - rachAvg / 2))),
          contextes: [contextesPool[Math.floor(Math.random() * contextesPool.length)]],
          commentaire: ti === 0 ? commentaires[Math.floor(Math.random() * commentaires.length)] : "",
          createdAt: new Date().toISOString()
        });
      });
    });

    s.settings.demoLoaded = true;
    Store.save();
  }
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
