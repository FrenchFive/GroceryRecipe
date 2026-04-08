/**
 * db.js – localStorage-backed data layer
 *
 * Schemas:
 *   Recipe  { id, name, emoji, photo, servings, prepTime, cookTime, ingredients:[{name,qty,unit,optional}], steps:[string], createdAt }
 *   ShopItem{ id, name, qty, unit, checked, source, recipeId }
 *   Plan    { [weekKey]: { [day]: { breakfast:[id], lunch:[id], dinner:[id] } } }
 *             weekKey = 'YYYY-MM-DD' of that week's Monday
 */

const DB_RECIPES   = 'gr_recipes';
const DB_SHOPPING  = 'gr_shopping';
const DB_PLAN      = 'gr_plan';
const DB_PREFS     = 'gr_prefs';

const DAYS         = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEALS        = ['breakfast','lunch','dinner'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

/**
 * Return the start-of-week Date for shopping, based on user's preferred shopping day.
 * shoppingDay: 0=Monday … 6=Sunday (same indexing as DAYS array).
 */
function getShopWeekStart(date, shoppingDay) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Convert JS getDay() (0=Sun) to our index (0=Mon … 6=Sun)
  const dow = d.getDay();
  const ourIdx = dow === 0 ? 6 : dow - 1; // 0=Mon … 6=Sun
  let diff = ourIdx - shoppingDay;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Week key for shopping (start date based on shopping day pref). */
function shopWeekKey(date) {
  const sd = PrefsDB.get('shoppingDay') || 0;
  const start = getShopWeekStart(date, sd);
  return `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
}

/** Array of 7 Date objects for the shop week identified by `swk`. */
function getShopWeekDates(swk) {
  const [y, mo, dy] = swk.split('-').map(Number);
  const start = new Date(y, mo - 1, dy);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });
}

/** Human-readable range for a shop week key. */
function formatShopWeekRange(swk) {
  const dates = getShopWeekDates(swk);
  const s = dates[0], e = dates[6];
  const sm = MONTHS_SHORT[s.getMonth()], em = MONTHS_SHORT[e.getMonth()];
  return s.getMonth() === e.getMonth()
    ? `${sm} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
    : `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`;
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

/* ── Unit system ────────────────────────────────────────── */

/** Conversion factors within each category (to a base unit). */
const UNIT_CONVERSIONS = {
  mass:   { mg: 0.001, g: 1, kg: 1000 },
  volume: { ml: 1, pint: 480, l: 1000 },
  spoon:  { tsp: 1, tbsp: 3 },
};

/** Ordered lists of units per category (smallest → largest). */
const UNIT_ORDER = {
  mass:   ['mg', 'g', 'kg'],
  volume: ['ml', 'pint', 'l'],
  spoon:  ['tsp', 'tbsp'],
};

/** All selectable units grouped by category. */
const UNIT_OPTIONS = [
  { value: '',         label: 'unit',     category: 'count' },
  { value: 'mg',       label: 'mg',       category: 'mass' },
  { value: 'g',        label: 'g',        category: 'mass' },
  { value: 'kg',       label: 'kg',       category: 'mass' },
  { value: 'ml',       label: 'ml',       category: 'volume' },
  { value: 'pint',     label: 'pint',     category: 'volume' },
  { value: 'l',        label: 'l',        category: 'volume' },
  { value: 'tsp',      label: 'tsp',      category: 'spoon' },
  { value: 'tbsp',     label: 'tbsp',     category: 'spoon' },
  { value: 'pinch',    label: 'pinch',    category: 'other' },
  { value: 'head',     label: 'head',     category: 'other' },
  { value: 'clove',    label: 'clove',    category: 'other' },
  { value: 'slice',    label: 'slice',    category: 'other' },
  { value: 'bunch',    label: 'bunch',    category: 'other' },
  { value: 'can',      label: 'can',      category: 'other' },
  { value: 'to taste', label: 'to taste', category: 'other' },
];

/** Return the category string for a given unit. */
function getUnitCategory(unit) {
  const u = (unit || '').trim().toLowerCase();
  for (const [cat, conversions] of Object.entries(UNIT_CONVERSIONS)) {
    if (u in conversions) return cat;
  }
  if (u === '' || u === 'unit') return 'count';
  return 'other';
}

/** Pick the best display unit for a base-unit quantity (largest where value >= 1). */
function pickBestUnit(baseQty, category) {
  const order = UNIT_ORDER[category];
  const conv  = UNIT_CONVERSIONS[category];
  if (!order || !conv) return '';
  for (let i = order.length - 1; i >= 0; i--) {
    if (baseQty / conv[order[i]] >= 1) return order[i];
  }
  return order[0];
}

/**
 * Merge an array of {qty, unit} into a display string.
 * Converts within categories, shows separate entries for different categories.
 * E.g. [{qty:'200',unit:'ml'},{qty:'1',unit:'l'},{qty:'2',unit:'tbsp'}] → "1.2 l + 2 tbsp"
 */
function mergeQtyUnits(items) {
  const byCategory = {};
  items.forEach(({ qty, unit }) => {
    const cat = getUnitCategory(unit);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ qty: parseFloat(qty), unit });
  });

  const parts = [];
  for (const [cat, entries] of Object.entries(byCategory)) {
    const conv = UNIT_CONVERSIONS[cat];
    if (conv) {
      let baseSum = 0;
      entries.forEach(({ qty, unit }) => {
        if (!isNaN(qty)) baseSum += qty * (conv[unit] || 1);
      });
      const best = pickBestUnit(baseSum, cat);
      const displayQty = Math.round((baseSum / (conv[best] || 1)) * 100) / 100;
      parts.push(`${displayQty} ${best}`);
    } else {
      const byUnit = {};
      entries.forEach(({ qty, unit }) => {
        const u = unit || '';
        if (!byUnit[u]) byUnit[u] = 0;
        if (!isNaN(qty)) byUnit[u] += qty;
      });
      for (const [u, total] of Object.entries(byUnit)) {
        const displayQty = Math.round(total * 100) / 100;
        parts.push(`${displayQty}${u ? ' ' + u : ''}`);
      }
    }
  }
  return parts.join(' + ');
}

/* ── Recipe categories ──────────────────────────────────── */
const RECIPE_CATEGORIES = [
  { value: '',           label: 'None' },
  { value: 'starter',    label: 'Starter' },
  { value: 'main',       label: 'Main' },
  { value: 'side',       label: 'Side' },
  { value: 'dessert',    label: 'Dessert' },
  { value: 'snack',      label: 'Snack' },
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'drink',      label: 'Drink' },
];

/* ── Recipes ─────────────────────────────────────────────── */
const RecipeDB = {
  all() { return load(DB_RECIPES, []); },

  get(id) { return this.all().find(r => r.id === id) || null; },

  save(recipe) {
    const list = this.all();
    const idx  = list.findIndex(r => r.id === recipe.id);
    if (idx < 0) {
      recipe.id        = uid();
      recipe.createdAt = Date.now();
    }
    // Ensure new fields have defaults
    if (recipe.starred === undefined) recipe.starred = false;
    if (!Array.isArray(recipe.tags)) recipe.tags = [];
    if (recipe.category === undefined) recipe.category = '';
    if (recipe.prepTime === undefined) recipe.prepTime = 0;
    if (recipe.cookTime === undefined) recipe.cookTime = 0;

    if (idx >= 0) { list[idx] = recipe; }
    else { list.push(recipe); }
    save(DB_RECIPES, list);
    return recipe;
  },

  delete(id) {
    save(DB_RECIPES, this.all().filter(r => r.id !== id));
  },

  toggleStar(id) {
    const list = this.all();
    const r = list.find(r => r.id === id);
    if (r) { r.starred = !r.starred; save(DB_RECIPES, list); }
    return r;
  },

  /** Search by name, tags, and category. */
  search(q) {
    const term = q.trim().toLowerCase();
    if (!term) return this.all();
    return this.all().filter(r => {
      if (r.name.toLowerCase().includes(term)) return true;
      if (r.category && r.category.toLowerCase().includes(term)) return true;
      if (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(term))) return true;
      return false;
    });
  },

  /** Count how many times a recipe appears in all plans. */
  planCount(id) {
    const data = load(DB_PLAN, {});
    let count = 0;
    for (const wk in data) {
      for (const day of DAYS) {
        if (!data[wk]?.[day]) continue;
        for (const meal of MEALS) {
          const slots = data[wk][day][meal];
          if (Array.isArray(slots)) {
            count += slots.filter(s => (typeof s === 'object' ? s.recipeId : s) === id).length;
          }
        }
      }
    }
    return count;
  },

  /** Return unique ingredients {name, unit, qty, optional} across all recipes (sorted by name).
   *  Keeps the first occurrence per ingredient name. */
  allIngredientsWithUnits() {
    const map = {};
    this.all().forEach(r => {
      r.ingredients.forEach(i => {
        const key = i.name.trim().toLowerCase();
        if (key && !map[key]) map[key] = { name: i.name.trim(), unit: i.unit || '', qty: i.qty || '', optional: !!i.optional };
      });
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  },

  /** Return all unique tags across recipes. */
  allTags() {
    const set = new Set();
    this.all().forEach(r => {
      if (Array.isArray(r.tags)) r.tags.forEach(t => set.add(t));
    });
    return [...set].sort();
  }
};

/* ── Shopping list ───────────────────────────────────────── */
const ShoppingDB = {
  all() { return load(DB_SHOPPING, []); },

  addFromRecipe(recipe, multiplier = 1) {
    const list = this.all();
    recipe.ingredients.forEach(ing => {
      const ingCat  = getUnitCategory(ing.unit);
      const conv    = UNIT_CONVERSIONS[ingCat];
      const addQty  = parseFloat(ing.qty) * multiplier;

      // Find existing item with same name and convertible unit (same category)
      const existing = list.find(i => {
        if (i.name.toLowerCase() !== ing.name.toLowerCase()) return false;
        const existCat = getUnitCategory(i.unit);
        if (existCat !== ingCat) return false;
        return conv ? true : (i.unit || '') === (ing.unit || '');
      });

      if (existing && conv && !isNaN(addQty)) {
        // Convert both to base unit, sum, pick best display unit
        const existBase = parseFloat(existing.qty) * (conv[existing.unit] || 1);
        const addBase   = addQty * (conv[ing.unit] || 1);
        if (!isNaN(existBase)) {
          const totalBase = existBase + addBase;
          const best      = pickBestUnit(totalBase, ingCat);
          existing.qty  = String(Math.round((totalBase / (conv[best] || 1)) * 100) / 100);
          existing.unit = best;
        }
        if (existing.source && !existing.source.includes(recipe.name)) {
          existing.source += ', ' + recipe.name;
        }
      } else if (existing) {
        const parsed = parseFloat(existing.qty);
        if (!isNaN(parsed) && !isNaN(addQty)) {
          existing.qty = String(Math.round((parsed + addQty) * 100) / 100);
        }
        if (existing.source && !existing.source.includes(recipe.name)) {
          existing.source += ', ' + recipe.name;
        }
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

/* ── Custom (manual) shopping items ─────────────────────── */
const DB_CUSTOM_ITEMS = 'gr_custom_items';

const CustomItemsDB = {
  all() { return load(DB_CUSTOM_ITEMS, []); },

  add(name, qty, unit) {
    const list = this.all();
    list.push({ id: uid(), name, qty: qty || '', unit: unit || '', checked: false });
    save(DB_CUSTOM_ITEMS, list);
  },

  toggle(id) {
    const list = this.all();
    const item = list.find(i => i.id === id);
    if (item) { item.checked = !item.checked; save(DB_CUSTOM_ITEMS, list); }
  },

  remove(id) { save(DB_CUSTOM_ITEMS, this.all().filter(i => i.id !== id)); },

  clearChecked() { save(DB_CUSTOM_ITEMS, this.all().filter(i => !i.checked)); },

  count() { return this.all().filter(i => !i.checked).length; }
};

/* ── Recurring items (auto-added every week) ────────────── */
const DB_RECURRING = 'gr_recurring_items';

const RecurringDB = {
  all() { return load(DB_RECURRING, []); },

  add(name, qty, unit) {
    const list = this.all();
    list.push({ id: uid(), name, qty: qty || '', unit: unit || '' });
    save(DB_RECURRING, list);
  },

  remove(id) { save(DB_RECURRING, this.all().filter(i => i.id !== id)); },

  update(id, name, qty, unit) {
    const list = this.all();
    const item = list.find(i => i.id === id);
    if (item) {
      item.name = name;
      item.qty = qty || '';
      item.unit = unit || '';
      save(DB_RECURRING, list);
    }
  }
};

/* ── Weekly planner ──────────────────────────────────────── */
const PlanDB = {
  /** Empty plan object for one week – each meal is an array of recipe IDs. */
  _emptyWeek() {
    const w = {};
    DAYS.forEach(d => { w[d] = { breakfast: [], lunch: [], dinner: [] }; });
    return w;
  },

  /**
   * Ensure a meal value is always an array of { recipeId, servings }.
   * Migrates from legacy formats: plain string IDs, or mixed arrays.
   */
  _norm(val) {
    if (!Array.isArray(val)) {
      if (!val) return [];
      if (typeof val === 'string') {
        const r = RecipeDB.get(val);
        return [{ recipeId: val, servings: r ? r.servings : 1 }];
      }
      if (typeof val === 'object' && val.recipeId) return [val];
      return [];
    }
    return val.filter(Boolean).map(v => {
      if (typeof v === 'string') {
        const r = RecipeDB.get(v);
        return { recipeId: v, servings: r ? r.servings : 1 };
      }
      if (typeof v === 'object' && v.recipeId) return v;
      return null;
    }).filter(Boolean);
  },

  /**
   * Load raw data, migrating legacy formats:
   * 1. Top-level day keys → week-keyed format
   * 2. Non-array values → arrays of {recipeId, servings}
   */
  _raw() {
    let data = load(DB_PLAN, {});
    // Legacy: top-level day keys
    if (data && DAYS.some(d => Object.prototype.hasOwnProperty.call(data, d))) {
      const wk = weekKey(new Date());
      data = { [wk]: data };
      save(DB_PLAN, data);
    }
    // Migrate non-array values to arrays
    let migrated = false;
    for (const wk in data) {
      for (const day of DAYS) {
        if (!data[wk][day]) continue;
        for (const meal of MEALS) {
          const v = data[wk][day][meal];
          if (v !== undefined && !Array.isArray(v)) {
            data[wk][day][meal] = this._norm(v);
            migrated = true;
          }
        }
      }
    }
    if (migrated) save(DB_PLAN, data);
    return data;
  },

  /** Return the plan for a specific week (normalised – arrays of {recipeId, servings}). */
  allForWeek(wk) {
    const week = this._raw()[wk] || this._emptyWeek();
    DAYS.forEach(d => {
      if (!week[d]) week[d] = { breakfast: [], lunch: [], dinner: [] };
      MEALS.forEach(m => { week[d][m] = this._norm(week[d][m]); });
    });
    return week;
  },

  /** Add a recipe to a meal slot with its default servings. */
  add(wk, day, meal, recipeId) {
    if (!recipeId) return;
    const raw = this._raw();
    if (!raw[wk])      raw[wk]      = this._emptyWeek();
    if (!raw[wk][day]) raw[wk][day] = { breakfast: [], lunch: [], dinner: [] };
    const arr = this._norm(raw[wk][day][meal]);
    if (!arr.some(s => s.recipeId === recipeId)) {
      const r = RecipeDB.get(recipeId);
      arr.push({ recipeId, servings: r ? r.servings : 1 });
    }
    raw[wk][day][meal] = arr;
    save(DB_PLAN, raw);
  },

  /** Remove a specific recipe from a meal slot. */
  remove(wk, day, meal, recipeId) {
    const raw = this._raw();
    if (!raw[wk]?.[day]) return;
    const arr = this._norm(raw[wk][day][meal]);
    raw[wk][day][meal] = arr.filter(s => s.recipeId !== recipeId);
    save(DB_PLAN, raw);
  },

  /** Update servings for a specific recipe in a meal slot. */
  setServings(wk, day, meal, recipeId, servings) {
    const raw = this._raw();
    if (!raw[wk]?.[day]) return;
    const arr = this._norm(raw[wk][day][meal]);
    const slot = arr.find(s => s.recipeId === recipeId);
    if (slot) { slot.servings = servings; }
    raw[wk][day][meal] = arr;
    save(DB_PLAN, raw);
  },

  /** Clear all recipes from a meal slot. */
  clearMeal(wk, day, meal) {
    const raw = this._raw();
    if (!raw[wk]?.[day]) return;
    raw[wk][day][meal] = [];
    save(DB_PLAN, raw);
  },

  /** Remove all meals for the given week. */
  clearWeek(wk) {
    const raw = this._raw();
    delete raw[wk];
    save(DB_PLAN, raw);
  }
};

/* ── Accent color presets ────────────────────────────────── */
const ACCENT_COLORS = {
  green:  { label: 'Green',  main: '#2e7d32', light: '#43a047', bg: '#e8f5e9' },
  teal:   { label: 'Teal',   main: '#00796b', light: '#00897b', bg: '#e0f2f1' },
  blue:   { label: 'Blue',   main: '#1565c0', light: '#1e88e5', bg: '#e3f2fd' },
  indigo: { label: 'Indigo', main: '#283593', light: '#3949ab', bg: '#e8eaf6' },
  purple: { label: 'Purple', main: '#6a1b9a', light: '#8e24aa', bg: '#f3e5f5' },
  pink:   { label: 'Pink',   main: '#c2185b', light: '#d81b60', bg: '#fce4ec' },
  red:    { label: 'Red',    main: '#c62828', light: '#e53935', bg: '#ffebee' },
  orange: { label: 'Orange', main: '#e65100', light: '#f4511e', bg: '#fbe9e7' },
  amber:  { label: 'Amber',  main: '#f57f17', light: '#f9a825', bg: '#fff8e1' },
  brown:  { label: 'Brown',  main: '#4e342e', light: '#6d4c41', bg: '#efebe9' },
};

/* ── User preferences ───────────────────────────────────── */
const PREF_DEFAULTS = {
  defaultServings: 1,
  accentColor: 'blue',
  shoppingDay: 0,          // 0=Monday … 6=Sunday (which day the shopping week starts)
  shoppingReminder: false  // Send a notification on shopping day
};

const PrefsDB = {
  all() { return { ...PREF_DEFAULTS, ...load(DB_PREFS, {}) }; },

  get(key) { return this.all()[key]; },

  set(key, value) {
    const prefs = this.all();
    prefs[key] = value;
    save(DB_PREFS, prefs);
  },

  reset() { save(DB_PREFS, {}); }
};

/* ── Seed data ───────────────────────────────────────────── */
function seedIfEmpty() {
  if (RecipeDB.all().length > 0) return;

  const seeds = [
    {
      name: 'Spaghetti Bolognese',
      emoji: '🍝',
      servings: 4,
      prepTime: 10,
      cookTime: 30,
      category: 'main',
      tags: ['pasta', 'italian'],
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
      prepTime: 10,
      cookTime: 0,
      category: 'starter',
      tags: ['salad', 'quick'],
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
      prepTime: 5,
      cookTime: 10,
      category: 'breakfast',
      tags: ['sweet', 'quick'],
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
