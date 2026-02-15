import { API_BASE_URL } from './config.js';

(function () {
    var token = localStorage.getItem('token');
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    var adminRoles = ['master', 'admin', 'employee'];
    var loginItem = navLinks.querySelector('.login-link');
    var loginLi = loginItem ? loginItem.closest('li') : null;

    if (!token) return;

    fetch(API_BASE_URL + '/api/check-auth', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.authenticated) return;

            // Add Admin link if user has admin role
            if (adminRoles.includes(data.user.role)) {
                var adminLi = document.createElement('li');
                var adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.textContent = 'Admin';
                var currentPage = window.location.pathname;
                if (currentPage.includes('admin')) {
                    adminLink.classList.add('active');
                }
                adminLi.appendChild(adminLink);

                var aboutLink = navLinks.querySelector('a[href="about.html"]');
                var aboutLi = aboutLink ? aboutLink.closest('li') : null;
                if (aboutLi && aboutLi.nextSibling) {
                    navLinks.insertBefore(adminLi, aboutLi.nextSibling);
                } else {
                    navLinks.appendChild(adminLi);
                }
            }

            // Replace "Logga in" with "Logga ut"
            if (loginLi) {
                loginLi.innerHTML = '<a href="#" class="login-link" id="nav-logout-btn">' +
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>' +
                    '<polyline points="16 17 21 12 16 7"></polyline>' +
                    '<line x1="21" y1="12" x2="9" y2="12"></line>' +
                    '</svg> Logga ut</a>';

                document.getElementById('nav-logout-btn').addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('cart');
                    window.location.href = '/index.html';
                });
            }
        })
        .catch(function () { });
})();
