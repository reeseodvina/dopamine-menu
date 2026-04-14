const CATEGORIES = {
  entree: {
    accent: "#e8a020",
    tape: "#a8c8e8",
    stars: 1,
  },
  mains: {
    accent: "#4a9a5a",
    tape: "#f5d9b8",
    stars: 3,
  },
  dessert: {
    accent: "#c85a8a",
    tape: "#f0c8d8",
    stars: 2,
  },
  specials: {
    accent: "#7a6aaa",
    tape: "#d8d0f0",
    stars: 4,
  },
};

const DEFAULT_ITEMS = {
  entree:   ["Doodle for 10 minutes", "Play with your pet", "Make tea & sit quietly", "Stretch for 5 mins"],
  mains:    ["Go for a long walk", "Call a friend", "Cook a new recipe", "Read a book chapter"],
  dessert:  ["Get a sweet treat", "Watch one episode", "Browse a bookstore", "Take a long bath"],
  specials: ["Weekend day trip", "Concert or live show", "Spa day", "Try a new restaurant"],
};

// ================================
// STATE
// These variables hold everything
// that changes while the user interacts.
// ================================
let menuItems = {};     // { entree: [...], mains: [...], ... }
let totalStars = 0;
let activeCat  = "entree";

// Timer state
let timerMins     = 25;
let timerLeft     = null;   // seconds remaining, null = not started
let timerRunning  = false;
let timerInterval = null;
let timerActivity = "";

// ================================
// LOCALSTORAGE

function saveToStorage() {
  localStorage.setItem("dm_items", JSON.stringify(menuItems));
  localStorage.setItem("dm_stars", String(totalStars));
}

function loadFromStorage() {
  const savedItems = localStorage.getItem("dm_items");
  const savedStars = localStorage.getItem("dm_stars");

  // if saved data exists use it, otherwise use defaults
  menuItems   = savedItems ? JSON.parse(savedItems) : { ...DEFAULT_ITEMS };
  totalStars  = savedStars ? parseInt(savedStars)   : 0;
}

// ================================
// RENDER ITEMS
function renderCard(catId) {
  const card   = document.getElementById("card-" + catId);
  const cat    = CATEGORIES[catId];
  const items  = menuItems[catId];

  // build the HTML string for all items
  let html = items.map((item, index) => `
    <div class="item-row">
      <div class="dot" style="background:${cat.accent}"></div>
      <span class="itext">${item}</span>
      <button
        class="btn-t"
        style="color:${cat.accent}; border:1px solid ${cat.accent}55"
        onclick="openTimer('${catId}', '${item.replace(/'/g, "\\'")}')">
        ⏱
      </button>
      <button
        class="btn-o"
        style="background:${cat.accent}"
        onclick="orderItem('${catId}', '${item.replace(/'/g, "\\'")}', this)">
        ✓ order
      </button>
      <button
        class="btn-x"
        onclick="removeItem('${catId}', ${index})">
        ×
      </button>
    </div>
  `).join("");

  // add the input row at the bottom
  html += `
    <div class="add-row">
      <input
        class="add-inp"
        id="input-${catId}"
        placeholder="add something you love..."
        style="border-color:${cat.accent}44"
        onkeydown="if(event.key==='Enter') addItem('${catId}')"
      />
      <button
        class="btn-add"
        style="background:${cat.accent}"
        onclick="addItem('${catId}')">
        + add
      </button>
    </div>
  `;

  card.innerHTML = html;
}

// render all 4 cards at once
function renderAllCards() {
  Object.keys(CATEGORIES).forEach(catId => renderCard(catId));
}

// ================================
// UPDATE STARS DISPLAY

function updateStarsDisplay() {
  const count = totalStars;
  const label = count === 1 ? "1 star collected" : `${count} stars collected`;
  document.getElementById("stars-pill").textContent  = label;
  document.getElementById("stars-count").textContent = count + (count === 1 ? " star" : " stars");
}

// ================================
// TAB SWITCHING
// Removes .active from all tabs and pages,
// then adds it to the clicked ones.
// The CSS flipIn animation fires automatically
// because the class is being added fresh.
// ================================
function switchTab(catId) {
  activeCat = catId;

  // update tab buttons
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.cat === catId);
  });

  // update pages
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === "page-" + catId);
  });
}

// ================================
// ADD ITEM
// Reads the input for the current card,
// pushes to the array, re-renders, saves.
// ================================
function addItem(catId) {
  const input = document.getElementById("input-" + catId);
  const text  = input.value.trim();
  if (!text) return;

  menuItems[catId].push(text);
  renderCard(catId);         // re-render just this card
  saveToStorage();
  // no need to clear input — renderCard rebuilds the whole card
  // including a fresh empty input
}

// REMOVE ITEM

// ================================
function removeItem(catId, index) {
  menuItems[catId].splice(index, 1);
  renderCard(catId);
  saveToStorage();
}

// ================================
// ORDER ITEM
// ================================
function orderItem(catId, itemName, btn) {
  const cat = CATEGORIES[catId];

  // add stars
  totalStars += cat.stars;
  updateStarsDisplay();

  // save receipt entry to localStorage
  // receipt.html will read this same key
  const receipt = JSON.parse(localStorage.getItem("dm_receipt") || "[]");
  receipt.unshift({
    id:       Date.now(),
    activity: itemName,
    category: catId,
    stars:    cat.stars,
    time:     new Date().toISOString(),
  });
  localStorage.setItem("dm_receipt", JSON.stringify(receipt));

  // save stars
  saveToStorage();

  // button feedback
  const originalText = btn.textContent;
  const originalBg   = btn.style.background;
  btn.textContent    = "✓ done!";
  btn.style.background = "#a8c8a8";
  setTimeout(() => {
    btn.textContent    = originalText;
    btn.style.background = originalBg;
  }, 1600);
}

// ================================
// TIMER — OPEN MODAL
// ================================
function openTimer(catId, activityName) {
  timerActivity = activityName;
  timerLeft     = null;
  timerRunning  = false;
  timerMins     = 25;
  clearInterval(timerInterval);

  // reset display
  document.getElementById("modal-activity-name").textContent = `"${activityName}"`;
  document.getElementById("timer-display").textContent = "25:00";
  document.getElementById("btn-start").textContent     = "Start ▶";
  document.getElementById("btn-start").style.background = "#7aaad0";
  document.getElementById("btn-reset").style.display   = "none";
  document.getElementById("duration-picker").style.display = "flex";
  setTimerRingProgress(0);

  // mark 25m as selected by default
  document.querySelectorAll(".dur-btn").forEach(b => {
    b.classList.toggle("selected", b.dataset.mins === "25");
  });

  document.getElementById("modal-backdrop").classList.add("open");
}

function closeTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById("modal-backdrop").classList.remove("open");
}

// ================================
// TIMER — RING PROGRESS
// The SVG circle has a circumference
// of 2 * PI * 56 = 351.86px.
// stroke-dashoffset controls how much
// of the ring is "drawn".
// 351.86 = empty, 0 = full circle.
// ================================
function setTimerRingProgress(percent) {
  const circumference = 351.86;
  const offset = circumference - (percent / 100) * circumference;
  document.getElementById("timer-ring").style.strokeDashoffset = offset;
}

function updateTimerDisplay() {
  const m = Math.floor(timerLeft / 60);
  const s = timerLeft % 60;
  document.getElementById("timer-display").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

  const total   = timerMins * 60;
  const elapsed = total - timerLeft;
  setTimerRingProgress((elapsed / total) * 100);
}

// ================================
// TIMER — START / PAUSE
// The same button toggles start and pause.
// ================================
function startPauseTimer() {
  const btn = document.getElementById("btn-start");

  if (!timerRunning && timerLeft === null) {
    // first start
    timerLeft    = timerMins * 60;
    timerRunning = true;
    document.getElementById("duration-picker").style.display = "none";
    document.getElementById("btn-reset").style.display = "inline-block";
    btn.textContent = "Pause ⏸";

    timerInterval = setInterval(() => {
      timerLeft--;
      updateTimerDisplay();

      if (timerLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        btn.textContent = "Done! 🎉";
        btn.style.background = "#a8c8a8";
      }
    }, 1000);

  } else if (timerRunning) {
    // pause
    timerRunning = false;
    clearInterval(timerInterval);
    btn.textContent = "Resume ▶";

  } else {
    // resume
    timerRunning = true;
    btn.textContent = "Pause ⏸";

    timerInterval = setInterval(() => {
      timerLeft--;
      updateTimerDisplay();

      if (timerLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        btn.textContent = "Done! 🎉";
        btn.style.background = "#a8c8a8";
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft    = null;

  document.getElementById("btn-start").textContent    = "Start ▶";
  document.getElementById("btn-start").style.background = "#7aaad0";
  document.getElementById("btn-reset").style.display  = "none";
  document.getElementById("duration-picker").style.display = "flex";
  document.getElementById("timer-display").textContent =
    String(timerMins).padStart(2, "0") + ":00";
  setTimerRingProgress(0);
}


// ================================
function initEventListeners() {

  // tab switching
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.cat));
  });

  // timer modal close
  document.getElementById("modal-close").addEventListener("click", closeTimer);
  document.getElementById("btn-start").addEventListener("click", startPauseTimer);
  document.getElementById("btn-reset").addEventListener("click", resetTimer);

  // close modal when clicking outside the card
  document.getElementById("modal-backdrop").addEventListener("click", function(e) {
    if (e.target === this) closeTimer();
  });

  // duration picker buttons
  document.querySelectorAll(".dur-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      timerMins = parseInt(btn.dataset.mins);
      document.querySelectorAll(".dur-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("timer-display").textContent =
        String(timerMins).padStart(2, "0") + ":00";
    });
  });
}


function init() {
  loadFromStorage();
  renderAllCards();
  updateStarsDisplay();
  initEventListeners();
}

// runs when the DOM is fully parsed
document.addEventListener("DOMContentLoaded", init);