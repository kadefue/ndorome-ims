import { useState, useEffect, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const API = "http://localhost:8000";

function useAuth() { return useContext(AuthContext); }

// ── API Helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.detail || err.message || `Request failed (${res.status})`;
    try { window._app_show_toast && window._app_show_toast(msg, 'danger'); } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ── Colors & Theme ────────────────────────────────────────────────────────────
const C = {
  primary: "#C8860A",
  primaryDark: "#9E6A08",
  primaryLight: "#F5B942",
  bg: "#0D1117",
  bgCard: "#161B22",
  bgHover: "#1C2333",
  border: "#21262D",
  text: "#E6EDF3",
  textMuted: "#8B949E",
  success: "#3FB950",
  danger: "#F85149",
  warning: "#D29922",
  info: "#58A6FF",
  purple: "#BC8CFF",
};

const PIE_COLORS = ["#C8860A", "#58A6FF", "#3FB950", "#F85149", "#BC8CFF", "#D29922"];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'DM Sans', sans-serif;
    background: #0D1117;
    color: #E6EDF3;
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0D1117; }
  ::-webkit-scrollbar-thumb { background: #21262D; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #C8860A; }

  .app { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 240px;
    min-width: 240px;
    background: #161B22;
    border-right: 1px solid #21262D;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    overflow-y: auto;
  }
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid #21262D;
  }
  .sidebar-logo h1 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: #C8860A;
    line-height: 1.1;
    letter-spacing: -0.3px;
  }
  .sidebar-logo span {
    font-size: 11px;
    color: #8B949E;
    font-weight: 400;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .sidebar-user {
    padding: 14px 20px;
    border-bottom: 1px solid #21262D;
    display: flex; align-items: center; gap: 10px;
  }
  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, #C8860A, #9E6A08);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px;
    color: #0D1117; flex-shrink: 0;
  }
  .user-info { overflow: hidden; }
  .user-info p { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-info span { font-size: 11px; color: #8B949E; text-transform: capitalize; }
  .nav-section { padding: 16px 12px 8px; }
  .nav-label { font-size: 10px; font-weight: 600; color: #8B949E; text-transform: uppercase; letter-spacing: 1px; padding: 0 8px 8px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; cursor: pointer;
    font-size: 13.5px; font-weight: 400; color: #8B949E;
    transition: all 0.15s ease; margin-bottom: 2px;
  }
  .nav-item:hover { background: #1C2333; color: #E6EDF3; }
  .nav-item.active { background: rgba(200,134,10,0.15); color: #C8860A; font-weight: 500; }
  .nav-item .icon { font-size: 16px; width: 18px; text-align: center; }
  .sidebar-footer {
    margin-top: auto; padding: 16px 12px;
    border-top: 1px solid #21262D;
  }
  .logout-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; cursor: pointer;
    font-size: 13.5px; color: #F85149;
    transition: background 0.15s; width: 100%;
    background: none; border: none;
  }
  .logout-btn:hover { background: rgba(248,81,73,0.1); }

  /* ── Main Content ── */
  .main { margin-left: 240px; flex: 1; min-width: 0; }
  .topbar {
    background: #161B22; border-bottom: 1px solid #21262D;
    padding: 0 28px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar h2 {
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
    color: #f9fafa;
  }
  .topbar-actions { display: flex; align-items: center; gap: 12px; }
  .badge-pill {
    background: rgba(200,134,10,0.2);
    color: #C8860A; border: 1px solid rgba(200,134,10,0.3);
    border-radius: 20px; font-size: 11px; font-weight: 600;
    padding: 3px 10px; letter-spacing: 0.3px;
  }
  .page { padding: 28px; }

  /* ── Cards ── */
  .card {
    background: #161B22; border: 1px solid #21262D;
    border-radius: 12px; overflow: hidden;
  }
  .card-header {
    padding: 16px 20px; border-bottom: 1px solid #21262D;
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-title {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #E6EDF3;
  }
  .card-body { padding: 20px; }

  /* ── Stat Cards ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: #161B22; border: 1px solid #21262D;
    border-radius: 12px; padding: 20px;
    position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  }
  .stat-card.gold::before { background: linear-gradient(90deg, #C8860A, #F5B942); }
  .stat-card.blue::before { background: linear-gradient(90deg, #58A6FF, #1F6FEB); }
  .stat-card.green::before { background: linear-gradient(90deg, #3FB950, #2EA043); }
  .stat-card.red::before { background: linear-gradient(90deg, #F85149, #DA3633); }
  .stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 12px;
  }
  .stat-icon.gold { background: rgba(200,134,10,0.15); }
  .stat-icon.blue { background: rgba(88,166,255,0.15); }
  .stat-icon.green { background: rgba(63,185,80,0.15); }
  .stat-icon.red { background: rgba(248,81,73,0.15); }
  .stat-label { font-size: 12px; color: #8B949E; margin-bottom: 6px; font-weight: 400; }
  .stat-value {
    font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800;
    color: #E6EDF3; line-height: 1;
  }
  .stat-sub { font-size: 11px; color: #8B949E; margin-top: 6px; }

  /* ── Charts Grid ── */
  .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
  
  /* ── Tables ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th {
    text-align: left; padding: 10px 14px;
    color: #8B949E; font-weight: 500; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid #21262D;
    background: rgba(28,35,51,0.5);
  }
  tbody tr { border-bottom: 1px solid #1C2333; transition: background 0.1s; }
  tbody tr:hover { background: rgba(255,255,255,0.02); }
  tbody tr:last-child { border-bottom: none; }
  td { padding: 12px 14px; color: #E6EDF3; }
  .td-muted { color: #8B949E; }

  /* ── Badges ── */
  .badge {
    display: inline-block; border-radius: 6px;
    font-size: 11px; font-weight: 600; padding: 3px 8px;
  }
  .badge-success { background: rgba(63,185,80,0.15); color: #3FB950; }
  .badge-warning { background: rgba(210,153,34,0.15); color: #D29922; }
  .badge-danger  { background: rgba(248,81,73,0.15); color: #F85149; }
  .badge-info    { background: rgba(88,166,255,0.15); color: #58A6FF; }
  .badge-purple  { background: rgba(188,140,255,0.15); color: #BC8CFF; }
  .badge-gold    { background: rgba(200,134,10,0.15); color: #C8860A; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-primary {
    background: #C8860A; color: #0D1117;
  }
  .btn-primary:hover { background: #F5B942; }
  .btn-secondary {
    background: #21262D; color: #E6EDF3; border: 1px solid #30363D;
  }
  .btn-secondary:hover { background: #1C2333; border-color: #C8860A; color: #C8860A; }
  .btn-danger { background: rgba(248,81,73,0.15); color: #F85149; border: 1px solid rgba(248,81,73,0.3); }
  .btn-danger:hover { background: rgba(248,81,73,0.25); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* ── Forms & Modals ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: #161B22; border: 1px solid #30363D;
    border-radius: 16px; width: 100%; max-width: 520px;
    max-height: 90vh; overflow-y: auto;
  }
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid #21262D;
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid #21262D; display: flex; justify-content: flex-end; gap: 10px; }
  .close-btn {
    width: 28px; height: 28px; border-radius: 6px;
    background: #21262D; border: none; color: #8B949E;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 16px; transition: all 0.1s;
  }
  .close-btn:hover { background: rgba(248,81,73,0.2); color: #F85149; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 500; color: #8B949E; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-control {
    width: 100%; background: #0D1117; border: 1px solid #30363D;
    border-radius: 8px; padding: 10px 12px; color: #E6EDF3;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    outline: none; transition: border-color 0.15s;
  }
  .form-control:focus { border-color: #C8860A; box-shadow: 0 0 0 3px rgba(200,134,10,0.1); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* ── Search ── */
  .search-wrap { position: relative; }
  .search-wrap input { padding-left: 34px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #8B949E; font-size: 14px; }

  /* ── Login ── */
  .login-page {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 20px;
    background: #0D1117;
    background-image: radial-gradient(ellipse at 20% 50%, rgba(200,134,10,0.07) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(88,166,255,0.05) 0%, transparent 50%);
  }
  .login-card {
    background: #161B22; border: 1px solid #21262D;
    border-radius: 20px; padding: 40px; width: 100%; max-width: 400px;
    margin: 0 auto;
  }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo h1 { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #C8860A; }
  .login-logo p { font-size: 13px; color: #8B949E; margin-top: 4px; }
  .login-btn {
    width: 100%; padding: 12px; background: #C8860A; color: #0D1117;
    border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.15s;
    margin-top: 8px;
  }
  .login-btn:hover { background: #F5B942; }
  .login-hint {
    text-align: center; margin-top: 20px; padding: 12px;
    background: #0D1117; border-radius: 8px; font-size: 12px; color: #8B949E;
  }
  .login-hint strong { color: #C8860A; }
  .error-msg { background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3); color: #F85149; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }

  /* ── Low Stock Alert ── */
  .alert-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; background: rgba(248,81,73,0.08); border: 1px solid rgba(248,81,73,0.2); margin-bottom: 8px; }
  .alert-dot { width: 8px; height: 8px; border-radius: 50%; background: #F85149; flex-shrink: 0; }

  /* ── Section Tabs ── */
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; }
  .page-subtitle { font-size: 13px; color: #8B949E; margin-top: 2px; }

  /* ── Loading ── */
  .loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: #8B949E; gap: 12px; }
  .spinner { width: 24px; height: 24px; border: 2px solid #21262D; border-top-color: #C8860A; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Tooltip override ── */
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: #1C2333 !important; border-color: #30363D !important;
    border-radius: 8px !important;
  }

  /* ── Role badge colors ── */
  .role-owner { background: rgba(200,134,10,0.15); color: #C8860A; }
  .role-manager { background: rgba(88,166,255,0.15); color: #58A6FF; }
  .role-employee { background: rgba(63,185,80,0.15); color: #3FB950; }

  /* ── Toasts ── */
  .toasts-container { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
  .toast {
    background: #0F1720; border: 1px solid #21262D; color: #E6EDF3;
    padding: 10px 14px; border-radius: 10px; min-width: 260px; box-shadow: 0 6px 20px rgba(2,6,23,0.6);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .toast .msg { flex: 1; font-size: 13px; color: #E6EDF3; }
  .toast .close { background: transparent; border: none; color: #8B949E; cursor: pointer; padding: 6px; border-radius: 6px; }
  .toast.success { border-left: 4px solid #3FB950; }
  .toast.danger  { border-left: 4px solid #F85149; }
  .toast.info    { border-left: 4px solid #58A6FF; }
  .toast.warning { border-left: 4px solid #D29922; }
`;

const themeCss = `
  /* Light theme overrides applied when body has class 'theme-light' */
  .theme-light body {
    background: #F6F8FA;
    color: #0D1117;
  }
  .theme-light .sidebar { background: #FFFFFF; border-right-color: #E6EDF3; }
  .theme-light .sidebar-logo h1 { color: #C8860A; }
  .theme-light .sidebar-logo span, .theme-light .user-info span, .theme-light .td-muted, .theme-light .page-subtitle { color: #6B7280; }
  .theme-light .user-avatar { color: #FFFFFF; }
  .theme-light .main { background: #F6F8FA; }
  .theme-light .topbar, .theme-light .card, .theme-light .login-card, .theme-light .stat-card, .theme-light .modal { background: #FFFFFF; border-color: #E6EDF3; }
  .theme-light .card-title, .theme-light .page-title, .theme-light .stat-value, .theme-light td { color: #0D1117; }
  .theme-light .nav-item { color: #374151; }
  .theme-light .nav-item:hover { background: #F3F4F6; }
  .theme-light .form-control { background: #FFFFFF; color: #0D1117; border: 1px solid #E6EDF3; }
  .theme-light thead th { background: rgba(15,23,42,0.02); color: #6B7280; border-bottom-color: #EEF2F7; }
  .theme-light .badge { background: rgba(0,0,0,0.03); color: #0D1117; }
`;

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;
const initials = (name) => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

const humanDate = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return d; }
};

// ── Translations ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.inventory": "Inventory",
    "nav.sales": "Sales",
    "nav.orders": "Orders",
    "nav.deliveries": "Deliveries",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "page.dashboard": "Dashboard",
    "page.inventory": "Inventory Management",
    "page.sales": "Sales Management",
    "page.orders": "Purchase Orders",
    "page.deliveries": "Deliveries",
    "page.reports": "Reports & Analytics",
    "page.users": "User Management",
    "btn.add_product": "＋ Add Product",
    "btn.new_sale": "＋ New Sale",
    "btn.new_order": "＋ New Order",
    "btn.record_delivery": "＋ Record Delivery",
    "btn.edit_product": "Edit Product",
    "btn.add_user": "＋ Add User",
    "sign_out": "Sign Out",
    "theme.light": "☀️ Light",
    "theme.dark": "🌙 Dark",
    "dashboard.welcome": "Welcome back! Here's what's happening at the store.",
    "stat.total_revenue": "Total Revenue",
    "stat.total_sales": "Total Sales",
    "stat.inventory_value": "Inventory Value",
    "stat.low_stock_alerts": "Low Stock Alerts",
    "stat.all_time_sales": "All-time sales",
    "stat.transactions_recorded": "Transactions recorded",
    "stat.inventory_products": "{count} product types",
    "charts.monthly_revenue": "Monthly Revenue Trend",
    "charts.stock_by_category": "Stock by Category",
    "inventory.product_stock": "Product Stock",
    "inventory.search_placeholder": "Search products…",
    "inventory.table.product": "Product",
    "inventory.table.sku": "SKU",
    "inventory.table.category": "Category",
    "inventory.table.qty": "Qty",
    "inventory.table.unit_price": "Unit Price",
    "inventory.table.supplier": "Supplier",
    "inventory.table.location": "Location",
    "inventory.table.status": "Status",
    "inventory.table.actions": "Actions",
    "inventory.status.low": "Low Stock",
    "inventory.status.in_stock": "In Stock",
    "btn.cancel": "Cancel",
    "btn.save": "Save",
    "sales.record_sale": "Record New Sale",
    "sales.transaction_history": "Transaction History",
    "orders.create_order": "Create Purchase Order",
    "deliveries.record_incoming": "Record Incoming Delivery",
    "deliveries.no_records": "No deliveries recorded yet",
    "table.notes": "Notes",
    "form.sku": "SKU",
    "form.category": "Category",
    "form.enter_sku": "Enter SKU",
    "form.enter_category": "Enter category",
    "form.enter_product_name": "Enter product name",
    "form.full_name": "Full Name",
    "form.email": "Email",
    "form.password": "Password",
    "form.role": "Role",
    "btn.create_user": "Create User",
    "nav.navigation": "Navigation",
    "tooltip.revenue": "Revenue",
    "loading.dashboard": "Loading dashboard…",
    "dashboard.low_stock_title": "⚠️ Low Stock Alerts",
    "dashboard.recent_sales": "🕐 Recent Sales",
    "label.left": "left",
    "label.min": "Min:",
    "table.date": "Date",
    "table.product": "Product",
    "table.supplier": "Supplier",
    "table.customer": "Customer",
    "table.qty": "Qty",
    "table.unit_price": "Unit Price",
    "table.total": "Total",
    "table.name": "Name",
    "table.email": "Email",
    "table.role": "Role",
    "table.payment": "Payment",
    "table.employee": "Employee",
    "table.status": "Status",
    "table.amount": "Amount",
    "form.product_name": "Product Name",
    "form.sku": "SKU",
    "form.category": "Category",
    "form.select_existing": "-- Select existing --",
    "form.other": "Other...",
    "form.enter_product_name": "Enter product name",
    "form.enter_sku": "Enter SKU",
    "form.enter_category": "Enter category",
    "form.supplier": "Supplier",
    "form.location": "Location",
    "form.quantity": "Quantity",
    "form.min_qty": "Min Qty",
    "form.unit_price_tzs": "Unit Price (TZS)",
    "confirm.delete_product": "Delete this product?",
    "alert.product_required": "Product name and SKU are required",
    "alert.product_exists": "A product with that name or SKU already exists.",
    "btn.edit": "Edit",
    "btn.delete": "Del",
    "sales.total_revenue_label": "Total Revenue",
    "sales.total_transactions": "Total Transactions",
    "sales.todays_sales": "Today's Sales",
    "search.placeholder": "Search…",
    "form.payment_method": "Payment Method",
    "form.customer_name": "Customer Name",
    "form.customer_email_optional": "Customer Email (optional)",
    "form.customer_phone_optional": "Customer Phone (optional)",
    "form.select_product": "-- Select Product --",
    "alert.fill_product_qty": "Fill product and quantity",
    "confirm.no_customer_continue": "No customer name, email or phone provided. Continue?",
    "orders.records_title": "Order Records",
    "orders.expected_delivery": "Expected Delivery",
    "orders.ordered_by": "Ordered By",
    "orders.actions": "Actions",
    "deliveries.records_title": "Delivery Records",
    "deliveries.approve_as_is": "Approve as is",
    "deliveries.linked_order_label": "Linked Purchase Order",
    "form.select_order": "-- Select Order --",
    "deliveries.notes_placeholder": "e.g. All items in good condition",
    "reports.title": "Reports & Analytics",
    "reports.subtitle": "Visual insights into business performance",
    "reports.monthly_revenue": "Monthly Revenue",
    "reports.payment_methods": "Payment Methods",
    "reports.inventory_by_category": "Inventory by Category",
    "users.subtitle": "{count} system users",
    "users.system_users_title": "System Users",
    "users.add_user": "Add System User",
    "btn.create_user": "Create User",
    "user.status.active": "Active",
    "user.status.inactive": "Inactive",
    "nav.navigation": "Navigation",
    "login.title": "Supa Kariakoo Spare Parts Centre",
    "login.subtitle": "Inventory Management System",
    "login.email_label": "Email Address",
    "login.password_label": "Password",
    "login.signing_in": "Signing in…",
    "login.sign_in": "Sign In",
    "login.hint_owner": "Owner:",
    "login.hint_manager": "Manager:",
    "login.hint_employee": "Employee:",
    "tooltip.revenue": "Revenue",
    "loading.dashboard": "Loading dashboard…",
    "dashboard.low_stock_title": "⚠️ Low Stock Alerts",
    "dashboard.recent_sales": "🕐 Recent Sales",
    "label.left": "left",
    "label.min": "Minimum:",
    "table.product": "Product",
    "table.customer": "Customer",
    "table.amount": "Amount",
    "form.product_name": "Product Name",
    "form.sku": "SKU",
    "form.category": "Category",
    "form.select_existing": "-- Select existing --",
    "form.other": "Other...",
    "form.supplier": "Supplier",
    "form.location": "Location",
    "form.quantity": "Quantity",
    "form.min_qty": "Min Qty",
    "form.unit_price_tzs": "Unit Price (TZS)",
    "confirm.delete_product": "Delete this product?",
    "alert.product_required": "Product name and SKU are required",
    "alert.product_exists": "A product with that name or SKU already exists.",
    "btn.edit": "Edit",
    "btn.delete": "Del",
    "sales.total_revenue_label": "Total Revenue",
    "sales.total_transactions": "Total Transactions",
    "sales.todays_sales": "Today's Sales",
    "search.placeholder": "Search…",
    "form.payment_method": "Payment Method",
    "form.customer_name": "Customer Name",
    "form.customer_email_optional": "Customer Email (optional)",
    "form.customer_phone_optional": "Customer Phone (optional)",
    "form.select_product": "-- Select Product --",
    "alert.fill_product_qty": "Fill product and quantity",
    "confirm.no_customer_continue": "No customer name, email or phone provided. Continue?",
    "orders.records_title": "Order Records",
    "orders.expected_delivery": "Expected Delivery",
    "orders.ordered_by": "Ordered By",
    "orders.actions": "Actions",
    "deliveries.records_title": "Delivery Records",
    "deliveries.approve_as_is": "Approve as is",
    "deliveries.linked_order_label": "Linked Purchase Order",
    "form.select_order": "-- Select Order --",
    "deliveries.notes_placeholder": "e.g. All items in good condition",
    "reports.title": "Reports & Analytics",
    "reports.subtitle": "Visual insights into business performance",
    "reports.monthly_revenue": "Monthly Revenue",
    "reports.payment_methods": "Payment Methods",
    "reports.inventory_by_category": "Inventory by Category",
    "users.subtitle": "{count} system users",
    "users.system_users_title": "System Users",
    "users.add_user": "Add System User",
    "btn.create_user": "Create User",
    "user.status.active": "Active",
    "user.status.inactive": "Inactive",
    "nav.navigation": "Navigation",
  },
  sw: {
    "nav.dashboard": "Dashibodi",
    "nav.inventory": "Orodha ya Stoku",
    "nav.sales": "Mauzo",
    "nav.orders": "Oda za Ununuzi",
    "nav.deliveries": "Upokeaji wa Bidhaa",
    "nav.reports": "Ripoti",
    "nav.users": "Watumiaji",
    "page.dashboard": "Dashibodi",
    "page.inventory": "Usimamizi wa Stoku",
    "page.sales": "Usimamizi wa Mauzo",
    "page.orders": "Oda za Ununuzi",
    "page.deliveries": "Upokeaji wa Bidhaa",
    "page.reports": "Ripoti na Uchambuzi",
    "page.users": "Usimamizi wa Watumiaji",
    "btn.add_product": "＋ Ongeza Bidhaa",
    "btn.new_sale": "＋ Mauzo Mapya",
    "btn.new_order": "＋ Oda Mpya",
    "btn.record_delivery": "＋ Rekodi Upokeaji wa Bidhaa",
    "btn.edit_product": "Hariri Bidhaa",
    "btn.add_user": "＋ Ongeza Mtumiaji",
    "sign_out": "Toka",
    "theme.light": "☀️ Mwanga",
    "theme.dark": "🌙 Giza",
    "dashboard.welcome": "Karibu tena! Haya ni yanayotokea kwenye duka.",
    "stat.total_revenue": "Jumla ya Mapato",
    "stat.total_sales": "Jumla ya Mauzo",
    "stat.inventory_value": "Thamani ya Stoku",
    "stat.low_stock_alerts": "Onyo: Stoku Kidogo",
    "stat.all_time_sales": "Mauzo yote",
    "stat.transactions_recorded": "Miamala iliyorekodiwa",
    "stat.inventory_products": "{count} aina za bidhaa",
    "charts.monthly_revenue": "Mwelekeo wa Mapato ya Mwezi",
    "charts.stock_by_category": "Hali ya Stoku kwa Aina",
    "inventory.product_stock": "Stoku za Bidhaa",
    "inventory.search_placeholder": "Tafuta bidhaa…",
    "inventory.table.product": "Bidhaa",
    "inventory.table.sku": "SKU",
    "inventory.table.category": "Aina",
    "inventory.table.qty": "Idadi",
    "inventory.table.unit_price": "Bei kwa Kifungu",
    "inventory.table.supplier": "Mzabuni",
    "inventory.table.location": "Mahali",
    "inventory.table.status": "Hali",
    "inventory.table.actions": "Vitendo",
    "inventory.status.low": "Tahadhari: Stoku Kidogo",
    "inventory.status.in_stock": "Stoku Ipo",
    "btn.cancel": "Ghairi",
    "btn.save": "Hifadhi",
    "sales.record_sale": "Rekodi Mauzo Mapya",
    "sales.transaction_history": "Rekodi za Miamala",
    "orders.create_order": "Tengeneza Oda za Ununuzi",
    "deliveries.record_incoming": "Rekodi Upokeaji wa Mzigo Unaokuja",
    "deliveries.no_records": "Hakuna Upokeaji wa Mzigo ulioandikwa bado",
    "table.notes": "Maelezo",
    "form.sku": "SKU",
    "form.category": "Aina",
    "form.enter_sku": "Ingiza SKU",
    "form.enter_category": "Ingiza aina",
    "form.enter_product_name": "Ingiza jina la bidhaa",
    "form.full_name": "Jina Kamili",
    "form.email": "Barua pepe",
    "form.password": "Nywila",
    "form.role": "Cheo",
    "btn.create_user": "Tengeneza Mtumiaji",
    "nav.navigation": "Urambazaji",
    "tooltip.revenue": "Mapato",
    "loading.dashboard": "Inapakia dashibodi…",
    "dashboard.low_stock_title": "⚠️ Onyo: Stoku Kidogo",
    "dashboard.recent_sales": "🕐 Mauzo ya Hivi Karibuni",
    "label.left": "baki",
    "label.min": "Kiwango cha Chini:",
    "table.date": "Tarehe",
    "table.product": "Bidhaa",
    "table.supplier": "Mzabuni",
    "table.customer": "Mteja",
    "table.qty": "Kiasi",
    "table.unit_price": "Bei",
    "table.total": "Jumla",
    "table.name": "Jina",
    "table.email": "Barua pepe",
    "table.role": "Cheo",
    "table.payment": "Malipo",
    "table.employee": "Mfanyakazi",
    "table.status": "Hali",
    "table.amount": "Kiasi",
    "form.product_name": "Jina la Bidhaa",
    "form.sku": "SKU",
    "form.category": "Aina",
    "form.select_existing": "-- Chagua iliyopo --",
    "form.other": "Nyingine...",
    "form.enter_product_name": "Ingiza jina la bidhaa",
    "form.enter_sku": "Ingiza SKU",
    "form.enter_category": "Ingiza aina",
    "form.supplier": "Mzabuni",
    "form.location": "Mahali",
    "form.quantity": "Kiasi",
    "form.min_qty": "Kiasi cha Chini",
    "form.unit_price_tzs": "Bei kwa Kifungu (TZS)",
    "confirm.delete_product": "Futa bidhaa hii?",
    "alert.product_required": "Jina la bidhaa na SKU vinahitajika",
    "alert.product_exists": "Bidhaa yenye jina au SKU hiyo tayari ipo.",
    "btn.edit": "Hariri",
    "btn.delete": "Futa",
    "sales.total_revenue_label": "Jumla ya Mapato",
    "sales.total_transactions": "Jumla ya Miamala",
    "sales.todays_sales": "Mauzo ya Leo",
    "search.placeholder": "Tafuta…",
    "form.payment_method": "Njia ya Malipo",
    "form.customer_name": "Jina la Mteja",
    "form.customer_email_optional": "Barua pepe ya Mteja (hiari)",
    "form.customer_phone_optional": "Simu ya Mteja (hiari)",
    "form.select_product": "-- Chagua Bidhaa --",
    "alert.fill_product_qty": "Jaza bidhaa na kiasi",
    "confirm.no_customer_continue": "Hakuna jina la mteja, barua au simu. Endelea?",
    "orders.records_title": "Rekodi za Oda",
    "orders.expected_delivery": "Kuwekwa Kutegemewa",
    "orders.ordered_by": "Imeagizwa Na",
    "orders.actions": "Vitendo",
    "deliveries.records_title": "Rekodi za Upokeaji",
    "deliveries.approve_as_is": "Kubali kama ilivyo",
    "deliveries.linked_order_label": "Oda ya Ununuzi Iliyohusishwa",
    "form.select_order": "-- Chagua Oda --",
    "deliveries.notes_placeholder": "mf: Bidhaa zote ziko katika hali nzuri",
    "reports.title": "Ripoti & Uchambuzi",
    "reports.subtitle": "Vionyesho vya picha kuhusu utendaji wa biashara",
    "reports.monthly_revenue": "Mapato ya Kila Mwezi",
    "reports.payment_methods": "Njia za Malipo",
    "reports.inventory_by_category": "Stoku kwa Aina",
    "users.subtitle": "Watumiaji wa mfumo wako {count} ",
    "users.system_users_title": "Watumiaji wa Mfumo",
    "users.add_user": "Ongeza Mtumiaji wa Mfumo",
    "btn.create_user": "Tengeneza Mtumiaji",
    "user.status.active": "Hai",
    "user.status.inactive": "Haiko Hai",
    "nav.navigation": "Urambazaji",
    "login.title": "Kituo cha Uuzaji wa Spea Supa Kariakoo",
    "login.subtitle": "Mfumo wa Usimamizi wa Stoku na Mauzo",
    "login.email_label": "Barua pepe",
    "login.password_label": "Nywila",
    "login.signing_in": "Inakubali kuingia…",
    "login.sign_in": "Ingia",
    "login.hint_owner": "Mmiliki:",
    "login.hint_manager": "Meneja:",
    "login.hint_employee": "Mfanyakazi:",
  }
};

const t = (locale, key) => (TRANSLATIONS[locale] && TRANSLATIONS[locale][key]) || TRANSLATIONS.en[key] || key;

function statusBadge(s) {
  const map = {
    completed: "badge-success", received: "badge-success",
    pending: "badge-warning", in_transit: "badge-info",
    delivered: "badge-success", cancelled: "badge-danger",
  };
  return <span className={`badge ${map[s] || "badge-gold"}`}>{s?.replace("_"," ")}</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Sidebar (right panel) ─────────────────────────────────────────────────
function Sidebar({ title, onClose, children, footer, width = 480 }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{position:"fixed",right:0,top:0,height:"100%",width,background:"#fff",boxShadow:"-10px 0 30px rgba(2,6,23,0.15)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:16,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #eee"}}>
          <div style={{fontWeight:700}}>{title}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:16,overflowY:"auto",flex:1}}>{children}</div>
        {footer && <div style={{padding:12,borderTop:"1px solid #eee"}}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, locale }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("password", form.password);
      const res = await fetch(`${API}/auth/token`, { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      const msg = err.message || "Login failed";
      setError(msg);
      try { window._app_show_toast && window._app_show_toast(msg, 'danger'); } catch {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{fontSize:36,marginBottom:8}}>🔧</div>
          <h1>{t(locale,'login.title') || 'Supa Kariakoo Spare Parts Centre'}</h1>
          <p>{t(locale,'login.subtitle')}</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">{t(locale,'login.email_label')}</label>
            <input className="form-control" type="email" value={form.username}
              onChange={e => setForm({...form, username:e.target.value})}
              placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t(locale,'login.password_label')}</label>
            <input className="form-control" type="password" value={form.password}
              onChange={e => setForm({...form, password:e.target.value})}
              placeholder="••••••••" required />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? t(locale,'login.signing_in') : t(locale,'login.sign_in')}
          </button>
        </form>
        <div className="login-hint">
          <div><strong>{t(locale,'login.hint_owner')}</strong> owner@ndorome.com / owner123</div>
          <div><strong>{t(locale,'login.hint_manager')}</strong> manager@ndorome.com / manager123</div>
          <div><strong>{t(locale,'login.hint_employee')}</strong> employee@ndorome.com / emp123</div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ locale }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { apiFetch("/dashboard/stats").then(setStats); }, []);

    if (!stats) return <div className="loading"><div className="spinner"/><span>{t(locale,'loading.dashboard')}</span></div>;

  const monthlyData = Object.entries(stats.monthly_sales).map(([m,v]) => ({month:m, revenue:v}));
  const catData = Object.entries(stats.category_stock).map(([name,value]) => ({name,value}));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.dashboard') || 'Dashboard'}</div>
          <div className="page-subtitle">{t(locale,'dashboard.welcome')}</div>
        </div>
        <span className="badge-pill">📅 {new Date().toLocaleDateString("en-KE",{dateStyle:"long"})}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-icon gold">💰</div>
          <div className="stat-label">{t(locale,'stat.total_revenue')}</div>
          <div className="stat-value">{fmt(stats.total_revenue)}</div>
          <div className="stat-sub">{t(locale,'stat.all_time_sales')}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue">🛒</div>
          <div className="stat-label">{t(locale,'stat.total_sales')}</div>
          <div className="stat-value">{stats.total_sales}</div>
          <div className="stat-sub">{t(locale,'stat.transactions_recorded')}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">📦</div>
          <div className="stat-label">{t(locale,'stat.inventory_value')}</div>
          <div className="stat-value">{fmt(stats.inventory_value)}</div>
          <div className="stat-sub">{t(locale,'stat.inventory_products').replace('{count}', stats.total_products)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">⚠️</div>
          <div className="stat-label">{t(locale,'stat.low_stock_alerts')}</div>
          <div className="stat-value">{stats.low_stock_count}</div>
          <div className="stat-sub">Items need reordering</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t(locale,'charts.monthly_revenue')}</span>
            <span className="badge-pill">2024</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8860A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C8860A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                <XAxis dataKey="month" tick={{fill:"#8B949E",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#8B949E",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                <Tooltip formatter={v=>[fmt(v),"Revenue"]} contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
                <Area type="monotone" dataKey="revenue" stroke="#C8860A" strokeWidth={2} fill="url(#revGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{t(locale,'charts.stock_by_category')}</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {catData.map((e,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:11,color:"#8B949E"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t(locale,'dashboard.low_stock_title')}</span>
            <span className="badge badge-danger">{stats.low_stock_count} items</span>
          </div>
          <div className="card-body">
            {stats.low_stock_items.map(p => (
              <div key={p.id} className="alert-row">
                <div className="alert-dot"/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>{p.sku}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,color:"#F85149",fontWeight:700}}>{p.quantity} {t(locale,'label.left')}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>{t(locale,'label.min')} {p.min_quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{t(locale,'dashboard.recent_sales')}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t(locale,'table.product')}</th><th>{t(locale,'table.customer')}</th><th>{t(locale,'table.amount')}</th></tr></thead>
              <tbody>
                {stats.recent_sales.map(s => (
                  <tr key={s.id}>
                    <td><div style={{fontSize:13}}>{s.product_name}</div><div style={{fontSize:11,color:"#8B949E"}}>{s.date}</div></td>
                    <td className="td-muted">{s.customer}</td>
                    <td style={{color:"#3FB950",fontWeight:600}}>{fmt(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function Inventory({ locale }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({name:"",sku:"",category:"",quantity:"",min_quantity:"",unit_price:"",supplier:"",location:"",name_select:"",sku_select:"",category_select:""});
  const canEdit = user.role !== "employee";

  const load = () => apiFetch("/products").then(setProducts);
  useEffect(()=>{ load(); },[]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditing(null); setForm({name:"",sku:"",category:"",quantity:"",min_quantity:"",unit_price:"",supplier:"",location:"",name_select:"",sku_select:"",category_select:""}); setShowSidebar(true); }
  function openEdit(p) { setEditing(p); setForm({...p, name_select:p.name, sku_select:p.sku, category_select:p.category}); setShowSidebar(true); }

  async function save() {
    // Inventory page only allows updating unit_price and quantity
    if (!editing) return;
    const body = {
      unit_price: +form.unit_price,
      quantity: +form.quantity,
    };
    try {
      await apiFetch(`/products/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      setShowSidebar(false);
      load();
    } catch (err) {
      alert(err.message || err);
    }
  }
  async function del(id) {
    if (!confirm(t(locale,'confirm.delete_product'))) return;
    await apiFetch(`/products/${id}`,{method:"DELETE"}); load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.inventory') || 'Inventory'}</div>
          <div className="page-subtitle">{products.length} products · {products.filter(p=>p.quantity<=p.min_quantity).length} low stock</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
            <span className="card-title">{t(locale,'inventory.product_stock')}</span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control" style={{width:220}} placeholder={t(locale,'inventory.search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t(locale,'inventory.table.product')}</th><th>{t(locale,'inventory.table.sku')}</th><th>{t(locale,'inventory.table.category')}</th><th>{t(locale,'inventory.table.qty')}</th><th>{t(locale,'inventory.table.unit_price')}</th><th>{t(locale,'inventory.table.supplier')}</th><th>{t(locale,'inventory.table.location')}</th><th>{t(locale,'inventory.table.status')}</th>{canEdit&&<th>{t(locale,'inventory.table.actions')}</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><div style={{fontWeight:500}}>{p.name}</div></td>
                  <td className="td-muted" style={{fontFamily:"monospace",fontSize:12}}>{p.sku}</td>
                  <td><span className="badge badge-info">{p.category}</span></td>
                  <td style={{fontWeight:700,color: p.quantity<=p.min_quantity?"#F85149":p.quantity<=p.min_quantity*2?"#D29922":"#3FB950"}}>{p.quantity}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(p.unit_price)}</td>
                  <td className="td-muted">{p.supplier}</td>
                  <td className="td-muted">{p.location}</td>
                  <td>{p.quantity<=p.min_quantity ? <span className="badge badge-danger">{t(locale,'inventory.status.low')}</span> : <span className="badge badge-success">{t(locale,'inventory.status.in_stock')}</span>}</td>
                  {canEdit && <td>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)}>{t(locale,'btn.edit')}</button>
                    
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSidebar && (
        <Sidebar title={editing? (t(locale,'btn.edit_product') || "Edit Product") : t(locale,'btn.add_product')} onClose={()=>setShowSidebar(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowSidebar(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={save}>{t(locale,'btn.save')}</button></>}>
          <div className="form-grid">
            <div style={{gridColumn: '1 / -1'}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>{form.name || editing?.name}</div>
              <div style={{fontSize:12,color:'#8B949E',marginBottom:12}}>SKU: {form.sku || editing?.sku}</div>
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.quantity')}</label>
              <input className="form-control" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.unit_price_tzs')}</label>
              {user.role === "manager" || user.role === "owner" ? (
                <input className="form-control" type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})}/>
              ) : (
                <input className="form-control" type="number" value={form.unit_price} readOnly style={{background:'#222',color:'#aaa'}}/>
              )}
            </div>
          </div>
        </Sidebar>
      )}
    </div>
  );
}

// ── Sales ─────────────────────────────────────────────────────────────────────
function Sales({ locale }) {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({product_id:"",quantity:"",customer:"",customer_email:"",customer_phone:"",payment:"Cash"});

  const load = () => Promise.all([apiFetch("/sales"),apiFetch("/products")]).then(([s,p])=>{setSales(s);setProducts(p);});
  useEffect(()=>{ load(); },[]);

  const filtered = sales.filter(s =>
    s.customer?.toLowerCase().includes(search.toLowerCase()) ||
    (s.product?.name || s.product_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const todayISO = new Date().toISOString().slice(0,10);
  const todaySales = sales.filter(s=>{
    try { return (new Date(s.date)).toISOString().slice(0,10) === todayISO; } catch(e) { return false; }
  });

  const selProd = products.find(p=>p.id===form.product_id);
  const calcTotal = selProd ? selProd.unit_price * (+form.quantity||0) : 0;

  async function saveSale() {
    if (!form.product_id || !form.quantity) return alert(t(locale,'alert.fill_product_qty'));
    if (!form.customer && !form.customer_email && !form.customer_phone) {
      // Allow anonymous sale but warn user; change this if you prefer to require at least one
      if (!confirm(t(locale,'confirm.no_customer_continue'))) return;
    }
    const body = {
      product_id: form.product_id, product_name: selProd?.name,
      quantity: +form.quantity, unit_price: selProd?.unit_price,
      total: calcTotal, customer: form.customer || null, payment: form.payment,
      customer_email: form.customer_email || null, customer_phone: form.customer_phone || null,
    };
    await apiFetch("/sales",{method:"POST",body:JSON.stringify(body)});
    setShowModal(false); setForm({product_id:"",quantity:"",customer:"",payment:"Cash",customer_email:"",customer_phone:""}); load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.sales') || 'Sales'}</div>
          <div className="page-subtitle">{sales.length} transactions · {fmt(totalRevenue)} total revenue</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>{t(locale,'btn.new_sale')}</button>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:20}}>
        <div className="stat-card gold"><div className="stat-icon gold">💰</div><div className="stat-label">{t(locale,'sales.total_revenue_label')}</div><div className="stat-value">{fmt(totalRevenue)}</div></div>
        <div className="stat-card blue"><div className="stat-icon blue">📋</div><div className="stat-label">{t(locale,'sales.total_transactions')}</div><div className="stat-value">{sales.length}</div></div>
        <div className="stat-card green"><div className="stat-icon green">📅</div><div className="stat-label">{t(locale,'sales.todays_sales')}</div><div className="stat-value">{todaySales.length}</div></div>
      </div>

      <div className="card">
          <div className="card-header">
            <span className="card-title">{t(locale,'sales.transaction_history')}</span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control" style={{width:220}} placeholder={t(locale,'search.placeholder')} value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t(locale,'table.date')}</th><th>{t(locale,'table.product')}</th><th>{t(locale,'table.customer')}</th><th>{t(locale,'table.qty')}</th><th>{t(locale,'table.unit_price')}</th><th>{t(locale,'table.total')}</th><th>{t(locale,'table.payment')}</th><th>{t(locale,'table.employee')}</th><th>{t(locale,'table.status')}</th></tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td className="td-muted" style={{fontSize:12}}>{humanDate(s.date)}</td>
                  <td style={{fontWeight:500}}>{s.product?.name || s.product_name || (products.find(p=>p.id===s.product_id)?.name) || "—"}</td>
                  <td className="td-muted">{s.customer}</td>
                  <td style={{textAlign:"center"}}>{s.quantity}</td>
                  <td>{fmt(s.unit_price)}</td>
                  <td style={{color:"#3FB950",fontWeight:700}}>{fmt(s.total)}</td>
                  <td><span className="badge badge-purple">{s.payment}</span></td>
                  <td className="td-muted" style={{fontSize:12}}>{s.employee?.name || s.employee_name || s.employee_id || "—"}</td>
                  <td>{statusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={t(locale,'sales.record_sale')} onClose={()=>setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveSale}>{t(locale,'btn.save')}</button></>}>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.product_name')}</label>
            <select className="form-control" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">{t(locale,'form.select_product')}</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>)}
            </select>
          </div>
          {selProd && <div style={{padding:"10px 12px",background:"rgba(200,134,10,0.1)",borderRadius:8,marginBottom:16,fontSize:13}}>Unit Price: <strong style={{color:"#C8860A"}}>{fmt(selProd.unit_price)}</strong></div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t(locale,'form.quantity')}</label>
              <input className="form-control" type="number" min="1" max={selProd?.quantity} value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.payment_method')}</label>
              <select className="form-control" value={form.payment} onChange={e=>setForm({...form,payment:e.target.value})}>
                {["Cash","M-Pesa","Bank Transfer","Credit"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.customer_name')}</label>
            <input className="form-control" placeholder="Full name" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t(locale,'form.customer_email_optional')}</label>
              <input className="form-control" type="email" placeholder="email@example.com" value={form.customer_email} onChange={e=>setForm({...form,customer_email:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.customer_phone_optional')}</label>
              <input className="form-control" type="tel" placeholder="+2557XXXXXXX" value={form.customer_phone} onChange={e=>setForm({...form,customer_phone:e.target.value})}/>
            </div>
          </div>
          {calcTotal > 0 && <div style={{padding:"12px 16px",background:"rgba(63,185,80,0.1)",border:"1px solid rgba(63,185,80,0.2)",borderRadius:8,fontSize:14}}>Total: <strong style={{color:"#3FB950",fontSize:18}}>{fmt(calcTotal)}</strong></div>}
        </Modal>
      )}
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function Orders({ locale }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [productEditorShow, setProductEditorShow] = useState(false);
  const [productEditorForm, setProductEditorForm] = useState(null);
  const [productEditorLoading, setProductEditorLoading] = useState(false);
  const [form, setForm] = useState({product_id:"",product_name:"",quantity:"",unit_price:"",supplier:"",expected_delivery:""});
  const canManage = user.role !== "employee";

  const load = () => Promise.all([apiFetch("/orders"),apiFetch("/products")]).then(([o,p])=>{setOrders(o);setProducts(p);});
  useEffect(()=>{ load(); },[]);

  async function saveOrder() {
    const selProd = products.find(p=>p.id===form.product_id);
    const body = { product_id: +form.product_id, product_name: selProd?.name||form.product_name, quantity:+form.quantity, unit_price:+form.unit_price, total:+form.quantity * +form.unit_price, supplier: form.supplier, expected_delivery: form.expected_delivery, notes: form.notes };
    const created = await apiFetch("/orders",{method:"POST",body:JSON.stringify(body)});
    // If user selected a status during creation, update it immediately (server requires OrderUpdate for status)
    if (form.status) {
      try {
        await apiFetch(`/orders/${created.id}`, { method: 'PUT', body: JSON.stringify({ status: form.status }) });
      } catch (err) { /* toast already shown in apiFetch */ }
    }
    setShowModal(false); load();
  }

  function openProductEditorForSelected() {
    const sel = products.find(p => p.id === form.product_id);
    if (!sel) return alert('Select a product first');
    setProductEditorForm({...sel});
    setProductEditorShow(true);
  }

  async function saveProductEditor() {
    if (!productEditorForm) return;
    const body = {
      name: productEditorForm.name,
      sku: productEditorForm.sku,
      category: productEditorForm.category,
      min_quantity: +productEditorForm.min_quantity,
      unit_price: +productEditorForm.unit_price,
      supplier: productEditorForm.supplier,
      location: productEditorForm.location,
    };
    setProductEditorLoading(true);
    try {
      let res;
      if (productEditorForm.id) {
        res = await apiFetch(`/products/${productEditorForm.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        // when creating new product, set initial stock to 0; min_quantity remains 5
        body.quantity = 0;
        // log payload for debugging when server-side validation fails
        try { console.debug('Creating product payload', body); } catch {}
        res = await apiFetch(`/products`, { method: 'POST', body: JSON.stringify(body) });
      }
      setProductEditorShow(false);
      const [pList, oList] = await Promise.all([apiFetch('/products'), apiFetch('/orders')]);
      setProducts(pList); setOrders(oList);
      // if created new product, set it on the order form
      if (!productEditorForm.id && res && res.id) {
        setForm(f => ({ ...f, product_id: res.id, unit_price: res.unit_price, supplier: res.supplier, product_name: res.name }));
      }
    } catch (err) {
      try { window._app_show_toast && window._app_show_toast(err.message || JSON.stringify(err) || err, 'danger'); } catch {}
    } finally {
      setProductEditorLoading(false);
    }
  }

  async function updateStatus(id, status) {
    await apiFetch(`/orders/${id}`,{method:"PUT",body:JSON.stringify({status})});
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.orders') || 'Purchase Orders'}</div>
          <div className="page-subtitle">{orders.length} orders · {orders.filter(o=>o.status==="pending").length} pending</div>
        </div>
        {canManage && <button className="btn btn-primary" onClick={()=>setShowModal(true)}>{t(locale,'btn.new_order') || '＋ New Order'}</button>}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t(locale,'orders.records_title')}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t(locale,'table.date')}</th><th>{t(locale,'table.product')}</th><th>{t(locale,'table.supplier')}</th><th>{t(locale,'table.qty')}</th><th>Per Unit Price</th><th>{t(locale,'table.total')}</th><th>{t(locale,'orders.expected_delivery')}</th><th>{t(locale,'orders.ordered_by')}</th><th>{t(locale,'table.status')}</th>{canManage&&<th>{t(locale,'orders.actions')}</th>}</tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id}>
                  <td className="td-muted" style={{fontSize:12}}>{humanDate(o.date)}</td>
                  <td style={{fontWeight:500}}>{o.product?.name || o.product_name || (products.find(p=>p.id===o.product_id)?.name) || "—"}</td>
                  <td className="td-muted">{o.supplier}</td>
                  <td style={{textAlign:"center",color:"#3FB950",fontWeight:700}}>{o.quantity}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(o.unit_price)}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(o.total)}</td>
                  <td className="td-muted" style={{fontSize:12}}>{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : "—"}</td>
                  <td className="td-muted" style={{fontSize:12}}>{o.ordered_by_user?.name || o.ordered_by_name || o.ordered_by_id || "—"}</td>
                  <td>{statusBadge(o.status)}</td>
                  {canManage && <td>
                    <select className="form-control" style={{padding:"4px 8px",fontSize:12,width:"auto"}}
                      value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>
                      {["pending","in_transit","delivered","cancelled"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
                    </select>
                  </td>}
                </tr>
              ))}
              {orders.length===0 && <tr><td colSpan={8} style={{textAlign:"center",color:"#8B949E",padding:40}}>{t(locale,'orders.no_records')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={t(locale,'orders.create_order')} onClose={()=>setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveOrder}>{t(locale,'btn.save')}</button></>}>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.product_name')}</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select className="form-control" value={form.product_id} onChange={e=>{
                const val = e.target.value;
                if (val === "__new") {
                  setProductEditorForm({ name: "", sku: "", category: "", min_quantity: 5, unit_price: 0, supplier: "", location: "" });
                  setProductEditorShow(true);
                  setForm(f => ({ ...f, product_id: "" }));
                  return;
                }
                const p = products.find(x => x.id === val);
                setForm({ ...form, product_id: val, supplier: p?.supplier || "", unit_price: p?.unit_price || "" });
              }}>
                <option value="">{t(locale,'form.select_product')}</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="__new">{t(locale,'orders.add_new_product') || '＋ Add new product'}</option>
              </select>
              {form.product_id && <button className="btn btn-secondary btn-sm" onClick={openProductEditorForSelected} style={{whiteSpace:'nowrap'}}>{t(locale,'btn.edit_product') || 'Edit'}</button>}
              {form.product_id && <button className="btn btn-danger btn-sm" onClick={()=>{ setForm({...form,product_id:"",product_name:"",unit_price:"",quantity:"",supplier:"",expected_delivery:"",status:""}); }}>{t(locale,'btn.delete') || 'Delete'}</button>}
            </div>
          </div>
          {/* Show SKU / Category / Location from selected product (read-only) */}
          {form.product_id && (()=>{ const p = products.find(x=>x.id===form.product_id); return (
            <div className="form-grid">
              <div className="form-group"><label className="form-label">{t(locale,'form.sku')}</label><input className="form-control" value={p?.sku||""} readOnly/></div>
              <div className="form-group"><label className="form-label">{t(locale,'form.category')}</label><input className="form-control" value={p?.category||""} readOnly/></div>
              <div className="form-group"><label className="form-label">{t(locale,'form.location')}</label><input className="form-control" value={p?.location||""} readOnly/></div>
            </div>
          ); })()}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t(locale,'form.quantity')}</label><input className="form-control" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.unit_price_tzs')}</label><input className="form-control" type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">{t(locale,'form.supplier')}</label><input className="form-control" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'orders.expected_delivery')}</label><input className="form-control" type="date" value={form.expected_delivery} onChange={e=>setForm({...form,expected_delivery:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'table.status')}</label>
            <select className="form-control" value={form.status||'pending'} onChange={e=>setForm({...form,status:e.target.value})}>
              {['pending','in_transit','delivered','cancelled'].map(s=> <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          {form.quantity&&form.unit_price&&<div style={{padding:"12px 16px",background:"rgba(200,134,10,0.1)",borderRadius:8,fontSize:14}}>Order Total: <strong style={{color:"#C8860A"}}>{fmt(+form.quantity * +form.unit_price)}</strong></div>}
        </Modal>
      )}
      {productEditorShow && (
        <Sidebar title={t(locale,'btn.edit_product') || 'Edit Product'} onClose={()=>setProductEditorShow(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setProductEditorShow(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveProductEditor} disabled={productEditorLoading}>{productEditorLoading ? (t(locale,'btn.saving')||'Saving...') : (t(locale,'btn.save')||'Save')}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t(locale,'form.product_name')}</label><input className="form-control" value={productEditorForm?.name||""} onChange={e=>setProductEditorForm({...productEditorForm,name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.sku')}</label><input className="form-control" value={productEditorForm?.sku||""} onChange={e=>setProductEditorForm({...productEditorForm,sku:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.category')}</label><input className="form-control" value={productEditorForm?.category||""} onChange={e=>setProductEditorForm({...productEditorForm,category:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.min_qty')}</label><input className="form-control" type="number" value={productEditorForm?.min_quantity||0} onChange={e=>setProductEditorForm({...productEditorForm,min_quantity:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.unit_price_tzs')}</label><input className="form-control" type="number" value={productEditorForm?.unit_price||0} onChange={e=>setProductEditorForm({...productEditorForm,unit_price:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.supplier')}</label><input className="form-control" value={productEditorForm?.supplier||""} onChange={e=>setProductEditorForm({...productEditorForm,supplier:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.location')}</label><input className="form-control" value={productEditorForm?.location||""} onChange={e=>setProductEditorForm({...productEditorForm,location:e.target.value})}/></div>
          </div>
        </Sidebar>
      )}
    </div>
  );
}

// ── Deliveries ────────────────────────────────────────────────────────────────
function Deliveries({ locale }) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({order_id:"",product_id:"",product_name:"",quantity:"",supplier:"",notes:""});
  const canManage = user.role !== "employee";

  const load = () => Promise.all([apiFetch("/deliveries"),apiFetch("/orders"),apiFetch("/products"),apiFetch("/auth/users")]).then(([d,o,p,u])=>{setDeliveries(d);setOrders(o);setProducts(p);setUsers(u);});
  useEffect(()=>{ load(); },[]);

  const pendingOrders = orders.filter(o=>["pending","in_transit"].includes(o.status));

  async function saveDelivery() {
    const selOrder = orders.find(o=>o.id===form.order_id);
    const body = {...form, product_id:selOrder?.product_id, product_name:selOrder?.product_name||form.product_name, quantity:+form.quantity, supplier:selOrder?.supplier||form.supplier};
    await apiFetch("/deliveries",{method:"POST",body:JSON.stringify(body)});
    setShowModal(false); load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.deliveries') || 'Deliveries'}</div>
          <div className="page-subtitle">{deliveries.length} deliveries recorded · {pendingOrders.length} orders in transit</div>
        </div>
       
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t(locale,'deliveries.records_title')}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t(locale,'table.date')}</th><th>{t(locale,'table.product')}</th><th>{t(locale,'table.supplier')}</th><th>{t(locale,'table.qty')}</th><th>Order Ref</th><th>{t(locale,'table.employee')}</th><th>{t(locale,'table.notes') || 'Notes'}</th><th>{t(locale,'table.status')}</th></tr></thead>
            <tbody>
              {deliveries.map(d=>(
                <tr key={d.id}>
                      <td className="td-muted" style={{fontSize:12}}>{humanDate(d.date)}</td>
                      <td style={{fontWeight:500}}>{d.product?.name || d.product_name || (products.find(p=>p.id===d.product_id)?.name) || "—"}</td>
                      <td className="td-muted">{d.supplier}</td>
                      <td style={{textAlign:"center",color:"#3FB950",fontWeight:700}}>{d.quantity}</td>
                      <td className="td-muted" style={{fontFamily:"monospace",fontSize:12}}>{d.order_id}</td>
                      <td className="td-muted" style={{fontSize:12}}>{d.received_by_user?.name || d.received_by_name || (users.find(u=>u.id===d.received_by_id)?.name) || "—"}</td>
                  <td className="td-muted" style={{fontSize:12,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.notes}</td>
                    <td style={{display:'flex',gap:8,alignItems:'center'}}>
                      {statusBadge(d.status)}
                      {canManage && d.status !== 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={async()=>{
                          if (!confirm(t(locale,'deliveries.approve_as_is'))) return;
                          try { await apiFetch(`/deliveries/${d.id}/approve`,{method:'PUT'}); load(); } catch(err) { alert(err.message); }
                        }}>{t(locale,'deliveries.approve_as_is')}</button>
                      )}
                    </td>
                </tr>
              ))}
              {deliveries.length===0 && <tr><td colSpan={8} style={{textAlign:"center",color:"#8B949E",padding:40}}>{t(locale,'deliveries.no_records')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={t(locale,'deliveries.record_incoming')} onClose={()=>setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveDelivery}>{t(locale,'btn.save')}</button></>}>
          <div className="form-group">
            <label className="form-label">{t(locale,'deliveries.linked_order_label')}</label>
            <select className="form-control" value={form.order_id} onChange={e=>{
              const o=orders.find(x=>x.id===e.target.value);
              setForm({...form,order_id:e.target.value,product_name:o?.product_name||"",supplier:o?.supplier||"",quantity:o?.quantity||""});
            }}>
              <option value="">{t(locale,'form.select_order')}</option>
              {pendingOrders.map(o=><option key={o.id} value={o.id}>{o.product_name} ({o.supplier})</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Product Name</label><input className="form-control" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Quantity Received</label><input className="form-control" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Supplier</label><input className="form-control" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'table.notes') || 'Notes'} / Condition</label><textarea className="form-control" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder={t(locale,'deliveries.notes_placeholder')}/></div>
        </Modal>
      )}
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function Reports({ locale }) {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  useEffect(()=>{ Promise.all([apiFetch("/dashboard/stats"),apiFetch("/sales")]).then(([s,sl])=>{setStats(s);setSales(sl);}); },[]);

  if (!stats) return <div className="loading"><div className="spinner"/></div>;

  const monthlyData = Object.entries(stats.monthly_sales).map(([m,v])=>({month:m,revenue:v}));
  const catData = Object.entries(stats.category_stock).map(([name,value])=>({name,value}));

  const paymentBreakdown = sales.reduce((acc,s)=>{acc[s.payment]=(acc[s.payment]||0)+s.total;return acc;},{});
  const payData = Object.entries(paymentBreakdown).map(([name,value])=>({name,value}));

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">{t(locale,'reports.title')}</div><div className="page-subtitle">{t(locale,'reports.subtitle')}</div></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card gold"><div className="stat-icon gold">💰</div><div className="stat-label">Total Revenue</div><div className="stat-value">{fmt(stats.total_revenue)}</div></div>
        <div className="stat-card blue"><div className="stat-icon blue">📦</div><div className="stat-label">Inventory Value</div><div className="stat-value">{fmt(stats.inventory_value)}</div></div>
        <div className="stat-card green"><div className="stat-icon green">🛒</div><div className="stat-label">Total Sales</div><div className="stat-value">{stats.total_sales}</div></div>
        <div className="stat-card red"><div className="stat-icon red">⚠️</div><div className="stat-label">Low Stock</div><div className="stat-value">{stats.low_stock_count}</div></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div className="card">
          <div className="card-header"><span className="card-title">{t(locale,'reports.monthly_revenue')}</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                <XAxis dataKey="month" tick={{fill:"#8B949E",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#8B949E",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                <Tooltip formatter={v=>[fmt(v)]} contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
                <Bar dataKey="revenue" fill="#C8860A" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">{t(locale,'reports.payment_methods')}</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={payData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:"#8B949E"}}>
                  {payData.map((e,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>[fmt(v)]} contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t(locale,'reports.inventory_by_category')}</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
              <XAxis type="number" tick={{fill:"#8B949E",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fill:"#8B949E",fontSize:12}} axisLine={false} tickLine={false} width={100}/>
              <Tooltip contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
              <Bar dataKey="value" fill="#58A6FF" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Users Management ──────────────────────────────────────────────────────────
function Users({ locale }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({name:"",email:"",password:"",role:"employee"});

  const load = () => apiFetch("/auth/users").then(setUsers);
  useEffect(()=>{ load(); },[]);

  async function saveUser() {
    await apiFetch("/auth/users",{method:"POST",body:JSON.stringify(form)});
    setShowModal(false); setForm({name:"",email:"",password:"",role:"employee"}); load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">{t(locale,'page.users')}</div><div className="page-subtitle">{t(locale,'users.subtitle').replace('{count}', users.length)}</div></div>
        {user.role==="owner" && <button className="btn btn-primary" onClick={()=>setShowModal(true)}>{t(locale,'btn.add_user')}</button>}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t(locale,'users.system_users_title')}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t(locale,'table.name')}</th><th>{t(locale,'table.email')}</th><th>{t(locale,'table.role')}</th><th>{t(locale,'table.status')}</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="user-avatar">{initials(u.name)}</div>
                      <div style={{fontWeight:500}}>{u.name}</div>
                    </div>
                  </td>
                  <td className="td-muted">{u.email}</td>
                  <td><span className={`badge role-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.active?"badge-success":"badge-danger"}`}>{u.active? t(locale,'user.status.active') : t(locale,'user.status.inactive')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={t(locale,'users.add_user')} onClose={()=>setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveUser}>{t(locale,'btn.create_user')}</button></>}>
          <div className="form-group"><label className="form-label">{t(locale,'form.full_name')}</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'form.email')}</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'form.password')}</label><input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.role')}</label>
            <select className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              {user.role==="owner" && <option value="owner">Owner</option>}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", labelKey:"nav.dashboard", icon:"📊" },
  { id:"inventory", labelKey:"nav.inventory", icon:"📦" },
  { id:"sales",     labelKey:"nav.sales",     icon:"🛒" },
  { id:"orders",    labelKey:"nav.orders",    icon:"📋" },
  { id:"deliveries",labelKey:"nav.deliveries",icon:"🚚" },
  { id:"reports",   labelKey:"nav.reports",   icon:"📈" },
  { id:"users",     labelKey:"nav.users",     icon:"👥", roles:["owner","manager"] },
];

const PAGE_TITLES = {dashboard:"page.dashboard",inventory:"page.inventory",sales:"page.sales",orders:"page.orders",deliveries:"page.deliveries",reports:"page.reports",users:"page.users"};

function AppShell({ user, onLogout, locale, setLocale }) {
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navItems = NAV.filter(n => !n.roles || n.roles.includes(user.role));

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <Dashboard locale={locale}/>;
      case "inventory": return <Inventory locale={locale}/>;
      case "sales":     return <Sales locale={locale}/>;
      case "orders":    return <Orders locale={locale}/>;
      case "deliveries":return <Deliveries locale={locale}/>;
      case "reports":   return <Reports locale={locale}/>;
      case "users":     return <Users locale={locale}/>;
      default:          return <Dashboard/>;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🔧 Supa Kariakoo</h1>
          <span>Spare Parts IMS</span>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{initials(user.name)}</div>
          <div className="user-info">
            <p>{user.name}</p>
            <span>{user.role}</span>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">{t(locale,'nav.navigation')}</div>
          {navItems.map(n => (
            <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
              <span className="icon">{n.icon}</span>
              {t(locale, n.labelKey)}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <span>🚪</span> {t(locale,'sign_out')}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h2>{t(locale, `page.${page}`)}</h2>
          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              try { localStorage.setItem("theme", next); } catch {};
              if (next === "light") document.documentElement.classList.add("theme-light"); else document.documentElement.classList.remove("theme-light");
            }}>{theme === "dark" ? t(locale,'theme.light') : t(locale,'theme.dark')}</button>
            <select value={locale} onChange={e=>{ setLocale(e.target.value); try{ localStorage.setItem('locale', e.target.value);}catch{} }} style={{marginLeft:8}}>
              <option value="en">EN</option>
              <option value="sw">SW</option>
            </select>
            <span className={`badge role-${user.role}`} style={{padding:"4px 12px",fontSize:12}}>{user.role}</span>
            <div className="user-avatar" style={{width:32,height:32,fontSize:12}}>{initials(user.name)}</div>
          </div>
        </div>
        <AuthContext.Provider value={{ user }}>
          {renderPage()}
        </AuthContext.Provider>
      </main>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const [locale, setLocale] = useState(() => { try { return localStorage.getItem('locale') || 'en'; } catch { return 'en'; } });

  // Toasts for error/notification surfacing
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'info', ttl = 5000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const t = { id, message, type };
    setToasts(s => [t, ...s]);
    if (ttl > 0) setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), ttl);
    return id;
  };
  const removeToast = (id) => setToasts(s => s.filter(x => x.id !== id));

  useEffect(() => {
    // expose a global helper so top-level helpers can show toasts
    window._app_show_toast = (msg, type = 'info') => { try { addToast(msg, type); } catch {} };
    return () => { try { delete window._app_show_toast; } catch {} };
  }, []);

  // Theme state persisted across sessions
  useEffect(() => {
    const t = localStorage.getItem("theme") || "dark";
    if (t === "light") document.documentElement.classList.add("theme-light");
    else document.documentElement.classList.remove("theme-light");
  }, []);

  function handleLogin(u) { setUser(u); }
  function handleLogout() { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); }

  return (
    <>
      <style>{css + themeCss}</style>
      <div className="toasts-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="msg">{t.message}</div>
            <button className="close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
      {user ? <AppShell user={user} onLogout={handleLogout} locale={locale} setLocale={setLocale}/> : <LoginPage onLogin={handleLogin} locale={locale}/>} 
    </>
  );
}
