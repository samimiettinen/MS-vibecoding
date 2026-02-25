/* ===== State ===== */
let allProducts = [];
let currentCategory = 'All';
let searchQuery = '';
let editingProductId = null;
let deletingProductId = null;

/* ===== DOM Helpers ===== */
const $ = (id) => document.getElementById(id);

/* ===== API ===== */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ===== Toast ===== */
let toastTimer = null;
function showToast(msg, type = 'default') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ===== Load & Render ===== */
async function loadProducts() {
  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (currentCategory !== 'All') params.set('category', currentCategory);

  try {
    allProducts = await apiFetch(`/api/products?${params}`);
    renderTable();
    updateStats();
  } catch (e) {
    showToast('Failed to load products.', 'error');
  }
}

async function loadCategories() {
  try {
    const cats = await apiFetch('/api/categories');
    renderCategoryFilters(cats);
    renderCategoryDatalist(cats);
  } catch { /* ignore */ }
}

function renderCategoryFilters(cats) {
  const container = $('categoryFilters');
  container.innerHTML = '<button class="filter-chip active" data-category="All">All</button>';
  cats.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.category = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });
  // Restore active
  container.querySelectorAll('.filter-chip').forEach((btn) => {
    if (btn.dataset.category === currentCategory) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

function renderCategoryDatalist(cats) {
  const dl = $('categoryList');
  dl.innerHTML = '';
  cats.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    dl.appendChild(opt);
  });
}

function statusInfo(qty) {
  if (qty === 0) return { label: 'Out of Stock', cls: 'status-out-of-stock' };
  if (qty < 20) return { label: 'Low Stock', cls: 'status-low-stock' };
  return { label: 'In Stock', cls: 'status-in-stock' };
}

function renderTable() {
  const tbody = $('productsBody');
  const empty = $('emptyState');
  const tableContainer = document.querySelector('.table-container');

  if (allProducts.length === 0) {
    tbody.innerHTML = '';
    tableContainer.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }
  tableContainer.style.display = '';
  empty.style.display = 'none';

  tbody.innerHTML = allProducts.map((p) => {
    const s = statusInfo(p.quantity);
    return `
    <tr data-id="${p.id}">
      <td class="product-name">${escHtml(p.name)}</td>
      <td><span class="sku-text">${escHtml(p.sku)}</span></td>
      <td><span class="product-category">${escHtml(p.category)}</span></td>
      <td>$${Number(p.price).toFixed(2)}</td>
      <td>
        <div class="qty-cell">
          <button class="qty-btn" data-action="decrement" data-id="${p.id}" data-qty="${p.quantity}" title="Decrease">−</button>
          <span class="qty-value">${p.quantity}</span>
          <button class="qty-btn" data-action="increment" data-id="${p.id}" data-qty="${p.quantity}" title="Increase">+</button>
          <button class="btn-icon" data-action="editQty" data-id="${p.id}" data-qty="${p.quantity}" data-name="${escHtml(p.name)}" title="Set quantity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </td>
      <td><span class="status-badge ${s.cls}">${s.label}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon danger" data-action="delete" data-id="${p.id}" data-name="${escHtml(p.name)}" title="Delete product">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function updateStats() {
  // Fetch all products (without filter) for accurate stats
  apiFetch('/api/products').then((all) => {
    $('statTotal').textContent = all.length;
    const cats = new Set(all.map((p) => p.category)).size;
    $('statCategories').textContent = cats;
    const low = all.filter((p) => p.quantity > 0 && p.quantity < 20).length +
                all.filter((p) => p.quantity === 0).length;
    $('statLowStock').textContent = low;
    const total = all.reduce((s, p) => s + p.price * p.quantity, 0);
    $('statValue').textContent = '$' + total.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }).catch(() => {});
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===== Modal Helpers ===== */
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
function setError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.classList.toggle('visible', !!msg);
}

/* ===== Quantity Quick Actions ===== */
async function changeQuantity(id, newQty) {
  try {
    const updated = await apiFetch(`/api/products/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: newQty }),
    });
    const idx = allProducts.findIndex((p) => p.id === id);
    if (idx !== -1) allProducts[idx] = updated;
    renderTable();
    updateStats();
  } catch (e) {
    showToast(e.message || 'Failed to update quantity.', 'error');
  }
}

/* ===== Event Delegation: Table Clicks ===== */
$('productsBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  const qty = Number(btn.dataset.qty);

  if (action === 'increment') {
    await changeQuantity(id, qty + 1);
  } else if (action === 'decrement') {
    if (qty <= 0) return;
    await changeQuantity(id, qty - 1);
  } else if (action === 'editQty') {
    editingProductId = id;
    $('editProductName').textContent = btn.dataset.name;
    $('editQuantity').value = qty;
    setError('editFormError', '');
    openModal('editModal');
    setTimeout(() => $('editQuantity').focus(), 50);
  } else if (action === 'delete') {
    deletingProductId = id;
    $('deleteProductName').textContent = btn.dataset.name;
    openModal('deleteModal');
  }
});

/* ===== Category Filter ===== */
$('categoryFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  currentCategory = chip.dataset.category;
  document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  loadProducts();
});

/* ===== Search ===== */
let searchDebounce = null;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = e.target.value.trim();
    loadProducts();
  }, 250);
});

/* ===== Add Product Modal ===== */
$('openAddModal').addEventListener('click', () => {
  $('addProductForm').reset();
  setError('addFormError', '');
  openModal('addModal');
  setTimeout(() => $('newName').focus(), 50);
});
$('closeAddModal').addEventListener('click', () => closeModal('addModal'));
$('cancelAddModal').addEventListener('click', () => closeModal('addModal'));

$('addProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  setError('addFormError', '');
  const name = $('newName').value.trim();
  const sku = $('newSku').value.trim();
  const category = $('newCategory').value.trim();
  const price = $('newPrice').value;
  const quantity = $('newQuantity').value;

  try {
    await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({ name, sku, category, price: Number(price), quantity: Number(quantity) }),
    });
    closeModal('addModal');
    showToast(`"${name}" added successfully.`, 'success');
    await loadCategories();
    await loadProducts();
  } catch (err) {
    setError('addFormError', err.message);
  }
});

/* ===== Edit Quantity Modal ===== */
$('closeEditModal').addEventListener('click', () => closeModal('editModal'));
$('cancelEditModal').addEventListener('click', () => closeModal('editModal'));

$('editQuantityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  setError('editFormError', '');
  const qty = Number($('editQuantity').value);
  if (!Number.isInteger(qty) || qty < 0) {
    setError('editFormError', 'Please enter a valid non-negative integer.');
    return;
  }
  try {
    await apiFetch(`/api/products/${editingProductId}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: qty }),
    });
    closeModal('editModal');
    showToast('Quantity updated.', 'success');
    await loadProducts();
  } catch (err) {
    setError('editFormError', err.message);
  }
});

/* ===== Delete Modal ===== */
$('closeDeleteModal').addEventListener('click', () => closeModal('deleteModal'));
$('cancelDeleteModal').addEventListener('click', () => closeModal('deleteModal'));

$('confirmDelete').addEventListener('click', async () => {
  try {
    await apiFetch(`/api/products/${deletingProductId}`, { method: 'DELETE' });
    closeModal('deleteModal');
    showToast('Product deleted.', 'success');
    await loadCategories();
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
    closeModal('deleteModal');
  }
});

/* ===== Close modals on overlay click ===== */
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* ===== Close modals on Escape ===== */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach((m) => m.classList.remove('open'));
  }
});

/* ===== Init ===== */
(async () => {
  await loadCategories();
  await loadProducts();
})();
