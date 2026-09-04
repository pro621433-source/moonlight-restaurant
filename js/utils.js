// ============================================================
// UTILS - Fonctions partagées (toasts, localStorage, etc.)
// ============================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || (() => {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function getStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key) {
    localStorage.removeItem(key);
}

function formatPrice(price) {
    return `${price} CFA`;
}