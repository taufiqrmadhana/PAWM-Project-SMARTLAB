
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

let array = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
let delay = 1000; 

function createArrayElements() {
    const arrayContainer = document.getElementById('array-container');
    arrayContainer.innerHTML = '';
    array.forEach((num) => {
        const element = document.createElement('div');
        element.classList.add('array-element');
        element.textContent = num;
        arrayContainer.appendChild(element);
    });
}

async function startSearch() {
    const searchInput = document.getElementById('search-input');
    const searchValue = parseInt(searchInput.value);
    if (isNaN(searchValue)) {
        alert('Silakan masukkan angka yang valid untuk dicari.');
        return;
    }

    const status = document.getElementById('status');
    const arrayElements = document.getElementsByClassName('array-element');

    let left = 0;
    let right = array.length - 1;
    let found = false;
    let iteration = 1;

    while (left <= right) {
        for (let i = 0; i < arrayElements.length; i++) {
            arrayElements[i].classList.remove('highlighted', 'found', 'not-found');
        }

        let mid = Math.floor((left + right) / 2);
        arrayElements[mid].classList.add('highlighted');

        status.textContent = `Iterasi ${iteration}: Memeriksa indeks ${mid} (nilai ${array[mid]})...`;
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (array[mid] === searchValue) {
            arrayElements[mid].classList.add('found');
            status.textContent = `Angka ${searchValue} ditemukan pada indeks ${mid} setelah ${iteration} iterasi!`;
            found = true;
            break;
        } else if (array[mid] < searchValue) {
            for (let i = left; i <= mid; i++) {
                arrayElements[i].classList.add('not-found');
            }
            left = mid + 1;
        } else {
            for (let i = mid; i <= right; i++) {
                arrayElements[i].classList.add('not-found');
            }
            right = mid - 1;
        }

        iteration++;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!found) {
        status.textContent = `Angka ${searchValue} tidak ditemukan dalam array setelah ${iteration - 1} iterasi.`;
    }
}

createArrayElements();
