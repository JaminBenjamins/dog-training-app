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



// DOM Elements (initialized on load)
let modal, modalContainer, nav;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('booking-modal');
    modalContainer = document.getElementById('modal-step-container');
    nav = document.querySelector('.navbar');

    initEventListeners();
    handleNavbarScroll();
    fetchExchangeRate();

    // Set hero image
    const heroImg = document.getElementById('hero-image');
    if (heroImg) {
        const img = new Image();
        img.src = 'dogman_hero.png';

        img.onload = () => {
            heroImg.style.backgroundImage = `url('${img.src}')`;
            heroImg.classList.remove('image-skeleton');
        };

        img.onerror = () => {
            console.warn('Primary hero image failed, trying fallback...');
            const fallback = new Image();
            fallback.src = 'luxury_dog_training_hero.png';
            fallback.onload = () => {
                heroImg.style.backgroundImage = `url('${fallback.src}')`;
                heroImg.classList.remove('image-skeleton');
            };
            fallback.onerror = () => {
                heroImg.classList.remove('image-skeleton');
                heroImg.style.backgroundColor = '#1e293b'; // Fallback solid color
            };
        };
    }

    initTestimonialAutoScroll();
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

    // View Programs Scroll
    const viewProgramsBtn = document.getElementById('view-programs-btn');
    if (viewProgramsBtn) {
        viewProgramsBtn.addEventListener('click', () => {
            document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Modal Close - X Button
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Modal Close - Click Outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Modal Close - Escape Key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeLegal();
        }
    });

    // Legal Modal Close
    const closeLegalBtn = document.getElementById('close-legal');
    if (closeLegalBtn) {
        closeLegalBtn.addEventListener('click', closeLegal);
    }
    const legalModal = document.getElementById('legal-modal');
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) closeLegal();
        });
    }

    window.addEventListener('scroll', handleNavbarScroll);
}

function closeLegal() {
    const legalModal = document.getElementById('legal-modal');
    if (legalModal) legalModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.openLegal = function (type) {
    const body = document.getElementById('legal-body');
    const modal = document.getElementById('legal-modal');

    if (type === 'tos') {
        body.innerHTML = `
            <div class="legal-text">
                <h2>Terms of Service</h2>
                <p>Effective Date: January 1, 2026</p>
                
                <h3>1. Booking & Scheduling</h3>
                <p>All training sessions must be booked 48 hours in advance. Confirmation is subject to availability and payment of the designated fee via M-Pesa.</p>
                
                <h3>2. Cancellation & Rescheduling</h3>
                <p>We require at least 24 hours' notice for rescheduling or cancellation. Fees for sessions cancelled with less than 24 hours' notice are non-refundable.</p>
                
                <h3>3. Dog Health & Safety</h3>
                <p>Clients must provide proof of up-to-date vaccinations (Parvovirus, Distemper, Rabies) for all dogs attending training. We reserve the right to refuse service to dogs showing signs of contagious illness.</p>
                
                <h3>4. Liability Waiver</h3>
                <p>Training involves inherent risks. While we take every precaution, DOGMAN UNLEASHED 254 is not liable for any injury, loss, or damage to property or persons caused by a dog during or after training sessions.</p>
                
                <h3>5. Payments</h3>
                <p>All payments are processed securely through the Lipa na M-Pesa framework. Services will only be rendered after payment confirmation.</p>
            </div>
        `;
    } else {
        body.innerHTML = `
            <div class="legal-text">
                <h2>Privacy Policy</h2>
                <p>Compliance: Kenya Data Protection Act, 2019</p>

                <h3>1. Information Collection</h3>
                <p>We collect minimal personal data required for service delivery, including your name, email address, and M-Pesa mobile number.</p>

                <h3>2. Use of Information</h3>
                <p>Your data is used exclusively for:
                    <ul>
                        <li>Processing payments through Safaricom API.</li>
                        <li>Sending automated appointment receipts.</li>
                        <li>Communication regarding training schedules.</li>
                    </ul>
                </p>

                <h3>3. Data Sharing</h3>
                <p>We do not sell your data. We only share your phone number with Safaricom PLC to initiate the Lipa na M-Pesa STK Push. Your email is processed via our secure scheduling engine.</p>

                <h3>4. Data Security</h3>
                <p>All digital interactions are encrypted. We do not store your M-Pesa PIN or any banking credentials on our servers.</p>

                <h3>5. Your Rights</h3>
                <p>Under the Data Protection Act, 2019, you have the right to access, rectify, or request the deletion of your personal information at any time.</p>
            </div>
        `;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

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
        
        <div class="time-selector-upgrade" id="time-selector">
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
            <div class="mpesa-actions" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                <button class="btn btn-mpesa" onclick="manualStatusCheck()" id="manual-check-btn" style="display: none;">Check Payment Status</button>
                <button class="btn btn-outline btn-full" style="opacity: 0.6;" onclick="renderCheckout()">Cancel Payment</button>
            </div>
        </div>
    `;

    // Make manual check button visible after 15 seconds
    setTimeout(() => {
        const btn = document.getElementById('manual-check-btn');
        if (btn) btn.style.display = 'block';
    }, 15000);


    try {
        // 2. Call backend STK Push
        const response = await fetch(window.appConfig.getApiUrl('/api/stkpush'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: fullPhone,
                amount: state.selectedAmountKes
            })
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || 'Server returned an invalid response');
        }

        console.log('STK Push Response:', data);

        if (response.ok && data.ResponseCode === '0') {
            document.getElementById('stk-status').innerText = 'Please check your phone...';
            state.checkoutRequestID = data.CheckoutRequestID;
            startPolling(data.CheckoutRequestID);
        } else {
            const errorMsg = data.CustomerMessage || data.error || data.errorMessage || 'Failed to trigger STK Push';
            document.getElementById('stk-status').innerHTML = `<span style="color: #ef4444;">Error: ${errorMsg}</span>`;
            console.error('M-Pesa error:', data);
            // Don't call renderCheckout immediately so user can see the error
        }
    } catch (error) {
        console.error('Payment error:', error);
        document.getElementById('stk-status').innerHTML = `<span style="color: #ef4444;">Error: ${error.message}</span>`;
        // Don't call renderCheckout immediately
    }
};

async function startPolling(checkoutRequestID) {
    const statusEl = document.getElementById('stk-status');
    let attempts = 0;
    const maxAttempts = 30; // ~90 seconds

    const poll = setInterval(async () => {
        attempts++;
        statusEl.innerText = `Waiting for confirmation... (${attempts})`;

        const isComplete = await checkServerStatus(checkoutRequestID);
        if (isComplete) {
            clearInterval(poll);
        }

        if (attempts >= maxAttempts) {
            clearInterval(poll);
            alert('Payment Timeout: We did not receive confirmation from Safaricom in time. If you paid, please click "Check Payment Status".');
        }
    }, 3000);
}

async function checkServerStatus(checkoutRequestID) {
    const statusEl = document.getElementById('stk-status');
    try {
        const response = await fetch(window.appConfig.getApiUrl(`/api/payment-status/${checkoutRequestID}`));
        if (!response.ok) return false;

        const data = await response.json();
        console.log('Internal Status Check:', data);

        if (data.status === 'SUCCESS') {
            state.mpesaReceipt = data.details.receiptNumber || 'N/A';
            state.currentStep = 3;
            renderStep();
            return true;
        } else if (data.status === 'FAILED') {
            alert('Payment Failed: ' + (data.details.reason || 'Transaction failed'));
            renderCheckout();
            return true;
        }
    } catch (err) {
        console.error('Polling error:', err);
    }
    return false;
}

window.manualStatusCheck = async function () {
    const checkoutID = state.checkoutRequestID;
    if (!checkoutID) {
        alert('Transaction ID not found. Please wait until the request is initialized.');
        return;
    }
    const btn = document.getElementById('manual-check-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Checking...';
    btn.disabled = true;

    const isComplete = await checkServerStatus(checkoutID);

    if (!isComplete) {
        // If not complete, also try a hard query to Safaricom via backend
        try {
            const response = await fetch(window.appConfig.getApiUrl('/api/stkquery'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ CheckoutRequestID: checkoutID })
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                if (data.ResultCode === '0') {
                    state.mpesaReceipt = data.MpesaReceiptNumber || 'QUERIED-STK';
                    state.currentStep = 3;
                    renderStep();
                } else {
                    alert('Status: ' + (data.CustomerMessage || 'Still waiting for M-Pesa. Please ensure you have entered your PIN.'));
                }
            } else {
                const text = await response.text();
                alert('Server Error: ' + text.substring(0, 100));
            }
        } catch (e) {
            console.error('Hard query error:', e);
            alert('Connection Error: Could not reach the server.');
        }
    }

    btn.innerText = originalText;
    btn.disabled = false;
};

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
    state.selectedTime = null;
    renderCalendar();

    window.setTimeout(() => {
        const timeSelector = document.getElementById('time-selector');
        if (timeSelector) {
            timeSelector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const firstTime = timeSelector.querySelector('.time-btn-upgrade');
            if (firstTime) firstTime.focus({ preventScroll: true });
        }
    }, 50);
};

window.selectTime = function (time) {
    state.selectedTime = time;
    renderCalendar();

    window.setTimeout(() => {
        const nextButton = document.getElementById('next-step');
        if (nextButton) {
            const modalBody = document.getElementById('modal-step-container');
            if (modalBody) {
                modalBody.scrollTo({
                    top: modalBody.scrollHeight,
                    behavior: 'smooth'
                });
            }
            nextButton.focus({ preventScroll: false });
        }
    }, 50);
};

window.goToStep = function (step) {
    state.currentStep = step;
    renderStep();
};

function formatDisplayDate(dateStr) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

/**
 * Premium Testimonial Auto-Scroll
 * Automatically scrolls testimonials and pauses on hover/interaction.
 */
function initTestimonialAutoScroll() {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    // Clone the content for a seamless loop
    const originalContent = container.innerHTML;
    container.innerHTML = originalContent + originalContent;

    let isPaused = false;
    let scrollInterval;
    const scrollSpeed = 0.6; // Smoother speed
    const intervalTime = 16; // ~60fps

    const startScroll = () => {
        scrollInterval = setInterval(() => {
            if (!isPaused) {
                container.scrollLeft += scrollSpeed;

                // Seamless loop jump
                if (container.scrollLeft >= container.scrollWidth / 2) {
                    container.scrollLeft = 0;
                }
            }
        }, intervalTime);
    };

    const stopScroll = () => {
        clearInterval(scrollInterval);
    };

    // Pause events
    container.addEventListener('mouseenter', () => isPaused = true);
    container.addEventListener('mouseleave', () => isPaused = false);
    container.addEventListener('touchstart', () => isPaused = true);
    container.addEventListener('touchend', () => isPaused = false);

    // Initial start
    startScroll();
}
