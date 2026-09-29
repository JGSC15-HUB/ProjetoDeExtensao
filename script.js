const STORE = 'caveBarberRecords';
const $ = selector => document.querySelector(selector);
const pad = number => String(number).padStart(2, '0');

function localDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setNow() {
  const now = new Date();
  $('#date').value = localDate(now);
  $('#time').value = localTime(now);
}

function updateClock() {
  $('#liveClock').textContent = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || [];
  } catch {
    return [];
  }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

$('#serviceForm').addEventListener('submit', async event => {
  event.preventDefault();

  const record = {
    id: crypto.randomUUID?.() || Date.now().toString(),
    barber: $('#barber').value,
    client: $('#client').value.trim(),
    service: $('#service').value,
    date: $('#date').value,
    time: $('#time').value,
    value: Number($('#value').value),
    createdAt: new Date().toISOString()
  };

  if (!record.barber || !record.client || !record.service || !record.date || !record.time || Number.isNaN(record.value)) {
    showToast('Preencha todos os campos.');
    return;
  }

  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORE, JSON.stringify(records));

  /* GOOGLE SHEETS / N8N
  await fetch('SUA_URL_DO_WEBHOOK', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  */

  event.target.reset();
  setNow();
  showToast('Atendimento salvo com sucesso!');
});

setNow();
updateClock();
setInterval(updateClock, 30000);
