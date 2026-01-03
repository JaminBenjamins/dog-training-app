// App State
const state = {
    selectedService: null,
    selectedAmountUsd: 0,
    selectedAmountKes: 0,
    exchangeRate: 129.5, // Default fallback
    selectedDate: null, // Full date string e.g., "2026-01-15"
    selectedTime: null,
    currentStep: 1, // 1: Calendar, 2: Checkout, 3: Success
    currentMonth: new Date().getMonth(), // 0-11
    currentYear: new Date().getFullYear()
};

const servicePrices = {
    'Puppy Foundations': 199,
    'Obedience Mastery': 249,
    'Behavior Modification': 299
};

// Colors & Icons for high-end look
const COLORS = {
    primary: '#F59E0B',
    secondary: '#0F172A',
    textMuted: '#94A3B8'
};

// DOM Elements
const modal = document.getElementById('booking-modal');
const modalContainer = document.getElementById('modal-step-container');
const closeModalBtn = document.getElementById('close-modal');
const nav = document.querySelector('.navbar');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    handleNavbarScroll();
    fetchExchangeRate();

    // Set hero image
    const heroImg = document.getElementById('hero-image');
    if (heroImg) {
        heroImg.style.backgroundImage = "url('dogman_hero.png')";
    }
});

async function fetchExchangeRate() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates && data.rates.KES) {
            state.exchangeRate = data.rates.KES;
            console.log(`Real-time USD to KES rate: ${state.exchangeRate}`);
        }
    } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
    }
}

function initEventListeners() {
    // Booking Buttons
    document.querySelectorAll('.book-service, #hero-book-btn, #book-now-nav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const serviceName = e.target.dataset.service || 'Obedience Mastery';
            openBookingModal(serviceName);
        });
    });

    closeModalBtn.addEventListener('click', closeModal);

    window.addEventListener('scroll', handleNavbarScroll);
}

function handleNavbarScroll() {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

// Modal Management
function openBookingModal(serviceName) {
    state.selectedService = serviceName;
    state.selectedAmountUsd = servicePrices[serviceName] || 249;
    state.selectedAmountKes = Math.round(state.selectedAmountUsd * state.exchangeRate);

    state.currentStep = 1;
    state.selectedDate = null;
    state.selectedTime = null;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderStep();
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Rendering Logic
function renderStep() {
    modalContainer.innerHTML = '';

    if (state.currentStep === 1) {
        renderCalendar();
    } else if (state.currentStep === 2) {
        renderCheckout();
    } else if (state.currentStep === 3) {
        renderSuccess();
    }
}

function renderCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Calendar Logic
    const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let calendarHTML = `
        <div class="step-header">
            <h2>Book ${state.selectedService}</h2>
            <p>Select a date and time for your session.</p>
        </div>
        <div class="calendar-upgrade">
            <div class="calendar-header">
                <button onclick="changeMonth(-1)" class="nav-btn">←</button>
                <h3>${monthNames[state.currentMonth]} ${state.currentYear}</h3>
                <button onclick="changeMonth(1)" class="nav-btn">→</button>
            </div>
            <div class="calendar-grid">
                ${days.map(d => `<div class="weekday">${d}</div>`).join('')}
                ${Array(firstDay).fill('').map(() => `<div class="day empty"></div>`).join('')}
                ${Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(state.currentYear, state.currentMonth, day);
        const isPast = dateObj < today;
        const isSelected = state.selectedDate === dateStr;
        return `<button class="day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
                        ${isPast ? 'disabled' : ''} 
                        onclick="selectDate('${dateStr}')">${day}</button>`;
    }).join('')}
            </div>
        </div>
        
        <div class="time-selector-upgrade">
            ${state.selectedDate ? `
                <h4>Available Times for ${formatDisplayDate(state.selectedDate)}</h4>
                <div class="time-grid-upgrade">
                    ${['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(time => `
                        <button class="time-btn-upgrade ${state.selectedTime === time ? 'selected' : ''}" 
                            onclick="selectTime('${time}')">${time}</button>
                    `).join('')}
                </div>
            ` : `<p class="select-date-hint">Please select a date to view available times.</p>`}
        </div>

        <button class="btn btn-primary btn-full ${!state.selectedDate || !state.selectedTime ? 'disabled-btn' : ''}" 
            id="next-step" 
            ${!state.selectedDate || !state.selectedTime ? 'disabled' : ''} 
            onclick="goToStep(2)">
            Continue to Payment
        </button>
    `;
    modalContainer.innerHTML = calendarHTML;
}

function renderCheckout() {
    modalContainer.innerHTML = `
        <div class="step-header">
            <div class="mpesa-logo-container">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" class="mpesa-logo" onerror="this.src='https://via.placeholder.com/120x40?text=M-PESA'">
            </div>
            <h2>Lipa na M-PESA</h2>
            <p>Complete your booking for ${state.selectedService}</p>
        </div>
        <div class="checkout-details-upgrade mpesa-theme">
            <div class="detail-row">
                <span>Service</span>
                <span class="value">${state.selectedService}</span>
            </div>
            <div class="detail-row">
                <span>Total Amount</span>
                <span class="price-value KES">KES ${state.selectedAmountKes.toLocaleString()}</span>
            </div>
        </div>
        <form class="payment-form-upgrade mpesa-form" onsubmit="handleMpesaPayment(event)">
            <div class="form-group" style="margin-bottom: 2rem;">
                <label>M-Pesa Mobile Number</label>
                <div class="phone-input-container">
                    <span class="prefix">+254</span>
                    <input type="tel" id="mpesa-phone" placeholder="712345678" required pattern="[0-9]{9}" title="Please enter 9 digits (e.g., 712345678)">
                </div>
                <p class="input-hint">An STK Push will be sent to this number.</p>
            </div>
            <button type="submit" class="btn btn-mpesa">Send STK Push</button>
            <p class="secure-hint">Lipa na M-Pesa Online Secure Checkout</p>
        </form>
    `;
}

window.handleMpesaPayment = async function (e) {
    e.preventDefault();
    const phoneInput = document.getElementById('mpesa-phone').value;
    const fullPhone = '254' + phoneInput;
    state.mpesaPhone = '+' + fullPhone;

    // 1. Show Waiting View
    modalContainer.innerHTML = `
        <div class="mpesa-waiting-view">
            <div class="mpesa-loader-ring">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" class="mpesa-inner-logo">
                <div class="ring-spinner"></div>
            </div>
            <h2>Awaiting PIN Entry</h2>
            <p class="waiting-subtitle">We're sending an STK Push to <strong>${state.mpesaPhone}</strong>.</p>
            <div class="mpesa-instructions-card">
                <ol>
                    <li>A popup will appear on your phone automatically.</li>
                    <li>Enter your <strong>M-PESA PIN</strong> using the keypad.</li>
                    <li>Click <strong>OK</strong> to authorize the transaction.</li>
                </ol>
            </div>
            <div class="waiting-timer" id="stk-status">Initializing secure channel...</div>
            <button class="btn btn-outline btn-full" style="opacity: 0.6;" onclick="renderCheckout()">Cancel Payment</button>
        </div>
    `;

    try {
        // 2. Call backend STK Push
        const response = await fetch('/api/stkpush', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: fullPhone,
                amount: 1 // Sandbox testing amount
            })
        });

        const data = await response.json();
        console.log('STK Push Response:', data);

        if (response.ok && data.ResponseCode === '0') {
            document.getElementById('stk-status').innerText = 'Please check your phone...';
            state.checkoutRequestID = data.CheckoutRequestID;
            startPolling(data.CheckoutRequestID);
        } else {
            alert('M-Pesa Error: ' + (data.CustomerMessage || data.error || 'Failed to trigger STK Push'));
            renderCheckout();
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('An network error occurred. Please check if the server is running.');
        renderCheckout();
    }
};

async function startPolling(checkoutRequestID) {
    const statusEl = document.getElementById('stk-status');
    let attempts = 0;
    const maxAttempts = 20; // ~60 seconds

    const poll = setInterval(async () => {
        attempts++;
        statusEl.innerText = `Waiting for confirmation... (${attempts})`;

        try {
            const response = await fetch('/api/stkquery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ CheckoutRequestID: checkoutRequestID })
            });

            const data = await response.json();
            console.log('Poll Result:', data);

            if (data.ResultCode === '0') {
                clearInterval(poll);
                state.mpesaReceipt = data.MpesaReceiptNumber || 'N/A';
                state.currentStep = 3;
                renderStep();
            } else if (data.errorCode && data.errorCode !== '500.003.1001') {
                clearInterval(poll);
                alert('Payment Failed: ' + (data.errorMessage || 'Transaction cancelled or failed'));
                renderCheckout();
            }
        } catch (err) {
            console.error('Polling error:', err);
        }

        if (attempts >= maxAttempts) {
            clearInterval(poll);
            alert('Payment Timeout: We did not receive confirmation in time.');
            renderCheckout();
        }
    }, 3000);
}

function renderSuccess() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

    modalContainer.innerHTML = `
        <div class="success-view-upgrade">
            <div class="success-ring">
                <div class="check-icon">✓</div>
            </div>
            <h2>Payment Successful!</h2>
            <p>Your session has been confirmed and added to our schedule. We're excited to work with you!</p>
            
            <div class="receipt-card">
                <div class="receipt-header">
                    <span>Transaction Receipt</span>
                    <span>${dateStr}</span>
                </div>
                <div class="receipt-row">
                    <span>Receipt No</span>
                    <strong>${state.mpesaReceipt || 'QUERIED-STK'}</strong>
                </div>
                <div class="receipt-row">
                    <span>Service</span>
                    <strong>${state.selectedService}</strong>
                </div>
                <div class="receipt-row">
                    <span>Date & Time</span>
                    <strong>${formatDisplayDate(state.selectedDate)} @ ${state.selectedTime}</strong>
                </div>
                <div class="receipt-row">
                    <span>Amount Paid</span>
                    <strong class="amount-total">KES ${state.selectedAmountKes.toLocaleString()}</strong>
                </div>
            </div>

            <button class="btn btn-primary btn-full btn-large" onclick="closeModal()">Back to Dashboard</button>
            <p class="email-hint" style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                A copy of this receipt has been sent to your email.
            </p>
        </div>
    `;
}

// Interactivity Helpers
window.changeMonth = function (offset) {
    state.currentMonth += offset;
    if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    } else if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    }
    renderCalendar();
};

window.selectDate = function (date) {
    state.selectedDate = date;
    renderCalendar();
};

window.selectTime = function (time) {
    state.selectedTime = time;
    renderCalendar();
};

window.goToStep = function (step) {
    state.currentStep = step;
    renderStep();
};

function formatDisplayDate(dateStr) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}
