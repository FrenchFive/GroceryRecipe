/**
 * app.js – SPA routing, view rendering, event wiring
 */

/* ── State ───────────────────────────────────────────────── */
let currentPage = 'recipes';
let detailRecipeId = null;  // which recipe is open in detail view

/* ── Routing ─────────────────────────────────────────────── */
function navigate(page) {
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
  const items = ShoppingDB.all();
  const page  = document.getElementById('page-shopping');

  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i =>  i.checked);

  if (items.length === 0) {
    page.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <p>Your shopping list is empty.<br>Add ingredients from a recipe!</p>
      </div>`;
    return;
  }

  const actions = `
    <div class="flex-row" style="margin-bottom:14px;justify-content:flex-end;">
      ${checked.length ? `<button class="btn btn-outline" id="btn-clear-checked" style="font-size:.85rem;padding:8px 14px;">✓ Remove checked</button>` : ''}
      <button class="btn btn-danger" id="btn-clear-all" style="font-size:.85rem;padding:8px 14px;">🗑 Clear all</button>
    </div>`;

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

  page.innerHTML = actions + `
    <div class="card" id="shop-list">
      ${unchecked.map(itemHtml).join('')}
      ${checked.length && unchecked.length ? '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">' : ''}
      ${checked.map(itemHtml).join('')}
    </div>`;

  // Bind checkboxes
  page.querySelectorAll('.shop-item input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      ShoppingDB.toggle(chk.closest('.shop-item').dataset.id);
      updateShoppingBadge();
      renderShopping();
    });
  });

  // Bind remove buttons
  page.querySelectorAll('.shop-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      ShoppingDB.remove(btn.dataset.id);
      updateShoppingBadge();
      renderShopping();
    });
  });

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('Clear the entire shopping list?')) {
      ShoppingDB.clearAll();
      updateShoppingBadge();
      renderShopping();
    }
  });

  const btnCC = document.getElementById('btn-clear-checked');
  if (btnCC) {
    btnCC.addEventListener('click', () => {
      ShoppingDB.clearChecked();
      updateShoppingBadge();
      renderShopping();
    });
  }
}

/* ── Planner page ────────────────────────────────────────── */
function renderPlanner() {
  const plan    = PlanDB.all();
  const recipes = RecipeDB.all();
  const page    = document.getElementById('page-planner');

  const recipeOptions = recipes.map(r =>
    `<option value="${r.id}">${r.emoji || '🍽'} ${escHtml(r.name)}</option>`
  ).join('');

  page.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button class="btn btn-outline" id="btn-plan-to-shop" style="font-size:.85rem;padding:8px 14px;">
        🛒 Add week to shopping list
      </button>
    </div>
    ${DAYS.map(day => `
      <div class="day-card">
        <div class="day-header"><h3>${day}</h3></div>
        <div class="day-body">
          ${MEALS.map(meal => `
            <div class="meal-slot">
              <span class="meal-slot-label">${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
              <select class="plan-select" data-day="${day}" data-meal="${meal}">
                <option value="">— none —</option>
                ${recipeOptions}
              </select>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;

  // Restore saved selections
  page.querySelectorAll('.plan-select').forEach(sel => {
    const { day, meal } = sel.dataset;
    sel.value = plan[day]?.[meal] || '';
    sel.addEventListener('change', () => {
      PlanDB.set(day, meal, sel.value);
    });
  });

  document.getElementById('btn-plan-to-shop').addEventListener('click', () => {
    const currentPlan = PlanDB.all();
    let count = 0;
    DAYS.forEach(day => {
      MEALS.forEach(meal => {
        const rid = currentPlan[day]?.[meal];
        if (rid) {
          const recipe = RecipeDB.get(rid);
          if (recipe) { ShoppingDB.addFromRecipe(recipe, 1); count++; }
        }
      });
    });
    updateShoppingBadge();
    if (count > 0) showToast(`${count} meal(s) added to shopping list 🛒`);
    else showToast('No meals planned yet');
  });
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

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  navigate('recipes');
});
