/**
 * app.js – SPA routing, view rendering, event wiring
 */

const APP_VERSION = '0.3.0';

/* ── Inline SVG icon helper (no createIcons dependency) ── */
const ICON_SVG = {
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  'calendar-range': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/>',
  'camera': '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'chef-hat': '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'clipboard-copy': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M16 4h2a2 2 0 0 1 2 2v4"/><path d="M21 14H11"/><path d="m15 10-4 4 4 4"/>',
  'cooking-pot': '<path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>',
  'list-plus': '<path d="M16 5H3"/><path d="M11 12H3"/><path d="M16 19H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
  'arrow-up-down': '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  'minus': '<path d="M5 12h14"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  'moon': '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
  'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  'save': '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  'search': '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  'share-2': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'sunrise': '<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  'trash-2': '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
};
function icon(name, size = 20, cls = '') {
  const inner = ICON_SVG[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name} ${cls}" aria-hidden="true">${inner}</svg>`;
}
function refreshIcons() {
  /* no-op: icons are now inline SVGs, no post-processing needed */
}

/* ── State ───────────────────────────────────────────────── */
let currentPage          = 'recipes';
let detailRecipeId       = null;   // recipe open in detail view
let plannerWeekOffset    = 0;      // 0 = current week, ±n = n weeks offset
let plannerSelectedDayIdx = null;  // null = auto-select today/Mon, 0-6 = explicit selection
let shoppingView         = 'current'; // 'current' | 'next'
let pickerCtx            = null;   // { wk, day, meal } for the meal picker
let recipeSortMode       = 'default';  // 'default' | 'alpha' | 'newest' | 'oldest' | 'most-planned' | 'least-planned'
let recipeCategoryFilter = '';         // '' = all, or a category value
let plannerSearchQuery   = '';         // search filter in planner meal picker

/* ── Planner week helpers ────────────────────────────────── */
function getPlannerWk() {
  const d = new Date();
  d.setDate(d.getDate() + plannerWeekOffset * 7);
  return weekKey(d);
}

/** Return the effective selected day index (auto-pick today or Monday). */
function getEffectiveSelIdx(nowDate) {
  if (plannerSelectedDayIdx !== null) return plannerSelectedDayIdx;
  if (plannerWeekOffset === 0) {
    const dow = nowDate.getDay(); // 0 = Sunday
    return dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
  }
  return 0;
}

/* ── Navigation history (for Android back gesture) ──────── */
let navHistory = [];
let handlingPopState = false;

/* ── Capacitor plugin helpers ──────────────────────────────── */
function getCapPlugin(name) {
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name])
      return window.Capacitor.Plugins[name];
  } catch (_) {}
  return null;
}

function hapticTap()    { const h = getCapPlugin('Haptics'); if (h) h.impact({ style: 'LIGHT' }); }
function hapticAction() { const h = getCapPlugin('Haptics'); if (h) h.impact({ style: 'MEDIUM' }); }
function hapticHeavy()  { const h = getCapPlugin('Haptics'); if (h) h.notification({ type: 'WARNING' }); }

/* ── Routing ─────────────────────────────────────────────── */
function navigate(page) {
  // Track history for back navigation
  const isSubPage = page === 'detail' || page === 'add' || page === 'edit';
  const wasSubPage = currentPage === 'detail' || currentPage === 'add' || currentPage === 'edit';

  if (!handlingPopState) {
    if (isSubPage && !wasSubPage) {
      // Entering a sub-page from a main page: push state
      navHistory.push(currentPage);
      history.pushState({ page }, '', '');
    } else if (!isSubPage && wasSubPage) {
      // Going back to a main page from sub-page: replace state
      history.replaceState({ page }, '', '');
    } else if (!isSubPage && !wasSubPage && currentPage !== page) {
      // Switching between main tabs: replace state (no back needed)
      history.replaceState({ page }, '', '');
    }
  }

  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const pageEl = document.getElementById('page-' + (page === 'edit' ? 'add' : page));
  if (pageEl) pageEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update header
  const titleIcons = {
    recipes:  'chef-hat',
    shopping: 'shopping-cart',
    planner:  'calendar-days',
    profile:  'user',
    detail:   'utensils',
    add:      'plus-circle',
    edit:     'pencil'
  };
  const titleTexts = {
    recipes:  'Recipes',
    shopping: 'Shopping List',
    planner:  'Weekly Planner',
    profile:  'Profile',
    detail:   'Recipe',
    add:      'Add Recipe',
    edit:     'Edit Recipe'
  };
  const hdr = document.getElementById('header-title');
  hdr.innerHTML = `${icon(titleIcons[page] || 'home', 20, 'header-icon')} ${titleTexts[page] || 'GroceryRecipe'}`;

  // show/hide back & add buttons
  const inDetail = page === 'detail' || page === 'add' || page === 'edit';
  document.getElementById('back-btn').style.display = inDetail ? 'flex' : 'none';
  document.getElementById('btn-add-recipe').style.display = (inDetail || page === 'profile' || page === 'planner') ? 'none' : 'flex';
  document.getElementById('bottom-nav').style.display = inDetail ? 'none' : 'flex';

  // Render the page content
  if (page === 'recipes')  renderRecipes();
  if (page === 'shopping') renderShopping();
  if (page === 'planner')  renderPlanner();
  if (page === 'profile')  renderProfile();
  if (page === 'detail')   renderDetail(detailRecipeId);
  if (page === 'add')      renderAddForm(null);
  if (page === 'edit')     renderAddForm(detailRecipeId);

  updateShoppingBadge();
  refreshIcons();
}

function goBack() {
  hapticTap();
  const prev = navHistory.pop();
  if (prev) {
    handlingPopState = true;
    navigate(prev);
    handlingPopState = false;
  } else {
    navigate('recipes');
  }
}

/* ── Recipe visual helper (photo or emoji) ──────────────── */
function recipeVisual(r, cls) {
  if (r && r.photo) return `<img class="${cls} recipe-photo" src="${r.photo}" alt="">`;
  return `<span class="${cls}">${(r && r.emoji) || '🍽'}</span>`;
}

/* ── Recipes page ────────────────────────────────────────── */
function sortRecipes(list) {
  // Starred always float to top, then apply sort
  const starred = list.filter(r => r.starred);
  const rest = list.filter(r => !r.starred);
  function applySortTo(arr) {
    switch (recipeSortMode) {
      case 'alpha':         return arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      case 'newest':        return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'oldest':        return arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      case 'most-planned':  return arr.sort((a, b) => RecipeDB.planCount(b.id) - RecipeDB.planCount(a.id));
      case 'least-planned': return arr.sort((a, b) => RecipeDB.planCount(a.id) - RecipeDB.planCount(b.id));
      default:              return arr; // insertion order
    }
  }
  return [...applySortTo(starred), ...applySortTo(rest)];
}

function renderRecipes(filter = '') {
  let list = RecipeDB.search(filter);
  // Apply category filter
  if (recipeCategoryFilter) {
    list = list.filter(r => (r.category || '') === recipeCategoryFilter);
  }
  list = sortRecipes(list);

  const container = document.getElementById('recipe-list');

  // Sort & filter controls
  const categories = RECIPE_CATEGORIES;
  const sortOptions = [
    { value: 'default',       label: 'Default' },
    { value: 'alpha',         label: 'A → Z' },
    { value: 'newest',        label: 'Newest' },
    { value: 'oldest',        label: 'Oldest' },
    { value: 'most-planned',  label: 'Most Planned' },
    { value: 'least-planned', label: 'Least Planned' },
  ];

  const controlsHtml = `<div class="recipe-controls">
    <div class="recipe-ctrl-group">
      <label>${icon('arrow-up-down', 14)}</label>
      <select id="recipe-sort" class="recipe-ctrl-select">
        ${sortOptions.map(o => `<option value="${o.value}" ${recipeSortMode === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
    </div>
    <div class="recipe-ctrl-group">
      <label>${icon('filter', 14)}</label>
      <select id="recipe-cat-filter" class="recipe-ctrl-select">
        <option value="">All</option>
        ${categories.filter(c => c.value).map(c => `<option value="${c.value}" ${recipeCategoryFilter === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
    </div>
  </div>`;

  if (list.length === 0) {
    container.innerHTML = controlsHtml + `
      <div class="empty-state">
        <div class="empty-icon">${icon('cooking-pot', 48)}</div>
        <p>${filter || recipeCategoryFilter ? 'No recipes match your search.' : 'No recipes yet. Tap + to add one!'}</p>
      </div>`;
  } else {
    container.innerHTML = controlsHtml + list.map(r => {
      const catLabel = r.category ? (RECIPE_CATEGORIES.find(c => c.value === r.category)?.label || '') : '';
      const tagsHtml = (r.tags || []).map(t => `<span class="recipe-tag-chip">${escHtml(t)}</span>`).join('');
      const metaParts = [`${r.ingredients.length} ing`, `serves ${r.servings}`];
      if (catLabel) metaParts.push(catLabel);
      return `
        <div class="recipe-item" data-id="${r.id}" role="button" tabindex="0">
          <button class="recipe-star-btn${r.starred ? ' starred' : ''}" data-id="${r.id}" aria-label="${r.starred ? 'Unstar' : 'Star'}">${icon('star', 18)}</button>
          ${recipeVisual(r, 'recipe-emoji')}
          <div class="recipe-info">
            <h3>${escHtml(r.name)}</h3>
            <p>${metaParts.join(' · ')}${tagsHtml ? ' ' + tagsHtml : ''}</p>
          </div>
          <span class="recipe-arrow">${icon('chevron-right', 18)}</span>
        </div>`;
    }).join('');
  }

  // Wire sort & filter
  const sortSel = document.getElementById('recipe-sort');
  const catSel = document.getElementById('recipe-cat-filter');
  if (sortSel) sortSel.addEventListener('change', () => {
    recipeSortMode = sortSel.value;
    renderRecipes(document.getElementById('recipe-search').value);
  });
  if (catSel) catSel.addEventListener('change', () => {
    recipeCategoryFilter = catSel.value;
    renderRecipes(document.getElementById('recipe-search').value);
  });

  // Wire star buttons
  container.querySelectorAll('.recipe-star-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      hapticTap();
      RecipeDB.toggleStar(btn.dataset.id);
      renderRecipes(document.getElementById('recipe-search').value);
    });
  });

  // Wire recipe item clicks
  container.querySelectorAll('.recipe-item').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(el.dataset.id); });
  });
}

function openDetail(id) {
  hapticTap();
  detailRecipeId = id;
  navigate('detail');
}

/* ── Detail page ─────────────────────────────────────────── */
function renderDetail(id) {
  const r = RecipeDB.get(id);
  if (!r) { navigate('recipes'); return; }

  const page = document.getElementById('page-detail');
  page.innerHTML = `
    <div class="detail-header">
      ${r.photo ? `<img class="emoji recipe-photo" src="${r.photo}" alt="">` : `<div class="emoji">${r.emoji || '🍽'}</div>`}
      <h2>${escHtml(r.name)}</h2>
      <p>Base: ${r.servings} serving${r.servings > 1 ? 's' : ''}${r.category ? ' · ' + escHtml(RECIPE_CATEGORIES.find(c => c.value === r.category)?.label || r.category) : ''}</p>
      ${(r.tags || []).length ? `<div class="detail-tags">${r.tags.map(t => `<span class="recipe-tag-chip">${escHtml(t)}</span>`).join('')}</div>` : ''}
    </div>

    <!-- Servings selector -->
    <div class="card">
      <div class="servings-row">
        <label>Servings:</label>
        <div class="qty-ctrl">
          <button id="qty-minus" aria-label="Decrease">${icon('minus', 16)}</button>
          <span class="qty-val" id="qty-val">${r.servings}</span>
          <button id="qty-plus"  aria-label="Increase">${icon('plus', 16)}</button>
        </div>
      </div>
    </div>

    <!-- Ingredients -->
    <div class="card">
      <div class="section-title">Ingredients</div>
      <ul class="ingredient-list" id="detail-ingredients"></ul>
    </div>

    <!-- Steps -->
    ${r.steps && r.steps.length ? `
    <div class="card">
      <div class="section-title">Instructions</div>
      <ol class="step-list">
        ${r.steps.map(s => `<li>${escHtml(s)}</li>`).join('')}
      </ol>
    </div>` : ''}

    <!-- Actions -->
    <div class="flex-row mt-16" style="padding-bottom:24px;">
      <button class="btn btn-outline" style="flex:1;" id="btn-share-recipe">${icon('share-2', 16)} Share</button>
      <button class="btn btn-outline" style="flex:1;" id="btn-edit-recipe">${icon('pencil', 16)} Edit</button>
      <button class="btn btn-danger"  style="flex:1;" id="btn-delete-recipe">${icon('trash-2', 16)} Delete</button>
    </div>
  `;

  let servings = r.servings;
  const ingList = document.getElementById('detail-ingredients');

  function renderIngredients() {
    const mult = servings / r.servings;
    ingList.innerHTML = r.ingredients.map(ing => {
      const qty = parseFloat(ing.qty);
      const scaledQty = isNaN(qty) ? ing.qty : String(Math.round(qty * mult * 100) / 100);
      const optBadge = ing.optional ? '<span class="optional-badge">optional</span>' : '';
      return `<li class="${ing.optional ? 'optional-ing' : ''}"><span>${escHtml(ing.name)} ${optBadge}</span>
                  <span class="ingredient-qty">${scaledQty} ${escHtml(ing.unit)}</span></li>`;
    }).join('');
  }
  renderIngredients();

  document.getElementById('qty-val').textContent = servings;

  document.getElementById('qty-minus').addEventListener('click', () => {
    if (servings > 1) { hapticTap(); servings--; document.getElementById('qty-val').textContent = servings; renderIngredients(); }
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    hapticTap(); servings++; document.getElementById('qty-val').textContent = servings; renderIngredients();
  });

  document.getElementById('btn-share-recipe').addEventListener('click', () => {
    hapticAction();
    const ingText = r.ingredients.map(i => `  ${i.qty} ${i.unit} ${i.name}`).join('\n');
    const stepsText = r.steps && r.steps.length ? '\n\nSteps:\n' + r.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n') : '';
    const text = `${r.name}\nServes ${r.servings}\n\nIngredients:\n${ingText}${stepsText}`;
    const capShare = getCapPlugin('Share');
    if (capShare) {
      capShare.share({ title: r.name, text, dialogTitle: 'Share recipe' }).catch(() => {});
    } else if (navigator.share) {
      navigator.share({ title: r.name, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('Recipe copied to clipboard')).catch(() => showToast('Could not share'));
    }
  });

  document.getElementById('btn-edit-recipe').addEventListener('click', () => navigate('edit'));
  document.getElementById('btn-delete-recipe').addEventListener('click', () => deleteRecipe(id));
}

function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  hapticHeavy();
  RecipeDB.delete(id);
  showToast('Recipe deleted');
  navigate('recipes');
}

/* ── Add / Edit form ─────────────────────────────────────── */
function renderAddForm(editId) {
  const r = editId ? RecipeDB.get(editId) : null;
  const page = document.getElementById('page-add');

  page.innerHTML = `
    <form id="recipe-form">
      <div class="card">
        <div class="form-group">
          <label>Recipe Name *</label>
          <input type="text" id="f-name" placeholder="e.g. Spaghetti Bolognese"
                 value="${r ? escHtml(r.name) : ''}" required>
        </div>
        <div class="form-group">
          <label>Photo or Emoji</label>
          <div class="photo-emoji-toggle">
            <button type="button" class="toggle-btn ${r && r.photo ? '' : 'active'}" id="tog-emoji">Emoji</button>
            <button type="button" class="toggle-btn ${r && r.photo ? 'active' : ''}" id="tog-photo">Photo</button>
          </div>
          <div id="emoji-input-wrap" style="${r && r.photo ? 'display:none' : ''}">
            <input type="text" id="f-emoji" placeholder="🍽" maxlength="4"
                   value="${r ? r.emoji : ''}">
          </div>
          <div id="photo-input-wrap" style="${r && r.photo ? '' : 'display:none'}">
            <input type="file" id="f-photo" accept="image/*" capture="environment" style="display:none">
            <div id="photo-preview" class="photo-preview ${r && r.photo ? 'has-photo' : ''}">
              ${r && r.photo ? `<img src="${r.photo}" alt="Recipe photo">` : `<span class="photo-placeholder">${icon('camera', 20)} Tap to take or choose a photo</span>`}
            </div>
            <button type="button" class="btn btn-outline btn-full mt-8" id="clear-photo-btn" style="${r && r.photo ? '' : 'display:none'}">${icon('x', 16)} Remove Photo</button>
          </div>
        </div>
        <div class="form-group">
          <label>Base Servings *</label>
          <input type="number" id="f-servings" min="1" value="${r ? r.servings : PrefsDB.get('defaultServings')}" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="f-category" class="recipe-ctrl-select" style="width:100%;padding:10px 14px;font-size:.95rem;">
            ${RECIPE_CATEGORIES.map(c => `<option value="${c.value}" ${(r?.category || '') === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tags</label>
          <div class="tags-input-wrap">
            <div class="tags-chips" id="f-tags-chips">
              ${(r?.tags || []).map(t => `<span class="tag-chip">${escHtml(t)} <button type="button" class="tag-chip-x" data-tag="${escHtml(t)}">&times;</button></span>`).join('')}
            </div>
            <input type="text" id="f-tags-input" placeholder="Type a tag and press Enter">
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      <div class="card">
        <div class="section-title">Ingredients</div>
        <div class="ingredient-header">
          <span>Name</span>
          <span>Qty</span>
          <span>Unit</span>
          <span></span>
        </div>
        <div id="ing-rows"></div>
        <button type="button" class="btn btn-outline btn-full mt-8" id="add-ing-btn">${icon('plus', 16)} Add Ingredient</button>
      </div>

      <!-- Steps -->
      <div class="card">
        <div class="section-title">Steps</div>
        <div id="step-rows"></div>
        <button type="button" class="btn btn-outline btn-full mt-8" id="add-step-btn">${icon('plus', 16)} Add Step</button>
      </div>

      <button type="submit" class="btn btn-primary btn-full mt-16" style="margin-bottom:32px;">
        ${r ? `${icon('save', 16)} Save Changes` : `${icon('check', 16)} Add Recipe`}
      </button>
    </form>
  `;

  const ingContainer  = document.getElementById('ing-rows');
  const stepContainer = document.getElementById('step-rows');

  // Ingredient autocomplete data: [{name, unit}]
  const knownIngredients = RecipeDB.allIngredientsWithUnits();

  // Build unit <select> options HTML (grouped by category)
  const unitOptHtml = (() => {
    const cats = [
      { label: 'Count',  units: UNIT_OPTIONS.filter(u => u.category === 'count') },
      { label: 'Mass',   units: UNIT_OPTIONS.filter(u => u.category === 'mass') },
      { label: 'Volume', units: UNIT_OPTIONS.filter(u => u.category === 'volume') },
      { label: 'Spoon',  units: UNIT_OPTIONS.filter(u => u.category === 'spoon') },
      { label: 'Other',  units: UNIT_OPTIONS.filter(u => u.category === 'other') },
    ];
    return cats.map(c =>
      `<optgroup label="${c.label}">${c.units.map(u =>
        `<option value="${escHtml(u.value)}">${escHtml(u.label)}</option>`
      ).join('')}</optgroup>`
    ).join('');
  })();

  /** Debounce helper */
  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  /** Wire up custom autocomplete on an ingredient row */
  function setupAutocomplete(row) {
    const nameInput = row.querySelector('.ing-name');
    const dropdown  = row.querySelector('.ing-ac');

    function showSuggestions() {
      const q = nameInput.value.trim().toLowerCase();
      dropdown.innerHTML = '';
      if (q.length < 3) { dropdown.classList.remove('open'); return; }

      const matches = knownIngredients
        .filter(i => i.name.toLowerCase().includes(q))
        .slice(0, 2);

      if (matches.length === 0) { dropdown.classList.remove('open'); return; }

      matches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'ing-ac-item';
        item.innerHTML = `<span>${escHtml(match.name)}</span><span class="ing-ac-unit">${escHtml(match.unit || 'unit')}</span>`;
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          nameInput.value = match.name;
          const sel = row.querySelector('.ing-unit');
          const opt = [...sel.options].find(o => o.value === (match.unit || ''));
          if (opt) sel.value = opt.value;
          dropdown.classList.remove('open');
        });
        dropdown.appendChild(item);
      });
      dropdown.classList.add('open');
    }

    const debouncedShow = debounce(showSuggestions, 200);
    nameInput.addEventListener('input', debouncedShow);
    nameInput.addEventListener('blur', () => {
      setTimeout(() => dropdown.classList.remove('open'), 150);
    });
    nameInput.addEventListener('focus', () => {
      if (nameInput.value.trim().length >= 3) debouncedShow();
    });
  }

  function addIngRow(name = '', qty = '', unit = '', focus = false, optional = false) {
    const div = document.createElement('div');
    div.className = 'ingredient-row-wrap';
    div.innerHTML = `
      <div class="ingredient-row">
        <div class="ing-name-wrap">
          <input type="text" class="ing-name" placeholder="Flour" value="${escHtml(name)}" autocomplete="off">
          <div class="ing-ac"></div>
        </div>
        <input type="text" class="ing-qty"  placeholder="200"   value="${escHtml(qty)}">
        <select class="ing-unit">${unitOptHtml}</select>
        <button type="button" class="remove-btn" aria-label="Remove">${icon('x', 16)}</button>
      </div>
      <label class="ing-optional-label">
        <input type="checkbox" class="ing-optional" ${optional ? 'checked' : ''}> Optional (pantry item)
      </label>
    `;
    // Set selected unit
    const sel = div.querySelector('.ing-unit');
    const matchOpt = [...sel.options].find(o => o.value === (unit || ''));
    if (matchOpt) matchOpt.selected = true;
    else if (unit) {
      const opt = document.createElement('option');
      opt.value = unit; opt.textContent = unit; opt.selected = true;
      sel.appendChild(opt);
    }

    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());

    // Autocomplete
    setupAutocomplete(div);

    ingContainer.appendChild(div);

    if (focus) {
      const nameInput = div.querySelector('.ing-name');
      setTimeout(() => nameInput.focus(), 0);
    }
  }

  function addStepRow(text = '') {
    const div = document.createElement('div');
    div.className = 'step-row';
    div.innerHTML = `
      <textarea class="step-text" placeholder="Describe this step…">${escHtml(text)}</textarea>
      <button type="button" class="remove-btn" aria-label="Remove">${icon('x', 16)}</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    stepContainer.appendChild(div);
  }

  // Pre-fill existing data
  if (r) {
    r.ingredients.forEach(i => addIngRow(i.name, i.qty, i.unit, false, !!i.optional));
    r.steps.forEach(s => addStepRow(s));
  } else {
    addIngRow();
    addStepRow();
  }

  document.getElementById('add-ing-btn').addEventListener('click',  () => addIngRow('', '', '', true));
  document.getElementById('add-step-btn').addEventListener('click', () => addStepRow());

  // Photo / Emoji toggle
  let pendingPhoto = r ? r.photo || null : null;
  const togEmoji   = document.getElementById('tog-emoji');
  const togPhoto   = document.getElementById('tog-photo');
  const emojiWrap  = document.getElementById('emoji-input-wrap');
  const photoWrap  = document.getElementById('photo-input-wrap');
  const photoInput = document.getElementById('f-photo');
  const preview    = document.getElementById('photo-preview');
  const clearBtn   = document.getElementById('clear-photo-btn');

  togEmoji.addEventListener('click', () => {
    togEmoji.classList.add('active'); togPhoto.classList.remove('active');
    emojiWrap.style.display = ''; photoWrap.style.display = 'none';
  });
  togPhoto.addEventListener('click', () => {
    togPhoto.classList.add('active'); togEmoji.classList.remove('active');
    emojiWrap.style.display = 'none'; photoWrap.style.display = '';
  });

  preview.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 512;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX / w, MAX / h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        pendingPhoto = canvas.toDataURL('image/jpeg', 0.7);
        preview.innerHTML = `<img src="${pendingPhoto}" alt="Recipe photo">`;
        preview.classList.add('has-photo');
        clearBtn.style.display = '';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  clearBtn.addEventListener('click', () => {
    pendingPhoto = null;
    photoInput.value = '';
    preview.innerHTML = `<span class="photo-placeholder">${icon('camera', 20)} Tap to take or choose a photo</span>`;
    refreshIcons();
    preview.classList.remove('has-photo');
    clearBtn.style.display = 'none';
  });

  // Tags input logic
  const pendingTags = r && Array.isArray(r.tags) ? [...r.tags] : [];
  const tagsChips = document.getElementById('f-tags-chips');
  const tagsInput = document.getElementById('f-tags-input');

  function renderTagsChips() {
    tagsChips.innerHTML = pendingTags.map(t =>
      `<span class="tag-chip">${escHtml(t)} <button type="button" class="tag-chip-x" data-tag="${escHtml(t)}">&times;</button></span>`
    ).join('');
    tagsChips.querySelectorAll('.tag-chip-x').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const idx = pendingTags.indexOf(btn.dataset.tag);
        if (idx >= 0) pendingTags.splice(idx, 1);
        renderTagsChips();
      });
    });
  }
  renderTagsChips();

  tagsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagsInput.value.trim().replace(/,/g, '');
      if (tag && !pendingTags.includes(tag)) {
        pendingTags.push(tag);
        renderTagsChips();
      }
      tagsInput.value = '';
    }
  });

  document.getElementById('recipe-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    if (!name) { showToast('Please enter a recipe name'); return; }

    // Capture any tag still in the input
    const trailingTag = tagsInput.value.trim().replace(/,/g, '');
    if (trailingTag && !pendingTags.includes(trailingTag)) pendingTags.push(trailingTag);

    const ingredients = [...ingContainer.querySelectorAll('.ingredient-row-wrap')]
      .map(wrap => ({
        name: wrap.querySelector('.ing-name').value.trim(),
        qty:  wrap.querySelector('.ing-qty').value.trim(),
        unit: wrap.querySelector('.ing-unit').value.trim(),
        optional: wrap.querySelector('.ing-optional')?.checked || false
      }))
      .filter(i => i.name);

    const steps = [...stepContainer.querySelectorAll('.step-text')]
      .map(t => t.value.trim())
      .filter(Boolean);

    const usePhoto = togPhoto.classList.contains('active') && pendingPhoto;
    const recipe = {
      ...(r || {}),
      name,
      emoji:     usePhoto ? '' : (document.getElementById('f-emoji').value.trim() || '🍽'),
      photo:     usePhoto ? pendingPhoto : null,
      servings:  Math.max(1, parseInt(document.getElementById('f-servings').value) || 1),
      category:  document.getElementById('f-category').value,
      tags:      [...pendingTags],
      ingredients,
      steps
    };

    const saved = RecipeDB.save(recipe);
    detailRecipeId = saved.id;
    hapticAction();
    showToast(r ? 'Recipe updated' : 'Recipe added');
    navigate('detail');
  });
}

/* ── Shopping page ───────────────────────────────────────── */

/** Compute merged ingredient list from a planner week (Mon-Sun), scaled by per-meal servings. */
function ingredientsForPlannerWeek(wk) {
  const plan = PlanDB.allForWeek(wk);
  const ingMap = {};
  DAYS.forEach(day => {
    MEALS.forEach(meal => {
      const slots = plan[day]?.[meal] || [];
      slots.forEach(slot => {
        const recipe = RecipeDB.get(slot.recipeId);
        if (!recipe) return;
        const mult = (slot.servings || recipe.servings) / recipe.servings;
        recipe.ingredients.forEach(ing => {
          const k = `${ing.name.toLowerCase()}\u0000${ing.unit}`;
          const scaledQty = isNaN(parseFloat(ing.qty)) ? ing.qty : String(Math.round(parseFloat(ing.qty) * mult * 100) / 100);
          if (ingMap[k]) {
            const prev = parseFloat(ingMap[k].qty), add = parseFloat(scaledQty);
            if (!isNaN(prev) && !isNaN(add)) ingMap[k].qty = String(Math.round((prev + add) * 100) / 100);
            if (!ingMap[k].sources.includes(recipe.name)) ingMap[k].sources.push(recipe.name);
            // If any recipe marks it as required, it's required
            if (!ing.optional) ingMap[k].optional = false;
          } else {
            ingMap[k] = { name: ing.name, qty: scaledQty, unit: ing.unit, optional: !!ing.optional, sources: [recipe.name] };
          }
        });
      });
    });
  });
  return Object.values(ingMap);
}

/**
 * Compute merged ingredient list for a shopping week (shopWeekKey), scaled by per-meal servings.
 * The shopping week may span two planner weeks if shopping day != Monday.
 */
function ingredientsForShopWeek(swk) {
  const dates = getShopWeekDates(swk);
  const ingMap = {};
  dates.forEach(date => {
    const planWk = weekKey(date);
    const plan = PlanDB.allForWeek(planWk);
    const dow = date.getDay();
    const dayIdx = dow === 0 ? 6 : dow - 1;
    const dayName = DAYS[dayIdx];
    MEALS.forEach(meal => {
      const slots = plan[dayName]?.[meal] || [];
      slots.forEach(slot => {
        const recipe = RecipeDB.get(slot.recipeId);
        if (!recipe) return;
        const mult = (slot.servings || recipe.servings) / recipe.servings;
        recipe.ingredients.forEach(ing => {
          const k = `${ing.name.toLowerCase()}\u0000${ing.unit}`;
          const scaledQty = isNaN(parseFloat(ing.qty)) ? ing.qty : String(Math.round(parseFloat(ing.qty) * mult * 100) / 100);
          if (ingMap[k]) {
            const prev = parseFloat(ingMap[k].qty), add = parseFloat(scaledQty);
            if (!isNaN(prev) && !isNaN(add)) ingMap[k].qty = String(Math.round((prev + add) * 100) / 100);
            if (!ingMap[k].sources.includes(recipe.name)) ingMap[k].sources.push(recipe.name);
            if (!ing.optional) ingMap[k].optional = false;
          } else {
            ingMap[k] = { name: ing.name, qty: scaledQty, unit: ing.unit, optional: !!ing.optional, sources: [recipe.name] };
          }
        });
      });
    });
  });
  return Object.values(ingMap);
}

/** Backwards-compatible alias used by profile page. */
function ingredientsForWeek(wk) {
  return ingredientsForPlannerWeek(wk);
}

function renderShopping() {
  const page = document.getElementById('page-shopping');
  const shopDay = PrefsDB.get('shoppingDay') || 0;
  const shopDayName = DAYS[shopDay];
  const tabs = `
    <div class="shop-tabs">
      <button class="shop-tab${shoppingView === 'current' ? ' active' : ''}" data-view="current">${icon('calendar-days', 16)} This Week</button>
      <button class="shop-tab${shoppingView === 'next'    ? ' active' : ''}" data-view="next">${icon('calendar-range', 16)} Next Week</button>
    </div>`;

  if (shoppingView === 'next') {
    renderShoppingWeek(page, tabs, 1);
  } else {
    renderShoppingWeek(page, tabs, 0);
  }

  page.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => { shoppingView = tab.dataset.view; renderShopping(); });
  });
  refreshIcons();
}

function buildShoppingListText(weekOffset) {
  const d = new Date();
  d.setDate(d.getDate() + weekOffset * 7);
  const swk = shopWeekKey(d);
  const label = formatShopWeekRange(swk);
  const items = ingredientsForShopWeek(swk);
  const checkedKey = `shop_checked_${swk}`;
  const checkedSet = new Set(JSON.parse(localStorage.getItem(checkedKey) || '[]'));
  const customItems = CustomItemsDB.all();
  const recurringItems = RecurringDB.all();

  let lines = [];
  lines.push(`Shopping List - ${label}`);
  lines.push('');

  // Recipe items
  const uncheckedRecipe = items.filter(i => !checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit));
  if (uncheckedRecipe.length > 0) {
    lines.push('From Recipes:');
    uncheckedRecipe.forEach(i => {
      const qty = [i.qty, i.unit].filter(Boolean).join(' ');
      lines.push(`  [ ] ${i.name}${qty ? ' - ' + qty : ''} (${i.sources.join(', ')})`);
    });
    lines.push('');
  }

  // Recurring items
  const recurringCheckedKey = `shop_recurring_checked_${swk}`;
  const recurringCheckedSet = new Set(JSON.parse(localStorage.getItem(recurringCheckedKey) || '[]'));
  const uncheckedRecurring = recurringItems.filter(i => !recurringCheckedSet.has(i.id));
  if (uncheckedRecurring.length > 0) {
    lines.push('Weekly Recurring:');
    uncheckedRecurring.forEach(i => {
      const qty = [i.qty, i.unit].filter(Boolean).join(' ');
      lines.push(`  [ ] ${i.name}${qty ? ' - ' + qty : ''}`);
    });
    lines.push('');
  }

  // Custom items
  const uncheckedCustom = customItems.filter(i => !i.checked);
  if (uncheckedCustom.length > 0) {
    lines.push('Other Items:');
    uncheckedCustom.forEach(i => {
      const qty = [i.qty, i.unit].filter(Boolean).join(' ');
      lines.push(`  [ ] ${i.name}${qty ? ' - ' + qty : ''}`);
    });
    lines.push('');
  }

  if (uncheckedRecipe.length === 0 && uncheckedRecurring.length === 0 && uncheckedCustom.length === 0) {
    lines.push('All items checked off!');
  }

  return lines.join('\n');
}

function renderShoppingWeek(page, tabs, weekOffset) {
  const d = new Date();
  d.setDate(d.getDate() + weekOffset * 7);
  const swk   = shopWeekKey(d);
  const label = formatShopWeekRange(swk);
  const items = ingredientsForShopWeek(swk);

  // Load checked state (keyed by shop week)
  const checkedKey = `shop_checked_${swk}`;
  const checkedSet = new Set(JSON.parse(localStorage.getItem(checkedKey) || '[]'));

  // Recurring items checked state (per shop week)
  const recurringCheckedKey = `shop_recurring_checked_${swk}`;
  const recurringCheckedSet = new Set(JSON.parse(localStorage.getItem(recurringCheckedKey) || '[]'));

  // Add item form is now in the header + popup (shop-add-picker)

  // --- Recipe-based items (split into required and optional) ---
  const requiredItems = items.filter(i => !i.optional);
  const optionalItems = items.filter(i => i.optional);

  let recipeSection = '';
  if (requiredItems.length > 0) {
    const unchecked = requiredItems.filter(i => !checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit));
    const checked   = requiredItems.filter(i =>  checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit));

    function recipeItemHtml(i) {
      const key = i.name.toLowerCase() + '\u0000' + i.unit;
      const isChecked = checkedSet.has(key);
      const safeKey = btoa(encodeURIComponent(key));
      return `<div class="shop-item${isChecked ? ' checked' : ''}" data-key="${safeKey}" data-type="recipe">
        <input type="checkbox" id="chk-${safeKey}" ${isChecked ? 'checked' : ''} aria-label="${escHtml(i.name)}">
        <label for="chk-${safeKey}">
          ${escHtml(i.name)}
          <span class="shop-source">${i.sources.map(escHtml).join(', ')}</span>
        </label>
        <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
      </div>`;
    }

    recipeSection = `
      <div class="shop-section-title">${icon('utensils', 14)} From Recipes</div>
      <div class="card" id="shop-list-recipe">
        ${unchecked.map(recipeItemHtml).join('')}
        ${checked.length && unchecked.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
        ${checked.map(recipeItemHtml).join('')}
      </div>`;
  }

  // --- Optional / pantry items from recipes ---
  let optionalSection = '';
  if (optionalItems.length > 0) {
    const uncheckedO = optionalItems.filter(i => !checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit));
    const checkedO   = optionalItems.filter(i =>  checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit));

    function optionalItemHtml(i) {
      const key = i.name.toLowerCase() + '\u0000' + i.unit;
      const isChecked = checkedSet.has(key);
      const safeKey = btoa(encodeURIComponent(key));
      return `<div class="shop-item${isChecked ? ' checked' : ''}" data-key="${safeKey}" data-type="recipe">
        <input type="checkbox" id="chk-${safeKey}" ${isChecked ? 'checked' : ''} aria-label="${escHtml(i.name)}">
        <label for="chk-${safeKey}">
          ${escHtml(i.name)}
          <span class="shop-source">${i.sources.map(escHtml).join(', ')}</span>
        </label>
        <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
      </div>`;
    }

    optionalSection = `
      <div class="shop-optional-header" id="shop-optional-toggle">
        <span class="shop-section-title" style="margin-bottom:0">${icon('chef-hat', 14)} Pantry / Optional</span>
        <span class="shop-optional-count">${uncheckedO.length} item${uncheckedO.length !== 1 ? 's' : ''}</span>
        <span class="shop-optional-arrow">${icon('chevron-right', 14)}</span>
      </div>
      <div class="card shop-optional-list" id="shop-optional-list" style="display:none;">
        ${uncheckedO.map(optionalItemHtml).join('')}
        ${checkedO.length && uncheckedO.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
        ${checkedO.map(optionalItemHtml).join('')}
      </div>`;
  }

  // --- Recurring items ---
  const recurringItems = RecurringDB.all();
  let recurringSection = '';
  if (recurringItems.length > 0) {
    const uncheckedR = recurringItems.filter(i => !recurringCheckedSet.has(i.id));
    const checkedR   = recurringItems.filter(i =>  recurringCheckedSet.has(i.id));

    function recurringItemHtml(i) {
      const isChecked = recurringCheckedSet.has(i.id);
      return `<div class="shop-item${isChecked ? ' checked' : ''}" data-id="${i.id}" data-type="recurring">
        <input type="checkbox" id="chk-rec-${i.id}" ${isChecked ? 'checked' : ''} aria-label="${escHtml(i.name)}">
        <label for="chk-rec-${i.id}">
          ${escHtml(i.name)}
          <span class="shop-source">${icon('repeat', 10)} Every week</span>
        </label>
        <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
        <button class="shop-remove" data-id="${i.id}" data-type="recurring" aria-label="Remove ${escHtml(i.name)}">${icon('x', 14)}</button>
      </div>`;
    }

    recurringSection = `
      <div class="shop-section-title">${icon('repeat', 14)} Weekly Recurring</div>
      <div class="card" id="shop-list-recurring">
        ${uncheckedR.map(recurringItemHtml).join('')}
        ${checkedR.length && uncheckedR.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
        ${checkedR.map(recurringItemHtml).join('')}
      </div>`;
  }

  // --- Custom (manual) items ---
  const customItems = CustomItemsDB.all();
  let customSection = '';
  if (customItems.length > 0) {
    const uncheckedC = customItems.filter(i => !i.checked);
    const checkedC   = customItems.filter(i =>  i.checked);

    function customItemHtml(i) {
      return `<div class="shop-item${i.checked ? ' checked' : ''}" data-id="${i.id}" data-type="custom">
        <input type="checkbox" id="chk-cust-${i.id}" ${i.checked ? 'checked' : ''} aria-label="${escHtml(i.name)}">
        <label for="chk-cust-${i.id}">
          ${escHtml(i.name)}
        </label>
        <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
        <button class="shop-remove" data-id="${i.id}" data-type="custom" aria-label="Remove ${escHtml(i.name)}">${icon('x', 14)}</button>
      </div>`;
    }

    customSection = `
      <div class="shop-section-title">${icon('list-plus', 14)} Other Items</div>
      <div class="card" id="shop-list-custom">
        ${uncheckedC.map(customItemHtml).join('')}
        ${checkedC.length && uncheckedC.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
        ${checkedC.map(customItemHtml).join('')}
      </div>`;
  }

  // --- Empty state ---
  const totalItems = items.length + recurringItems.length + customItems.length;
  const emptyState = totalItems === 0 ? `<div class="empty-state">
    <div class="empty-icon">${icon('shopping-cart', 48)}</div>
    <p>Your shopping list is empty.<br>Tap + to add items or plan meals in the Planner!</p>
  </div>` : '';

  // --- Share / Export buttons ---
  const shareButtons = totalItems > 0 ? `
    <div class="shop-share-row">
      <button class="btn btn-outline shop-share-btn" id="shop-copy-btn">${icon('clipboard-copy', 16)} Copy List</button>
      <button class="btn btn-outline shop-share-btn" id="shop-share-btn">${icon('share-2', 16)} Share</button>
    </div>` : '';

  const weekLabel = `<div class="shop-week-label">${icon('calendar-days', 14)} ${escHtml(label)}</div>`;

  page.innerHTML = tabs + weekLabel + recipeSection + optionalSection + recurringSection + customSection + emptyState + shareButtons;

  // Wire optional section toggle
  const optToggle = document.getElementById('shop-optional-toggle');
  const optList = document.getElementById('shop-optional-list');
  if (optToggle && optList) {
    optToggle.addEventListener('click', () => {
      const open = optList.style.display !== 'none';
      optList.style.display = open ? 'none' : 'block';
      optToggle.classList.toggle('open', !open);
    });
  }

  // Add form wiring is handled by the shop-add-picker popup (see boot section)

  // --- Wire recipe item checkboxes ---
  page.querySelectorAll('.shop-item[data-type="recipe"] input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      const safeKey = chk.closest('.shop-item').dataset.key;
      const key = decodeURIComponent(atob(safeKey));
      if (chk.checked) checkedSet.add(key);
      else checkedSet.delete(key);
      localStorage.setItem(checkedKey, JSON.stringify([...checkedSet]));
      renderShopping();
    });
  });

  // --- Wire recurring item checkboxes ---
  page.querySelectorAll('.shop-item[data-type="recurring"] input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.closest('.shop-item').dataset.id;
      if (chk.checked) recurringCheckedSet.add(id);
      else recurringCheckedSet.delete(id);
      localStorage.setItem(recurringCheckedKey, JSON.stringify([...recurringCheckedSet]));
      renderShopping();
    });
  });

  // --- Wire custom item checkboxes ---
  page.querySelectorAll('.shop-item[data-type="custom"] input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.closest('.shop-item').dataset.id;
      CustomItemsDB.toggle(id);
      renderShopping();
    });
  });

  // --- Wire remove buttons ---
  page.querySelectorAll('.shop-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      if (type === 'recurring') {
        RecurringDB.remove(id);
        showToast('Recurring item removed');
      } else if (type === 'custom') {
        CustomItemsDB.remove(id);
        showToast('Item removed');
      }
      renderShopping();
      updateShoppingBadge();
    });
  });

  // --- Wire share / copy buttons ---
  const copyBtn = document.getElementById('shop-copy-btn');
  const shareBtn = document.getElementById('shop-share-btn');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = buildShoppingListText(weekOffset);
      navigator.clipboard.writeText(text).then(() => {
        showToast('List copied to clipboard');
      }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('List copied to clipboard');
      });
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const text = buildShoppingListText(weekOffset);
      if (navigator.share) {
        navigator.share({ title: 'Shopping List', text: text }).catch(() => {});
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
          showToast('List copied (share not supported on this device)');
        }).catch(() => {
          showToast('Could not share');
        });
      }
    });
  }
}

/* ── Planner page ────────────────────────────────────────── */
function renderPlanner() {
  const wk      = getPlannerWk();
  const plan    = PlanDB.allForWeek(wk);
  const dates   = getWeekDates(wk);
  const nowDate = new Date(); nowDate.setHours(0,0,0,0);

  const mealIcons = { breakfast: icon('sunrise', 18), lunch: icon('sun', 18), dinner: icon('moon', 18) };
  const page      = document.getElementById('page-planner');

  const selIdx  = getEffectiveSelIdx(nowDate);
  const selDay  = DAYS[selIdx];
  const selDate = dates[selIdx];
  const selPlan = plan[selDay] || { breakfast: [], lunch: [], dinner: [] };

  const todayBtn = plannerWeekOffset !== 0
    ? `<button class="cal-today-btn" id="planner-today">${icon('arrow-left', 14)} Back to Today</button>`
    : '';

  /* ── Horizontal day strip ──── */
  const stripHtml = DAYS.map((day, i) => {
    const d       = dates[i];
    const isToday = d.getTime() === nowDate.getTime();
    const isSel   = i === selIdx;
    // Check if this day has any meals planned
    const dayPlan = plan[day] || { breakfast: [], lunch: [], dinner: [] };
    const hasMeals = MEALS.some(m => (dayPlan[m] || []).length > 0);
    // Show meal dot if day has meals (today dot is handled by CSS ::before)
    let dotHtml = '';
    if (hasMeals) {
      dotHtml = '<span class="cal-strip-meals" aria-hidden="true"></span>';
    }
    return `<button class="cal-strip-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}"
              data-idx="${i}" aria-label="${day} ${d.getDate()}" aria-pressed="${isSel}">
      <span class="cal-strip-name">${DAYS_SHORT[i]}</span>
      <span class="cal-strip-num">${d.getDate()}</span>
      ${dotHtml}
    </button>`;
  }).join('');

  /* ── 3 meal cards for selected day ──── */
  const mealCardsHtml = MEALS.map(meal => {
    const slots   = selPlan[meal] || [];
    const entries = slots.map(s => ({ recipe: RecipeDB.get(s.recipeId), servings: s.servings, recipeId: s.recipeId })).filter(e => e.recipe);
    const hasRecipes = entries.length > 0;

    const recipesHtml = entries.map(({ recipe, servings, recipeId }) => `
      <div class="cal-card-recipe">
        ${recipeVisual(recipe, 'cal-card-emoji')}
        <div class="cal-card-info">
          <span class="cal-card-name">${escHtml(recipe.name)}</span>
        </div>
        <div class="cal-inline-servings">
          <button class="cal-srv-btn" data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}" data-rid="${recipeId}" data-dir="-1" aria-label="Decrease servings">${icon('minus', 12)}</button>
          <span class="cal-srv-val">${servings}</span>
          <button class="cal-srv-btn" data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}" data-rid="${recipeId}" data-dir="1" aria-label="Increase servings">${icon('plus', 12)}</button>
        </div>
        <div class="cal-recipe-actions">
          <button class="cal-more-btn" data-rid="${recipeId}" aria-label="More options">${icon('more-vertical', 16)}</button>
          <div class="cal-more-menu">
            <button class="cal-more-option" data-action="view" data-rid="${recipeId}">${icon('utensils', 14)} View</button>
            <button class="cal-more-option" data-action="edit" data-rid="${recipeId}">${icon('pencil', 14)} Edit</button>
          </div>
        </div>
        <button class="cal-recipe-remove" data-wk="${wk}" data-day="${escHtml(selDay)}"
                data-meal="${meal}" data-rid="${recipeId}"
                aria-label="Remove ${recipe.name}">${icon('x', 14)}</button>
      </div>
    `).join('');

    const addBtn = `<div class="cal-card-add cal-card-add-more" data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}"
                         role="button" tabindex="0">
      <span class="cal-card-add-icon">${icon('plus', 18)}</span>
      <span>${hasRecipes ? 'Add another' : `Add ${meal}`}</span>
    </div>`;

    return `<div class="cal-meal-card">
      <div class="cal-meal-card-hd">
        <span class="cal-meal-card-icon">${mealIcons[meal]}</span>
        <span class="cal-meal-card-label">${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
        ${hasRecipes ? `<button class="cal-chip-clear"
                          data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}"
                          aria-label="Clear all ${meal}">${icon('x', 14)}</button>` : ''}
      </div>
      <div class="cal-meal-card-body">
        ${recipesHtml}
        ${addBtn}
      </div>
    </div>`;
  }).join('');

  const selHeading = `${selDay}, ${MONTHS_FULL[selDate.getMonth()]} ${selDate.getDate()}`;

  page.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="planner-prev" aria-label="Previous week">${icon('chevron-left', 20)}</button>
      <div class="cal-nav-center">
        <div class="cal-nav-label">${formatWeekRange(wk)}</div>
        ${todayBtn}
      </div>
      <button class="cal-nav-btn" id="planner-next" aria-label="Next week">${icon('chevron-right', 20)}</button>
    </div>

    <div class="cal-week-strip" role="tablist" aria-label="Day selector">
      ${stripHtml}
    </div>

    <div class="cal-day-detail">
      <div class="cal-detail-heading">
        <span class="cal-detail-date">${escHtml(selHeading)}</span>
        <div class="cal-detail-actions">
          <button class="btn btn-outline" id="btn-clear-week"
                  style="font-size:.75rem;padding:5px 10px;border-color:var(--red);color:var(--red);">${icon('trash-2', 14)} Clear week</button>
        </div>
      </div>
      <div class="cal-meal-cards">
        ${mealCardsHtml}
      </div>
    </div>
  `;

  /* ── Week navigation ──── */
  document.getElementById('planner-prev').addEventListener('click', () => {
    plannerWeekOffset--;
    plannerSelectedDayIdx = null;
    renderPlanner();
  });
  document.getElementById('planner-next').addEventListener('click', () => {
    plannerWeekOffset++;
    plannerSelectedDayIdx = null;
    renderPlanner();
  });
  const btnToday = document.getElementById('planner-today');
  if (btnToday) btnToday.addEventListener('click', () => {
    plannerWeekOffset = 0;
    plannerSelectedDayIdx = null;
    renderPlanner();
  });

  /* ── Day strip selection ──── */
  page.querySelectorAll('.cal-strip-day').forEach(btn => {
    btn.addEventListener('click', () => {
      plannerSelectedDayIdx = parseInt(btn.dataset.idx, 10);
      renderPlanner();
    });
  });

  /* ── Swipe left/right to change day ──── */
  (function() {
    const detail = page.querySelector('.cal-day-detail');
    let startX = 0, startY = 0;
    detail.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    detail.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx) * 1.5) return;
      const cur = getEffectiveSelIdx(nowDate);
      if (dx < 0) {
        // swipe left → next day
        if (cur < 6) { plannerSelectedDayIdx = cur + 1; }
        else { plannerWeekOffset++; plannerSelectedDayIdx = 0; }
      } else {
        // swipe right → previous day
        if (cur > 0) { plannerSelectedDayIdx = cur - 1; }
        else { plannerWeekOffset--; plannerSelectedDayIdx = 6; }
      }
      renderPlanner();
    });
  })();

  /* ── Add button → open picker ──── */
  page.querySelectorAll('.cal-card-add-more').forEach(el => {
    const open = () => openMealPicker(el.dataset.wk, el.dataset.day, el.dataset.meal);
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  /* ── Remove single recipe from meal ──── */
  page.querySelectorAll('.cal-recipe-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      PlanDB.remove(btn.dataset.wk, btn.dataset.day, btn.dataset.meal, btn.dataset.rid);
      renderPlanner();
    });
  });

  /* ── Clear all recipes from meal ──── */
  page.querySelectorAll('.cal-chip-clear').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      PlanDB.clearMeal(btn.dataset.wk, btn.dataset.day, btn.dataset.meal);
      renderPlanner();
    });
  });

  /* ── Servings +/- buttons ──── */
  page.querySelectorAll('.cal-srv-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { wk: slotWk, day: slotDay, meal: slotMeal, rid, dir } = btn.dataset;
      const curPlan = PlanDB.allForWeek(slotWk);
      const slots = curPlan[slotDay]?.[slotMeal] || [];
      const slot = slots.find(s => s.recipeId === rid);
      if (!slot) return;
      const newServings = slot.servings + parseInt(dir, 10);
      if (newServings < 1) return;
      PlanDB.setServings(slotWk, slotDay, slotMeal, rid, newServings);
      renderPlanner();
    });
  });

  /* ── 3-dot menu ──── */
  page.querySelectorAll('.cal-more-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      // Close any other open menus first
      page.querySelectorAll('.cal-more-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu.classList.toggle('open');
    });
  });

  page.querySelectorAll('.cal-more-option').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      page.querySelectorAll('.cal-more-menu.open').forEach(m => m.classList.remove('open'));
      const rid = btn.dataset.rid;
      if (btn.dataset.action === 'view') { detailRecipeId = rid; navigate('detail'); }
      if (btn.dataset.action === 'edit') { detailRecipeId = rid; navigate('edit'); }
    });
  });

  // Close menus when tapping elsewhere
  page.addEventListener('click', () => {
    page.querySelectorAll('.cal-more-menu.open').forEach(m => m.classList.remove('open'));
  });

  /* ── Clear week ──── */
  document.getElementById('btn-clear-week').addEventListener('click', () => {
    if (!confirm('Clear all meals for this week?')) return;
    PlanDB.clearWeek(wk);
    renderPlanner();
    showToast('Week cleared');
  });
}

/* ── Meal picker bottom sheet ────────────────────────────── */
function renderMealPickerList(filterText) {
  const recipes = RecipeDB.search(filterText || '');
  const list = document.getElementById('meal-picker-list');
  if (recipes.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-weight:600;">No recipes found</div>`;
    return;
  }
  list.innerHTML = recipes.map(r => {
    const catLabel = r.category ? (RECIPE_CATEGORIES.find(c => c.value === r.category)?.label || '') : '';
    return `
      <button class="meal-picker-item" data-id="${r.id}">
        ${recipeVisual(r, 'mpi-emoji')}
        <span class="mpi-name">${escHtml(r.name)}${catLabel ? `<span class="mpi-cat">${escHtml(catLabel)}</span>` : ''}</span>
      </button>`;
  }).join('');

  list.querySelectorAll('.meal-picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      PlanDB.add(pickerCtx.wk, pickerCtx.day, pickerCtx.meal, btn.dataset.id);
      closeMealPicker();
      renderPlanner();
    });
  });
}

function openMealPicker(wk, day, meal) {
  pickerCtx = { wk, day, meal };
  plannerSearchQuery = '';
  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);
  document.getElementById('meal-picker-title').textContent = `${day} · ${mealLabel}`;

  // Ensure search input exists
  let searchInput = document.getElementById('meal-picker-search');
  if (!searchInput) {
    const searchWrap = document.createElement('div');
    searchWrap.className = 'picker-search-wrap';
    searchWrap.innerHTML = `<input type="search" id="meal-picker-search" class="picker-search" placeholder="Search recipes…" aria-label="Search recipes">`;
    const title = document.getElementById('meal-picker-title');
    title.insertAdjacentElement('afterend', searchWrap);
    searchInput = document.getElementById('meal-picker-search');
  }
  searchInput.value = '';
  searchInput.oninput = () => renderMealPickerList(searchInput.value);

  renderMealPickerList('');
  refreshIcons();

  const picker   = document.getElementById('meal-picker');
  const backdrop = document.getElementById('meal-picker-backdrop');
  picker.classList.add('open');
  setTimeout(() => searchInput.focus(), 350);
  backdrop.addEventListener('click', closeMealPicker, { once: true });
}

function closeMealPicker() {
  document.getElementById('meal-picker').classList.remove('open');
  pickerCtx = null;
}

/* ── Theme ──────────────────────────────────────────────── */
function applyTheme() {
  const key   = PrefsDB.get('accentColor') || 'blue';
  const color = ACCENT_COLORS[key] || ACCENT_COLORS.blue;
  const root  = document.documentElement;

  // Apply accent color CSS variables
  root.style.setProperty('--green',       color.main);
  root.style.setProperty('--green-light', color.light);
  root.style.setProperty('--green-bg',    color.bg);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = color.main;
}

/* ── Profile page ───────────────────────────────────────── */
function renderProfile() {
  const page  = document.getElementById('page-profile');
  const prefs = PrefsDB.all();
  const recipeCount = RecipeDB.all().length;
  const shopCount   = ingredientsForWeek(weekKey(new Date())).length;

  page.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${icon('chef-hat', 36)}</div>
      <div class="profile-app-name">GroceryRecipe</div>
      <div class="profile-version">v${APP_VERSION}</div>
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat-num">${recipeCount}</span>
          <span class="profile-stat-label">Recipes</span>
        </div>
        <div class="profile-stat-divider"></div>
        <div class="profile-stat">
          <span class="profile-stat-num">${shopCount}</span>
          <span class="profile-stat-label">Shopping Items</span>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div class="settings-section">
      <div class="settings-section-title">Settings</div>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-label-text">Default Servings</span>
            <span class="setting-label-desc">Pre-fill when adding recipes</span>
          </div>
          <select class="setting-select" id="pref-default-servings">
            ${[1,2,3,4,5,6,8,10].map(n =>
              `<option value="${n}" ${prefs.defaultServings === n ? 'selected' : ''}>${n}</option>`
            ).join('')}
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-label-text">Shopping Day</span>
            <span class="setting-label-desc">Which day your shopping week starts</span>
          </div>
          <select class="setting-select" id="pref-shopping-day">
            ${DAYS.map((day, i) =>
              `<option value="${i}" ${prefs.shoppingDay === i ? 'selected' : ''}>${day}</option>`
            ).join('')}
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-label-text">Shopping Reminder</span>
            <span class="setting-label-desc">Get notified on shopping day</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="pref-shopping-reminder" ${prefs.shoppingReminder ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:10px;">
          <div class="setting-label">
            <span class="setting-label-text">Accent Color</span>
            <span class="setting-label-desc">Personalize the app's look</span>
          </div>
          <div class="color-picker" id="color-picker">
            ${Object.entries(ACCENT_COLORS).map(([key, c]) => `
              <button class="color-swatch${prefs.accentColor === key ? ' active' : ''}"
                      data-color="${key}"
                      style="--swatch-color:${c.main};"
                      aria-label="${c.label}"
                      title="${c.label}">
                ${prefs.accentColor === key ? '<span class="swatch-check">&#10003;</span>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Data -->
    <div class="settings-section">
      <div class="settings-section-title">Data</div>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-label-text">Reset Preferences</span>
            <span class="setting-label-desc">Restore default settings</span>
          </div>
          <button class="btn btn-outline" id="btn-reset-prefs" style="font-size:.8rem;padding:6px 14px;">Reset</button>
        </div>
      </div>
    </div>

    <div class="profile-footer">
      Made with love for home cooks
    </div>
  `;

  // Accent color picker
  document.querySelectorAll('#color-picker .color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      PrefsDB.set('accentColor', btn.dataset.color);
      applyTheme();
      // Update active swatch visually
      document.querySelectorAll('#color-picker .color-swatch').forEach(s => {
        s.classList.remove('active');
        s.innerHTML = '';
      });
      btn.classList.add('active');
      btn.innerHTML = '<span class="swatch-check">&#10003;</span>';
    });
  });

  // Default servings
  document.getElementById('pref-default-servings').addEventListener('change', e => {
    PrefsDB.set('defaultServings', parseInt(e.target.value, 10));
    showToast('Default servings updated');
  });

  // Shopping day
  document.getElementById('pref-shopping-day').addEventListener('change', e => {
    PrefsDB.set('shoppingDay', parseInt(e.target.value, 10));
    updateShoppingBadge();
    scheduleShoppingReminder();
    showToast('Shopping day updated');
  });

  // Shopping reminder toggle
  document.getElementById('pref-shopping-reminder').addEventListener('change', async e => {
    if (e.target.checked) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        e.target.checked = false;
        showToast('Notification permission denied');
        return;
      }
      PrefsDB.set('shoppingReminder', true);
      scheduleShoppingReminder();
      showToast('Shopping reminder enabled');
    } else {
      PrefsDB.set('shoppingReminder', false);
      // Cancel any scheduled Capacitor notification
      const capLN = getCapLocalNotifications();
      if (capLN) {
        try { await capLN.cancel({ notifications: [{ id: 7777 }] }); } catch (e) {}
      }
      showToast('Shopping reminder disabled');
    }
  });

  // Reset prefs
  document.getElementById('btn-reset-prefs').addEventListener('click', () => {
    if (!confirm('Reset all preferences to defaults?')) return;
    PrefsDB.reset();
    applyTheme();
    renderProfile();
    showToast('Preferences reset');
  });
}

/* ── Badge ───────────────────────────────────────────────── */
function updateShoppingBadge() {
  const swk = shopWeekKey(new Date());
  const items = ingredientsForShopWeek(swk);
  const checkedKey = `shop_checked_${swk}`;
  const checkedSet = new Set(JSON.parse(localStorage.getItem(checkedKey) || '[]'));
  const recipeCount = items.filter(i => !checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit)).length;

  // Recurring items unchecked count
  const recurringCheckedKey = `shop_recurring_checked_${swk}`;
  const recurringCheckedSet = new Set(JSON.parse(localStorage.getItem(recurringCheckedKey) || '[]'));
  const recurringCount = RecurringDB.all().filter(i => !recurringCheckedSet.has(i.id)).length;

  // Custom items unchecked count
  const customCount = CustomItemsDB.count();

  const n = recipeCount + recurringCount + customCount;
  let badge = document.getElementById('shop-badge');
  if (!badge) {
    const btn = document.querySelector('.nav-btn[data-page="shopping"]');
    if (!btn) return;
    badge = document.createElement('span');
    badge.id = 'shop-badge';
    badge.className = 'badge';
    btn.appendChild(badge);
  }
  badge.textContent  = n;
  badge.style.display = n > 0 ? 'inline' : 'none';
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── Escape HTML ─────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Shopping day notification ───────────────────────────── */

/** Get the Capacitor LocalNotifications plugin if available. */
function getCapLocalNotifications() {
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      return window.Capacitor.Plugins.LocalNotifications;
    }
  } catch (e) { /* not available */ }
  return null;
}

/** Request notification permission (Capacitor or Web). */
async function requestNotificationPermission() {
  const capLN = getCapLocalNotifications();
  if (capLN) {
    const result = await capLN.requestPermissions();
    return result.display === 'granted';
  }
  if ('Notification' in window) {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

/** Check current notification permission. */
async function hasNotificationPermission() {
  const capLN = getCapLocalNotifications();
  if (capLN) {
    const result = await capLN.checkPermissions();
    return result.display === 'granted';
  }
  if ('Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

/** Build the shopping summary text for the notification body. */
function buildReminderBody() {
  const now = new Date();
  const swk = shopWeekKey(now);
  const recipeItems = ingredientsForShopWeek(swk);
  const checkedKey = `shop_checked_${swk}`;
  const checkedSet = new Set(JSON.parse(localStorage.getItem(checkedKey) || '[]'));
  const uncheckedRecipe = recipeItems.filter(i => !checkedSet.has(i.name.toLowerCase() + '\u0000' + i.unit)).length;
  const recurringCheckedKey = `shop_recurring_checked_${swk}`;
  const recurringCheckedSet = new Set(JSON.parse(localStorage.getItem(recurringCheckedKey) || '[]'));
  const uncheckedRecurring = RecurringDB.all().filter(i => !recurringCheckedSet.has(i.id)).length;
  const uncheckedCustom = CustomItemsDB.count();
  const total = uncheckedRecipe + uncheckedRecurring + uncheckedCustom;
  return total > 0
    ? `You have ${total} item${total !== 1 ? 's' : ''} on your shopping list.`
    : 'Your shopping list is empty — plan some meals!';
}

/**
 * Schedule a Capacitor local notification for next shopping day at 9:00 AM.
 * Cancels any previous shopping reminder first.
 */
async function scheduleCapacitorReminder() {
  const capLN = getCapLocalNotifications();
  if (!capLN) return;
  const prefs = PrefsDB.all();

  // Cancel existing shopping reminder
  try {
    await capLN.cancel({ notifications: [{ id: 7777 }] });
  } catch (e) { /* ignore if none scheduled */ }

  if (!prefs.shoppingReminder) return;

  // Calculate next shopping day at 9 AM
  const now = new Date();
  const dow = now.getDay();
  const ourIdx = dow === 0 ? 6 : dow - 1;
  const targetIdx = prefs.shoppingDay || 0;
  let daysUntil = targetIdx - ourIdx;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // If today is shopping day but past 9 AM, schedule for next week
    if (now.getHours() >= 9) daysUntil = 7;
  }

  const schedDate = new Date(now);
  schedDate.setDate(schedDate.getDate() + daysUntil);
  schedDate.setHours(9, 0, 0, 0);

  await capLN.schedule({
    notifications: [{
      id: 7777,
      title: 'Shopping Day!',
      body: buildReminderBody(),
      schedule: {
        at: schedDate,
        every: 'week',
        allowWhileIdle: true
      },
      smallIcon: 'ic_stat_shopping_cart',
      largeIcon: 'ic_launcher',
      autoCancel: true
    }]
  });
}

/**
 * Web fallback: check on each app open if today is shopping day.
 * Shows a web notification once per day.
 */
function checkWebShoppingReminder() {
  const prefs = PrefsDB.all();
  if (!prefs.shoppingReminder) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const dow = now.getDay();
  const ourIdx = dow === 0 ? 6 : dow - 1;
  if (ourIdx !== (prefs.shoppingDay || 0)) return;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (localStorage.getItem('gr_last_shop_notify') === todayStr) return;

  localStorage.setItem('gr_last_shop_notify', todayStr);
  const body = buildReminderBody();

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('Shopping Day!', {
        body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'shopping-reminder'
      });
    });
  } else {
    new Notification('Shopping Day!', { body, icon: 'icons/icon-192.png', tag: 'shopping-reminder' });
  }
}

/** Entry point: schedule Capacitor notification or set up web check. */
function scheduleShoppingReminder() {
  const capLN = getCapLocalNotifications();
  if (capLN) {
    scheduleCapacitorReminder();
  } else {
    checkWebShoppingReminder();
  }
}

/* ── Shop add item bottom sheet ─────────────────────────── */
function openShopAddPicker() {
  const picker = document.getElementById('shop-add-picker');
  const backdrop = document.getElementById('shop-add-backdrop');
  picker.classList.add('open');
  const nameInput = document.querySelector('#shop-add-picker #sap-name');
  if (nameInput) setTimeout(() => nameInput.focus(), 350);
  backdrop.addEventListener('click', closeShopAddPicker, { once: true });
}

function closeShopAddPicker() {
  document.getElementById('shop-add-picker').classList.remove('open');
}

/* ── Boot ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  applyTheme();

  // ── Capacitor native UI setup ──────────────────────────
  const capStatusBar  = getCapPlugin('StatusBar');
  const capSplash     = getCapPlugin('SplashScreen');
  const capKeyboard   = getCapPlugin('Keyboard');

  if (capStatusBar) {
    capStatusBar.setBackgroundColor({ color: '#1565c0' });
    capStatusBar.setStyle({ style: 'DARK' });
    capStatusBar.setOverlaysWebView({ overlay: false });
  }

  if (capSplash) {
    capSplash.hide();
  }

  if (capKeyboard) {
    capKeyboard.setScroll({ isDisabled: false });
    capKeyboard.setAccessoryBarVisible({ isVisible: true });
  }

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { hapticTap(); navigate(btn.dataset.page); });
  });

  // Add button in header – context-aware per page
  document.getElementById('btn-add-recipe').addEventListener('click', () => {
    hapticTap();
    if (currentPage === 'shopping') { openShopAddPicker(); }
    else { navigate('add'); }
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', goBack);

  // Search box
  document.getElementById('recipe-search').addEventListener('input', e => {
    renderRecipes(e.target.value);
  });

  // Handle Android hardware back button via Capacitor App plugin
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    const CapApp = window.Capacitor.Plugins.App;
    CapApp.addListener('backButton', () => {
      const prevPage = navHistory.pop();
      if (prevPage) {
        handlingPopState = true;
        navigate(prevPage);
        handlingPopState = false;
      } else if (currentPage !== 'recipes') {
        navigate('recipes');
      } else {
        CapApp.exitApp();
      }
    });
  }

  // Handle browser back button (PWA / non-Capacitor fallback)
  window.addEventListener('popstate', () => {
    const prevPage = navHistory.pop();
    if (prevPage) {
      handlingPopState = true;
      navigate(prevPage);
      handlingPopState = false;
    } else {
      history.pushState(null, '', '');
    }
  });
  history.replaceState({ page: 'recipes' }, '', '');
  history.pushState(null, '', '');

  // Wire up shop-add popup form
  const sapForm = document.getElementById('sap-form');
  if (sapForm) {
    sapForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('sap-name').value.trim();
      if (!name) return;
      const qty = document.getElementById('sap-qty').value.trim();
      const unit = document.getElementById('sap-unit').value.trim();
      const recurring = document.getElementById('sap-recurring').checked;
      if (recurring) {
        RecurringDB.add(name, qty, unit);
        showToast('Recurring item added');
      } else {
        CustomItemsDB.add(name, qty, unit);
        showToast('Item added');
      }
      sapForm.reset();
      closeShopAddPicker();
      if (currentPage === 'shopping') renderShopping();
      updateShoppingBadge();
    });
  }

  // Register service worker (skip inside Capacitor – assets are bundled in the APK)
  if ('serviceWorker' in navigator && !window.Capacitor) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Default to planner if today has meals planned, otherwise recipes
  const todayWk = weekKey(new Date());
  const todayPlan = PlanDB.allForWeek(todayWk);
  const nowDow = new Date().getDay();
  const todayDayName = DAYS[nowDow === 0 ? 6 : nowDow - 1];
  const todayDayPlan = todayPlan[todayDayName] || {};
  const todayHasMeals = MEALS.some(m => (todayDayPlan[m] || []).length > 0);
  navigate(todayHasMeals ? 'planner' : 'recipes');

  // Start shopping day reminder checks
  scheduleShoppingReminder();
});
