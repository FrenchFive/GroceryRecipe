/**
 * app.js – SPA routing, view rendering, event wiring
 */

/* ── State ───────────────────────────────────────────────── */
let currentPage          = 'recipes';
let detailRecipeId       = null;   // recipe open in detail view
let plannerWeekOffset    = 0;      // 0 = current week, ±n = n weeks offset
let plannerSelectedDayIdx = null;  // null = auto-select today/Mon, 0-6 = explicit selection
let shoppingView         = 'current'; // 'current' | 'next'
let pickerCtx            = null;   // { wk, day, meal } for the meal picker

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

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update header
  const titles = {
    recipes:  '🥘 Recipes',
    shopping: '🛒 Shopping List',
    planner:  '📅 Weekly Planner',
    detail:   '🍽 Recipe',
    add:      '✏️ Add Recipe',
    edit:     '✏️ Edit Recipe'
  };
  document.getElementById('header-title').textContent = titles[page] || 'GroceryRecipe';

  // show/hide back & add buttons
  const inDetail = page === 'detail' || page === 'add' || page === 'edit';
  document.getElementById('back-btn').style.display = inDetail ? 'flex' : 'none';
  document.getElementById('btn-add-recipe').style.display = inDetail ? 'none' : 'flex';
  document.getElementById('bottom-nav').style.display = inDetail ? 'none' : 'flex';

  // Render the page content
  if (page === 'recipes')  renderRecipes();
  if (page === 'shopping') renderShopping();
  if (page === 'planner')  renderPlanner();
  if (page === 'detail')   renderDetail(detailRecipeId);
  if (page === 'add')      renderAddForm(null);
  if (page === 'edit')     renderAddForm(detailRecipeId);

  updateShoppingBadge();
}

function goBack() {
  if (currentPage === 'detail' || currentPage === 'edit') navigate('recipes');
  else if (currentPage === 'add') navigate('recipes');
  else navigate('recipes');
}

/* ── Recipes page ────────────────────────────────────────── */
function renderRecipes(filter = '') {
  const list = RecipeDB.search(filter);
  const container = document.getElementById('recipe-list');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍳</div>
        <p>${filter ? 'No recipes match your search.' : 'No recipes yet. Tap + to add one!'}</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(r => `
    <div class="recipe-item" data-id="${r.id}" role="button" tabindex="0">
      <span class="recipe-emoji">${r.emoji || '🍽'}</span>
      <div class="recipe-info">
        <h3>${escHtml(r.name)}</h3>
        <p>${r.ingredients.length} ingredients &bull; serves ${r.servings}</p>
      </div>
      <span class="recipe-arrow">›</span>
    </div>
  `).join('');

  container.querySelectorAll('.recipe-item').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(el.dataset.id); });
  });
}

function openDetail(id) {
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
      <div class="emoji">${r.emoji || '🍽'}</div>
      <h2>${escHtml(r.name)}</h2>
      <p>Base: ${r.servings} serving${r.servings > 1 ? 's' : ''}</p>
    </div>

    <!-- Servings selector -->
    <div class="card">
      <div class="servings-row">
        <label>Servings:</label>
        <div class="qty-ctrl">
          <button id="qty-minus" aria-label="Decrease">−</button>
          <span class="qty-val" id="qty-val">${r.servings}</span>
          <button id="qty-plus"  aria-label="Increase">+</button>
        </div>
      </div>
      <button class="btn btn-primary btn-full" id="btn-add-to-shop">
        🛒 Add to Shopping List
      </button>
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
      <button class="btn btn-outline" style="flex:1;" id="btn-edit-recipe">✏️ Edit</button>
      <button class="btn btn-danger"  style="flex:1;" id="btn-delete-recipe">🗑 Delete</button>
    </div>
  `;

  let servings = r.servings;
  const ingList = document.getElementById('detail-ingredients');

  function renderIngredients() {
    const mult = servings / r.servings;
    ingList.innerHTML = r.ingredients.map(ing => {
      const qty = parseFloat(ing.qty);
      const scaledQty = isNaN(qty) ? ing.qty : String(Math.round(qty * mult * 100) / 100);
      return `<li><span>${escHtml(ing.name)}</span>
                  <span class="ingredient-qty">${scaledQty} ${escHtml(ing.unit)}</span></li>`;
    }).join('');
  }
  renderIngredients();

  document.getElementById('qty-val').textContent = servings;

  document.getElementById('qty-minus').addEventListener('click', () => {
    if (servings > 1) { servings--; document.getElementById('qty-val').textContent = servings; renderIngredients(); }
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    servings++; document.getElementById('qty-val').textContent = servings; renderIngredients();
  });

  document.getElementById('btn-add-to-shop').addEventListener('click', () => {
    const mult = servings / r.servings;
    ShoppingDB.addFromRecipe(r, mult);
    updateShoppingBadge();
    showToast(`${r.name} added to shopping list 🛒`);
  });

  document.getElementById('btn-edit-recipe').addEventListener('click', () => navigate('edit'));
  document.getElementById('btn-delete-recipe').addEventListener('click', () => deleteRecipe(id));
}

function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
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
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>Emoji</label>
            <input type="text" id="f-emoji" placeholder="🍽" maxlength="4"
                   value="${r ? r.emoji : ''}">
          </div>
          <div class="form-group">
            <label>Base Servings *</label>
            <input type="number" id="f-servings" min="1" value="${r ? r.servings : 2}" required>
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
        <button type="button" class="btn btn-outline btn-full mt-8" id="add-ing-btn">+ Add Ingredient</button>
      </div>

      <!-- Steps -->
      <div class="card">
        <div class="section-title">Steps</div>
        <div id="step-rows"></div>
        <button type="button" class="btn btn-outline btn-full mt-8" id="add-step-btn">+ Add Step</button>
      </div>

      <button type="submit" class="btn btn-primary btn-full mt-16" style="margin-bottom:32px;">
        ${r ? '💾 Save Changes' : '✅ Add Recipe'}
      </button>
    </form>
  `;

  const ingContainer  = document.getElementById('ing-rows');
  const stepContainer = document.getElementById('step-rows');

  function addIngRow(name = '', qty = '', unit = '') {
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = `
      <input type="text"   class="ing-name" placeholder="Flour"  value="${escHtml(name)}">
      <input type="text"   class="ing-qty"  placeholder="200"    value="${escHtml(qty)}">
      <input type="text"   class="ing-unit" placeholder="g"      value="${escHtml(unit)}">
      <button type="button" class="remove-btn" aria-label="Remove">✕</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    ingContainer.appendChild(div);
  }

  function addStepRow(text = '') {
    const div = document.createElement('div');
    div.className = 'step-row';
    div.innerHTML = `
      <textarea class="step-text" placeholder="Describe this step…">${escHtml(text)}</textarea>
      <button type="button" class="remove-btn" aria-label="Remove">✕</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    stepContainer.appendChild(div);
  }

  // Pre-fill existing data
  if (r) {
    r.ingredients.forEach(i => addIngRow(i.name, i.qty, i.unit));
    r.steps.forEach(s => addStepRow(s));
  } else {
    addIngRow(); addIngRow();
    addStepRow(); addStepRow();
  }

  document.getElementById('add-ing-btn').addEventListener('click',  () => addIngRow());
  document.getElementById('add-step-btn').addEventListener('click', () => addStepRow());

  document.getElementById('recipe-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    if (!name) { showToast('Please enter a recipe name'); return; }

    const ingredients = [...ingContainer.querySelectorAll('.ingredient-row')]
      .map(row => ({
        name: row.querySelector('.ing-name').value.trim(),
        qty:  row.querySelector('.ing-qty').value.trim(),
        unit: row.querySelector('.ing-unit').value.trim()
      }))
      .filter(i => i.name);

    const steps = [...stepContainer.querySelectorAll('.step-text')]
      .map(t => t.value.trim())
      .filter(Boolean);

    const recipe = {
      ...(r || {}),
      name,
      emoji:     document.getElementById('f-emoji').value.trim() || '🍽',
      servings:  Math.max(1, parseInt(document.getElementById('f-servings').value) || 1),
      ingredients,
      steps
    };

    const saved = RecipeDB.save(recipe);
    detailRecipeId = saved.id;
    showToast(r ? 'Recipe updated ✅' : 'Recipe added ✅');
    navigate('detail');
  });
}

/* ── Shopping page ───────────────────────────────────────── */
function renderShopping() {
  const page   = document.getElementById('page-shopping');
  const tabs   = `
    <div class="shop-tabs">
      <button class="shop-tab${shoppingView === 'current' ? ' active' : ''}" data-view="current">🛒 Current List</button>
      <button class="shop-tab${shoppingView === 'next'    ? ' active' : ''}" data-view="next">📅 Next Week</button>
    </div>`;

  if (shoppingView === 'next') {
    renderShoppingNextWeek(page, tabs);
  } else {
    renderShoppingCurrent(page, tabs);
  }

  page.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => { shoppingView = tab.dataset.view; renderShopping(); });
  });
}

function renderShoppingCurrent(page, tabs) {
  const items     = ShoppingDB.all();
  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i =>  i.checked);

  function itemHtml(i) {
    return `<div class="shop-item${i.checked ? ' checked' : ''}" data-id="${i.id}">
      <input type="checkbox" id="chk-${i.id}" ${i.checked ? 'checked' : ''} aria-label="${escHtml(i.name)}">
      <label for="chk-${i.id}">
        ${escHtml(i.name)}
        <span class="shop-source">from ${escHtml(i.source)}</span>
      </label>
      <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
      <button class="shop-remove" data-id="${i.id}" aria-label="Remove">✕</button>
    </div>`;
  }

  let body;
  if (items.length === 0) {
    body = `<div class="empty-state">
      <div class="empty-icon">🛒</div>
      <p>Your shopping list is empty.<br>Add ingredients from a recipe!</p>
    </div>`;
  } else {
    const actions = `
      <div class="flex-row" style="margin-bottom:14px;justify-content:flex-end;">
        ${checked.length ? `<button class="btn btn-outline" id="btn-clear-checked" style="font-size:.85rem;padding:8px 14px;">✓ Remove checked</button>` : ''}
        <button class="btn btn-danger" id="btn-clear-all" style="font-size:.85rem;padding:8px 14px;">🗑 Clear all</button>
      </div>`;
    body = actions + `
      <div class="card" id="shop-list">
        ${unchecked.map(itemHtml).join('')}
        ${checked.length && unchecked.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
        ${checked.map(itemHtml).join('')}
      </div>`;
  }

  page.innerHTML = tabs + body;

  page.querySelectorAll('.shop-item input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      ShoppingDB.toggle(chk.closest('.shop-item').dataset.id);
      updateShoppingBadge();
      renderShopping();
    });
  });

  page.querySelectorAll('.shop-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      ShoppingDB.remove(btn.dataset.id);
      updateShoppingBadge();
      renderShopping();
    });
  });

  const btnCA = document.getElementById('btn-clear-all');
  if (btnCA) {
    btnCA.addEventListener('click', () => {
      if (confirm('Clear the entire shopping list?')) {
        ShoppingDB.clearAll();
        updateShoppingBadge();
        renderShopping();
      }
    });
  }

  const btnCC = document.getElementById('btn-clear-checked');
  if (btnCC) {
    btnCC.addEventListener('click', () => {
      ShoppingDB.clearChecked();
      updateShoppingBadge();
      renderShopping();
    });
  }
}

function renderShoppingNextWeek(page, tabs) {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const nwk   = weekKey(d);
  const plan  = PlanDB.allForWeek(nwk);
  const dates = getWeekDates(nwk);
  const label = formatWeekRange(nwk);

  // Collect meals planned for next week
  const meals = [];
  DAYS.forEach((day, idx) => {
    MEALS.forEach(meal => {
      const rid = plan[day]?.[meal];
      if (rid) {
        const recipe = RecipeDB.get(rid);
        if (recipe) meals.push({ recipe, day, meal, date: dates[idx] });
      }
    });
  });

  let body;
  if (meals.length === 0) {
    body = `<div class="empty-state">
      <div class="empty-icon">📅</div>
      <p>No meals planned for next week.<br>Go to the Planner to schedule some!</p>
    </div>`;
  } else {
    // Merge ingredients across all planned recipes
    const ingMap = {};
    meals.forEach(({ recipe }) => {
      recipe.ingredients.forEach(ing => {
        const k = `${ing.name.toLowerCase()}\u0000${ing.unit}`;
        if (ingMap[k]) {
          const prev = parseFloat(ingMap[k].qty), add = parseFloat(ing.qty);
          if (!isNaN(prev) && !isNaN(add)) ingMap[k].qty = String(Math.round((prev + add) * 100) / 100);
          if (!ingMap[k].sources.includes(recipe.name)) ingMap[k].sources.push(recipe.name);
        } else {
          ingMap[k] = { name: ing.name, qty: ing.qty, unit: ing.unit, sources: [recipe.name] };
        }
      });
    });
    const ingList = Object.values(ingMap);

    body = `
      <div class="next-week-header">
        <span>📅 ${escHtml(label)}</span>
        <button class="btn btn-primary" id="btn-add-next-week" style="font-size:.8rem;padding:8px 14px;">
          🛒 Add to shopping list
        </button>
      </div>
      <div class="card">
        ${ingList.map(i => `
          <div class="shop-item-preview">
            <span class="shop-item-preview-name">${escHtml(i.name)}</span>
            <span class="shop-qty">${escHtml(i.qty)} ${escHtml(i.unit)}</span>
          </div>
          <span class="shop-source" style="padding:0 0 8px;display:block;">${i.sources.map(escHtml).join(', ')}</span>
        `).join('')}
      </div>`;
  }

  page.innerHTML = tabs + body;

  const btnANW = document.getElementById('btn-add-next-week');
  if (btnANW) {
    btnANW.addEventListener('click', () => {
      meals.forEach(({ recipe }) => ShoppingDB.addFromRecipe(recipe, 1));
      updateShoppingBadge();
      shoppingView = 'current';
      renderShopping();
      showToast(`Next week's groceries added to shopping list 🛒`);
    });
  }
}

/* ── Planner page ────────────────────────────────────────── */
function renderPlanner() {
  const wk      = getPlannerWk();
  const plan    = PlanDB.allForWeek(wk);
  const dates   = getWeekDates(wk);
  const nowDate = new Date(); nowDate.setHours(0,0,0,0);

  const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
  const page      = document.getElementById('page-planner');

  const selIdx  = getEffectiveSelIdx(nowDate);
  const selDay  = DAYS[selIdx];
  const selDate = dates[selIdx];
  const selPlan = plan[selDay] || { breakfast: null, lunch: null, dinner: null };

  const todayBtn = plannerWeekOffset !== 0
    ? `<button class="cal-today-btn" id="planner-today">Today</button>`
    : '';

  /* ── Horizontal day strip ──── */
  const stripHtml = DAYS.map((day, i) => {
    const d       = dates[i];
    const isToday = d.getTime() === nowDate.getTime();
    const isSel   = i === selIdx;
    return `<button class="cal-strip-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}"
              data-idx="${i}" aria-label="${day} ${d.getDate()}" aria-pressed="${isSel}">
      <span class="cal-strip-name">${DAYS_SHORT[i]}</span>
      <span class="cal-strip-num">${d.getDate()}</span>
      ${isToday && !isSel ? '<span class="cal-strip-dot" aria-hidden="true"></span>' : ''}
    </button>`;
  }).join('');

  /* ── 3 meal cards for selected day ──── */
  const mealCardsHtml = MEALS.map(meal => {
    const rid    = selPlan[meal];
    const recipe = rid ? RecipeDB.get(rid) : null;
    const body   = recipe
      ? `<div class="cal-card-recipe">
           <span class="cal-card-emoji">${recipe.emoji || '🍽'}</span>
           <div class="cal-card-info">
             <span class="cal-card-name">${escHtml(recipe.name)}</span>
             <span class="cal-card-meta">${recipe.ingredients.length} ingredients · serves ${recipe.servings}</span>
           </div>
           <span class="cal-card-arrow">›</span>
         </div>`
      : `<div class="cal-card-add">
           <span class="cal-card-add-icon">+</span>
           <span>Add ${meal}</span>
         </div>`;

    return `<div class="cal-meal-card">
      <div class="cal-meal-card-hd">
        <span class="cal-meal-card-icon">${mealIcons[meal]}</span>
        <span class="cal-meal-card-label">${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
        ${recipe ? `<button class="cal-chip-clear"
                      data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}"
                      aria-label="Clear ${meal}">×</button>` : ''}
      </div>
      <div class="cal-meal-card-body"
           data-wk="${wk}" data-day="${escHtml(selDay)}" data-meal="${meal}"
           role="button" tabindex="0" aria-label="${recipe ? `Change ${meal}: ${recipe.name}` : `Add ${meal}`}">
        ${body}
      </div>
    </div>`;
  }).join('');

  const selHeading = `${selDay}, ${MONTHS_FULL[selDate.getMonth()]} ${selDate.getDate()}`;

  page.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="planner-prev" aria-label="Previous week">‹</button>
      <div class="cal-nav-center">
        <div class="cal-nav-label">${formatWeekRange(wk)}</div>
        ${todayBtn}
      </div>
      <button class="cal-nav-btn" id="planner-next" aria-label="Next week">›</button>
    </div>

    <div class="cal-week-strip" role="tablist" aria-label="Day selector">
      ${stripHtml}
    </div>

    <div class="cal-day-detail">
      <div class="cal-detail-heading">
        <span class="cal-detail-date">${escHtml(selHeading)}</span>
        <div class="cal-detail-actions">
          <button class="btn btn-outline" id="btn-plan-to-shop"
                  style="font-size:.75rem;padding:5px 10px;">🛒 Add week</button>
          <button class="btn btn-outline" id="btn-clear-week"
                  style="font-size:.75rem;padding:5px 10px;border-color:var(--red);color:var(--red);">🗑 Clear</button>
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

  /* ── Meal card body → open picker ──── */
  page.querySelectorAll('.cal-meal-card-body').forEach(el => {
    const open = () => openMealPicker(el.dataset.wk, el.dataset.day, el.dataset.meal);
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  /* ── Chip clear (×) ──── */
  page.querySelectorAll('.cal-chip-clear').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      PlanDB.set(btn.dataset.wk, btn.dataset.day, btn.dataset.meal, null);
      renderPlanner();
    });
  });

  /* ── Add week to shopping ──── */
  document.getElementById('btn-plan-to-shop').addEventListener('click', () => {
    let count = 0;
    DAYS.forEach(day => {
      MEALS.forEach(meal => {
        const rid = plan[day]?.[meal];
        if (rid) { const r = RecipeDB.get(rid); if (r) { ShoppingDB.addFromRecipe(r, 1); count++; } }
      });
    });
    updateShoppingBadge();
    showToast(count > 0 ? `${count} meal(s) added to shopping list 🛒` : 'No meals planned yet');
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
function openMealPicker(wk, day, meal) {
  pickerCtx = { wk, day, meal };
  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);
  document.getElementById('meal-picker-title').textContent = `${day} · ${mealLabel}`;

  const recipes = RecipeDB.all();
  const list    = document.getElementById('meal-picker-list');
  list.innerHTML = `
    <button class="meal-picker-item meal-picker-clear" data-id="">
      <span class="mpi-emoji">✕</span>
      <span class="mpi-name">None (clear)</span>
    </button>
    ${recipes.map(r => `
      <button class="meal-picker-item" data-id="${r.id}">
        <span class="mpi-emoji">${r.emoji || '🍽'}</span>
        <span class="mpi-name">${escHtml(r.name)}</span>
      </button>
    `).join('')}
  `;

  list.querySelectorAll('.meal-picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      PlanDB.set(pickerCtx.wk, pickerCtx.day, pickerCtx.meal, btn.dataset.id || null);
      closeMealPicker();
      renderPlanner();
    });
  });

  const picker   = document.getElementById('meal-picker');
  const backdrop = document.getElementById('meal-picker-backdrop');
  picker.classList.add('open');
  backdrop.addEventListener('click', closeMealPicker, { once: true });
}

function closeMealPicker() {
  document.getElementById('meal-picker').classList.remove('open');
  pickerCtx = null;
}

/* ── Badge ───────────────────────────────────────────────── */
function updateShoppingBadge() {
  const n = ShoppingDB.count();
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

/* ── Boot ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Add recipe button in header
  document.getElementById('btn-add-recipe').addEventListener('click', () => navigate('add'));

  // Back button
  document.getElementById('back-btn').addEventListener('click', goBack);

  // Search box
  document.getElementById('recipe-search').addEventListener('input', e => {
    renderRecipes(e.target.value);
  });

  // Handle Android back gesture / browser back button
  window.addEventListener('popstate', () => {
    const prevPage = navHistory.pop();
    if (prevPage) {
      handlingPopState = true;
      navigate(prevPage);
      handlingPopState = false;
    } else {
      // No more history – push state back so next back will also be caught
      // (prevents app from closing on first back press from a main page)
      history.pushState(null, '', '');
    }
  });
  // Set initial history state so popstate fires instead of closing the app
  history.replaceState({ page: 'recipes' }, '', '');
  history.pushState(null, '', '');

  // Register service worker (skip inside Capacitor – assets are bundled in the APK)
  if ('serviceWorker' in navigator && !window.Capacitor) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  navigate('recipes');
});
