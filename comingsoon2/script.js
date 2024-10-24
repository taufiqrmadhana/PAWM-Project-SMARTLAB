
function toggleNavbar() {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('active');

    const hamburgerMenu = document.getElementById('hamburger-menu');
    if (navbar.classList.contains('active')) {
        hamburgerMenu.style.display = 'none';
    } else {
        hamburgerMenu.style.display = 'block';
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}
