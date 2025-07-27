document.addEventListener('DOMContentLoaded', function () {
    // =================================================================
    // || KONFIGURasi ADMIN                                           ||
    // =================================================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAyLg7YBrguhmv0R_vnCmyX7-drEsHhvR-_cXhvnXESUGs4E1CYzdsJZMbgAAKK8LX/exec"; // <-- GANTI DENGAN URL ANDA
    const ADMIN_USER = "mjkwhen";
    const ADMIN_PASS = "mjkwhens";
    const API_KEY = "WhenStellariaMjk";

    // =================================================================
    // || Elemen DOM                                                  ||
    // =================================================================
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const refreshButton = document.getElementById('refresh-button');
    const loader = document.getElementById('loader');
    const ordersTable = document.getElementById('orders-table');
    const ordersTbody = document.getElementById('orders-tbody');
    const totalRevenueEl = document.getElementById('total-revenue');
    const memberSummaryEl = document.getElementById('member-summary');
    const togglePasswordButton = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-icon');
    
    // =================================================================
    // || FUNGSI UTAMA                                                ||
    // =================================================================

    // Fungsi untuk menampilkan/menyembunyikan password
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            if (type === 'password') {
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            } else {
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            }
        });
    }

    // Cek status login saat halaman dimuat
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showDashboard();
    }

    // Handler untuk form login
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            showDashboard();
        } else {
            loginError.textContent = 'Invalid username or password.';
            setTimeout(() => { loginError.textContent = ''; }, 3000);
        }
    });

    // Handler untuk logout
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        showLogin();
    });
    
    // Handler untuk refresh data
    refreshButton.addEventListener('click', fetchData);

    function showDashboard() {
        loginSection.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        fetchData();
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    }

    // Fungsi untuk mengambil data dari Google Sheet
    async function fetchData() {
        loader.style.display = 'block';
        ordersTable.classList.add('hidden');
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getOrders&apiKey=${API_KEY}`);
            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            renderTable(data);
            calculateSummary(data);

        } catch (error) {
            console.error('Error fetching data:', error);
            loader.innerHTML = `<p class="text-red-500">Failed to load data. Please try again.</p>`;
        } finally {
            // Kita tidak menyembunyikan loader di sini lagi agar pesan error tetap terlihat
            // tapi kita pastikan tabel tidak muncul jika ada error
            if (loader.innerHTML.includes('Failed')) {
                ordersTable.classList.add('hidden');
            } else {
                loader.style.display = 'none';
                ordersTable.classList.remove('hidden');
            }
        }
    }

    // Fungsi untuk merender tabel pesanan dengan nomor urut
    function renderTable(data) {
        ordersTbody.innerHTML = '';
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${new Date(row.Timestamp).toLocaleString('id-ID')}</td>
                <td>${row.Nama}</td>
                <td>${row.Email}</td>
                <td>${row['No. WhatsApp']}</td>
                <td class="whitespace-pre-wrap">${row.Pesanan}</td>
                <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(row.Total)}</td>
                <td><a href="${row['Link Bukti Bayar']}" target="_blank" class="text-purple-400 hover:underline">View Proof</a></td>
            `;
            ordersTbody.appendChild(tr);
        });
    }

    // Fungsi untuk kalkulasi rangkuman
    function calculateSummary(data) {
        // Total Pendapatan
        const totalRevenue = data.reduce((sum, row) => sum + parseFloat(row.Total || 0), 0);
        totalRevenueEl.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalRevenue);

        // Rangkuman per member
        const memberCounts = {
            'NAE': 0, 'YUNA': 0, 'ALICE': 0, 'MELODY': 0, 'ELLA': 0, 'Group Cheki': 0
        };

        data.forEach(row => {
            const pesanan = row.Pesanan || '';
            const lines = pesanan.split('\n');
            lines.forEach(line => {
                const match = line.match(/🧡NAE🧡|💛YUNA💛|💜ALICE💜|❤️MELODY❤️|💚ELLA💚|Group Cheki 🖤/);
                const quantityMatch = line.match(/\((\d+)x/);
                if (match && quantityMatch) {
                    const memberName = match[0].replace(/🧡|💛|💜|❤️|💚|🖤/g, '').trim();
                    const quantity = parseInt(quantityMatch[1], 10);
                    if (memberCounts.hasOwnProperty(memberName)) {
                        memberCounts[memberName] += quantity;
                    } else if (memberName === "Group Cheki") {
                         memberCounts['Group Cheki'] += quantity;
                    }
                }
            });
        });
        
        memberSummaryEl.innerHTML = '';
        for (const member in memberCounts) {
            memberSummaryEl.innerHTML += `
                <div class="text-sm">
                    <p class="font-semibold text-slate-300">${member}</p>
                    <p class="text-xl font-bold text-purple-300">${memberCounts[member]} Cheki</p>
                </div>
            `;
        }
    }
});