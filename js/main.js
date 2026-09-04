// ============================================================
// MAIN - SITE PUBLIC AVEC CHARGEMENT DEPUIS LES FICHIERS JSON
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- ÉLÉMENTS DOM ---
    const menuGrid = document.getElementById('menuGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cartBody = document.getElementById('cartBody');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartBadge = document.getElementById('cartBadgeMobile');
    const cartClear = document.getElementById('cartClear');
    const cartOrderBtn = document.getElementById('cartOrderBtn');
    const nightToggle = document.getElementById('nightModeToggle');
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('mainNav');
    const shareBtn = document.getElementById('shareLocationBtn');

    // --- DONNÉES PAR DÉFAUT (fallback si les fichiers JSON ne chargent pas) ---
    const DEFAULT_MENU = [
        { id: 1, name: 'Bruschetta', category: 'entrees', price: 2500, desc: 'Pain grillé, tomates, basilic, huile d\'olive', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69a?w=300' },
        { id: 2, name: 'Poulet Divin', category: 'plats', price: 5500, desc: 'Mariné 24h, grillé, sauce secrète', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300' }
    ];
    const DEFAULT_EVENT = {
        badge: 'Événement de la semaine',
        title: 'Soirée <span class="highlight">Afrobeat</span> &amp; Grillades',
        date: 'Samedi 4 Septembre 2026 · À partir de 20h',
        desc: 'Ambiance garantie avec DJ Kaysha.',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200'
    };

    // --- CHARGEMENT DES DONNÉES DEPUIS LES FICHIERS JSON ---
    async function loadData() {
        let menu = [];
        let eventData = {};

        try {
            const menuRes = await fetch('/content/menu.json');
            if (menuRes.ok) {
                menu = await menuRes.json();
                menu = menu.map((item, index) => ({ ...item, id: item.id || index + 1 }));
            } else {
                console.warn('Menu JSON non trouvé, utilisation des valeurs par défaut.');
                menu = DEFAULT_MENU;
            }
        } catch (e) {
            console.warn('Erreur chargement menu:', e);
            menu = DEFAULT_MENU;
        }

        try {
            const eventRes = await fetch('/content/event.json');
            if (eventRes.ok) {
                eventData = await eventRes.json();
            } else {
                console.warn('Event JSON non trouvé, utilisation des valeurs par défaut.');
                eventData = DEFAULT_EVENT;
            }
        } catch (e) {
            console.warn('Erreur chargement event:', e);
            eventData = DEFAULT_EVENT;
        }

        window.moonlightMenu = menu;
        window.moonlightEvent = eventData;

        renderEvent(eventData);
        renderMenu(menu, 'all');
    }

    // --- AFFICHAGE ÉVÉNEMENT ---
    function renderEvent(data) {
        if (!data) return;
        document.getElementById('eventBadge').textContent = data.badge || 'Événement';
        document.getElementById('eventTitle').innerHTML = data.title || 'Soirée spéciale';
        document.getElementById('eventDate').innerHTML = `<i class="fas fa-clock"></i> ${data.date || ''}`;
        document.getElementById('eventDesc').textContent = data.desc || '';
        const hero = document.getElementById('hero');
        if (data.image) {
            hero.style.backgroundImage = `url('${data.image}')`;
        }
    }

    // --- AFFICHAGE MENU ---
    function renderMenu(items, filter = 'all') {
        if (!items || !items.length) {
            menuGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary);">Aucun article. Ajoutez-en dans l'admin !</p>`;
            return;
        }
        const filtered = filter === 'all' ? items : items.filter(item => item.category === filter);
        if (!filtered.length) {
            menuGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary);">Aucun article dans cette catégorie.</p>`;
            return;
        }
        menuGrid.innerHTML = filtered.map(item => `
            <div class="menu-card" data-id="${item.id}">
                <img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'}" alt="${item.name}" loading="lazy" />
                <div class="menu-card-body">
                    <h3>${item.name}</h3>
                    <div class="price">${formatPrice(item.price)}</div>
                    <div class="desc">${item.desc || ''}</div>
                    <div class="menu-card-actions">
                        <div class="qty-control">
                            <button class="qty-minus" data-id="${item.id}">-</button>
                            <span class="qty-value" data-id="${item.id}">1</span>
                            <button class="qty-plus" data-id="${item.id}">+</button>
                        </div>
                        <button class="btn-add" data-id="${item.id}">Ajouter</button>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const span = document.querySelector(`.qty-value[data-id="${id}"]`);
                let val = parseInt(span.textContent);
                if (val > 1) span.textContent = val - 1;
            });
        });
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const span = document.querySelector(`.qty-value[data-id="${id}"]`);
                let val = parseInt(span.textContent);
                span.textContent = val + 1;
            });
        });
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const qtySpan = document.querySelector(`.qty-value[data-id="${id}"]`);
                const qty = parseInt(qtySpan.textContent);
                addToCart(id, qty);
            });
        });
    }

    // --- PANIER (localStorage) ---
    function addToCart(id, qty) {
        const items = window.moonlightMenu || [];
        const item = items.find(i => i.id === id);
        if (!item) return;
        let cartItems = getStorage('moonlightCart', []);
        const existing = cartItems.find(i => i.id === id);
        if (existing) {
            existing.qty += qty;
        } else {
            cartItems.push({ ...item, qty });
        }
        setStorage('moonlightCart', cartItems);
        renderCart();
        showToast(`${item.name} (×${qty}) ajouté au panier`, 'success');
    }

    function removeFromCart(id) {
        let cartItems = getStorage('moonlightCart', []);
        cartItems = cartItems.filter(i => i.id !== id);
        setStorage('moonlightCart', cartItems);
        renderCart();
        showToast('Article retiré du panier', 'warning');
    }

    function clearCart() {
        if (confirm('Vider le panier ?')) {
            setStorage('moonlightCart', []);
            renderCart();
            showToast('Panier vidé', 'warning');
        }
    }

    function renderCart() {
        const cartItems = getStorage('moonlightCart', []);
        const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        const count = cartItems.reduce((sum, i) => sum + i.qty, 0);
        cartBadge.textContent = count;
        cartTotalPrice.textContent = formatPrice(total);
        if (!cartItems.length) {
            cartBody.innerHTML = `<p class="cart-empty">Votre panier est vide.</p>`;
            return;
        }
        cartBody.innerHTML = cartItems.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-qty">×${item.qty}</div>
                </div>
                <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
                <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                removeFromCart(parseInt(this.dataset.id));
            });
        });
    }

    function generateWhatsAppMessage() {
        const cartItems = getStorage('moonlightCart', []);
        if (!cartItems.length) {
            showToast('Votre panier est vide', 'error');
            return null;
        }
        const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        let msg = '🍽️ *Ma commande Moonlight* 🍽️\n\n';
        cartItems.forEach(i => {
            msg += `• ${i.name} ×${i.qty} = ${formatPrice(i.price * i.qty)}\n`;
        });
        msg += `\n📦 *Total : ${formatPrice(total)}*\n`;
        msg += `\n📍 *Adresse :* Dan la von Enface Agence administrative MTN Calavi, Abomey Calavi\n`;
        msg += `📞 *Téléphone :* 01 41 90 77 77\n`;
        return encodeURIComponent(msg);
    }

    function sendWhatsAppOrder() {
        const msg = generateWhatsAppMessage();
        if (!msg) return;
        const phone = '2290141907777';
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }

    // --- FILTRES ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const menu = window.moonlightMenu || [];
            renderMenu(menu, this.dataset.filter);
        });
    });

    // --- MODE NUIT ---
    nightToggle.addEventListener('click', function() {
        document.body.classList.toggle('night-mode');
        const icon = this.querySelector('i');
        if (document.body.classList.contains('night-mode')) {
            icon.className = 'fas fa-sun';
            showToast('Mode Nightclub activé 🌙', 'success');
        } else {
            icon.className = 'fas fa-moon';
            showToast('Mode Bar & Restaurant activé ☀️', 'success');
        }
    });

    // --- HAMBURGER ---
    hamburger.addEventListener('click', function() {
        nav.classList.toggle('open');
    });

    // --- TRIPLE-CLIC SUR LE LOGO (ACCÈS ADMIN SECRET) ---
    const logo = document.getElementById('secretAdminLink');
    let clickCount = 0;
    let timer = null;
    logo.addEventListener('click', function(e) {
        clickCount++;
        if (clickCount === 1) {
            timer = setTimeout(() => { clickCount = 0; }, 600);
        } else if (clickCount === 3) {
            clearTimeout(timer);
            clickCount = 0;
            window.location.href = 'moonlight-41907777.html';
        }
    });

    // --- PARTAGER ---
    shareBtn.addEventListener('click', function() {
        const url = 'https://maps.google.com/maps?q=6.4602294,2.355331';
        if (navigator.share) {
            navigator.share({
                title: 'Moonlight Bar & Restaurant',
                text: 'Venez nous rejoindre !',
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                showToast('Lien Google Maps copié !', 'success');
            }).catch(() => {
                showToast('Impossible de copier le lien', 'error');
            });
        }
    });

    // --- VIDER PANIER & COMMANDER ---
    cartClear.addEventListener('click', clearCart);
    cartOrderBtn.addEventListener('click', sendWhatsAppOrder);

    // --- LANCEMENT ---
    loadData();
    renderCart();
});
