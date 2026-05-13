/* =========================================
   VIBE NATION - SCRIPT.JS
========================================= */

/* ========= APP STATE ========= */

let currentUser = JSON.parse(localStorage.getItem("vibeUser")) || null;

let users = JSON.parse(localStorage.getItem("vibeUsers")) || [];

let events = JSON.parse(localStorage.getItem("vibeEvents")) || [
  {
    id: 1,
    title: "Afro Vibes Festival",
    venue: "Nairobi",
    date: "2026-07-21",
    time: "7:00 PM",
    description:
      "Experience the biggest Afro music festival with top artists and DJs.",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop",
    price: 45,
    badge: "HOT"
  },

  {
    id: 2,
    title: "Neon Night Experience",
    venue: "Westlands",
    date: "2026-08-05",
    time: "9:00 PM",
    description:
      "The craziest neon themed nightlife experience in town.",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
    price: 30,
    badge: "VIP"
  },

  {
    id: 3,
    title: "Summer Wave Concert",
    venue: "Mombasa",
    date: "2026-09-10",
    time: "6:00 PM",
    description:
      "Feel the beach vibes and enjoy unforgettable live performances.",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
    price: 60,
    badge: "LIVE"
  }
];

let purchasedTickets =
  JSON.parse(localStorage.getItem("vibeTickets")) || [];

/* ========= APP START ========= */

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});

/* ========= AUTH ========= */

function checkAuth() {
  if (currentUser) {
    loadDashboard();
  } else {
    loadAuthScreen();
  }
}

function loadAuthScreen() {
  document.body.innerHTML = `

    <div class="auth-container">

      <div class="auth-wrapper">

        <div class="auth-header">
          <h1>Vibe Nation</h1>
          <p>Discover. Book. Experience The Vibe.</p>
        </div>

        <div id="login-box">

          <div class="auth-form">

            <h2>Welcome Back</h2>

            <input type="email"
            id="login-email"
            placeholder="Enter Email">

            <input type="password"
            id="login-password"
            placeholder="Enter Password">

            <button class="btn btn-primary btn-large"
            onclick="login()">
              Login
            </button>

            <p class="form-toggle">
              No account?
              <a href="#" onclick="showRegister()">
                Register
              </a>
            </p>

          </div>

        </div>

      </div>

    </div>
  `;
}

function showRegister() {
  document.getElementById("login-box").innerHTML = `

    <div class="auth-form">

      <h2>Create Account</h2>

      <input type="text"
      id="register-name"
      placeholder="Full Name">

      <input type="email"
      id="register-email"
      placeholder="Email">

      <input type="password"
      id="register-password"
      placeholder="Password">

      <button class="btn btn-primary btn-large"
      onclick="register()">
        Register
      </button>

      <p class="form-toggle">
        Already have an account?
        <a href="#" onclick="loadAuthScreen()">
          Login
        </a>
      </p>

    </div>
  `;
}

function register() {
  const name =
    document.getElementById("register-name").value;

  const email =
    document.getElementById("register-email").value;

  const password =
    document.getElementById("register-password").value;

  if (!name || !email || !password) {
    showAlert("Please fill all fields", "error");
    return;
  }

  const exists = users.find(user => user.email === email);

  if (exists) {
    showAlert("User already exists", "error");
    return;
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password
  };

  users.push(user);

  localStorage.setItem(
    "vibeUsers",
    JSON.stringify(users)
  );

  showAlert("Account created successfully");

  loadAuthScreen();
}

function login() {
  const email =
    document.getElementById("login-email").value;

  const password =
    document.getElementById("login-password").value;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    showAlert("Invalid credentials", "error");
    return;
  }

  currentUser = user;

  localStorage.setItem(
    "vibeUser",
    JSON.stringify(user)
  );

  showAlert("Login successful");

  loadDashboard();
}

function logout() {
  localStorage.removeItem("vibeUser");

  currentUser = null;

  showAlert("Logged out");

  loadAuthScreen();
}

/* ========= DASHBOARD ========= */

function loadDashboard() {
  document.body.innerHTML = `

  <nav class="navbar">

    <div class="logo">
      Vibe Nation
    </div>

    <div class="nav-links">

      <a href="#">Home</a>
      <a href="#">Events</a>
      <a href="#">Tickets</a>

      <button class="btn btn-secondary"
      onclick="logout()">
        Logout
      </button>

    </div>

  </nav>

  <section class="hero">

    <div class="hero-content">

      <div class="hero-badge">
        🔥 Welcome ${currentUser.name}
      </div>

      <h1>
        Discover The
        <span class="gradient-text">
          Ultimate Vibe
        </span>
      </h1>

      <p>
        Explore premium concerts, festivals
        and nightlife experiences.
      </p>

    </div>

  </section>

  <section class="section">

    <div class="section-title">

      <h2>Trending Events</h2>

      <p>
        Book your next unforgettable experience.
      </p>

    </div>

    <div class="events-grid"
    id="events-grid">

    </div>

  </section>

  <footer class="footer">

    © 2026 Vibe Nation. All Rights Reserved.

  </footer>
  `;

  renderEvents();
}

/* ========= EVENTS ========= */

function renderEvents() {
  const grid =
    document.getElementById("events-grid");

  grid.innerHTML = "";

  events.forEach(event => {
    grid.innerHTML += `

      <div class="event-card">

        <span class="event-badge">
          ${event.badge}
        </span>

        <img
        src="${event.image}"
        class="event-image">

        <div class="event-content">

          <h3>${event.title}</h3>

          <div class="event-meta">

            <span>📍 ${event.venue}</span>

            <span>📅 ${event.date}</span>

          </div>

          <p>
            ${event.description}
          </p>

          <div class="event-footer">

            <div class="price">
              $${event.price}
            </div>

            <button
            class="btn btn-primary"
            onclick="buyTicket(${event.id})">
              Buy Ticket
            </button>

          </div>

        </div>

      </div>
    `;
  });
}

/* ========= BUY TICKET ========= */

function buyTicket(id) {
  const event =
    events.find(e => e.id === id);

  const ticket = {
    id: Date.now(),
    user: currentUser.name,
    event: event.title,
    price: event.price,
    date: new Date().toLocaleDateString()
  };

  purchasedTickets.push(ticket);

  localStorage.setItem(
    "vibeTickets",
    JSON.stringify(purchasedTickets)
  );

  showAlert(
    `🎉 Ticket Purchased For ${event.title}`
  );
}

/* ========= ALERT ========= */

function showAlert(message, type = "success") {

  const alert = document.createElement("div");

  alert.className = `
    custom-alert
    ${type}
  `;

  alert.innerHTML = message;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.classList.add("show");
  }, 100);

  setTimeout(() => {
    alert.classList.remove("show");

    setTimeout(() => {
      alert.remove();
    }, 400);

  }, 3000);
}

/* ========= ALERT STYLE ========= */

const style = document.createElement("style");

style.innerHTML = `

.custom-alert{
  position:fixed;
  top:30px;
  right:30px;

  padding:18px 28px;

  border-radius:16px;

  color:white;

  font-weight:600;

  z-index:99999;

  transform:translateX(120%);
  transition:.4s;
}

.custom-alert.show{
  transform:translateX(0);
}

.custom-alert.success{
  background:linear-gradient(
    to right,
    #10b981,
    #059669
  );
}

.custom-alert.error{
  background:linear-gradient(
    to right,
    #ef4444,
    #dc2626
  );
}

`;

document.head.appendChild(style);