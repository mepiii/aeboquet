const STORAGE_KEY = 'aebouquet_cart';
const LIKED_KEY = 'aebouquet_liked';

let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let isLiked = JSON.parse(localStorage.getItem(LIKED_KEY)) || false;

// --- Inisialisasi Saat Halaman Dimuat ---
document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    updateCartBadge();
    toggleLikeButtonState(); // Set status tombol like pas load
});

function setActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('header.navbar a').forEach(link => {
        if (link.getAttribute('href') === page) link.classList.add('active-link');
    });
}

// --- Like Button ---
function toggleLike() {
    isLiked =!isLiked;
    localStorage.setItem(LIKED_KEY, JSON.stringify(isLiked));
    toggleLikeButtonState();
}

function toggleLikeButtonState() {
    const btn = document.getElementById('like-btn');
    if (btn) btn.classList.toggle('active', isLiked);
}

// --- Cart Core Functions ---
function addToCart(name, price) {
    const index = cart.findIndex(i => i.name === name);
    if (index > -1) {
        cart[index].quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateData();
}

function updateData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
    // Jika modal sedang terbuka, refresh ringkasannya juga
    const modal = document.getElementById('checkoutModal');
    if (modal && modal.style.display === "block") {
        renderSummary();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0? "block" : "none";
    }
}

// --- Modal Logic ---
function viewCart() {
    if (cart.length === 0) return alert("Keranjang belanja Anda masih kosong!");
    document.getElementById('checkoutModal').style.display = "block";
    renderSummary();
}

function closeModal() {
    document.getElementById('checkoutModal').style.display = "none";
}

function renderSummary() {
    const summaryDiv = document.getElementById('orderSummary');
    if (!summaryDiv) return;

    if (cart.length === 0) {
        summaryDiv.innerHTML = "<p style='text-align:center; font-size:1.4rem; padding: 2rem;'>Keranjang kosong.</p>";
        return;
    }

    let total = 0;
    let html = `<h3 style="font-size:1.8rem; margin-bottom:1.5rem; border-bottom:2px solid var(--pink); display:inline-block;">Ringkasan Pesanan</h3>`;

    cart.forEach((item, index) => {
        let subtotal = item.price * item.quantity;
        total += subtotal;
        html += `
            <div class="summary-item" style="display:flex; justify-content:space-between; align-items:center; font-size:1.4rem; margin-bottom:1rem; padding-bottom:0.5rem; border-bottom:1px dashed #ccc;">
                <div style="flex: 1; text-align: left;">
                    <span style="display:block; font-weight:600;">${item.name}</span>
                    <small style="color:var(--pink)">Rp ${subtotal.toLocaleString('id-ID')}</small>
                </div>

                <div style="display:flex; align-items:center; gap:12px; background: #fdf0f3; padding: 5px 10px; border-radius: 8px;">
                    <button onclick="changeQty(${index}, -1)" style="background:var(--pink); color:white; border:none; border-radius:4px; width:25px; height:25px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">-</button>

                    <span style="min-width:20px; text-align:center; font-weight:bold; color:#333;">${item.quantity}</span>

                    <button onclick="changeQty(${index}, 1)" style="background:var(--pink); color:white; border:none; border-radius:4px; width:25px; height:25px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
                </div>
            </div>
        `;
    });

    html += `
        <div style="margin-top:1.5rem; text-align:right; padding: 1rem; background: #fff; border-radius: 8px;">
            <p style="font-size:1.4rem;">Total: <strong style="color:var(--pink); font-size:1.8rem;">Rp ${total.toLocaleString('id-ID')}</strong></p>
        </div>
    `;

    summaryDiv.innerHTML = html;
}

// Hapus fungsi removeFromCart & removeItem yang lama. Cukup pake changeQty
function changeQty(index, delta) {
    if (index < 0 || index >= cart.length) return; // Validasi index

    cart[index].quantity += delta;

    // Jika kuantitas menjadi kurang dari 1, hapus item tersebut
    if (cart[index].quantity < 1) {
        cart.splice(index, 1);
    }

    updateData();

    // Jika keranjang kosong setelah dikurangi, tutup modal
    if (cart.length === 0) {
        closeModal();
    }
}

// --- Payment & Receipt Logic ---
function processPayment(event) {
    event.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const paymentElement = document.querySelector('input[name="pay"]:checked');

    if (!name ||!address ||!phone) return alert("Lengkapi semua data pengiriman!");
    if (!paymentElement) return alert("Pilih metode pembayaran!");

    const payment = paymentElement.value;
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const date = new Date().toLocaleDateString('id-ID', options);

    let total = 0;
    let productListHtml = "";

    cart.forEach((item) => {
        let subtotal = item.price * item.quantity;
        total += subtotal;
        productListHtml += `
            <div style="display: flex; justify-content: space-between; font-size: 1.3rem; margin-bottom: 0.5rem;">
                <span>${item.name} (x${item.quantity})</span>
                <span>Rp ${subtotal.toLocaleString('id-ID')}</span>
            </div>
        `;
    });

    let bankInfo = payment === "Transfer Bank"
       ? `<p>Transfer ke <strong>Bank Mandiri</strong>:</p><span class="account-number" id="accNum" style="font-size:1.6rem; color:var(--pink); font-weight:bold;">1234 567 890</span>`
        : `<p>Transfer ke <strong>DANA</strong>:</p><span class="account-number" id="accNum" style="font-size:1.6rem; color:var(--pink); font-weight:bold;">0838 3404 8238</span>`;

    closeModal();
    const mainContent = document.querySelector('main');
    if(mainContent) mainContent.style.display = "none";

    const receiptPage = document.getElementById('receiptPage');
    receiptPage.style.display = "block";

    document.getElementById('receiptContent').innerHTML = `
        <div id="captureArea" style="padding: 2rem; background: #fff; border-radius: 1rem; border: 1px solid #eee; font-family: 'Poppins', sans-serif;">
            <div style="text-align:center; margin-bottom: 1.5rem;">
                <h2 style="color:var(--pink); font-size: 2.5rem; font-family: 'Playfair Display', serif;">𝖆𝖊𝖇𝖔𝖚𝖖𝖚𝖊𝖙</h2>
                <p style="text-align:center; font-size: 1.1rem; color: #777;">${date}</p>
            </div>

            <div class="status-badge" style="background: var(--pink); color: #fff; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 5rem; font-size: 1.2rem; margin-bottom: 1rem;">Menunggu Pembayaran</div>
            <h3 style="font-size: 2.2rem; margin-bottom: 1rem;">Pesanan Berhasil, ${name}!</h3>

            <div style="text-align: left; margin: 1.5rem 0; padding: 1.5rem; background: #f9f9f9; border-radius: 1rem; border: 1px solid #eee;">
                <p style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 1rem;">Rincian Pengiriman:</p>
                <p style="font-size:1.2rem;"><strong>Alamat:</strong> ${address}</p>
                <p style="font-size:1.2rem;"><strong>No. HP:</strong> ${phone}</p>

                <p style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin: 1.5rem 0 1rem 0;">Produk:</p>
                ${productListHtml}
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--pink); font-weight: 700; font-size: 1.8rem; color: var(--pink);">
                    Total: Rp ${total.toLocaleString('id-ID')}
                </div>
            </div>

            <div class="payment-box" style="background: var(--light-pink); padding: 1.5rem; border-radius: 1rem; text-align:center;">
                ${bankInfo}
                <button type="button" onclick="copyText()" style="margin-top:1rem; background:var(--pink); color:#fff; border:none; padding: 0.5rem 1rem; border-radius:5px; cursor:pointer;">Salin Nomor</button>
            </div>
        </div>

        <button type="button" class="btn" onclick="downloadReceipt()" style="width: 100%; margin-top: 2rem; background: #27ae60;">
            <i class="fas fa-file-download"></i> Download Struk
        </button>
    `;

    // Reset data
    cart = [];
    localStorage.removeItem(STORAGE_KEY);
    updateCartBadge();
}

// FUNGSI DOWNLOAD GAMBAR
function downloadReceipt() {
    const element = document.getElementById('captureArea');
    if (typeof html2canvas === 'undefined') {
        return alert('Library html2canvas belum di-load!');
    }
    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Struk-Aebouquet.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function copyText() {
    const text = document.getElementById('accNum')?.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        alert("Nomor rekening berhasil disalin!");
    }).catch(() => {
        alert("Gagal menyalin. Browser tidak support.");
    });
}

// --- Utilities ---
function swapImg(id, img1, img2) {
    const el = document.getElementById(id);
    if (el) {
        el.src = el.src.includes(img1)? img2 : img1;
    }
}

function handleContact(event) {
    event.preventDefault();
    const name = document.getElementById('c_name').value;
    alert(`Terima kasih ${name}, pesan Anda telah terkirim!`);
    event.target.reset();
}

window.onclick = function(event) {
    const modal = document.getElementById('checkoutModal');
    if (event.target == modal) closeModal();
}

const TOKO_WA_NUMBER = '6282179965441'; 

function handleContact(event) {
    event.preventDefault();
    const name = document.getElementById('c_name').value.trim();
    const phone = document.getElementById('c_phone').value.trim();
    const subject = document.getElementById('c_subject').value;
    const msg = document.getElementById('c_msg').value.trim();
    
    if (!name || !phone || !subject || !msg) {
        return alert('Lengkapi semua data dulu ya!');
    }

    const text = `*Halloo 𝖆𝖊𝖇𝖔𝖚𝖖𝖚𝖊𝖙* 👋%0A%0A*Nama:* ${name}%0A*No. WA:* ${phone}%0A*Keperluan:* ${subject}%0A%0A*Pesan:*%0A${msg}%0A%0A_Dikirim dari website aebouquet_`;
    
    window.open(`https://wa.me/${TOKO_WA_NUMBER}?text=${text}`, '_blank');
    event.target.reset();
}

// Pasang event listener
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('contact-form')?.addEventListener('submit', handleContact);
});