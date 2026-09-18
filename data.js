/* ============================================================
   CHIP CLUB — data.js
   Référentiels statiques : familles, formes, cuissons, saveurs,
   niveaux de piquant, seuils de verdict, contextes de dégustation.
   Conçu pour pouvoir migrer plus tard vers Supabase : chaque
   référentiel a un "id" stable, chaque entité utilisateur a un
   id généré (uuid-like) et des timestamps ISO.
   ============================================================ */

/* ---------- Familles de chips / snacks ---------- */
const FAMILLES = [
  { id: "pdt-classique", label: "Chips de pomme de terre", emoji: "🥔" },
  { id: "tortilla-mais", label: "Tortilla / chips de maïs", emoji: "🌽" },
  { id: "pdt-ondulee", label: "Chips ondulées", emoji: "🥔" },
  { id: "pdt-epaisse", label: "Chips épaisses / kettle cooked", emoji: "🥔" },
  { id: "pdt-artisanale", label: "Chips artisanales", emoji: "🥔" },
  { id: "pdt-chaudron", label: "Chips cuites au chaudron", emoji: "🥔" },
  { id: "pdt-allegee", label: "Chips allégées / cuites au four", emoji: "🥔" },
  { id: "legumes", label: "Chips de légumes", emoji: "🥔" },
  { id: "patate-douce", label: "Chips de patate douce", emoji: "🍠" },
  { id: "souffle", label: "Snacks soufflés", emoji: "🌽" },
  { id: "fromage-souffle", label: "Snacks type soufflés fromage", emoji: "🧀" },
  { id: "anneaux", label: "Anneaux / rings", emoji: "⭕" },
  { id: "tortilla-triangle", label: "Tortillas triangulaires", emoji: "🔺" },
  { id: "bretzel", label: "Bretzels / snacks apéritifs", emoji: "🥨" },
  { id: "crackers", label: "Crackers apéritifs", emoji: "🌾" },
  { id: "legumineuses", label: "Chips de légumineuses", emoji: "🌱" },
  { id: "riz", label: "Chips de riz", emoji: "🍚" },
  { id: "etranger", label: "Snack étranger / spécialité", emoji: "🌍" },
  { id: "autre-famille", label: "Autre", emoji: "❓" }
];

/* ---------- Formes / découpe ---------- */
const FORMES = [
  { id: "fine-classique", label: "Fine classique" },
  { id: "epaisse", label: "Épaisse" },
  { id: "ondulee", label: "Ondulée" },
  { id: "tres-ondulee", label: "Très ondulée" },
  { id: "striee", label: "Striée" },
  { id: "triangle", label: "Triangle" },
  { id: "tube", label: "Tube" },
  { id: "soufflee", label: "Soufflée" },
  { id: "boule", label: "Boule" },
  { id: "anneau", label: "Anneau" },
  { id: "batonnet", label: "Bâtonnet" },
  { id: "irreguliere", label: "Irrégulière / artisanale" },
  { id: "autre-forme", label: "Autre" }
];

/* ---------- Type de cuisson ---------- */
const CUISSONS = [
  { id: "frite-classique", label: "Frite classique" },
  { id: "chaudron", label: "Cuisson au chaudron" },
  { id: "kettle", label: "Kettle cooked" },
  { id: "four", label: "Cuisson au four" },
  { id: "soufflee-cuisson", label: "Soufflée" },
  { id: "autre-cuisson", label: "Autre" },
  { id: "inconnue", label: "Inconnue" }
];

/* ---------- Familles de saveur (pour les statistiques) ---------- */
const FAMILLES_SAVEUR = [
  { id: "classique", label: "Classique" },
  { id: "bbq-fume", label: "Barbecue / fumé" },
  { id: "fromage", label: "Fromage" },
  { id: "oignon-creme", label: "Oignon / crème" },
  { id: "epice-piment", label: "Épicé / piment" },
  { id: "vinaigre-acidule", label: "Vinaigre / acidulé" },
  { id: "premium", label: "Premium" },
  { id: "internationale", label: "Internationale" },
  { id: "wtf", label: "WTF" }
];

/* ---------- Grande bibliothèque de saveurs ---------- */
/* chaque saveur : id, label, familleId (référence FAMILLES_SAVEUR) */
const SAVEURS = [
  // Classiques
  { id: "nature", label: "Nature", familleId: "classique" },
  { id: "sel", label: "Sel", familleId: "classique" },
  { id: "sel-mer", label: "Sel de mer", familleId: "classique" },
  { id: "fleur-sel", label: "Fleur de sel", familleId: "classique" },
  { id: "poivre", label: "Poivre", familleId: "classique" },
  { id: "sel-poivre", label: "Sel & poivre", familleId: "classique" },
  // Barbecue / fumé
  { id: "barbecue", label: "Barbecue", familleId: "bbq-fume" },
  { id: "barbecue-fume", label: "Barbecue fumé", familleId: "bbq-fume" },
  { id: "bacon", label: "Bacon", familleId: "bbq-fume" },
  { id: "bacon-fume", label: "Bacon fumé", familleId: "bbq-fume" },
  { id: "poulet-roti", label: "Poulet rôti", familleId: "bbq-fume" },
  { id: "poulet-bbq", label: "Poulet barbecue", familleId: "bbq-fume" },
  { id: "viande-grillee", label: "Viande grillée", familleId: "bbq-fume" },
  { id: "steak", label: "Steak", familleId: "bbq-fume" },
  { id: "fume", label: "Saveur fumée", familleId: "bbq-fume" },
  // Fromage
  { id: "fromage", label: "Fromage", familleId: "fromage" },
  { id: "cheddar", label: "Cheddar", familleId: "fromage" },
  { id: "cheddar-affine", label: "Cheddar affiné", familleId: "fromage" },
  { id: "emmental", label: "Emmental", familleId: "fromage" },
  { id: "parmesan", label: "Parmesan", familleId: "fromage" },
  { id: "comte", label: "Comté", familleId: "fromage" },
  { id: "chevre", label: "Chèvre", familleId: "fromage" },
  { id: "bleu", label: "Bleu", familleId: "fromage" },
  { id: "fromage-oignon", label: "Fromage & oignon", familleId: "fromage" },
  { id: "nacho-cheese", label: "Nacho cheese", familleId: "fromage" },
  // Oignon / crème
  { id: "oignon", label: "Oignon", familleId: "oignon-creme" },
  { id: "oignon-grille", label: "Oignon grillé", familleId: "oignon-creme" },
  { id: "oignon-caramelise", label: "Oignon caramélisé", familleId: "oignon-creme" },
  { id: "creme-oignon", label: "Crème & oignon", familleId: "oignon-creme" },
  { id: "sour-cream-onion", label: "Sour Cream & Onion", familleId: "oignon-creme" },
  { id: "ciboulette", label: "Ciboulette", familleId: "oignon-creme" },
  { id: "ail", label: "Ail", familleId: "oignon-creme" },
  { id: "ail-fines-herbes", label: "Ail & fines herbes", familleId: "oignon-creme" },
  // Épicé / piment
  { id: "paprika", label: "Paprika", familleId: "epice-piment" },
  { id: "paprika-fume", label: "Paprika fumé", familleId: "epice-piment" },
  { id: "piment", label: "Piment", familleId: "epice-piment" },
  { id: "chili", label: "Chili", familleId: "epice-piment" },
  { id: "sweet-chili", label: "Sweet Chili", familleId: "epice-piment" },
  { id: "chili-doux", label: "Chili doux", familleId: "epice-piment" },
  { id: "chili-citron", label: "Chili & citron", familleId: "epice-piment" },
  { id: "jalapeno", label: "Jalapeño", familleId: "epice-piment" },
  { id: "habanero", label: "Habanero", familleId: "epice-piment" },
  { id: "cayenne", label: "Piment de Cayenne", familleId: "epice-piment" },
  { id: "espelette", label: "Piment d'Espelette", familleId: "epice-piment" },
  { id: "hot-spicy", label: "Hot & Spicy", familleId: "epice-piment" },
  { id: "sriracha", label: "Sriracha", familleId: "epice-piment" },
  { id: "wasabi", label: "Wasabi", familleId: "epice-piment" },
  // Vinaigre / acidulé
  { id: "vinaigre", label: "Vinaigre", familleId: "vinaigre-acidule" },
  { id: "sel-vinaigre", label: "Sel & vinaigre", familleId: "vinaigre-acidule" },
  { id: "vinaigre-balsamique", label: "Vinaigre balsamique", familleId: "vinaigre-acidule" },
  { id: "citron", label: "Citron", familleId: "vinaigre-acidule" },
  { id: "citron-vert", label: "Citron vert", familleId: "vinaigre-acidule" },
  { id: "pickles", label: "Pickles", familleId: "vinaigre-acidule" },
  { id: "cornichon", label: "Cornichon", familleId: "vinaigre-acidule" },
  { id: "moutarde", label: "Moutarde", familleId: "vinaigre-acidule" },
  { id: "moutarde-ancienne", label: "Moutarde à l'ancienne", familleId: "vinaigre-acidule" },
  // Premium
  { id: "truffe", label: "Truffe", familleId: "premium" },
  { id: "truffe-noire", label: "Truffe noire", familleId: "premium" },
  { id: "truffe-blanche", label: "Truffe blanche", familleId: "premium" },
  { id: "cepes", label: "Cèpes", familleId: "premium" },
  { id: "champignons", label: "Champignons", familleId: "premium" },
  { id: "foie-gras", label: "Foie gras", familleId: "premium" },
  { id: "parmesan-truffe", label: "Parmesan & truffe", familleId: "premium" },
  { id: "herbes-provence", label: "Herbes de Provence", familleId: "premium" },
  { id: "romarin", label: "Romarin", familleId: "premium" },
  { id: "huile-olive", label: "Huile d'olive", familleId: "premium" },
  { id: "tomate-basilic", label: "Tomate & basilic", familleId: "premium" },
  // Internationales
  { id: "curry", label: "Curry", familleId: "internationale" },
  { id: "curry-thai", label: "Curry thaï", familleId: "internationale" },
  { id: "tikka-masala", label: "Tikka Masala", familleId: "internationale" },
  { id: "teriyaki", label: "Teriyaki", familleId: "internationale" },
  { id: "yakitori", label: "Yakitori", familleId: "internationale" },
  { id: "kimchi", label: "Kimchi", familleId: "internationale" },
  { id: "soja", label: "Soja", familleId: "internationale" },
  { id: "miso", label: "Miso", familleId: "internationale" },
  { id: "kebab", label: "Kebab", familleId: "internationale" },
  { id: "tacos", label: "Tacos", familleId: "internationale" },
  { id: "pizza", label: "Pizza", familleId: "internationale" },
  { id: "burger", label: "Burger", familleId: "internationale" },
  { id: "hot-dog", label: "Hot Dog", familleId: "internationale" },
  { id: "buffalo", label: "Buffalo", familleId: "internationale" },
  { id: "tex-mex", label: "Tex-Mex", familleId: "internationale" },
  { id: "salsa", label: "Salsa", familleId: "internationale" },
  { id: "guacamole", label: "Guacamole", familleId: "internationale" },
  // WTF
  { id: "oeuf", label: "Œuf", familleId: "wtf" },
  { id: "crevette", label: "Crevette", familleId: "wtf" },
  { id: "crabe", label: "Crabe", familleId: "wtf" },
  { id: "homard", label: "Homard", familleId: "wtf" },
  { id: "huitre", label: "Huître", familleId: "wtf" },
  { id: "algues", label: "Algues", familleId: "wtf" },
  { id: "calamar", label: "Calamar", familleId: "wtf" },
  { id: "poulpe", label: "Poulpe", familleId: "wtf" },
  { id: "caviar", label: "Caviar", familleId: "wtf" },
  { id: "cola", label: "Cola", familleId: "wtf" },
  { id: "chocolat", label: "Chocolat", familleId: "wtf" },
  { id: "miel", label: "Miel", familleId: "wtf" },
  { id: "erable", label: "Érable", familleId: "wtf" },
  { id: "cannelle", label: "Cannelle", familleId: "wtf" },
  { id: "saveur-inconnue", label: "Saveur inconnue", familleId: "wtf" }
];

/* ---------- Niveaux de piquant ---------- */
const NIVEAUX_PIQUANT = [
  { valeur: 0, label: "Aucun", emoji: "" },
  { valeur: 1, label: "Très léger", emoji: "🌶️" },
  { valeur: 2, label: "Léger", emoji: "🌶️🌶️" },
  { valeur: 3, label: "Piquant", emoji: "🌶️🌶️🌶️" },
  { valeur: 4, label: "Très piquant", emoji: "🌶️🌶️🌶️🌶️" },
  { valeur: 5, label: "Violence gratuite", emoji: "🌶️🌶️🌶️🌶️🌶️" }
];

/* ---------- Critères de dégustation ---------- */
const CRITERES = [
  { id: "gout", label: "Goût", description: "Le plaisir gustatif général." },
  { id: "texture", label: "Texture / croustillant", description: "Qualité du croquant et sensation en bouche." },
  { id: "fidelite", label: "Fidélité de la saveur", description: "Est-ce que le goût annoncé sur le paquet correspond réellement à ce que l'on mange ?" },
  { id: "intensite", label: "Intensité", description: "La saveur est-elle suffisamment présente ?" },
  { id: "originalite", label: "Originalité", description: "La chips apporte-t-elle quelque chose de différent ?" },
  { id: "addictivite", label: "Addictivité", description: "Est-ce qu'on a immédiatement envie d'en reprendre une ?" },
  { id: "qualite_prix", label: "Rapport qualité / prix", description: "" }
];

/* ---------- Racheter ---------- */
const RACHETER_OPTIONS = [
  { id: "oui", label: "Oui, sans hésiter", emoji: "😍" },
  { id: "peut-etre", label: "Peut-être", emoji: "🤔" },
  { id: "non", label: "Non", emoji: "❌" }
];

/* ---------- Survie du paquet ---------- */
const SURVIE_PAQUET = [
  { valeur: 1, label: "Plusieurs jours" },
  { valeur: 2, label: "Ça va" },
  { valeur: 3, label: "Il commence à être en danger" },
  { valeur: 4, label: "Très peu de chances" },
  { valeur: 5, label: "Le paquet est déjà mort" }
];

/* ---------- Contextes de consommation ---------- */
const CONTEXTES = [
  { id: "apero", label: "Apéro" },
  { id: "film-serie", label: "Film / série" },
  { id: "biere", label: "Bière" },
  { id: "soda", label: "Soda" },
  { id: "sandwich", label: "Sandwich" },
  { id: "burger", label: "Burger" },
  { id: "seule", label: "Seule" },
  { id: "soiree", label: "Soirée" },
  { id: "autre-contexte", label: "Autre" }
];

/* ---------- Seuils de verdict automatique (modifiables) ---------- */
const SEUILS_VERDICT = [
  { min: 9.0, max: 10.01, label: "LÉGENDAIRE", emoji: "👑" },
  { min: 8.0, max: 9.0, label: "BANGER", emoji: "🔥" },
  { min: 7.0, max: 8.0, label: "TRÈS SOLIDE", emoji: "😋" },
  { min: 6.0, max: 7.0, label: "ÇA PASSE BIEN", emoji: "👍" },
  { min: 5.0, max: 6.0, label: "BOF", emoji: "😐" },
  { min: 4.0, max: 5.0, label: "COMPLIQUÉ", emoji: "😬" },
  { min: -0.01, max: 4.0, label: "CRIME CONTRE LA PATATE", emoji: "🚨" }
];

function getVerdict(note) {
  if (note == null || isNaN(note)) return { label: "—", emoji: "❓" };
  const seuils = Store.getSeuils();
  for (const s of seuils) {
    if (note >= s.min && note < s.max) return s;
  }
  return seuils[seuils.length - 1];
}

/* ---------- Modes de dégustation ---------- */
const MODES_DEGUSTATION = [
  { id: "classique", label: "Classique", description: "Les informations de la chips sont visibles." },
  { id: "aveugle", label: "À l'aveugle", description: "La marque et la saveur sont cachées pendant le vote et révélées seulement après validation des notes." }
];

/* ---------- Helpers ---------- */
function uid(prefix) {
  return (prefix ? prefix + "_" : "") + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function findById(list, id) {
  return list.find((x) => x.id === id);
}

function labelOf(list, id, fallback) {
  const item = findById(list, id);
  return item ? item.label : (fallback || id || "—");
}
