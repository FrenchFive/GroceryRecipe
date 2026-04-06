/**
 * db.js – localStorage-backed data layer
 *
 * Schemas:
 *   Recipe  { id, name, emoji, servings, ingredients:[{name,qty,unit}], steps:[string], createdAt }
 *   ShopItem{ id, name, qty, unit, checked, source, recipeId }
 *   Plan    { [weekKey]: { [day]: { breakfast, lunch, dinner } } }
 *             weekKey = 'YYYY-MM-DD' of that week's Monday
 */

const DB_RECIPES   = 'gr_recipes';
const DB_SHOPPING  = 'gr_shopping';
const DB_PLAN      = 'gr_plan';

const DAYS         = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEALS        = ['breakfast','lunch','dinner'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Week utilities ──────────────────────────────────────── */

/** Return a new Date set to midnight of the Monday for `date`. */
function getMondayOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sunday
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

/** 'YYYY-MM-DD' string for the Monday of the week containing `date`. */
function weekKey(date) {
  const m = getMondayOfWeek(date);
  return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`;
}

/** Array of 7 Date objects (Mon → Sun) for the week identified by `wk`. */
function getWeekDates(wk) {
  const [y, mo, dy] = wk.split('-').map(Number);
  const mon = new Date(y, mo - 1, dy);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x;
  });
}

/** Human-readable range like "Jun 9 – 15, 2026" or "Jun 30 – Jul 6, 2026". */
function formatWeekRange(wk) {
  const dates = getWeekDates(wk);
  const s = dates[0], e = dates[6];
  const sm = MONTHS_SHORT[s.getMonth()], em = MONTHS_SHORT[e.getMonth()];
  return s.getMonth() === e.getMonth()
    ? `${sm} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
    : `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`;
}

/* ── helpers ────────────────────────────────────────────── */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ── Recipes ─────────────────────────────────────────────── */
const RecipeDB = {
  all() { return load(DB_RECIPES, []); },

  get(id) { return this.all().find(r => r.id === id) || null; },

  save(recipe) {
    const list = this.all();
    const idx  = list.findIndex(r => r.id === recipe.id);
    if (idx >= 0) { list[idx] = recipe; }
    else {
      recipe.id        = uid();
      recipe.createdAt = Date.now();
      list.push(recipe);
    }
    save(DB_RECIPES, list);
    return recipe;
  },

  delete(id) {
    save(DB_RECIPES, this.all().filter(r => r.id !== id));
  },

  search(q) {
    const term = q.trim().toLowerCase();
    if (!term) return this.all();
    return this.all().filter(r => r.name.toLowerCase().includes(term));
  }
};

/* ── Shopping list ───────────────────────────────────────── */
const ShoppingDB = {
  all() { return load(DB_SHOPPING, []); },

  addFromRecipe(recipe, multiplier = 1) {
    const list = this.all();
    recipe.ingredients.forEach(ing => {
      const existing = list.find(
        i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit
      );
      if (existing) {
        const parsed = parseFloat(existing.qty);
        const add    = parseFloat(ing.qty) * multiplier;
        existing.qty = isNaN(parsed) ? existing.qty : String(Math.round((parsed + add) * 100) / 100);
      } else {
        list.push({
          id:       uid(),
          name:     ing.name,
          qty:      isNaN(parseFloat(ing.qty)) ? ing.qty : String(Math.round(parseFloat(ing.qty) * multiplier * 100) / 100),
          unit:     ing.unit || '',
          checked:  false,
          source:   recipe.name,
          recipeId: recipe.id
        });
      }
    });
    save(DB_SHOPPING, list);
  },

  toggle(id) {
    const list = this.all();
    const item = list.find(i => i.id === id);
    if (item) { item.checked = !item.checked; save(DB_SHOPPING, list); }
  },

  remove(id) { save(DB_SHOPPING, this.all().filter(i => i.id !== id)); },

  clearChecked() { save(DB_SHOPPING, this.all().filter(i => !i.checked)); },

  clearAll() { save(DB_SHOPPING, []); },

  count() { return this.all().filter(i => !i.checked).length; }
};

/* ── Weekly planner ──────────────────────────────────────── */
const PlanDB = {
  /** Empty plan object for one week. */
  _emptyWeek() {
    const w = {};
    DAYS.forEach(d => { w[d] = { breakfast: null, lunch: null, dinner: null }; });
    return w;
  },

  /**
   * Detect the legacy format (top-level keys are day names) and migrate it
   * to the new week-keyed format transparently.
   */
  _raw() {
    const data = load(DB_PLAN, {});
    if (data && DAYS.some(d => Object.prototype.hasOwnProperty.call(data, d))) {
      const wk = weekKey(new Date());
      const migrated = { [wk]: data };
      save(DB_PLAN, migrated);
      return migrated;
    }
    return data;
  },

  /** Return the plan for a specific week (empty week if none stored). */
  allForWeek(wk) {
    return this._raw()[wk] || this._emptyWeek();
  },

  /** Set a single meal slot. */
  set(wk, day, meal, recipeId) {
    const raw = this._raw();
    if (!raw[wk])      raw[wk]      = this._emptyWeek();
    if (!raw[wk][day]) raw[wk][day] = { breakfast: null, lunch: null, dinner: null };
    raw[wk][day][meal] = recipeId || null;
    save(DB_PLAN, raw);
  },

  /** Remove all meals for the given week. */
  clearWeek(wk) {
    const raw = this._raw();
    delete raw[wk];
    save(DB_PLAN, raw);
  }
};

/* ── Seed data ───────────────────────────────────────────── */
function seedIfEmpty() {
  if (RecipeDB.all().length > 0) return;

  const seeds = [
    {
      name: 'Spaghetti Bolognese',
      emoji: '🍝',
      servings: 4,
      ingredients: [
        { name: 'Spaghetti',        qty: '400', unit: 'g' },
        { name: 'Ground beef',       qty: '500', unit: 'g' },
        { name: 'Tomato sauce',      qty: '400', unit: 'ml' },
        { name: 'Onion',             qty: '1',   unit: '' },
        { name: 'Garlic cloves',     qty: '3',   unit: '' },
        { name: 'Olive oil',         qty: '2',   unit: 'tbsp' },
        { name: 'Salt & pepper',     qty: '',    unit: 'to taste' }
      ],
      steps: [
        'Finely chop onion and garlic.',
        'Heat olive oil in a pan, sauté onion until translucent, then add garlic.',
        'Add ground beef and brown for 5 minutes.',
        'Pour in tomato sauce, season, and simmer 20 minutes.',
        'Cook spaghetti according to package instructions.',
        'Serve sauce over pasta.'
      ]
    },
    {
      name: 'Caesar Salad',
      emoji: '🥗',
      servings: 2,
      ingredients: [
        { name: 'Romaine lettuce', qty: '1',   unit: 'head' },
        { name: 'Parmesan',       qty: '50',  unit: 'g' },
        { name: 'Croutons',       qty: '80',  unit: 'g' },
        { name: 'Caesar dressing',qty: '4',   unit: 'tbsp' },
        { name: 'Lemon',          qty: '0.5', unit: '' }
      ],
      steps: [
        'Wash and tear romaine leaves into a large bowl.',
        'Add croutons and shaved parmesan.',
        'Drizzle with Caesar dressing and a squeeze of lemon.',
        'Toss gently and serve immediately.'
      ]
    },
    {
      name: 'Pancakes',
      emoji: '🥞',
      servings: 2,
      ingredients: [
        { name: 'Flour',          qty: '150', unit: 'g' },
        { name: 'Milk',           qty: '200', unit: 'ml' },
        { name: 'Egg',            qty: '1',   unit: '' },
        { name: 'Butter',         qty: '30',  unit: 'g' },
        { name: 'Baking powder',  qty: '1',   unit: 'tsp' },
        { name: 'Sugar',          qty: '1',   unit: 'tbsp' },
        { name: 'Salt',           qty: '1',   unit: 'pinch' }
      ],
      steps: [
        'Mix flour, baking powder, sugar and salt.',
        'Whisk in milk, egg and melted butter until smooth.',
        'Heat a lightly oiled pan over medium heat.',
        'Pour ~3 tbsp batter per pancake; flip when bubbles form.',
        'Serve with maple syrup or fresh fruit.'
      ]
    }
  ];

  seeds.forEach(s => RecipeDB.save(s));
}
