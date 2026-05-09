// ============================================
// NOTIFICATION MANAGER
// ============================================

class NotificationManager {
    static notifications = [];

    static showNotification(message, type = 'success', duration = 3000) {
        const notification = {
            id: StorageManager.generateId(),
            message,
            type, // success, error, info, warning
            timestamp: new Date().toISOString()
        };

        this.notifications.push(notification);
        this.renderNotification(notification, duration);
    }

    static renderNotification(notification, duration) {
        const container = document.getElementById('notification-container') || this.createContainer();
        
        const notifEl = document.createElement('div');
        notifEl.className = `notification notification-${notification.type}`;
        notifEl.id = `notif-${notification.id}`;
        notifEl.innerHTML = `
            <div class="notification-content">
                <span>${notification.message}</span>
                <button onclick="closeNotification('${notification.id}')" class="notification-close">&times;</button>
            </div>
        `;

        container.appendChild(notifEl);

        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    static createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static removeNotification(id) {
        const notifEl = document.getElementById(`notif-${id}`);
        if (notifEl) {
            notifEl.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notifEl.remove(), 300);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    static getNotifications() {
        return this.notifications;
    }

    static simulateOrganizerNotification(eventTitle, customerName, quantity, tierName, revenue) {
        this.showNotification(
            `📬 ${customerName} bought ${quantity} ${tierName} ticket(s) for "${eventTitle}" - $${revenue.toFixed(2)} earned!`,
            'info',
            4000
        );
    }
}

// ============================================
// LOCAL STORAGE MANAGER
// ============================================

class StorageManager {
    static init() {
        // Initialize with default data if empty
        if (!localStorage.getItem('users')) {
            // Start with no users by default (no admin required)
            localStorage.setItem('users', JSON.stringify([]));
        }

        if (!localStorage.getItem('events')) {
            localStorage.setItem('events', JSON.stringify([]));
        }

        if (!localStorage.getItem('tickets')) {
            localStorage.setItem('tickets', JSON.stringify([]));
        }

        // no organizer-request queue needed (organizers register immediately)
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // User Operations
    static getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    static getUserById(id) {
        return this.getUsers().find(u => u.id === id);
    }

    static saveUser(user) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index > -1) {
            users[index] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem('users', JSON.stringify(users));
    }

    static deleteUser(id) {
        const users = this.getUsers().filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Event Operations
    static getEvents() {
        return JSON.parse(localStorage.getItem('events')) || [];
    }

    static getEventById(id) {
        return this.getEvents().find(e => e.id === id);
    }

    static saveEvent(event) {
        const events = this.getEvents();
        const index = events.findIndex(e => e.id === event.id);
        if (index > -1) {
            events[index] = event;
        } else {
            events.push(event);
        }
        localStorage.setItem('events', JSON.stringify(events));
    }

    static deleteEvent(id) {
        const events = this.getEvents().filter(e => e.id !== id);
        localStorage.setItem('events', JSON.stringify(events));
    }

    // Ticket Operations
    static getTickets() {
        return JSON.parse(localStorage.getItem('tickets')) || [];
    }

    static saveTicket(ticket) {
        const tickets = this.getTickets();
        tickets.push(ticket);
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }

    static getTicketsByUser(userId) {
        return this.getTickets().filter(t => t.buyerId === userId);
    }

    static getTicketsByEvent(eventId) {
        return this.getTickets().filter(t => t.eventId === eventId);
    }

    // No organizer approval queue — organizers become `organizer` immediately on registration
}

// ============================================
// AUTHENTICATION MANAGER
// ============================================

class AuthManager {
    static currentUser = null;

    static init() {
        StorageManager.init();
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
            this.currentUser = StorageManager.getUserById(userId);
        }
    }

    static register(name, email, password, role) {
        // Check if email already exists
        const users = StorageManager.getUsers();
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: StorageManager.generateId(),
            name,
            email,
            password, // In production, this should be hashed
            role: role === 'organizer' ? 'organizer' : 'user',
            createdAt: new Date().toISOString()
        };

        StorageManager.saveUser(newUser);

        return { success: true, message: 'Registration successful' };
    }

    static login(email, password) {
        const users = StorageManager.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUserId', user.id);
            return { success: true, user };
        }

        return { success: false, message: 'Invalid email or password' };
    }

    static logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUserId');
    }

    static getCurrentUser() {
        return this.currentUser;
    }

    static isAuthenticated() {
        return this.currentUser !== null;
    }
}

// ============================================
// EVENT MANAGER
// ============================================

class EventManager {
    static createEvent(eventData, organizerId) {
        const event = {
            id: StorageManager.generateId(),
            organizerId,
            title: eventData.title,
            description: eventData.description,
            venue: eventData.venue,
            date: eventData.date,
            time: eventData.time,
            image: eventData.image, // Base64 string
            ticketTiers: eventData.ticketTiers, // Array of { name, price, quantity }
            ticketsSold: 0,
            createdAt: new Date().toISOString()
        };

        StorageManager.saveEvent(event);
        return event;
    }

    static getEventsByOrganizer(organizerId) {
        return StorageManager.getEvents().filter(e => e.organizerId === organizerId);
    }

    static getAvailableTickets(eventId, tierId) {
        const event = StorageManager.getEventById(eventId);
        if (!event) return 0;

        const tier = event.ticketTiers.find((t, idx) => idx === tierId);
        if (!tier) return 0;

        const soldCount = StorageManager.getTickets()
            .filter(t => t.eventId === eventId && t.tierId === tierId)
            .length;

        return tier.quantity - soldCount;
    }

    static getTotalRevenue(organizerId) {
        const events = this.getEventsByOrganizer(organizerId);
        let revenue = 0;

        events.forEach(event => {
            const eventTickets = StorageManager.getTickets().filter(t => t.eventId === event.id);
            eventTickets.forEach(ticket => {
                revenue += ticket.price;
            });
        });

        return revenue;
    }

    static getTotalTicketsSold(organizerId) {
        const events = this.getEventsByOrganizer(organizerId);
        let total = 0;

        events.forEach(event => {
            const eventTickets = StorageManager.getTickets().filter(t => t.eventId === event.id);
            total += eventTickets.length;
        });

        return total;
    }

    static getEventAnalytics(organizerId) {
        const events = this.getEventsByOrganizer(organizerId);
        const analytics = {
            totalCapacity: 0,
            totalSold: 0,
            capacityPercentage: 0,
            revenueByTier: {}
        };

        events.forEach(event => {
            // Calculate capacity
            event.ticketTiers.forEach((tier, idx) => {
                analytics.totalCapacity += tier.quantity;
                if (!analytics.revenueByTier[tier.name]) {
                    analytics.revenueByTier[tier.name] = { sold: 0, revenue: 0, available: tier.quantity };
                }
            });

            // Calculate sold tickets and revenue
            const eventTickets = StorageManager.getTickets().filter(t => t.eventId === event.id);
            eventTickets.forEach(ticket => {
                analytics.totalSold++;
                if (analytics.revenueByTier[ticket.tierName]) {
                    analytics.revenueByTier[ticket.tierName].sold++;
                    analytics.revenueByTier[ticket.tierName].revenue += ticket.price;
                    analytics.revenueByTier[ticket.tierName].available--;
                }
            });
        });

        if (analytics.totalCapacity > 0) {
            analytics.capacityPercentage = Math.round((analytics.totalSold / analytics.totalCapacity) * 100);
        }

        return analytics;
    }
}

// ============================================
// TICKET MANAGER
// ============================================

class TicketManager {
    static purchaseTicket(eventId, tierId, quantity, buyerId, buyerName, price) {
        const event = StorageManager.getEventById(eventId);
        if (!event) return { success: false, message: 'Event not found' };

        const tier = event.ticketTiers[tierId];
        if (!tier) return { success: false, message: 'Ticket tier not found' };

        // Check availability
        const available = EventManager.getAvailableTickets(eventId, tierId);
        if (available < quantity) {
            return { success: false, message: 'Not enough tickets available' };
        }

        // Create ticket records
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
            const ticket = {
                id: StorageManager.generateId(),
                ticketId: `TKT-${StorageManager.generateId().toUpperCase()}`,
                eventId,
                eventTitle: event.title,
                tierId,
                tierName: tier.name,
                price: tier.price,
                buyerId,
                buyerName,
                purchaseDate: new Date().toISOString()
            };
            StorageManager.saveTicket(ticket);
            tickets.push(ticket);
        }

        // Send notification to organizer
        const organizer = StorageManager.getUserById(event.organizerId);
        if (organizer) {
            const totalRevenue = tier.price * quantity;
            NotificationManager.simulateOrganizerNotification(
                event.title,
                buyerName,
                quantity,
                tier.name,
                totalRevenue
            );
        }

        return { success: true, tickets };
    }

    static getRevenueBytier(eventId) {
        const event = StorageManager.getEventById(eventId);
        if (!event) return [];

        const revenue = {};
        event.ticketTiers.forEach((tier, idx) => {
            revenue[idx] = {
                name: tier.name,
                price: tier.price,
                sold: 0,
                revenue: 0
            };
        });

        const tickets = StorageManager.getTickets().filter(t => t.eventId === eventId);
        tickets.forEach(ticket => {
            if (revenue[ticket.tierId]) {
                revenue[ticket.tierId].sold++;
                revenue[ticket.tierId].revenue += ticket.price;
            }
        });

        return Object.values(revenue);
    }
}

// ============================================
// UI RENDERER
// ============================================

class UIRenderer {
    static renderApp() {
        const app = document.getElementById('app');
        
        if (!AuthManager.isAuthenticated()) {
            this.renderAuthPage();
        } else {
            this.renderDashboard();
        }
    }

    static renderAuthPage() {
        const app = document.getElementById('app');
        const template = document.getElementById('auth-template');
        app.innerHTML = template.innerHTML;
    }

    static renderDashboard() {
        const app = document.getElementById('app');
        const template = document.getElementById('dashboard-template');
        app.innerHTML = template.innerHTML;

        const user = AuthManager.getCurrentUser();
        document.getElementById('current-user-name').textContent = user.name;
        document.getElementById('current-user-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

        this.renderSidebar();
        this.renderMainContent();
    }

    static renderSidebar() {
        const user = AuthManager.getCurrentUser();
        const menuItems = document.getElementById('sidebar-menu-items');
        menuItems.innerHTML = '';

        const menuConfig = {
            user: [
                { name: 'Browse Events', id: 'browse-events' },
                { name: 'My Tickets', id: 'my-tickets' }
            ],
            organizer: [
                { name: 'Dashboard', id: 'organizer-dashboard' },
                { name: 'Create Event', id: 'create-event' }
            ],
            admin: [
                { name: 'Dashboard', id: 'admin-dashboard' },
                { name: 'Manage Users', id: 'admin-users' }
            ]
        };

        const items = menuConfig[user.role] || menuConfig.user;
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.name;
            a.dataset.page = item.id;
            a.className = item.id === 'browse-events' ? 'active' : '';
            a.onclick = (e) => {
                e.preventDefault();
                this.navigateTo(item.id);
            };
            li.appendChild(a);
            menuItems.appendChild(li);
        });
    }

    static navigateTo(page) {
        // Update active menu item
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            a.classList.remove('active');
            if (a.dataset.page === page) {
                a.classList.add('active');
            }
        });

        this.renderMainContent(page);
    }

    static renderMainContent(page = 'browse-events') {
        const user = AuthManager.getCurrentUser();
        const contentArea = document.getElementById('content-area');
        const pageTitle = document.getElementById('page-title');
        const headerActions = document.getElementById('header-actions');

        headerActions.innerHTML = '';

        const pageConfig = {
            'browse-events': { title: 'Browse Events', render: () => this.renderBrowseEvents() },
            'my-tickets': { title: 'My Tickets', render: () => this.renderMyTickets() },
            'organizer-dashboard': { title: 'Dashboard', render: () => this.renderOrganizerDashboard() },
            'create-event': { 
                title: 'Create Event', 
                render: () => this.renderCreateEvent(),
                action: null
            },
            
        };

        const config = pageConfig[page] || pageConfig['browse-events'];
        pageTitle.textContent = config.title;

        if (config.action) {
            headerActions.innerHTML = config.action;
        }

        config.render();
    }

    static renderBrowseEvents() {
        const contentArea = document.getElementById('content-area');
        const template = document.getElementById('user-dashboard-template');
        contentArea.innerHTML = template.innerHTML;

        this.displayEvents(StorageManager.getEvents());

        // Setup search and filter
        document.getElementById('search-events').addEventListener('input', () => this.filterEvents());
        document.getElementById('filter-date').addEventListener('change', () => this.filterEvents());
        document.querySelector('.btn-secondary')?.addEventListener('click', () => this.clearFilters());
    }

    static displayEvents(events) {
        const grid = document.getElementById('events-grid');
        grid.innerHTML = '';

        if (events.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No events found</p>';
            return;
        }

        events.forEach(event => {
            const card = this.createEventCard(event);
            grid.appendChild(card);
        });
    }

    static createEventCard(event) {
        const template = document.getElementById('event-card-template');
        const card = template.content.cloneNode(true);

        const eventCardImage = card.querySelector('.event-image');
        eventCardImage.src = event.image;

        const title = card.querySelector('.event-card-title');
        title.textContent = event.title;

        const venue = card.querySelector('.event-card-venue');
        venue.textContent = `📍 ${event.venue}`;

        const date = card.querySelector('.date-badge');
        date.textContent = new Date(event.date).toLocaleDateString();

        const time = card.querySelector('.time-badge');
        time.textContent = event.time;

        const description = card.querySelector('.event-card-description');
        description.textContent = event.description;

        // Calculate if sold out
        let isSoldOut = true;
        event.ticketTiers.forEach((tier, idx) => {
            const available = EventManager.getAvailableTickets(event.id, idx);
            if (available > 0) isSoldOut = false;
        });

        const badge = card.querySelector('.event-status-badge');
        if (isSoldOut) {
            badge.textContent = 'Sold Out';
            badge.classList.add('sold-out');
        } else {
            badge.textContent = 'Available';
        }

        const viewBtn = card.querySelector('.btn');
        viewBtn.dataset.eventId = event.id;
        viewBtn.onclick = (e) => {
            e.preventDefault();
            this.openEventDetails(event);
        };

        const cardElement = document.createElement('div');
        cardElement.appendChild(card);
        return cardElement.firstChild;
    }

    static openEventDetails(event) {
        const template = document.getElementById('event-details-template');
        const modal = template.content.cloneNode(true);

        document.body.appendChild(modal);

        // Populate event details
        document.getElementById('modal-event-image').src = event.image;
        document.getElementById('modal-event-title').textContent = event.title;
        document.getElementById('modal-event-venue').textContent = event.venue;
        document.getElementById('modal-event-date').textContent = new Date(event.date).toLocaleDateString();
        document.getElementById('modal-event-time').textContent = event.time;
        document.getElementById('modal-event-description').textContent = event.description;

        // Populate ticket tiers
        const ticketOptions = document.getElementById('ticket-options');
        ticketOptions.innerHTML = '';

        event.ticketTiers.forEach((tier, idx) => {
            const available = EventManager.getAvailableTickets(event.id, idx);
            const option = document.createElement('label');
            option.className = 'ticket-option';
            option.innerHTML = `
                <input type="radio" name="ticket-tier" value="${idx}" ${idx === 0 ? 'checked' : ''} 
                    ${available === 0 ? 'disabled' : ''}>
                <div class="ticket-option-label">
                    <span>${tier.name}</span>
                    <span>$${tier.price.toFixed(2)} (${available} left)</span>
                </div>
            `;
            option.disabled = available === 0;
            ticketOptions.appendChild(option);

            option.addEventListener('change', () => {
                window.currentEventId = event.id;
                window.selectedEventData = event;
                this.updateTotalPrice();
            });
        });

        window.currentEventId = event.id;
        window.selectedEventData = event;

        // Setup quantity and price calculation
        const quantityInput = document.getElementById('ticket-quantity');
        quantityInput.addEventListener('input', () => this.updateTotalPrice());

        this.updateTotalPrice();
    }

    static updateTotalPrice() {
        const selectedTier = document.querySelector('input[name="ticket-tier"]:checked');
        const quantity = parseInt(document.getElementById('ticket-quantity').value) || 1;

        if (selectedTier && window.selectedEventData) {
            const tierIdx = parseInt(selectedTier.value);
            const tier = window.selectedEventData.ticketTiers[tierIdx];
            const total = tier.price * quantity;
            document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
        }
    }

    static renderMyTickets() {
        const contentArea = document.getElementById('content-area');
        const user = AuthManager.getCurrentUser();
        const userTickets = StorageManager.getTicketsByUser(user.id);

        const template = document.getElementById('purchased-tickets-template');
        contentArea.innerHTML = template.innerHTML;

        const grid = document.getElementById('tickets-grid');
        grid.innerHTML = '';

        if (userTickets.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">You have not purchased any tickets yet.</p>';
            return;
        }

        userTickets.forEach(ticket => {
            const ticketTemplate = document.getElementById('ticket-card-template');
            const ticketCard = ticketTemplate.content.cloneNode(true);
            ticketCard.querySelector('#ticket-event-name').textContent = ticket.eventTitle;
            ticketCard.querySelector('#ticket-id').textContent = ticket.ticketId;
            ticketCard.querySelector('#ticket-category').textContent = ticket.tierName;
            ticketCard.querySelector('#ticket-price').textContent = `$${ticket.price.toFixed(2)}`;
            ticketCard.querySelector('#ticket-buyer').textContent = ticket.buyerName;
            ticketCard.querySelector('#ticket-purchase-date').textContent = new Date(ticket.purchaseDate).toLocaleDateString();

            // Generate QR code placeholder
            const qrDiv = ticketCard.querySelector('#ticket-qr-code');
            qrDiv.innerHTML = `<svg viewBox="0 0 100 100" width="100" height="100">
                <rect width="100" height="100" fill="white"/>
                <text x="50" y="50" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="black">${ticket.ticketId}</text>
            </svg>`;

            grid.appendChild(ticketCard);
        });
    }

    static renderCreateEvent() {
        const contentArea = document.getElementById('content-area');
        const template = document.getElementById('create-event-template');
        contentArea.innerHTML = template.innerHTML;

        // Add initial ticket category
        this.addTicketCategory();

        const form = document.getElementById('create-event-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleCreateEvent();
            });
        }
    }

    static renderOrganizerDashboard() {
        const contentArea = document.getElementById('content-area');
        const user = AuthManager.getCurrentUser();
        const template = document.getElementById('organizer-dashboard-template');
        contentArea.innerHTML = template.innerHTML;

        // Update stats
        const events = EventManager.getEventsByOrganizer(user.id);
        const analytics = EventManager.getEventAnalytics(user.id);
        
        document.getElementById('total-events').textContent = events.length;
        document.getElementById('total-revenue').textContent = `$${EventManager.getTotalRevenue(user.id).toFixed(2)}`;
        document.getElementById('total-tickets-sold').textContent = EventManager.getTotalTicketsSold(user.id);

        // Add capacity stat
        const statsContainer = document.querySelector('.dashboard-stats');
        if (!document.getElementById('capacity-stat')) {
            const capacityStat = document.createElement('div');
            capacityStat.id = 'capacity-stat';
            capacityStat.className = 'stat-card';
            capacityStat.innerHTML = `
                <h3>Capacity Used</h3>
                <p class="stat-value">${analytics.capacityPercentage}%</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${analytics.totalSold} of ${analytics.totalCapacity} tickets</p>
            `;
            statsContainer.appendChild(capacityStat);
        }

        // Display events
        const eventsList = document.getElementById('organizer-events-list');
        eventsList.innerHTML = '';

        if (events.length === 0) {
            eventsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No events created yet.</p>';
            return;
        }

        // Add revenue breakdown section
        const breakdownContainer = document.createElement('div');
        breakdownContainer.style.marginTop = '2rem';
        breakdownContainer.style.paddingTop = '2rem';
        breakdownContainer.style.borderTop = '1px solid var(--border-color)';
        breakdownContainer.innerHTML = '<h3>Revenue Breakdown by Ticket Tier</h3>';

        const tierTable = document.createElement('div');
        tierTable.className = 'tier-breakdown-table';
        tierTable.style.marginTop = '1rem';

        if (Object.keys(analytics.revenueByTier).length === 0) {
            tierTable.innerHTML = '<p style="color: var(--text-secondary);">No ticket sales yet</p>';
        } else {
            tierTable.innerHTML = `
                <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 1rem; padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem; font-weight: 600; border-bottom: 2px solid var(--border-color);">
                    <div>Ticket Tier</div>
                    <div>Sold</div>
                    <div>Available</div>
                    <div>Revenue</div>
                </div>
            `;

            Object.keys(analytics.revenueByTier).forEach(tierName => {
                const tier = analytics.revenueByTier[tierName];
                const row = document.createElement('div');
                row.style.cssText = 'display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-color); align-items: center;';
                row.innerHTML = `
                    <div style="font-weight: 600;">${tierName}</div>
                    <div style="color: var(--primary-color);">${tier.sold}</div>
                    <div style="color: var(--text-secondary);">${tier.available}</div>
                    <div style="color: var(--success-color); font-weight: 600;">$${tier.revenue.toFixed(2)}</div>
                `;
                tierTable.appendChild(row);
            });
        }

        breakdownContainer.appendChild(tierTable);
        eventsList.parentElement.appendChild(breakdownContainer);

        // Display events table
        events.forEach(event => {
            const row = document.createElement('div');
            row.className = 'event-row';
            const tickets = StorageManager.getTickets().filter(t => t.eventId === event.id);
            const totalCapacity = event.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
            const capacity = Math.round((tickets.length / totalCapacity) * 100) || 0;
            
            row.innerHTML = `
                <div>${event.title}</div>
                <div>${new Date(event.date).toLocaleDateString()}</div>
                <div>${tickets.length}/${totalCapacity} (${capacity}%)</div>
                <div>$${tickets.reduce((sum, t) => sum + t.price, 0).toFixed(2)}</div>
                <div>
                    <button onclick="deleteEvent('${event.id}')" class="btn btn-danger btn-small">Delete</button>
                </div>
            `;
            eventsList.appendChild(row);
        });
    }

    

    static filterEvents() {
        const searchTerm = document.getElementById('search-events').value.toLowerCase();
        const dateFilter = document.getElementById('filter-date').value;
        let events = StorageManager.getEvents();

        // Filter by search term
        if (searchTerm) {
            events = events.filter(e => 
                e.title.toLowerCase().includes(searchTerm) || 
                e.description.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by date
        if (dateFilter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            events = events.filter(e => {
                const eventDate = new Date(e.date);
                eventDate.setHours(0, 0, 0, 0);

                if (dateFilter === 'today') {
                    return eventDate.getTime() === today.getTime();
                } else if (dateFilter === 'week') {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return eventDate >= today && eventDate <= weekEnd;
                } else if (dateFilter === 'month') {
                    const monthEnd = new Date(today);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);
                    return eventDate >= today && eventDate <= monthEnd;
                }
            });
        }

        this.displayEvents(events);
    }

    static clearFilters() {
        document.getElementById('search-events').value = '';
        document.getElementById('filter-date').value = '';
        this.displayEvents(StorageManager.getEvents());
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        NotificationManager.showNotification('Please enter email and password', 'warning');
        return;
    }

    const result = AuthManager.login(email, password);
    if (result.success) {
        NotificationManager.showNotification(`Welcome back, ${result.user.name}! 👋`, 'success', 2000);
        setTimeout(() => {
            UIRenderer.renderApp();
        }, 800);
    } else {
        NotificationManager.showNotification(result.message, 'error');
    }
}

function handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    if (!name || !email || !password || !confirmPassword) {
        NotificationManager.showNotification('Please fill all fields', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        NotificationManager.showNotification('Passwords do not match', 'error');
        return;
    }

    const result = AuthManager.register(name, email, password, role);
    if (result.success) {
        const message = '✅ Registration successful! Please login.';
        NotificationManager.showNotification(message, 'success', 3000);
        setTimeout(() => {
            toggleAuthForm();
        }, 1500);
    } else {
        NotificationManager.showNotification(result.message, 'error');
    }
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    }
}

function handleLogout() {
    AuthManager.logout();
    UIRenderer.renderApp();
}

function handleCreateEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const venue = document.getElementById('event-venue').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const imageInput = document.getElementById('event-image');
    // Basic validation (image optional)
    if (!title || !description || !venue || !date || !time) {
        NotificationManager.showNotification('Please fill title, description, venue, date and time', 'warning');
        return;
    }

    const file = imageInput.files && imageInput.files[0];

    const proceed = (image) => {
        const ticketCategories = [];
        document.querySelectorAll('.ticket-category-card').forEach(card => {
            const name = (card.querySelector('.ticket-name').value || '').trim();
            const price = parseFloat(card.querySelector('.ticket-price').value);
            let quantity = parseInt(card.querySelector('.ticket-quantity').value);
            if (isNaN(quantity) || quantity <= 0) quantity = 100;

            if (name && !isNaN(price) && price > 0) {
                ticketCategories.push({ name, price, quantity });
            }
        });

        if (ticketCategories.length === 0) {
            NotificationManager.showNotification('Please add at least one ticket category with a price', 'warning');
            return;
        }

        const user = AuthManager.getCurrentUser();
        const event = EventManager.createEvent({
            title,
            description,
            venue,
            date,
            time,
            image,
            ticketTiers: ticketCategories
        }, user.id);

        NotificationManager.showNotification(`✅ Event "${title}" created successfully!`, 'success', 4000);
        setTimeout(() => {
            UIRenderer.renderDashboard();
        }, 1000);
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => proceed(e.target.result);
        reader.readAsDataURL(file);
    } else {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='50%' fill='#94a3b8' font-size='36' text-anchor='middle' dominant-baseline='middle'>No Image Provided</text></svg>`;
        const placeholder = 'data:image/svg+xml;base64,' + btoa(svg);
        proceed(placeholder);
    }
}

function previewImage() {
    const input = document.getElementById('event-image');
    const preview = document.getElementById('image-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Utility: add default ticket tiers for main create form
function addDefaultTicketCategories() {
    const container = document.getElementById('ticket-categories');
    if (!container) return;
    const template = document.getElementById('ticket-category-template');
    const tiers = [
        { name: 'VVIP', price: '', quantity: 50 },
        { name: 'VIP', price: '', quantity: 100 },
        { name: 'Regular', price: '', quantity: 200 }
    ];
    tiers.forEach(t => {
        const card = template.content.cloneNode(true);
        container.appendChild(card);
        // set values after added
    });
    // Populate last added three cards with names/quantities
    const cards = container.querySelectorAll('.ticket-category-card');
    const last = Array.from(cards).slice(-3);
    last.forEach((card, idx) => {
        const nameInput = card.querySelector('.ticket-name');
        const priceInput = card.querySelector('.ticket-price');
        const qtyInput = card.querySelector('.ticket-quantity');
        if (nameInput) nameInput.value = tiers[idx].name;
        if (priceInput) priceInput.value = '';
        if (qtyInput) qtyInput.value = tiers[idx].quantity;
    });
}

function addTicketCategory() {
    const container = document.getElementById('ticket-categories');
    const template = document.getElementById('ticket-category-template');
    const card = template.content.cloneNode(true);
    container.appendChild(card);
}

function removeTicketCategory(btn) {
    btn.closest('.ticket-category-card').remove();
}

function purchaseTicket() {
    const user = AuthManager.getCurrentUser();
    const selectedTier = document.querySelector('input[name="ticket-tier"]:checked');
    const quantity = parseInt(document.getElementById('ticket-quantity').value);

    if (!selectedTier) {
        NotificationManager.showNotification('Please select a ticket tier', 'warning');
        return;
    }

    const tierId = parseInt(selectedTier.value);
    const tier = window.selectedEventData.ticketTiers[tierId];

    const result = TicketManager.purchaseTicket(
        window.currentEventId,
        tierId,
        quantity,
        user.id,
        user.name,
        tier.price
    );

    if (result.success) {
        const totalCost = (tier.price * quantity).toFixed(2);
        NotificationManager.showNotification(
            `✅ Successfully purchased ${quantity} ${tier.name} ticket(s) for $${totalCost}!`,
            'success',
            4000
        );
        closeModal();
        setTimeout(() => {
            UIRenderer.renderBrowseEvents();
        }, 1000);
    } else {
        NotificationManager.showNotification(result.message, 'error');
    }
}

function downloadTicket(btn) {
    NotificationManager.showNotification('📥 Ticket downloaded! (Ticket ID included)', 'success', 3000);
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        StorageManager.deleteEvent(eventId);
        NotificationManager.showNotification('Event deleted successfully', 'info', 2000);
        UIRenderer.renderMainContent('organizer-dashboard');
    }
}

function deleteAdminUser(userId) {
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

function openEventDetails(btn) {
    const card = btn.closest('.event-card');
    const title = card.querySelector('.event-card-title').textContent;
    const events = StorageManager.getEvents();
    const event = events.find(e => e.title === title);

    if (event) {
        UIRenderer.openEventDetails(event);
    }
}

function closeNotification(id) {
    NotificationManager.removeNotification(id);
}

// ============================================
// POST EVENT FORM HANDLERS
// ============================================

function showPostEventForm() {
    const container = document.getElementById('post-event-form-container');
    container.style.display = 'flex';

    // Add initial ticket category
    addQuickTicketCategory();

    // Set up form submission
    const form = document.getElementById('quick-create-event-form');
    if (form) {
        form.onsubmit = handleQuickCreateEvent;
    }
}

function hidePostEventForm() {
    const container = document.getElementById('post-event-form-container');
    container.style.display = 'none';

    // Clear form
    document.getElementById('quick-create-event-form').reset();
    document.getElementById('quick-image-preview').style.display = 'none';
    document.getElementById('quick-ticket-categories').innerHTML = '';
}

function addQuickTicketCategory() {
    const container = document.getElementById('quick-ticket-categories');
    const template = document.getElementById('ticket-category-template');
    const card = template.content.cloneNode(true);
    container.appendChild(card);
}

function addDefaultQuickTicketCategories() {
    const container = document.getElementById('quick-ticket-categories');
    if (!container) return;
    const template = document.getElementById('ticket-category-template');
    const tiers = [
        { name: 'VVIP', price: '', quantity: 50 },
        { name: 'VIP', price: '', quantity: 100 },
        { name: 'Regular', price: '', quantity: 200 }
    ];
    tiers.forEach(t => {
        const card = template.content.cloneNode(true);
        container.appendChild(card);
    });
    const cards = container.querySelectorAll('.ticket-category-card');
    const last = Array.from(cards).slice(-3);
    last.forEach((card, idx) => {
        const nameInput = card.querySelector('.ticket-name');
        const priceInput = card.querySelector('.ticket-price');
        const qtyInput = card.querySelector('.ticket-quantity');
        if (nameInput) nameInput.value = tiers[idx].name;
        if (priceInput) priceInput.value = '';
        if (qtyInput) qtyInput.value = tiers[idx].quantity;
    });
}

function previewQuickImage() {
    const input = document.getElementById('quick-event-image');
    const preview = document.getElementById('quick-image-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function handleQuickCreateEvent(e) {
    e.preventDefault();

    const title = document.getElementById('quick-event-title').value;
    const description = document.getElementById('quick-event-description').value;
    const venue = document.getElementById('quick-event-venue').value;
    const date = document.getElementById('quick-event-date').value;
    const time = document.getElementById('quick-event-time').value;
    const imageInput = document.getElementById('quick-event-image');
    // Basic validation (image optional)
    if (!title || !description || !venue || !date || !time) {
        NotificationManager.showNotification('Please fill title, description, venue, date and time', 'warning');
        return;
    }

    const file = imageInput.files && imageInput.files[0];

    const proceedWithImage = (image) => {
        // Collect ticket categories (require name and price, default quantity = 100)
        const ticketCategories = [];
        document.querySelectorAll('#quick-ticket-categories .ticket-category-card').forEach(card => {
            const name = (card.querySelector('.ticket-name').value || '').trim();
            const price = parseFloat(card.querySelector('.ticket-price').value);
            let quantity = parseInt(card.querySelector('.ticket-quantity').value);
            if (isNaN(quantity) || quantity <= 0) quantity = 100; // default quantity

            if (name && !isNaN(price) && price > 0) {
                ticketCategories.push({ name, price, quantity });
            }
        });

        if (ticketCategories.length === 0) {
            NotificationManager.showNotification('Please add at least one ticket category with a price', 'warning');
            return;
        }

        const user = AuthManager.getCurrentUser();
        const event = EventManager.createEvent({
            title,
            description,
            venue,
            date,
            time,
            image,
            ticketTiers: ticketCategories
        }, user.id);

        NotificationManager.showNotification(`✅ Event "${title}" posted successfully!`, 'success', 4000);
        hidePostEventForm();
        setTimeout(() => {
            UIRenderer.renderMainContent('organizer-dashboard');
        }, 1500);
    };

    if (file) {
        // Read provided image
        const reader = new FileReader();
        reader.onload = (e) => {
            proceedWithImage(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        // Use a lightweight SVG placeholder encoded as base64
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='50%' fill='#94a3b8' font-size='36' text-anchor='middle' dominant-baseline='middle'>No Image Provided</text></svg>`;
        const placeholder = 'data:image/svg+xml;base64,' + btoa(svg);
        proceedWithImage(placeholder);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
    UIRenderer.renderApp();
});
