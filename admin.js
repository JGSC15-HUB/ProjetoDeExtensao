'use strict';

const STORE = 'caveBarberRecords';
const SESSION_KEY = 'caveAdminLogged';
const LOGIN = { user: 'admin', password: '1234' };
const BARBERS = ['Bruno', 'Branco', 'Wellington', 'Washington'];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
}

function getRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao ler os atendimentos:', error);
    return [];
  }
}

function safe(value) {
  const element = document.createElement('div');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}

function formatDate(value) {
  if (!value) return '-';
  const parts = value.split('-');
  return parts.length === 3 ? parts.reverse().join('/') : value;
}

function recordDate(record) {
  const date = record.date || record.data;
  const time = record.time || record.hora || '00:00';
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function normalizedRecord(record) {
  return {
    barber: record.barber || record.barbeiro || '',
    client: record.client || record.nome || record.cliente || '',
    service: record.service || record.servico || '',
    date: record.date || record.data || '',
    time: record.time || record.hora || '',
    value: Number(record.value ?? record.valor ?? 0)
  };
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + (copy.getDay() === 0 ? -6 : 1 - copy.getDay()));
  return copy;
}

function period(records, filter) {
  const filtered = records.filter(filter);
  return {
    count: filtered.length,
    total: filtered.reduce((sum, record) => sum + Number(record.value || 0), 0)
  };
}

function row(record) {
  return `<tr>
    <td>${safe(record.barber)}</td>
    <td>${safe(record.client)}</td>
    <td>${safe(record.service)}</td>
    <td>${formatDate(record.date)}</td>
    <td>${safe(record.time)}</td>
    <td><b>${money(record.value)}</b></td>
  </tr>`;
}

function fillTable(element, records) {
  if (!element) return;
  element.innerHTML = records.length
    ? records.map(row).join('')
    : '<tr><td colspan="6" class="empty">Nenhum atendimento cadastrado.</td></tr>';
}

function showAdmin() {
  const loginArea = $('#loginArea');
  const adminArea = $('#adminArea');
  if (!loginArea || !adminArea) return;

  loginArea.classList.add('hidden');
  adminArea.classList.remove('hidden');
  adminArea.classList.add('active');
  adminArea.setAttribute('aria-hidden', 'false');
  renderAll();
}

function showLogin() {
  const loginArea = $('#loginArea');
  const adminArea = $('#adminArea');
  if (!loginArea || !adminArea) return;

  adminArea.classList.add('hidden');
  adminArea.classList.remove('active');
  adminArea.setAttribute('aria-hidden', 'true');
  loginArea.classList.remove('hidden');
}

function renderRecords() {
  const searchInput = $('#recordSearch');
  const barberSelect = $('#recordBarber');
  const search = (searchInput?.value || '').trim().toLowerCase();
  const selectedBarber = barberSelect?.value || '';

  const filtered = getRecords().map(normalizedRecord).filter((record) => {
    const matchesSearch = !search
      || record.client.toLowerCase().includes(search)
      || record.barber.toLowerCase().includes(search);
    const matchesBarber = !selectedBarber || record.barber === selectedBarber;
    return matchesSearch && matchesBarber;
  });

  fillTable($('#allTable'), filtered);
}

function renderBarbers() {
  const container = $('#barberCards');
  if (!container) return;

  const records = getRecords().map(normalizedRecord);
  container.innerHTML = BARBERS.map((barber) => {
    const ownRecords = records.filter((record) => record.barber === barber);
    const total = ownRecords.reduce((sum, record) => sum + record.value, 0);
    const average = ownRecords.length ? total / ownRecords.length : 0;

    return `<article class="barber-card">
      <h3>${safe(barber)}</h3>
      <strong>${money(total)}</strong>
      <div class="metric-row"><span>Atendimentos</span><b>${ownRecords.length}</b></div>
      <div class="metric-row"><span>Ticket médio</span><b>${money(average)}</b></div>
    </article>`;
  }).join('');
}

function clientSummary() {
  const clients = {};

  getRecords().map(normalizedRecord).forEach((record) => {
    const key = record.client.trim().toLowerCase();
    if (!key) return;

    if (!clients[key]) {
      clients[key] = { name: record.client, count: 0, total: 0, last: record };
    }

    clients[key].count += 1;
    clients[key].total += record.value;
    if (recordDate(record) > recordDate(clients[key].last)) clients[key].last = record;
  });

  return Object.values(clients).sort((a, b) => b.count - a.count);
}

function renderClients() {
  const container = $('#clientCards');
  if (!container) return;

  const search = ($('#clientSearch')?.value || '').trim().toLowerCase();
  const clients = clientSummary().filter((client) => client.name.toLowerCase().includes(search));

  container.innerHTML = clients.length
    ? clients.map((client) => `<article class="client-card">
        <h3>${safe(client.name)}</h3>
        <div class="metric-row"><span>Visitas</span><b>${client.count}</b></div>
        <div class="metric-row"><span>Total gasto</span><b>${money(client.total)}</b></div>
        <div class="metric-row"><span>Último atendimento</span><b>${formatDate(client.last.date)}</b></div>
        <div class="metric-row"><span>Barbeiro</span><b>${safe(client.last.barber)}</b></div>
      </article>`).join('')
    : '<article class="client-card">Nenhum cliente encontrado.</article>';
}

function renderAll() {
  const records = getRecords().map(normalizedRecord);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const day = period(records, (record) => sameDay(recordDate(record), now));
  const week = period(records, (record) => {
    const date = recordDate(record);
    return date >= weekStart && date <= now;
  });
  const month = period(records, (record) => {
    const date = recordDate(record);
    return date >= monthStart && date <= now;
  });

  const adminDate = $('#adminDate');
  if (adminDate) {
    adminDate.textContent = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(now);
  }

  if ($('#dayRevenue')) $('#dayRevenue').textContent = money(day.total);
  if ($('#weekRevenue')) $('#weekRevenue').textContent = money(week.total);
  if ($('#monthRevenue')) $('#monthRevenue').textContent = money(month.total);
  if ($('#dayCount')) $('#dayCount').textContent = `${day.count} atendimento${day.count === 1 ? '' : 's'}`;
  if ($('#weekCount')) $('#weekCount').textContent = `${week.count} atendimento${week.count === 1 ? '' : 's'}`;
  if ($('#monthCount')) $('#monthCount').textContent = `${month.count} atendimento${month.count === 1 ? '' : 's'}`;

  fillTable($('#recentTable'), records.slice(0, 8));
  renderRecords();
  renderBarbers();
  renderClients();
}

function initializeAdmin() {
  const loginForm = $('#loginForm');
  const logoutButton = $('#logout');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const username = ($('#username')?.value || '').trim();
      const password = $('#password')?.value || '';
      const error = $('#loginError');

      if (username === LOGIN.user && password === LOGIN.password) {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (error) error.textContent = '';
        showAdmin();
      } else if (error) {
        error.textContent = 'Usuário ou senha incorretos.';
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin();
    });
  }

  $$('[data-admin-page]').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.side-link').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      $$('.admin-page').forEach((page) => page.classList.remove('active'));
      const target = document.getElementById(button.dataset.adminPage);
      if (target) target.classList.add('active');
    });
  });

  $('#recordSearch')?.addEventListener('input', renderRecords);
  $('#recordBarber')?.addEventListener('change', renderRecords);
  $('#clientSearch')?.addEventListener('input', renderClients);

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showAdmin();
  } else {
    showLogin();
  }
}

document.addEventListener('DOMContentLoaded', initializeAdmin);
