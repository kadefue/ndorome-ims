import { useState, useEffect, createContext, useContext, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
// API base URL read from Vite env variable `VITE_API_URL` with fallback
const API = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:8000";

function useAuth() { return useContext(AuthContext); }

// ── API Helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.detail || err.message || ('Request failed (' + res.status + ')');
    try { window._app_show_toast && window._app_show_toast(msg, 'danger'); } catch {}
    throw new Error(msg);
  }
  return res.json();
}

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

  html, body, #root {
    width: 100%;
    min-height: 100vh;
  }
  
  body {
    font-family: 'DM Sans', sans-serif;
    background: #0D1117;
    color: #E6EDF3;
    display: block;
    min-height: 100vh;
  }

  #root {
    max-width: none;
    margin: 0;
    padding: 0;
    text-align: initial;
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
    color: #E6EDF3;
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
  .dashboard-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

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
    position: relative;
    overflow: hidden;
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
    box-shadow: 0 12px 40px rgba(2,6,23,0.6);
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
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #0D1117;
    background-image: radial-gradient(ellipse at 20% 50%, rgba(200,134,10,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(88,166,255,0.05) 0%, transparent 50%);
  }
  .login-card {
    background: #161B22; border: 1px solid #21262D;
    border-radius: 20px; padding: 40px; width: 100%; max-width: 420px;
    margin: auto;
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

  /* ── Toasts (left stack) ── */
  .toasts-container {
    position: fixed;
    left: 16px;
    top: 80px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 260px;
    max-width: 420px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(20,24,30,0.6);
    border: 1px solid rgba(255,255,255,0.04);
    color: #E6EDF3;
    box-shadow: 0 8px 24px rgba(2,6,23,0.5);
    animation: toastIn 220ms cubic-bezier(.2,.9,.2,1);
  }
  @keyframes toastIn { from { transform: translateX(-8px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
  .toast .toast-icon { width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:14px; flex-shrink:0; }
  .toast .msg { flex: 1; font-size: 13px; }
  .toast .close { background: none; border: none; color: #8B949E; cursor: pointer; font-size: 13px; padding: 6px; border-radius: 6px; }
  .toast .close:hover { color: #E6EDF3; background: rgba(255,255,255,0.02); }

  /* Outlined severity */
  .toast.info { border-left: 4px solid #58A6FF; }
  .toast.success { border-left: 4px solid #3FB950; }
  .toast.warning { border-left: 4px solid #D29922; }
  .toast.danger { border-left: 4px solid #F85149; }
  .toast.info .toast-icon { background: rgba(88,166,255,0.12); }
  .toast.success .toast-icon { background: rgba(63,185,80,0.08); }
  .toast.warning .toast-icon { background: rgba(210,153,34,0.08); }
  .toast.danger .toast-icon { background: rgba(248,81,73,0.08); }

  /* Ripple effect */
  .ripple {
    position: absolute; border-radius: 50%; transform: scale(0);
    pointer-events: none; background: rgba(255,255,255,0.12);
    animation: ripple 650ms ease-out;
  }
  @keyframes ripple { to { transform: scale(4); opacity: 0; } }

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

  /* ── Responsive ── */
  @media (max-width: 1180px) {
    .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .charts-grid { grid-template-columns: 1fr; }
    .dashboard-bottom-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 920px) {
    .app { flex-direction: column; min-height: 100dvh; }
    .sidebar {
      position: static;
      width: 100%;
      min-width: 0;
      border-right: 0;
      border-bottom: 1px solid #21262D;
      max-height: none;
    }
    .nav-section { padding: 12px; }
    .main { margin-left: 0; }
    .topbar { padding: 10px 14px; height: auto; flex-wrap: wrap; gap: 10px; }
    .topbar h2 { font-size: 16px; }
    .topbar-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 8px; }
    .page { padding: 16px; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .card-header { padding: 12px 14px; }
    .card-body { padding: 14px; }
    .form-grid { grid-template-columns: 1fr; }
    .modal { max-width: 100%; }
    .modal-body { padding: 16px; }
    .modal-header, .modal-footer { padding: 12px 16px; }
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .sidebar-logo { padding: 14px 14px 12px; }
    .sidebar-logo h1 { font-size: 16px; }
    .sidebar-user { padding: 10px 14px; }
    .nav-item { padding: 9px 10px; font-size: 13px; }
    .page { padding: 12px; }
    .page-title { font-size: 18px; }
    table { font-size: 12px; }
    th, td { white-space: nowrap; }
    .btn { padding: 8px 12px; }
  }
`;

const themeCss = `
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

  // ── Translations ───────────────────────────────────────────────────────────
  const TRANSLATIONS = {
    en: {
      "title.dashboard": "Spare Parts IMS",
      "nav.dashboard": "Dashboard",
      "nav.inventory": "Inventory",
      "nav.sales": "Sales",
      "nav.orders": "Orders",
      "nav.deliveries": "Deliveries",
      "nav.categories": "Motorcycle Categories/Types",
      "nav.models": "Motorcycle Models/Brands",
      "nav.products": "Motorcycle Products/Parts",
      "nav.reports": "Reports",
      "nav.users": "Users",
      "nav.navigation": "Navigation",
      "page.dashboard": "Dashboard",
      "page.inventory": "Inventory Management",
      "page.sales": "Sales Management",
      "page.orders": "Purchase Orders",
      "page.deliveries": "Deliveries",
      "page.categories": "Motorcycle Categories/Types",
      "page.models": "Motorcycle Models/Brands",
      "page.products": "Motorcycle Products/Parts",
      "page.reports": "Reports & Analytics",
      "page.users": "User Management",
      "btn.add_product": "＋ Add Product/Part",
      "btn.new_sale": "＋ New Sale",
      "btn.new_order": "＋ New Order",
      "btn.record_delivery": "＋ Record Delivery",
      "btn.edit_product": "Edit Product",
      "btn.edit_order": "Edit Order",
      "btn.add_user": "＋ Add User",
      "btn.approve": "Approve",
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
      "deliveries.approve": "Approve Delivery",
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
      "table.page_size": "Page Size",
      "form.product_name": "Product Name",
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
      "btn.edit_user": "Edit User",
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
      "user.status.active": "Active",
      "user.status.inactive": "Inactive",
      "login.title": "Supa Kariakoo Spare Parts Centre",
      "login.subtitle": "Inventory Management System",
      "login.email_label": "Email Address",
      "login.password_label": "Password",
      "login.signing_in": "Signing in…",
      "login.sign_in": "Sign In",
      "login.hint_owner": "Owner:",
      "login.hint_manager": "Manager:",
      "login.hint_employee": "Employee:",
      "inventory.sold_below": "⚠️ This product has been sold below {threshold} per unit. Current: {current_price}.",
      "status.completed": "Completed",
      "status.cancelled": "Cancelled",
      "status.in_transit": "In transit",
      "status.approved": "Approved",
      "status.pending": "Pending",
      "status.delivered": "Delivered",
      "deliveries.recorded": "Deliveries recorded",
      "orders.in_transit": "Orders in transit",
      "role.owner": "Owner",
      "role.manager": "Manager",
      "role.employee": "Employee",
      "btn.change_password": "Change password",
    },
    sw: {
      "title.dashboard": "Mfumo wa Kuuza na Kusambaza Spea",
      "nav.dashboard": "Dashibodi",
      "nav.inventory": "Orodha ya Stoku",
      "nav.sales": "Mauzo",
      "nav.orders": "Oda za Ununuzi",
      "nav.deliveries": "Upokeaji wa Bidhaa",
      "nav.reports": "Ripoti",
      "nav.users": "Watumiaji",
      "nav.navigation": "Urambazaji",
      "nav.categories": "Aina za vifaa",
      "nav.models": "Modeli ya Pikipiki",
      "nav.products": "Spea za Pikipiki",
      "page.dashboard": "Dashibodi",
      "page.inventory": "Usimamizi wa Stoku",
      "page.sales": "Usimamizi wa Mauzo",
      "page.orders": "Oda za Ununuzi",
       "page.categories": "Aina za vifaa",
      "page.models": "Modeli ya Pikipiki",
      "page.products": "Spea za Pikipiki",
      "page.deliveries": "Upokeaji wa Bidhaa",
      "page.reports": "Ripoti na Uchambuzi",
      "page.users": "Usimamizi wa Watumiaji",
      "btn.add_product": "＋ Ongeza Bidhaa",
      "btn.new_sale": "＋ Mauzo Mapya",
      "btn.new_order": "＋ Oda Mpya",
      "btn.record_delivery": "＋ Rekodi Upokeaji wa Bidhaa",
      "btn.edit_product": "Hariri Bidhaa",
      "btn.edit_order": "Hariri Oda",
      "btn.add_user": "＋ Ongeza Mtumiaji",
      "btn.edit_user": "Hariri Mtumiaji",
      "btn.approve": "Kubali",
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
      "deliveries.approve": "Kubali Upokeaji",
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
      "table.page_size": "Ukubwa wa Ukurasa",
      "form.product_name": "Jina la Bidhaa",
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
      "users.edit_user": "Hariri Mtumiaji",
      "user.status.active": "Hai",
      "user.status.inactive": "Haiko Hai",
      "login.title": "Kituo cha Uuzaji wa Spea Supa Kariakoo",
      "login.subtitle": "Mfumo wa Usimamizi wa Stoku na Mauzo",
      "login.email_label": "Barua pepe",
      "login.password_label": "Nywila",
      "login.signing_in": "Inakubali kuingia…",
      "login.sign_in": "Ingia",
      "login.hint_owner": "Mmiliki:",
      "login.hint_manager": "Meneja:",
      "login.hint_employee": "Mfanyakazi:",
      "inventory.sold_below": "Bidhaa hii imeuzwa chini ya {threshold} kwa kifungu. Thamani ya sasa: {current_price}.",
      "status.completed": "Imekamilika",
      "status.cancelled": "Imekatishwa",
      "status.in_transit": "Njiani",
      "status.approved": "Imeidhinishwa",
      "status.pending": "Inasubiri",
      "status.delivered": "Imepokelewa",
      "deliveries.recorded": "Upokeaji uliorekodiwa",
      "orders.in_transit": "Oda njiani",
      "role.owner": "Mmiliki",
      "role.manager": "Meneja",
      "role.employee": "Mfanyakazi",
      "btn.change_password": "Badili nywila",
    }
};

const t = (locale, key) => (TRANSLATIONS[locale] && TRANSLATIONS[locale][key]) || TRANSLATIONS.en[key] || key;

const fmt = (n) => 'TZS ' + Number(n || 0).toLocaleString();

// Simple template replacer for translation strings with {placeholders}
const formatMessage = (template, vars = {}) => {
  if (!template) return '';
  return Object.keys(vars).reduce((s, k) => s.split('{' + k + '}').join(vars[k]), template);
};

const humanDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function statusBadge(s, locale = 'en') {
  const map = {
    completed: "badge-success", received: "badge-success",
    pending: "badge-warning", in_transit: "badge-info",
    delivered: "badge-success", cancelled: "badge-danger",
  };
  const label = (typeof s === 'string') ? (t(locale, 'status.' + s) || s.replace('_',' ')) : '';
  return (
    <span className={'badge ' + (map[s] || 'badge-gold')}>{label}</span>
  );
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
      const res = await fetch(API + "/auth/token", { method: "POST", body: fd });
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
                <YAxis tick={{fill:"#8B949E",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v => (v/1000) + 'k'}/>
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
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="46%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                  {catData.map((e,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#1C2333",border:"1px solid #30363D",borderRadius:8,fontSize:12}}/>
                <Legend verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{fontSize:11,color:"#8B949E"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
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
                  <div style={{fontSize:13,fontWeight:500}}>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))}</div>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageOptions = [10,20,50,100];
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({name:"",sku:"",category:"",quantity:"",min_quantity:"",unit_price:"",supplier:"",location:"",name_select:"",sku_select:"",category_select:""});
  const canEdit = user.role !== "employee";

  const load = async () => {
    try {
      const [pList, sList, oList] = await Promise.all([apiFetch('/products'), apiFetch('/sales').catch(()=>[]), apiFetch('/orders').catch(()=>[])]);
      // mark products that have been sold below current unit_price and whether referenced by sales/orders
      const withFlag = pList.map(p => {
          const salePrices = (sList || []).filter(s => ((s.product_id || s.product?.id) === p.id) && typeof s.unit_price === 'number').map(s => s.unit_price);
          const minSalePrice = salePrices.length ? Math.min(...salePrices) : null;
          const soldBelow = (minSalePrice !== null) && (minSalePrice < p.unit_price);
          const hasSales = (sList || []).some(s => (s.product_id === p.id) || (s.product && s.product.id === p.id));
        const hasOrders = (oList || []).some(o => (o.product_id === p.id) || (o.product && o.product.id === p.id));
        return { ...p, soldBelow, soldBelowValue: minSalePrice, hasReferences: !!(hasSales || hasOrders) };
      });
      setProducts(withFlag);
    } catch (err) {
      setProducts([]);
    }
  };
  useEffect(()=>{ load(); },[]);
  
  // For inventory we want to indicate products that have been sold below current product price
  // load will be replaced in Inventory component to fetch sales too

  // Search
  const filtered = products.filter(p =>
    (p.display_name || p.name).toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier||"").toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = useMemo(()=>{
    if (!sortField) return filtered;
    const rows = [...filtered];
    rows.sort((a,b)=>{
      const va = (a[sortField] ?? "").toString();
      const vb = (b[sortField] ?? "").toString();
      // date
      if (!isNaN(Date.parse(va)) && !isNaN(Date.parse(vb))) return (new Date(va) - new Date(vb)) * (sortDir==='asc'?1:-1);
      // number
      if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) return (parseFloat(va) - parseFloat(vb)) * (sortDir==='asc'?1:-1);
      return va.localeCompare(vb) * (sortDir==='asc'?1:-1);
    });
    return rows;
  }, [filtered, sortField, sortDir]);

  // Pagination
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paged = sorted.slice((page-1)*pageSize, page*pageSize);

  function toggleSort(field) { if (sortField===field) setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } }

  function openAdd() { try { window._app_show_toast && window._app_show_toast('Opening product editor', 'info'); } catch {} setEditing(null); setForm({name:"",sku:"",category:"",quantity:"",min_quantity:"",unit_price:"",supplier:"",location:"",name_select:"",sku_select:"",category_select:""}); setShowSidebar(true); }
  function openEdit(p) { try { window._app_show_toast && window._app_show_toast('Opening product editor', 'info'); } catch {} setEditing(p); setForm({...p, name_select:p.name, sku_select:p.sku, category_select:p.category}); setShowSidebar(true); }

  async function save() {
    // Inventory page only allows updating unit_price and quantity
    try { window._app_show_toast && window._app_show_toast('Saving product...', 'info'); } catch {}

    // If no `editing` product, create a new product
    if (!editing) {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || form.category_select || 'Uncategorized',
        quantity: +(form.quantity || 0),
        min_quantity: +(form.min_quantity || 5),
        unit_price: +form.unit_price,
        supplier: form.supplier || null,
        location: form.location || null,
      };
      try {
        const created = await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
        setShowSidebar(false);
        window._app_show_toast && window._app_show_toast('Product created', 'success');
        load();
      } catch (err) {
        // apiFetch already shows toast on error
      }
      return;
    }

    const body = {
      name: form.name,
      sku: form.sku,
      unit_price: +form.unit_price,
      // Do not allow direct quantity updates from Inventory UI; stock updates only via delivery approval
    };
    try {
      const proposed = +form.unit_price;
      // Check latest order price for this product to provide clearer feedback before sending to server
      try {
        const orders = await apiFetch('/orders');
        const related = (orders || []).filter(o => (o.product_id === editing.id) || (o.product && o.product.id === editing.id));
        if (related.length) {
          related.sort((a,b) => new Date(b.date) - new Date(a.date));
          const last = related[0];
          const lastPrice = Number(last.unit_price || 0);
          const minAllowed = lastPrice * 1.25;
          if (proposed < minAllowed) {
            window._app_show_toast && window._app_show_toast(`Proposed price ${fmt(proposed)} is below required minimum ${fmt(minAllowed)} (last order price was ${fmt(lastPrice)})`, 'warning');
            return;
          }
        }
      } catch (e) {
        // if orders fetch fails, continue and let server validate
      }

      await apiFetch('/products/' + editing.id, { method: "PUT", body: JSON.stringify(body) });
      setShowSidebar(false);
      window._app_show_toast && window._app_show_toast('Product updated', 'success');
      load();
    } catch (err) {
      // If server returns the price rule message, attempt to surface clearer numbers
      const msg = err.message || String(err);
      // backend message includes min_allowed in parentheses sometimes
      const m = String(msg).match(/\((\d+(?:\.\d+)?)\)/);
      if (m) {
        const minAllowed = Number(m[1]);
        const proposed = +form.unit_price;
        // Try to obtain last order price for richer message
        try {
          const orders = await apiFetch('/orders');
          const related = (orders || []).filter(o => (o.product_id === editing.id) || (o.product && o.product.id === editing.id));
          if (related.length) {
            related.sort((a,b) => new Date(b.date) - new Date(a.date));
            const last = related[0];
            const lastPrice = Number(last.unit_price || 0);
            window._app_show_toast && window._app_show_toast(`New price ${fmt(proposed)} is below required minimum ${fmt(minAllowed)} (based on last order price ${fmt(lastPrice)})`, 'danger');
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      window._app_show_toast && window._app_show_toast(msg, 'danger');
    }
  }
  async function del(id) {
    try {
      // check for existing sales or orders referencing this product
      const [salesList, ordersList] = await Promise.all([apiFetch('/sales').catch(()=>[]), apiFetch('/orders').catch(()=>[])]);
      const hasSales = (salesList || []).some(s => (s.product_id === id) || (s.product && s.product.id === id));
      const hasOrders = (ordersList || []).some(o => (o.product_id === id) || (o.product && o.product.id === id));
      if (hasSales || hasOrders) {
        try { window._app_show_toast && window._app_show_toast('Cannot delete product: existing sales or orders reference this item', 'warning'); } catch {}
        return;
      }
      if (!(await window._app_confirm(t(locale,'confirm.delete_product')))) return;
      await apiFetch('/products/' + id,{method:"DELETE"});
      await load();
      try { window._app_show_toast && window._app_show_toast('Product deleted', 'success'); } catch {}
    } catch (err) {
      // apiFetch shows toast on error
    }
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
              <tr>
                <th onClick={()=>toggleSort('name')}>{t(locale,'inventory.table.product')}</th>
                <th onClick={()=>toggleSort('sku')}>{t(locale,'inventory.table.sku')}</th>
                <th onClick={()=>toggleSort('category')}>{t(locale,'inventory.table.category')}</th>
                <th onClick={()=>toggleSort('quantity')}>{t(locale,'inventory.table.qty')}</th>
                <th onClick={()=>toggleSort('unit_price')}>{t(locale,'inventory.table.unit_price')}</th>
                <th onClick={()=>toggleSort('supplier')}>{t(locale,'inventory.table.supplier')}</th>
                <th onClick={()=>toggleSort('location')}>{t(locale,'inventory.table.location')}</th>
                <th>{t(locale,'inventory.table.status')}</th>
                <th>{t(locale,'inventory.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,fontWeight:500}}>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))} {p.soldBelow && <span style={{marginLeft:8}} className="badge badge-danger">{formatMessage(t(locale,'inventory.sold_below')||'Sold below price', { threshold: fmt(p.soldBelowValue), current_price: fmt(p.unit_price), currency: 'TZS' })}</span>}</div>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)} disabled={!canEdit} title={!canEdit ? 'Insufficient permissions' : 'Edit product'}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(p.id)} disabled={!canEdit || p.hasReferences} title={!canEdit ? 'Insufficient permissions' : (p.hasReferences ? 'Cannot delete: existing sales or orders reference this item' : 'Delete product')}>🗑</button>
                      </div>
                    </div>
                  </td>
                  <td className="td-muted" style={{fontFamily:"monospace",fontSize:12}}>{p.sku}</td>
                  <td><span className="badge badge-info">{p.category}</span></td>
                  <td style={{fontWeight:700,color: p.quantity<=p.min_quantity?"#F85149":p.quantity<=p.min_quantity*2?"#D29922":"#3FB950"}}>{p.quantity}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(p.unit_price)}</td>
                  <td className="td-muted">{p.supplier}</td>
                  <td className="td-muted">{p.location}</td>
                  <td>{p.quantity<=p.min_quantity ? <span className="badge badge-danger">{t(locale,'inventory.status.low')}</span> : <span className="badge badge-success">{t(locale,'inventory.status.in_stock')}</span>}</td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)} disabled={!canEdit} title={!canEdit ? 'Insufficient permissions' : ''}>{t(locale,'btn.edit')}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(p.id)} style={{marginLeft:6}} disabled={!canEdit || p.hasReferences} title={!canEdit ? 'Insufficient permissions' : (p.hasReferences ? 'Cannot delete: existing sales or orders reference this item' : '')}>{t(locale,'btn.delete') || 'Del'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10}}>
          <div>
            <label style={{marginRight:8}}>{t(locale,'table.page_size')||'Page size'}:</label>
            <select value={pageSize} onChange={e=>{ setPageSize(+e.target.value); setPage(1); }}>
              {pageOptions.map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <span style={{margin:'0 8px'}}>{Math.min((page-1)*pageSize+1, total || 0)}-{Math.min(page*pageSize,total || 0)} of {total}</span>
            <button disabled={page>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>Next</button>
          </div>
        </div>
      </div>

      {showSidebar && (
        <Sidebar title={editing? (t(locale,'btn.edit_product') || "Edit Product") : t(locale,'btn.add_product')} onClose={()=>setShowSidebar(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowSidebar(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={save}>{t(locale,'btn.save')}</button></>}>
            <div className="form-grid">
              <div style={{gridColumn: '1 / -1'}}>
                <div className="form-group">
                  <label className="form-label">Product name</label>
                  <input className="form-control" placeholder="Product name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-control" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t(locale,'form.quantity')}</label>
                <input className="form-control" type="number" value={editing?.quantity ?? 0} readOnly style={{background:'#0D1117',color:'#8B949E'}}/>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageOptions = [10,20,50,100];
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [form, setForm] = useState({product_id:"",quantity:"",customer:"",customer_email:"",customer_phone:"",payment:"Cash"});

  const load = () => Promise.all([apiFetch("/sales"),apiFetch("/products")]).then(([s,p])=>{setSales(s);setProducts(p);});
  useEffect(()=>{ load(); },[]);

  const filtered = sales.filter(s =>
    s.customer?.toLowerCase().includes(search.toLowerCase()) ||
    (s.product?.display_name || s.product_name || s.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.payment || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.employee?.name || s.employee_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = useMemo(()=>{
    if (!sortField) return filtered;
    const rows = [...filtered];
    const getVal = (item, field) => {
      switch(field) {
        case 'product_name': return (item.product?.display_name || item.product_name || item.product?.name || '');
        case 'ordered_by_name': return (item.ordered_by_user?.name || item.ordered_by_name || '');
        case 'expected_delivery': return item.expected_delivery || '';
        default: return item[field] ?? '';
      }
    };
    rows.sort((a,b)=>{
      const va = (getVal(a, sortField) ?? "").toString();
      const vb = (getVal(b, sortField) ?? "").toString();
      if (!isNaN(Date.parse(va)) && !isNaN(Date.parse(vb))) return (new Date(va) - new Date(vb)) * (sortDir==='asc'?1:-1);
      if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) return (parseFloat(va) - parseFloat(vb)) * (sortDir==='asc'?1:-1);
      return va.localeCompare(vb) * (sortDir==='asc'?1:-1);
    });
    return rows;
  }, [filtered, sortField, sortDir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paged = sorted.slice((page-1)*pageSize, page*pageSize);

  function toggleSort(field) { if (sortField===field) setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } }

  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const todayISO = new Date().toISOString().slice(0,10);
  const todaySales = sales.filter(s=>{
    try { return (new Date(s.date)).toISOString().slice(0,10) === todayISO; } catch(e) { return false; }
  });

  const selProd = products.find(p=>p.id===form.product_id);
  const calcTotal = selProd ? selProd.unit_price * (+form.quantity||0) : 0;

  async function saveSale() {
    if (!form.product_id || !form.quantity) {
      window._app_show_toast && window._app_show_toast(t(locale,'alert.fill_product_qty'), 'warning');
      return;
    }
    if (!form.customer && !form.customer_email && !form.customer_phone) {
      // Allow anonymous sale but warn user; change this if you prefer to require at least one
      if (!(await window._app_confirm(t(locale,'confirm.no_customer_continue'), { title: t(locale,'confirm.warning') || 'Warning', confirmLabel: t(locale,'btn.continue') || 'Continue', cancelLabel: t(locale,'btn.cancel') || 'Cancel' }))) return;
    }
    try { window._app_show_toast && window._app_show_toast('Saving sale...', 'info'); } catch {}
    const body = {
      product_id: form.product_id, product_name: selProd?.name,
      quantity: +form.quantity, unit_price: selProd?.unit_price,
      total: calcTotal, customer: form.customer || null, payment: form.payment,
      customer_email: form.customer_email || null, customer_phone: form.customer_phone || null,
    };
    await apiFetch("/sales",{method:"POST",body:JSON.stringify(body)});
    window._app_show_toast && window._app_show_toast('Sale recorded', 'success');
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
            <thead>
              <tr>
                <th onClick={()=>toggleSort('date')}>{t(locale,'table.date')}</th>
                <th onClick={()=>toggleSort('product_name')}>{t(locale,'table.product')}</th>
                <th onClick={()=>toggleSort('customer')}>{t(locale,'table.customer')}</th>
                <th onClick={()=>toggleSort('quantity')}>{t(locale,'table.qty')}</th>
                <th onClick={()=>toggleSort('unit_price')}>{t(locale,'table.unit_price')}</th>
                <th onClick={()=>toggleSort('total')}>{t(locale,'table.total')}</th>
                <th onClick={()=>toggleSort('payment')}>{t(locale,'table.payment')}</th>
                <th onClick={()=>toggleSort('employee_name')}>{t(locale,'table.employee')}</th>
                <th onClick={()=>toggleSort('status')}>{t(locale,'table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s=>(
                <tr key={s.id}>
                  <td className="td-muted" style={{fontSize:12}}>{humanDate(s.date)}</td>
                  <td style={{fontWeight:500}}>{s.product?.display_name || s.product_name || (products.find(p=>p.id===s.product_id)?.display_name) || (products.find(p=>p.id===s.product_id)?.name) || "—"}</td>
                  <td className="td-muted">{s.customer}</td>
                  <td style={{textAlign:"center"}}>{s.quantity}</td>
                  <td>{fmt(s.unit_price)}</td>
                  <td style={{color:"#3FB950",fontWeight:700}}>{fmt(s.total)}</td>
                  <td><span className="badge badge-purple">{s.payment}</span></td>
                  <td className="td-muted" style={{fontSize:12}}>{s.employee?.name || s.employee_name || s.employee_id || "—"}</td>
                  <td>{statusBadge(s.status, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10}}>
          <div>
            <label style={{marginRight:8}}>{t(locale,'table.page_size')||'Page size'}:</label>
            <select value={pageSize} onChange={e=>{ setPageSize(+e.target.value); setPage(1); }}>
              {pageOptions.map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <span style={{margin:'0 8px'}}>{Math.min((page-1)*pageSize+1, total || 0)}-{Math.min(page*pageSize,total || 0)} of {total}</span>
            <button disabled={page>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={t(locale,'sales.record_sale')} onClose={()=>setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveSale}>{t(locale,'btn.save')}</button></>}>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.product_name')}</label>
            <select className="form-control" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">{t(locale,'form.select_product')}</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))} (Stock: {p.quantity})</option>)}
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageOptions = [10,20,50,100];
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [productEditorShow, setProductEditorShow] = useState(false);
  const [productEditorForm, setProductEditorForm] = useState(null);
  const [productEditorLoading, setProductEditorLoading] = useState(false);
  const [form, setForm] = useState({product_id:"",product_name:"",quantity:"",unit_price:"",supplier:"",location:"",expected_delivery:""});
  const canManage = user.role !== "employee";

  const load = () => Promise.all([apiFetch("/orders"),apiFetch("/products?include_unstocked=true"), apiFetch('/settings/categories'), apiFetch('/settings/templates')]).then(([o,p,c,t])=>{setOrders(o);setProducts(p); setCategories(c||[]); setTemplates(t||[]);});
  useEffect(()=>{ load(); },[]);

  async function saveOrder() {
    try { window._app_show_toast && window._app_show_toast('Saving order...', 'info'); } catch {}
    const selProd = products.find(p=>p.id===form.product_id);
    const payload = { product_id: +form.product_id, product_name: selProd?.display_name || selProd?.name || form.product_name, quantity:+form.quantity, unit_price:+form.unit_price, supplier: form.supplier, location: form.location, expected_delivery: form.expected_delivery, notes: form.notes };
    try {
      if (editingOrder) {
        await apiFetch('/orders/' + editingOrder.id, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        const created = await apiFetch("/orders",{method:"POST",body:JSON.stringify(payload)});
        // set status if user picked one
        if (form.status) {
          try { await apiFetch('/orders/' + created.id, { method: 'PUT', body: JSON.stringify({ status: form.status }) }); } catch {}
        }
      }
      setShowModal(false);
      const wasEdit = !!editingOrder;
      setEditingOrder(null);
      await load();
      try { window._app_show_toast && window._app_show_toast(wasEdit ? 'Order updated' : 'Order created', 'success'); } catch {}
    } catch (err) {
      // apiFetch shows toast
    }
  }

  function openEditOrder(order) {
    try { window._app_show_toast && window._app_show_toast('Opening order editor', 'info'); } catch {}
    setEditingOrder(order);
    setForm({ product_id: order.product_id?.toString() || '', product_name: order.product_name || '', quantity: order.quantity, unit_price: order.unit_price, supplier: order.supplier || '', location: order.location || '', expected_delivery: order.expected_delivery || '', status: order.status || 'pending', notes: order.notes || '' });
    setShowModal(true);
  }

  function openProductEditorForSelected() {
    const sel = products.find(p => p.id === form.product_id);
    if (!sel) { window._app_show_toast && window._app_show_toast('Select a product first', 'warning'); return; }
    try { window._app_show_toast && window._app_show_toast('Opening product editor', 'info'); } catch {}
    setProductEditorForm({...sel});
    setProductEditorShow(true);
  }

  async function saveProductEditor() {
    if (!productEditorForm) return;
    try { window._app_show_toast && window._app_show_toast('Saving product...', 'info'); } catch {}
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
      const isNew = !productEditorForm.id;
      if (isNew) {
        res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
      } else {
        // when creating new product, set initial stock to 0; min_quantity remains 5
        body.quantity = 0;
        // log payload for debugging when server-side validation fails
        try { console.debug('Creating product payload', body); } catch {}
        res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
      }
      setProductEditorShow(false);
      const [pList, oList] = await Promise.all([apiFetch('/products?include_unstocked=true'), apiFetch('/orders')]);
      setProducts(pList); setOrders(oList);
      // if created new product, set it on the order form
      if (!productEditorForm.id && res && res.id) {
        setForm(f => ({ ...f, product_id: res.id, unit_price: res.unit_price, supplier: res.supplier, location: res.location || '', product_name: res.name }));
      }
      try { window._app_show_toast && window._app_show_toast(isNew ? 'Product created' : 'Product saved', 'success'); } catch {}
    } catch (err) {
      try { window._app_show_toast && window._app_show_toast(err.message || JSON.stringify(err) || err, 'danger'); } catch {}
    } finally {
      setProductEditorLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await apiFetch('/orders/' + id,{method:"PUT",body:JSON.stringify({status})});
      await load();
      try { window._app_show_toast && window._app_show_toast('Order status updated', 'success'); } catch {}
    } catch (err) {
      // apiFetch already shows error toast
    }
  }

  // Open product editor for a product id (from table row)
  function editProductById(productId) {
    if (!productId) return;
    const p = products.find(x => x.id === productId);
    if (!p) return window._app_show_toast && window._app_show_toast('Product not found', 'danger');
    setProductEditorForm({ ...p });
    setProductEditorShow(true);
  }

  async function deleteProductById(productId) {
    if (!productId) return;
    if (!(await window._app_confirm('Delete product? This cannot be undone.', { title: 'Delete product', confirmLabel: 'Delete', cancelLabel: 'Cancel' }))) return;
    try {
      await apiFetch('/products/' + productId, { method: 'DELETE' });
      await load();
      window._app_show_toast && window._app_show_toast('Product deleted', 'success');
    } catch (err) {
      // apiFetch already shows a toast on error
    }
  }

  // Filter, sort, paginate orders
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (o.product?.display_name || o.product_name || o.product?.name || "").toLowerCase().includes(q)
      || (o.supplier||"").toLowerCase().includes(q)
      || (o.ordered_by_user?.name || o.ordered_by_name || "").toLowerCase().includes(q)
      || (o.status || "").toLowerCase().includes(q);
  });

  const sorted = useMemo(()=>{
    if (!sortField) return filtered;
    const rows = [...filtered];
    const getVal = (item, field) => {
      switch(field) {
        case 'product_name': return (item.product?.display_name || item.product_name || item.product?.name || '');
        case 'received_by_name': return (item.received_by_user?.name || item.received_by_name || '');
        case 'order_id': return item.order_id || '';
        default: return item[field] ?? '';
      }
    };
    rows.sort((a,b)=>{
      const va = (getVal(a, sortField) ?? "").toString();
      const vb = (getVal(b, sortField) ?? "").toString();
      if (!isNaN(Date.parse(va)) && !isNaN(Date.parse(vb))) return (new Date(va) - new Date(vb)) * (sortDir==='asc'?1:-1);
      if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) return (parseFloat(va) - parseFloat(vb)) * (sortDir==='asc'?1:-1);
      return va.localeCompare(vb) * (sortDir==='asc'?1:-1);
    });
    return rows;
  }, [filtered, sortField, sortDir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paged = sorted.slice((page-1)*pageSize, page*pageSize);

  function toggleSort(field) { if (sortField===field) setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } }

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
        <div className="card-header">
          <span className="card-title">{t(locale,'orders.records_title')}</span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control" style={{width:220}} placeholder={t(locale,'search.placeholder')} value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={()=>toggleSort('date')}>{t(locale,'table.date')}</th>
                <th onClick={()=>toggleSort('product_name')}>{t(locale,'table.product')}</th>
                <th onClick={()=>toggleSort('supplier')}>{t(locale,'table.supplier')}</th>
                <th onClick={()=>toggleSort('quantity')}>{t(locale,'table.qty')}</th>
                <th onClick={()=>toggleSort('unit_price')}>Per Unit Price</th>
                <th onClick={()=>toggleSort('total')}>{t(locale,'table.total')}</th>
                <th onClick={()=>toggleSort('expected_delivery')}>{t(locale,'orders.expected_delivery')}</th>
                <th onClick={()=>toggleSort('ordered_by_name')}>{t(locale,'orders.ordered_by')}</th>
                <th onClick={()=>toggleSort('status')}>{t(locale,'table.status')}</th>
                {canManage&&<th>{t(locale,'orders.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map(o=>(
                <tr key={o.id}>
                  <td className="td-muted" style={{fontSize:12}}>{humanDate(o.date)}</td>
                  <td style={{fontWeight:500}}>{o.product?.display_name || o.product_name || (products.find(p=>p.id===o.product_id)?.display_name) || (products.find(p=>p.id===o.product_id)?.name) || "—"}</td>
                  <td className="td-muted">{o.supplier}</td>
                  <td style={{textAlign:"center",color:"#3FB950",fontWeight:700}}>{o.quantity}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(o.unit_price)}</td>
                  <td style={{color:"#C8860A",fontWeight:600}}>{fmt(o.total)}</td>
                  <td className="td-muted" style={{fontSize:12}}>{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : "—"}</td>
                  <td className="td-muted" style={{fontSize:12}}>{o.ordered_by_user?.name || o.ordered_by_name || o.ordered_by_id || "—"}</td>
                  <td>{statusBadge(o.status, locale)}</td>
                  {canManage && <td style={{display:'flex',gap:8,alignItems:'center'}}>
                    <select className="form-control" style={{padding:"4px 8px",fontSize:12,width:"auto"}}
                      value={o.status}
                      disabled={o.delivery_status === 'approved' && user.role !== 'owner'}
                      onChange={e=>{
                        const newStatus = e.target.value;
                        if (o.delivery_status === 'approved' && user.role !== 'owner') {
                          try { window._app_show_toast && window._app_show_toast('Cannot change status: delivery already approved', 'warning'); } catch {}
                          return;
                        }
                        updateStatus(o.id, newStatus);
                      }}>
                      {["pending","in_transit","delivered","cancelled"].map(s=> <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={()=>{
                      if (o.delivery_status === 'approved' && user.role !== 'owner') {
                        try { window._app_show_toast && window._app_show_toast('Cannot edit order: delivery already approved', 'warning'); } catch {}
                        return;
                      }
                      openEditOrder(o);
                    }} title={o.delivery_status==='approved' && user.role !== 'owner' ? 'Order has approved delivery and cannot be edited' : ''}>{t(locale,'btn.edit_order')||'Edit'}</button>
                   
                  </td>}
                </tr>
              ))}
              {orders.length===0 && <tr><td colSpan={8} style={{textAlign:"center",color:"#8B949E",padding:40}}>{t(locale,'orders.no_records')}</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10}}>
          <div>
            <label style={{marginRight:8}}>{t(locale,'table.page_size')||'Page size'}:</label>
            <select value={pageSize} onChange={e=>{ setPageSize(+e.target.value); setPage(1); }}>
              {pageOptions.map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <span style={{margin:'0 8px'}}>{Math.min((page-1)*pageSize+1, total || 0)}-{Math.min(page*pageSize,total || 0)} of {total}</span>
            <button disabled={page>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>Next</button>
          </div>
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
                setForm({ ...form, product_id: val, supplier: p?.supplier || "", location: p?.location || "", unit_price: p?.unit_price || "" });
              }}>
                <option value="">{t(locale,'form.select_product')}</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))}</option>)}
              </select>
              {/* Edit/Delete moved to table actions */}
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t(locale,'form.quantity')}</label><input className="form-control" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t(locale,'form.unit_price_tzs')}</label><input className="form-control" type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">{t(locale,'form.supplier')}</label><input className="form-control" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'form.location') || 'Location'}</label><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
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
            <div className="form-group">
              <label className="form-label">{t(locale,'form.product_name')}</label>
              <select className="form-control" value={productEditorForm?.name||""} onChange={e=>setProductEditorForm({...productEditorForm,name:e.target.value})}>
                <option value="">(select product)</option>
                {/* templates from settings */}
                {templates && templates.map(t => <option key={`tmpl-${t.id}`} value={t.name}>{t.name}</option>)}
                {/* existing product names */}
                {products && products.map(p=> <option key={p.id} value={p.name}>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t(locale,'form.sku')}</label><input className="form-control" value={productEditorForm?.sku||""} onChange={e=>setProductEditorForm({...productEditorForm,sku:e.target.value})}/></div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.category')}</label>
              <select className="form-control" value={productEditorForm?.category||""} onChange={e=>setProductEditorForm({...productEditorForm,category:e.target.value})}>
                <option value="">(select category)</option>
                {categories && categories.length ? categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>) : ['Brakes','Tires','Engine','Transmission','Fluids','Body','Electrical','Accessories','Drive','Controls','Gaskets','Fuel System'].map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageOptions = [10,20,50,100];
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({order_id:"",product_id:"",product_name:"",quantity:"",supplier:"",notes:""});
  const canManage = user.role !== "employee";

  const load = () => Promise.all([apiFetch("/deliveries"),apiFetch("/orders"),apiFetch("/products?include_unstocked=true"),apiFetch("/auth/users")]).then(([d,o,p,u])=>{setDeliveries(d);setOrders(o);setProducts(p);setUsers(u);});
  useEffect(()=>{ load(); },[]);

  const pendingOrders = orders.filter(o=>["pending","in_transit"].includes(o.status));

  // search, sort and paginate deliveries
  const filtered = deliveries.filter(d => {
    const q = search.toLowerCase();
    return (d.product?.display_name || d.product_name || d.product?.name || "").toLowerCase().includes(q)
      || (d.supplier||"").toLowerCase().includes(q)
      || (String(d.order_id)||"").toLowerCase().includes(q)
      || (d.status||"").toLowerCase().includes(q);
  });

  const sorted = useMemo(()=>{
    if (!sortField) return filtered;
    const rows = [...filtered];
    rows.sort((a,b)=>{
      const va = (a[sortField] ?? "").toString();
      const vb = (b[sortField] ?? "").toString();
      if (!isNaN(Date.parse(va)) && !isNaN(Date.parse(vb))) return (new Date(va) - new Date(vb)) * (sortDir==='asc'?1:-1);
      if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) return (parseFloat(va) - parseFloat(vb)) * (sortDir==='asc'?1:-1);
      return va.localeCompare(vb) * (sortDir==='asc'?1:-1);
    });
    return rows;
  }, [filtered, sortField, sortDir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paged = sorted.slice((page-1)*pageSize, page*pageSize);

  function toggleSort(field) { if (sortField===field) setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } }

  async function saveDelivery() {
    try { window._app_show_toast && window._app_show_toast('Saving delivery...', 'info'); } catch {}
    const selOrder = orders.find(o=>o.id===form.order_id);
    const body = {...form, product_id:selOrder?.product_id, product_name:selOrder?.product_name||form.product_name, quantity:+form.quantity, supplier:selOrder?.supplier||form.supplier};
    await apiFetch("/deliveries",{method:"POST",body:JSON.stringify(body)});
    setShowModal(false);
    await load();
    try { window._app_show_toast && window._app_show_toast('Delivery recorded', 'success'); } catch {}
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
        <div className="card-header">
          <span className="card-title">{t(locale,'deliveries.records_title')}</span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control" style={{width:220}} placeholder={t(locale,'search.placeholder')} value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={()=>toggleSort('date')}>{t(locale,'table.date')}</th>
                <th onClick={()=>toggleSort('product_name')}>{t(locale,'table.product')}</th>
                <th onClick={()=>toggleSort('supplier')}>{t(locale,'table.supplier')}</th>
                <th onClick={()=>toggleSort('quantity')}>{t(locale,'table.qty')}</th>
                <th onClick={()=>toggleSort('order_id')}>Order Ref</th>
                <th onClick={()=>toggleSort('received_by_name')}>{t(locale,'table.employee')}</th>
                <th>{t(locale,'table.notes') || 'Notes'}</th>
                <th onClick={()=>toggleSort('status')}>{t(locale,'table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(d=>(
                    <tr key={d.id}>
                      <td className="td-muted" style={{fontSize:12}}>{humanDate(d.date)}</td>
                      <td style={{fontWeight:500}}>{d.product?.display_name || d.product_name || (products.find(p=>p.id===d.product_id)?.display_name) || (products.find(p=>p.id===d.product_id)?.name) || "—"}</td>
                      <td className="td-muted">{d.supplier}</td>
                      <td style={{textAlign:"center",color:"#3FB950",fontWeight:700}}>{d.quantity}</td>
                      <td className="td-muted" style={{fontFamily:"monospace",fontSize:12}}>{d.order_id}</td>
                      <td className="td-muted" style={{fontSize:12}}>{d.received_by_user?.name || d.received_by_name || (users.find(u=>u.id===d.received_by_id)?.name) || "—"}</td>
                  <td className="td-muted" style={{fontSize:12,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.notes}</td>
                    <td style={{display:'flex',gap:8,alignItems:'center'}}>
                      {statusBadge(d.status, locale)}
                      {canManage && d.status !== 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={async()=>{
                          if (!(await window._app_confirm(t(locale,'deliveries.approve_as_is'), { title: t(locale,'deliveries.approve') || 'Approve Delivery', confirmLabel: t(locale,'btn.approve') || 'Approve', cancelLabel: t(locale,'btn.cancel') || 'Cancel' }))) return;
                          try {
                            await apiFetch('/deliveries/' + d.id + '/approve',{method:'PUT'});
                            window._app_show_toast && window._app_show_toast('Delivery approved', 'success');
                            load();
                          } catch(err) { window._app_show_toast && window._app_show_toast(err.message || err, 'danger'); }
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

// ── Settings ───────────────────────────────────────────────────────────────
function Settings({ locale }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [catInput, setCatInput] = useState('');
  const [tmpl, setTmpl] = useState({name:'',category:'',sku:'',unit_price:''});
  const [modelInput, setModelInput] = useState({name:'',categories:''});
  useEffect(()=>{
    apiFetch('/settings/categories').then(c=>setCategories(c||[])).catch(()=>{});
    apiFetch('/settings/templates').then(t=>setTemplates(t||[])).catch(()=>{});
    apiFetch('/settings/models').then(m=>setModels(m||[])).catch(()=>{});
  },[]);

  async function addCategory() {
    const v = catInput.trim(); if (!v) return;
    try {
      const res = await apiFetch('/settings/categories',{method:'POST', body: JSON.stringify({name:v})});
      setCategories(cs=>[...cs, res]);
      setCatInput('');
      try { window._app_show_toast && window._app_show_toast('Category added', 'success'); } catch {}
    } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  async function addTemplate() {
    if (!tmpl.name || !tmpl.category) { window._app_show_toast && window._app_show_toast('Provide name and category', 'warning'); return; }
    try { const res = await apiFetch('/settings/templates',{method:'POST', body: JSON.stringify(tmpl)}); setTemplates(ts=>[...ts, res]); setTmpl({name:'',category:'',sku:'',unit_price:''}); window._app_show_toast && window._app_show_toast('Template added', 'success'); } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  async function addModel() {
    if (!modelInput.name) { window._app_show_toast && window._app_show_toast('Provide model name', 'warning'); return; }
    const cats = modelInput.categories.split(',').map(s=>s.trim()).filter(Boolean);
    try { const res = await apiFetch('/settings/models',{method:'POST', body: JSON.stringify({name: modelInput.name, categories: cats})}); setModels(ms=>[...ms, res]); setModelInput({name:'',categories:''}); window._app_show_toast && window._app_show_toast('Model added', 'success'); } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.settings') || 'Settings'}</div>
          <div className="page-subtitle">Manage categories, product templates and motorcycle models</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Categories</span></div>
        <div style={{padding:16}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input className="form-control" placeholder="Add category" value={catInput} onChange={e=>setCatInput(e.target.value)} style={{width:220}} />
            <button className="btn btn-primary" onClick={addCategory}>Add</button>
          </div>
          <div style={{marginTop:12}}>{categories.length?categories.map(c=> <span key={c} className="badge badge-info" style={{marginRight:6}}>{c}</span>) : <span className="td-muted">No categories yet</span>}</div>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-header"><span className="card-title">Product Templates</span></div>
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'200px 200px 120px 120px 80px',gap:8}}>
            <input className="form-control" placeholder="Template name" value={tmpl.name} onChange={e=>setTmpl({...tmpl,name:e.target.value})} />
            <input className="form-control" placeholder="Category" value={tmpl.category} onChange={e=>setTmpl({...tmpl,category:e.target.value})} />
            <input className="form-control" placeholder="SKU" value={tmpl.sku} onChange={e=>setTmpl({...tmpl,sku:e.target.value})} />
            <input className="form-control" placeholder="Price" value={tmpl.unit_price} onChange={e=>setTmpl({...tmpl,unit_price:e.target.value})} />
            <button className="btn btn-primary" onClick={addTemplate}>Add</button>
          </div>
          <div style={{marginTop:12}}>{templates.length?templates.map(t=> <div key={t.name} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}><strong>{t.name}</strong><span className="td-muted">{t.category}</span><span className="td-muted">{t.sku}</span></div>) : <span className="td-muted">No templates yet</span>}</div>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-header"><span className="card-title">Motorcycle Models</span></div>
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'200px 300px 120px',gap:8}}>
            <input className="form-control" placeholder="Model name (e.g. CG125)" value={modelInput.name} onChange={e=>setModelInput({...modelInput,name:e.target.value})} />
            <input className="form-control" placeholder="Categories (comma separated)" value={modelInput.categories} onChange={e=>setModelInput({...modelInput,categories:e.target.value})} />
            <button className="btn btn-primary" onClick={addModel}>Add</button>
          </div>
          <div style={{marginTop:12}}>{models.length?models.map(m=> <div key={m.name} style={{marginBottom:8}}><strong>{m.name}</strong> <span className="td-muted">{m.categories.join(', ')}</span></div>) : <span className="td-muted">No models yet</span>}</div>
        </div>
      </div>
    </div>
  );
}

// ── Categories Page ───────────────────────────────────────────────────────
function CategoriesPage({ locale }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoriesUsage, setCategoriesUsage] = useState({});
  const [catInput, setCatInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  useEffect(()=>{
    apiFetch('/settings/categories').then(c=>setCategories(c||[])).catch(()=>{});
    apiFetch('/settings/categories/usage').then(u=>{ const map={}; (u||[]).forEach(x=>map[x.id]=x.count); setCategoriesUsage(map); }).catch(()=>{});
  },[]);

  async function addCategory(){
    const v = catInput.trim(); if (!v) return;
    try {
      const res = await apiFetch('/settings/categories',{method:'POST', body: JSON.stringify({name:v})});
      setCategories(cs=>[...cs, res]); setCatInput('');
      try { window._app_show_toast && window._app_show_toast('Category added', 'success'); } catch {}
    } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  function startEdit(cat){ try { window._app_show_toast && window._app_show_toast('Editing category', 'info'); } catch {} setEditingId(cat.id); setEditingName(cat.name); }

  async function saveEdit(){
    if (!editingName.trim()) return;
    try {
      const res = await apiFetch('/settings/categories/' + editingId, { method: 'PUT', body: JSON.stringify({ name: editingName.trim() }) });
      setCategories(cs => cs.map(c => c.id === res.id ? res : c));
      setEditingId(null); setEditingName('');
      try { window._app_show_toast && window._app_show_toast('Category saved', 'success'); } catch {}
    } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  async function deleteCategory(id){
    if (!(await window._app_confirm('Delete category?', { title: 'Delete category', confirmLabel: 'Delete', cancelLabel: 'Cancel' }))) return;
    try { await apiFetch('/settings/categories/' + id, { method: 'DELETE' }); setCategories(cs=>cs.filter(c=>c.id!==id)); window._app_show_toast && window._app_show_toast('Deleted', 'success'); } catch(e){ }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.categories') || 'Categories'}</div>
          <div className="page-subtitle">Manage product categories</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Categories</span></div>
        <div style={{padding:16}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input className="form-control" placeholder="Add category" value={catInput} onChange={e=>setCatInput(e.target.value)} style={{width:220}} />
            <button className="btn btn-primary" onClick={addCategory}>Add</button>
          </div>
          <div style={{marginTop:12}}>
            {categories.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Actions</th></tr></thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                            <td>{editingId===c.id ? <input className="form-control" value={editingName} onChange={e=>setEditingName(e.target.value)} /> : <strong>{c.name}</strong>}</td>
                            <td>
                              {editingId===c.id ? (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                                  <button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={()=>{ setEditingId(null); setEditingName(''); }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-secondary btn-sm" onClick={()=>startEdit(c)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" style={{marginLeft:8}} onClick={()=>deleteCategory(c.id)} disabled={(categoriesUsage[c.id]||0) > 0}>{(categoriesUsage[c.id]||0) > 0 ? `Delete (${categoriesUsage[c.id]})` : 'Delete'}</button>
                                </>
                              )}
                            </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <span className="td-muted">No categories yet</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Models Page ───────────────────────────────────────────────────────────
function ModelsPage({ locale }) {
  const [models, setModels] = useState([]);
  const [modelInput, setModelInput] = useState({name:''});
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [modelsUsage, setModelsUsage] = useState({});
  useEffect(()=>{ apiFetch('/settings/models').then(m=>setModels(m||[])).catch(()=>{}); apiFetch('/settings/models/usage').then(u=>{ const map={}; (u||[]).forEach(x=>map[x.id]=x.count); setModelsUsage(map); }).catch(()=>{}); },[]);

  async function addModel(){
    if (!modelInput.name) { window._app_show_toast && window._app_show_toast('Provide model name', 'warning'); return; }
    try { const res = await apiFetch('/settings/models',{method:'POST', body: JSON.stringify({name: modelInput.name})}); setModels(ms=>[...ms, res]); setModelInput({name:''}); window._app_show_toast && window._app_show_toast('Model added', 'success'); } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  function startEdit(m){ try { window._app_show_toast && window._app_show_toast('Editing model', 'info'); } catch {} setEditingId(m.id); setEditingName(m.name); }
  async function saveEdit(){ if (!editingName.trim()) return; try { const res = await apiFetch('/settings/models/' + editingId, { method: 'PUT', body: JSON.stringify({ name: editingName.trim(), categories: [] }) }); setModels(ms=>ms.map(x=> x.id === res.id ? res : x)); setEditingId(null); setEditingName(''); } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); } }

  async function deleteModel(id){ if (!(await window._app_confirm('Delete model?', { title: 'Delete model', confirmLabel: 'Delete', cancelLabel: 'Cancel' }))) return; try { await apiFetch('/settings/models/' + id, { method: 'DELETE' }); setModels(ms=>ms.filter(m=>m.id!==id)); window._app_show_toast && window._app_show_toast('Deleted', 'success'); } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); } }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.models') || 'Motorcycle Models'}</div>
          <div className="page-subtitle">Manage motorcycle models</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Add Model</span></div>
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'200px 120px',gap:8}}>
            <input className="form-control" placeholder="Model name (e.g. CG125)" value={modelInput.name} onChange={e=>setModelInput({...modelInput,name:e.target.value})} />
            <button className="btn btn-primary" onClick={addModel}>Add</button>
          </div>
            <div style={{marginTop:12}}>
            {models.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Actions</th></tr></thead>
                  <tbody>
                    {models.map(m=> (
                      <tr key={m.id}>
                        <td>{editingId===m.id ? <input className="form-control" value={editingName} onChange={e=>setEditingName(e.target.value)} /> : <strong>{m.name}</strong>}</td>
                        <td>{editingId===m.id ? (<><button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button><button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={()=>{ setEditingId(null); setEditingName(''); }}>Cancel</button></>) : (<><button className="btn btn-secondary btn-sm" onClick={()=>startEdit(m)}>Edit</button><button className="btn btn-danger btn-sm" style={{marginLeft:8}} onClick={()=>deleteModel(m.id)} disabled={(modelsUsage[m.id]||0) > 0}>{(modelsUsage[m.id]||0) > 0 ? `Delete (${modelsUsage[m.id]})` : 'Delete'}</button></>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <span className="td-muted">No models yet</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Products Page (add product with category dropdown) ──────────────────────
function ProductsPage({ locale }) {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({name:'',sku:'',category:'',model:'',min_quantity:5, supplier:'', location:''});
  useEffect(()=>{ Promise.all([apiFetch('/settings/categories'), apiFetch('/settings/templates'), apiFetch('/settings/models'), apiFetch('/products?include_unstocked=true')]).then(([c,t,m,p])=>{ setCategories(c||[]); setTemplates(t||[]); setModels(m||[]); setProducts(p||[]); }).catch(()=>{}); },[]);

  function inferModelName(prod) {
    if (!prod) return '';
    // Prefer explicit fields if backend provides them
    if (prod.motorcycle_model_id) {
      const byId = (models || []).find(x => x.id === prod.motorcycle_model_id);
      if (byId) return byId.name;
    }
    if (prod.motorcycle_model && prod.motorcycle_model.name) return prod.motorcycle_model.name;
    if (prod.model) return prod.model;

    const name = (prod.name || '').toLowerCase();
    // Match model by name appearing in product name
    for (const m of (models || [])) {
      if (!m) continue;
      const mname = (m.name || '').toLowerCase();
      if (mname && name.includes(mname)) return m.name;
    }
    // Match model by overlapping categories (if model defines categories)
    for (const m of (models || [])) {
      if (!m || !m.categories) continue;
      if (!prod.category) continue;
      if (m.categories.includes(prod.category)) return m.name;
    }
    return '';
  }

  async function addProduct(){
    if (!form.name || !form.category) { window._app_show_toast && window._app_show_toast('Provide name and select category', 'warning'); return; }
    try {
      const payload = { name: form.name, sku: form.sku, category: form.category, min_quantity: +form.min_quantity, unit_price: 1.0, quantity: 0, supplier: form.supplier || null, location: form.location || null };
      if (form.model) payload.motorcycle_model_id = +form.model;
      // backend expects unit_price > 0; default to 1.0 when user doesn't provide price in UI
      const res = await apiFetch('/products',{method:'POST', body: JSON.stringify(payload)});
      setProducts(ps=>[res,...ps]);
      setForm({name:'',sku:'',category:'',model:'',min_quantity:5, supplier:'', location:''});
      window._app_show_toast && window._app_show_toast('Product added', 'success');
    } catch(e){ window._app_show_toast && window._app_show_toast(e.message||e,'danger'); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t(locale,'page.products') || 'Products'}</div>
          <div className="page-subtitle">Create products (category chosen from dropdown)</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">New Product</span></div>
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 200px 160px 200px',gap:8}}>
            <input className="form-control" placeholder="Product name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <input className="form-control" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} />
            <select className="form-control" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Select category</option>
              {(categories||[]).map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select className="form-control" value={form.model} onChange={e=>setForm({...form,model:e.target.value})}>
              <option value="">Select model (optional)</option>
              {(models||[]).map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'200px',gap:8,marginTop:8}}>
            <input className="form-control" placeholder="Min qty" type="number" value={form.min_quantity} onChange={e=>setForm({...form,min_quantity:e.target.value})} />
          </div>
          <div style={{marginTop:12}}>
            <button className="btn btn-primary" onClick={addProduct}>Add Product</button>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-header"><span className="card-title">Existing Products</span></div>
        <div className="table-wrap" style={{padding:16}}>
          <table>
            <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Model</th></tr></thead>
            <tbody>{products.length?products.map(p=> <tr key={p.id}><td>{p.display_name || (p.name + (p.motorcycle_model?.name ? ' - ' + p.motorcycle_model.name : ''))}</td><td className="td-muted">{p.sku}</td><td className="td-muted">{p.category}</td><td className="td-muted">{inferModelName(p) || ''}</td></tr>) : <tr><td colSpan={4} style={{padding:20}} className="td-muted">No products yet</td></tr>}</tbody>
          </table>
        </div>
      </div>
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
                <YAxis tick={{fill:"#8B949E",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>(v/1000) + 'k'}/>
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
                <Pie data={payData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,percent})=>name + ' ' + (percent*100).toFixed(0) + '%'} labelLine={{stroke:"#8B949E"}}>
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
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: "", text: "" });
  const [editingUserId, setEditingUserId] = useState(null);

  const load = () => apiFetch("/auth/users").then(setUsers);
  useEffect(()=>{ load(); },[]);

  function openCreateUser() {
    setEditingUserId(null);
    setForm({name:"",email:"",password:"",role:"employee"});
    setModalMsg({ type: "", text: "" });
    setShowModal(true);
  }

  function openEditUser(target) {
    setEditingUserId(target.id);
    setForm({
      name: target.name || "",
      email: target.email || "",
      password: "",
      role: target.role || "employee",
      active: !!target.active,
    });
    setModalMsg({ type: "", text: "" });
    setShowModal(true);
  }

  async function saveUser() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      if (editingUserId && form.name.trim() && form.email.trim()) {
        // password is optional during edit
      } else {
        const text = "Please fill Full Name, Email and Password.";
        setModalMsg({ type: "error", text });
        try { window._app_show_toast && window._app_show_toast(text, 'danger'); } catch {}
        return;
      }
    }

    if (!form.name.trim() || !form.email.trim()) {
      const text = "Please fill Full Name, Email and Password.";
      setModalMsg({ type: "error", text });
      try { window._app_show_toast && window._app_show_toast(text, 'danger'); } catch {}
      return;
    }
    setSaving(true);
    setModalMsg({ type: "", text: "" });
    try {
      if (editingUserId) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
        };
        if (form.password && form.password.trim()) payload.password = form.password;
        await apiFetch('/auth/users/' + editingUserId, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch("/auth/users",{method:"POST",body:JSON.stringify(form)});
      }

      const text = editingUserId ? "User account updated successfully." : "System user created successfully.";
      setModalMsg({ type: "success", text });
      try { window._app_show_toast && window._app_show_toast(text, 'success'); } catch {}
      await load();
      setTimeout(() => {
        setShowModal(false);
        setEditingUserId(null);
        setForm({name:"",email:"",password:"",role:"employee"});
        setModalMsg({ type: "", text: "" });
      }, 500);
    } catch (err) {
      const text = err?.message || "Failed to create system user.";
      setModalMsg({ type: "error", text });
      try { window._app_show_toast && window._app_show_toast(text, 'danger'); } catch {}
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(target) {
    const nextActive = !target.active;
    const confirmText = nextActive ? "Activate this account?" : "Deactivate this account?";
    if (!(await window._app_confirm(confirmText, { title: confirmText, confirmLabel: 'Yes', cancelLabel: 'No' }))) return;
    try {
      await apiFetch('/auth/users/' + target.id, {
        method: 'PUT',
        body: JSON.stringify({ active: nextActive }),
      });
      try { window._app_show_toast && window._app_show_toast(nextActive ? "Account activated." : "Account deactivated.", 'success'); } catch {}
      await load();
    } catch (err) {
      try { window._app_show_toast && window._app_show_toast(err?.message || 'Failed to update account status.', 'danger'); } catch {}
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">{t(locale,'page.users')}</div><div className="page-subtitle">{t(locale,'users.subtitle').replace('{count}', users.length)}</div></div>
        {user.role==="owner" && <button className="btn btn-primary" onClick={openCreateUser}>{t(locale,'btn.add_user')}</button>}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t(locale,'users.system_users_title')}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t(locale,'table.name')}</th><th>{t(locale,'table.email')}</th><th>{t(locale,'table.role')}</th><th>{t(locale,'table.status')}</th>{user.role==="owner" && <th>{t(locale,'orders.actions') || 'Actions'}</th>}</tr></thead>
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
                  <td><span className={"badge role-" + u.role}>{u.role}</span></td>
                  <td><span className={"badge " + (u.active?"badge-success":"badge-danger")}>{u.active? t(locale,'user.status.active') : t(locale,'user.status.inactive')}</span></td>
                  {user.role==="owner" && (
                    <td>
                      {u.role !== 'owner' ? (
                        <div style={{display:'flex',gap:8}}>
                          <button className="btn btn-secondary btn-sm" onClick={()=>openEditUser(u)}>{t(locale,'btn.edit') || 'Edit'}</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>toggleActive(u)}>{u.active ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editingUserId ? (t(locale,'btn.edit_user') || 'Edit System User') : t(locale,'users.add_user')} onClose={()=>{ setShowModal(false); setEditingUserId(null); setModalMsg({ type: "", text: "" }); }}
          footer={<><button className="btn btn-secondary" onClick={()=>{ setShowModal(false); setModalMsg({ type: "", text: "" }); }} disabled={saving}>{t(locale,'btn.cancel')}</button><button className="btn btn-primary" onClick={saveUser} disabled={saving}>{saving ? (t(locale,'btn.saving') || 'Saving...') : t(locale,'btn.create_user')}</button></>}>
          {modalMsg.text && (
            <div className="error-msg" style={{ marginBottom: 12, background: modalMsg.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', borderColor: modalMsg.type === 'success' ? 'rgba(63,185,80,0.35)' : 'rgba(248,81,73,0.3)', color: modalMsg.type === 'success' ? '#3FB950' : '#F85149' }}>
              {modalMsg.text}
            </div>
          )}
          <div className="form-group"><label className="form-label">{t(locale,'form.full_name')}</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{t(locale,'form.email')}</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">{editingUserId ? ((t(locale,'form.password') || 'Password') + ' (optional)') : t(locale,'form.password')}</label><input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div className="form-group">
            <label className="form-label">{t(locale,'form.role')}</label>
            <select className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {editingUserId && (
            <div className="form-group">
              <label className="form-label">{t(locale,'table.status') || 'Status'}</label>
              <select className="form-control" value={form.active ? 'active' : 'inactive'} onChange={e=>setForm({...form,active:e.target.value === 'active'})}>
                <option value="active">{t(locale,'user.status.active')}</option>
                <option value="inactive">{t(locale,'user.status.inactive')}</option>
              </select>
            </div>
          )}
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
  { id:"categories",labelKey:"nav.categories", icon:"🏷️", roles:["owner","manager"] },
  { id:"models",    labelKey:"nav.models",     icon:"🏍️", roles:["owner","manager"] },
  { id:"products", labelKey:"nav.products", icon:"🧩" },
];

const PAGE_TITLES = {
  dashboard:"page.dashboard",
  inventory:"page.inventory",
  products:"page.products",
  sales:"page.sales",
  orders:"page.orders",
  deliveries:"page.deliveries",
  reports:"page.reports",
  users:"page.users",
  
  categories:"page.categories",
  models:"page.models",
};

function AppShell({ user, onLogout, locale, setLocale }) {
  const [page, setPage] = useState("dashboard");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navItems = NAV.filter(n => !n.roles || n.roles.includes(user.role));

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <Dashboard locale={locale}/>;
      case "inventory": return <Inventory locale={locale}/>;
      case "products":  return <ProductsPage locale={locale}/>;
      case "sales":     return <Sales locale={locale}/>;
      case "orders":    return <Orders locale={locale}/>;
      case "deliveries":return <Deliveries locale={locale}/>;
      
      case "categories":return <CategoriesPage locale={locale}/>;
      case "models":    return <ModelsPage locale={locale}/>;
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
          <span>{t(locale,'title.dashboard')}</span>
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
            <div key={n.id} className={"nav-item " + (page===n.id?"active":"")} onClick={()=>setPage(n.id)}>
              <span className="icon">{n.icon}</span>
              {t(locale, n.labelKey)}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="btn btn-secondary" style={{width:'100%',marginBottom:8}} onClick={()=>setShowChangePwd(true)}>🔑 Change Password</button>
          <button className="logout-btn" onClick={onLogout}>
            <span>🚪</span> {t(locale,'sign_out')}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h2>{t(locale, 'page.' + page)}</h2>
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
            <span className={"badge role-" + user.role} style={{padding:"4px 12px",fontSize:12}}>{user.role}</span>
            <div className="user-avatar" style={{width:32,height:32,fontSize:12}}>{initials(user.name)}</div>
          </div>
        </div>
        <AuthContext.Provider value={{ user }}>
          {renderPage()}
        </AuthContext.Provider>
        {showChangePwd && (
          <Modal title={t(locale,'btn.change_password')||'Change Password'} onClose={()=>setShowChangePwd(false)}
            footer={<>
              <button className="btn btn-secondary" onClick={()=>setShowChangePwd(false)}>{t(locale,'btn.cancel')}</button>
              <button className="btn btn-primary" onClick={async ()=>{
                if (!pwdForm.old_password || !pwdForm.new_password) return window._app_show_toast && window._app_show_toast('Provide both passwords','warning');
                if (pwdForm.new_password !== pwdForm.confirm) return window._app_show_toast && window._app_show_toast('New passwords do not match','warning');
                try {
                  await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password: pwdForm.old_password, new_password: pwdForm.new_password }) });
                  window._app_show_toast && window._app_show_toast('Password changed','success');
                  setShowChangePwd(false);
                  setPwdForm({ old_password:'', new_password:'', confirm:'' });
                } catch (err) {
                }
              }}>{t(locale,'btn.save')||'Save'}</button>
            </>}>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.current_password')||'Current password'}</label>
              <input className="form-control" type="password" value={pwdForm.old_password} onChange={e=>setPwdForm({...pwdForm,old_password:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.new_password')||'New password'}</label>
              <input className="form-control" type="password" value={pwdForm.new_password} onChange={e=>setPwdForm({...pwdForm,new_password:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t(locale,'form.confirm_password')||'Confirm new password'}</label>
              <input className="form-control" type="password" value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm,confirm:e.target.value})} />
            </div>
          </Modal>
        )}
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
  const [confirmState, setConfirmState] = useState(null);
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
    // expose a global confirm helper that returns a Promise
    window._app_confirm = (message, opts = {}) => {
      return new Promise(resolve => {
        setConfirmState({ message, resolve, opts });
      });
    };
    // show toast for global JS errors and unhandled promise rejections
    const onWindowError = (e) => {
      try {
        const msg = e?.message || (e && e.error && e.error.message) || 'An unexpected error occurred';
        window._app_show_toast && window._app_show_toast(msg, 'danger');
      } catch {}
    };
    const onUnhandledRejection = (ev) => {
      try {
        const reason = ev?.reason || ev;
        const msg = (reason && reason.message) ? reason.message : String(reason || 'Unhandled promise rejection');
        window._app_show_toast && window._app_show_toast(msg, 'danger');
      } catch {}
    };
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    // ripple effect: delegated handler for buttons with .btn
    const onPointerDown = (e) => {
      try {
        const el = e.target.closest && e.target.closest('.btn');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const span = document.createElement('span');
        span.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        span.style.width = span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left - size / 2) + 'px';
        span.style.top = (e.clientY - rect.top - size / 2) + 'px';
        el.appendChild(span);
        setTimeout(() => { try { span.remove(); } catch {} }, 700);
      } catch (err) { /* ignore */ }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => { try { delete window._app_show_toast; delete window._app_confirm; document.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('error', onWindowError); window.removeEventListener('unhandledrejection', onUnhandledRejection); } catch {} };
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
          <div key={t.id} className={"toast " + t.type}>
            <span className="toast-icon">{t.type === 'success' ? '✅' : t.type === 'danger' ? '⚠️' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <div className="msg">{t.message}</div>
            <button className="close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
      {confirmState && (
        <Modal title={confirmState.opts?.title || 'Confirm'} onClose={() => { confirmState.resolve(false); setConfirmState(null); }}
          footer={<>
            <button className="btn btn-secondary" onClick={() => { confirmState.resolve(false); setConfirmState(null); }}>{confirmState.opts?.cancelLabel || 'Cancel'}</button>
            <button className="btn btn-danger" onClick={() => { confirmState.resolve(true); setConfirmState(null); }} style={{marginLeft:8}}>{confirmState.opts?.confirmLabel || 'Delete'}</button>
          </>}>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{width:44,height:44,background:'rgba(248,81,73,0.12)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>⚠️</div>
            <div>
              <div style={{fontWeight:700,marginBottom:6,color:'#F85149'}}>{confirmState.opts?.title || 'Are you sure?'}</div>
              <div style={{color:'#8B949E'}}>{confirmState.message}</div>
            </div>
          </div>
        </Modal>
      )}
      {user ? <AppShell user={user} onLogout={handleLogout} locale={locale} setLocale={setLocale}/> : <LoginPage onLogin={handleLogin} locale={locale}/>} 
    </>
  );
}
