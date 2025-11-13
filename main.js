// Importar Firebase desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Configuración de Firebase (tuya)
const firebaseConfig = {
  apiKey: "AIzaSyBc0Ipret_1qDG0wXHtG2vqnO4xOq3T9Ew",
  authDomain: "futbol-dashboard.firebaseapp.com",
  projectId: "futbol-dashboard",
  storageBucket: "futbol-dashboard.firebasestorage.app",
  messagingSenderId: "459799326095",
  appId: "1:459799326095:web:b0b15cb43fe5a7c8bcaffa",
  databaseURL: "https://futbol-dashboard-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elementos del DOM
const form = document.getElementById('playerForm');
const nameInput = document.getElementById('playerName');
const goalsInput = document.getElementById('goals');
const assistsInput = document.getElementById('assists');
const select = document.getElementById('playerSelect');
const tableBody = document.querySelector('#scoreTable tbody');
const logDiv = document.getElementById('log');

// 🟢 Registrar cambios en la base de datos
function addLog(action) {
  const time = new Date().toLocaleString();
  const logRef = ref(db, 'logs/' + Date.now());
  set(logRef, { time, action });
}

// 🟢 Mostrar registros
function renderLog() {
  const logsRef = ref(db, 'logs/');
  onValue(logsRef, (snapshot) => {
    const logs = snapshot.val() || {};
    const logList = Object.values(logs).sort((a, b) => new Date(b.time) - new Date(a.time));
    logDiv.innerHTML = logList.map(l => `<div>🕒 ${l.time}: ${l.action}</div>`).join('');
  });
}

// 🟢 Mostrar tabla de jugadores
function renderTable() {
  const playersRef = ref(db, 'players/');
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data);
    players.sort((a, b) => b.goals - a.goals || b.assists - a.assists);

    tableBody.innerHTML = players.map((p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.goals}</td>
        <td>${p.assists}</td>
        <td><button class="delete-btn" data-name="${p.name}">Borrar</button></td>
      </tr>
    `).join('');

    // Actualizar lista desplegable
    select.innerHTML = '<option value="">Seleccionar jugador existente</option>';
    players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  });
}

// 🟢 Al seleccionar un jugador, cargar su nombre
select.addEventListener('change', () => {
  if (select.value) {
    nameInput.value = select.value;
  } else {
    nameInput.value = '';
  }
});

// 🟢 Agregar o actualizar jugador
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const goals = parseInt(goalsInput.value) || 0;
  const assists = parseInt(assistsInput.value) || 0;
  if (!name) return;

  const playerRef = ref(db, 'players/' + name);
  get(playerRef).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      update(playerRef, {
        goals: data.goals + goals,
        assists: data.assists + assists
      });
      addLog(`Actualizó "${name}" → +${goals} goles, +${assists} asistencias.`);
    } else {
      set(playerRef, { name, goals, assists });
      addLog(`Agregó nuevo jugador "${name}" con ${goals} goles y ${assists} asistencias.`);
    }
  });

  form.reset();
  select.value = '';
});

// 🟢 Eliminar jugador
tableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const name = e.target.dataset.name;
    if (confirm(`¿Eliminar a ${name}?`)) {
      remove(ref(db, 'players/' + name));
      addLog(`Se borró al jugador "${name}".`);
    }
  }
});

// Inicializar vistas
renderTable();
renderLog();
