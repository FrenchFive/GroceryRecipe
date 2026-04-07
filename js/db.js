/**
 * db.js – localStorage-backed data layer
 *
 * Schemas:
 *   Recipe  { id, name, emoji, photo, servings, ingredients:[{name,qty,unit}], steps:[string], createdAt }
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

  /** Ensure a meal value is always an array (migrate from old single-ID format). */
  _norm(val) {
    if (Array.isArray(val)) return val.filter(Boolean);
    return val ? [val] : [];
  },

  /**
   * Load raw data, migrating legacy formats:
   * 1. Top-level day keys → week-keyed format
   * 2. Single recipeId per meal → array of recipeIds
   */
  _raw() {
    let data = load(DB_PLAN, {});
    // Legacy: top-level day keys
    if (data && DAYS.some(d => Object.prototype.hasOwnProperty.call(data, d))) {
      const wk = weekKey(new Date());
      data = { [wk]: data };
      save(DB_PLAN, data);
    }
    // Migrate single-ID values to arrays
    let migrated = false;
    for (const wk in data) {
      for (const day of DAYS) {
        if (!data[wk][day]) continue;
        for (const meal of MEALS) {
          const v = data[wk][day][meal];
          if (v !== undefined && !Array.isArray(v)) {
            data[wk][day][meal] = v ? [v] : [];
            migrated = true;
          }
        }
      }
    }
    if (migrated) save(DB_PLAN, data);
    return data;
  },

  /** Return the plan for a specific week (normalised – arrays). */
  allForWeek(wk) {
    const week = this._raw()[wk] || this._emptyWeek();
    // Ensure every meal slot is an array
    DAYS.forEach(d => {
      if (!week[d]) week[d] = { breakfast: [], lunch: [], dinner: [] };
      MEALS.forEach(m => { week[d][m] = this._norm(week[d][m]); });
    });
    return week;
  },

  /** Add a recipe to a meal slot. */
  add(wk, day, meal, recipeId) {
    if (!recipeId) return;
    const raw = this._raw();
    if (!raw[wk])      raw[wk]      = this._emptyWeek();
    if (!raw[wk][day]) raw[wk][day] = { breakfast: [], lunch: [], dinner: [] };
    const arr = this._norm(raw[wk][day][meal]);
    if (!arr.includes(recipeId)) arr.push(recipeId);
    raw[wk][day][meal] = arr;
    save(DB_PLAN, raw);
  },

  /** Remove a specific recipe from a meal slot. */
  remove(wk, day, meal, recipeId) {
    const raw = this._raw();
    if (!raw[wk]?.[day]) return;
    const arr = this._norm(raw[wk][day][meal]);
    raw[wk][day][meal] = arr.filter(id => id !== recipeId);
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
  defaultServings: 2,
  accentColor: 'blue',
  shoppingDay: 0           // 0=Monday … 6=Sunday (which day the shopping week starts)
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
