    /* ===== SETTINGS: edit these ===== */
    const bookingFee = 100000;
    const managerWhatsApp = "+256744221336";          // digits only, with country code
    const payment = {
      momoName: "Brilliant Hostel",
      momoNumber: "+2567XX XXX XXX",              // your MTN / Airtel merchant or phone number
      bankName: "centenarry bank",
      bankAccountName: "Brilliant Hostel",
      bankAccountNumber: "3203973489"
    };
    const STORAGE_KEY = "brilliantHostelBookings";

    // Amenities are placeholders. Change them to match what each room type really has.
    const amenitiesByType = {
      "Single Room": ["Wi-Fi", "Water", "Security", "Own bed & desk"],
      "Double Room": ["Wi-Fi", "Water", "Security", "Shared with 1"],
      "Triple Room": ["Wi-Fi", "Water", "Security", "Shared with 2"]
    };

    const rooms = [
      { number: "A-101", section: "A", type: "Single Room", price: 1200000, available: true },
      { number: "A-102", section: "A", type: "Single Room", price: 1200000, available: false },
      { number: "A-103", section: "A", type: "Double Room", price: 950000, available: true },
      { number: "A-104", section: "A", type: "Double Room", price: 950000, available: true },
      { number: "B-201", section: "B", type: "Single Room", price: 1300000, available: true },
      { number: "B-202", section: "B", type: "Double Room", price: 1000000, available: false },
      { number: "B-203", section: "B", type: "Double Room", price: 1000000, available: true },
      { number: "B-204", section: "B", type: "Triple Room", price: 800000, available: true },
      { number: "C-301", section: "C", type: "Single Room", price: 1250000, available: false },
      { number: "C-302", section: "C", type: "Double Room", price: 900000, available: true },
      { number: "C-303", section: "C", type: "Double Room", price: 900000, available: true },
      { number: "C-304", section: "C", type: "Triple Room", price: 750000, available: false },
      { number: "D-401", section: "D", type: "Single Room", price: 1350000, available: true },
      { number: "D-402", section: "D", type: "Double Room", price: 1050000, available: true },
      { number: "D-403", section: "D", type: "Double Room", price: 1050000, available: false },
      { number: "D-404", section: "D", type: "Triple Room", price: 850000, available: true },
      { number: "E-501", section: "E", type: "Single Room", price: 1150000, available: true },
      { number: "E-502", section: "E", type: "Double Room", price: 880000, available: true },
      { number: "E-503", section: "E", type: "Double Room", price: 880000, available: false },
      { number: "E-504", section: "E", type: "Triple Room", price: 700000, available: true }
    ];
    const sections = ["A", "B", "C", "D", "E"];

    let activeSection = "A";
    let selectedRoom = null;
    let submitting = false;
    let lastFocused = null;

    const $ = (id) => document.getElementById(id);
    const roomGrid = $("roomGrid");
    const sectionTabs = $("sectionTabs");
    const bookingModal = $("bookingModal");
    const bookingForm = $("bookingForm");
    const bookingFormArea = $("bookingFormArea");
    const receiptArea = $("receiptArea");
    const formError = $("formError");

    const formatUGX = (amount) => `UGX ${amount.toLocaleString("en-US")}`;

    /* ===== Saved bookings (this browser only; see note in the chat) ===== */
    function loadBookings() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
      catch (e) { return []; }
    }
    function saveBooking(booking) {
      try {
        const all = loadBookings();
        all.push(booking);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch (e) { /* storage unavailable: booking still proceeds */ }
    }
    loadBookings().forEach((b) => {
      const room = rooms.find((r) => r.number === b.room);
      if (room) room.available = false;
    });

    /* ===== Mobile menu ===== */
    const menuToggle = $("menuToggle");
    const mainNav = $("mainNav");
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    mainNav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    /* ===== Tabs, filters, room cards ===== */
    function renderTabs() {
      sectionTabs.innerHTML = sections.map((s) => {
        const left = rooms.filter((r) => r.section === s && r.available).length;
        return `<button type="button" class="section-tab ${s === activeSection ? "active" : ""}"
          data-section="${s}" aria-pressed="${s === activeSection}">
          Section ${s}<small>${left} ${left === 1 ? "room" : "rooms"} left</small></button>`;
      }).join("");
    }

    function renderRooms() {
      const type = $("filterType").value;
      const maxPrice = Number($("filterPrice").value) || Infinity;
      const onlyAvailable = $("filterAvailable").checked;

      const list = rooms.filter((r) =>
        r.section === activeSection &&
        (!type || r.type === type) &&
        r.price <= maxPrice &&
        (!onlyAvailable || r.available)
      );

      if (!list.length) {
        roomGrid.innerHTML = `<p class="empty">No rooms match these filters in Section ${activeSection}. Try another section or clear a filter.</p>`;
        return;
      }

      roomGrid.innerHTML = list.map((room) => `
        <article class="room-card ${room.available ? "" : "unavailable"}">
          <div class="room-card-top">
            <div><span>${room.type}</span><h3>${room.number}</h3></div>
            <span class="status ${room.available ? "available" : "booked"}">${room.available ? "Available" : "Reserved"}</span>
          </div>
          <div class="room-card-body">
            <ul class="amenities">${(amenitiesByType[room.type] || []).map((a) => `<li>${a}</li>`).join("")}</ul>
            <div class="room-price"><strong>${formatUGX(room.price)}</strong><span>per semester</span></div>
            <p class="room-balance">Balance after booking fee: ${formatUGX(room.price - bookingFee)}</p>
            <button type="button" class="book-room-button" data-room="${room.number}" ${room.available ? "" : "disabled"}>
              ${room.available ? "Book This Room" : "Not Available"}
            </button>
          </div>
        </article>`).join("");
    }

    function refresh() { renderTabs(); renderRooms(); }

    sectionTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".section-tab");
      if (!tab) return;
      activeSection = tab.dataset.section;
      refresh();
    });
    ["filterType", "filterPrice", "filterAvailable"].forEach((id) => $(id).addEventListener("change", renderRooms));

    roomGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".book-room-button");
      if (!btn || btn.disabled) return;
      selectedRoom = rooms.find((r) => r.number === btn.dataset.room);
      if (selectedRoom && selectedRoom.available) openBookingModal();
    });

    /* ===== Modal (focus handling, Escape, focus trap) ===== */
    function openBookingModal() {
      lastFocused = document.activeElement;
      $("selectedRoomName").textContent = `${selectedRoom.number} - ${selectedRoom.type}`;
      $("selectedRoomPrice").textContent = `${formatUGX(selectedRoom.price)} per semester`;
      $("selectedRoomBalance").textContent = formatUGX(selectedRoom.price - bookingFee);
      clearErrors();
      bookingModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      $("studentName").focus();
    }

    function closeBookingModal() {
      bookingModal.classList.add("hidden");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    $("closeModal").addEventListener("click", closeBookingModal);
    $("modalOverlay").addEventListener("click", closeBookingModal);

    document.addEventListener("keydown", (e) => {
      if (bookingModal.classList.contains("hidden")) return;
      if (e.key === "Escape") { closeBookingModal(); return; }
      if (e.key !== "Tab") return;
      const focusable = [...bookingModal.querySelectorAll("button, a[href], input, select")]
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* ===== Validation ===== */
    function clearErrors() {
      formError.textContent = "";
      bookingForm.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    }

    function validate(student) {
      const problems = [];
      const flag = (id, msg) => { $(id).classList.add("invalid"); problems.push(msg); };

      if (student.name.length < 3) flag("studentName", "Enter your full name.");
      if (!student.number) flag("studentNumber", "Enter your student number.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(student.email)) flag("studentEmail", "Enter a valid email address.");
      const phone = student.phone.replace(/[\s-]/g, "");
      if (!/^(\+256|0)7\d{8}$/.test(phone)) flag("studentPhone", "Enter a valid Ugandan phone number, like 0772 123 456 or +256 772 123 456.");
      if (!student.semester) flag("semester", "Choose a semester.");
      if (!student.paymentMethod) flag("paymentMethod", "Choose a payment method.");
      return problems;
    }

    /* ===== Submit: creates a PENDING request, never marks anything as paid ===== */
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (submitting || !selectedRoom) return;

      clearErrors();
      const student = {
        name: $("studentName").value.trim(),
        number: $("studentNumber").value.trim(),
        email: $("studentEmail").value.trim(),
        phone: $("studentPhone").value.trim(),
        semester: $("semester").value,
        paymentMethod: $("paymentMethod").value
      };

      const problems = validate(student);
      if (problems.length) {
        formError.textContent = problems[0];
        bookingForm.querySelector(".invalid").focus();
        return;
      }

      if (!selectedRoom.available) {
        formError.textContent = "Sorry, this room was just reserved. Please close this window and pick another room.";
        refresh();
        return;
      }

      submitting = true;
      const submitBtn = $("submitBooking");
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      const reference = `BH-${Date.now().toString().slice(-8)}`;
      const balance = selectedRoom.price - bookingFee;

      selectedRoom.available = false;
      saveBooking({
        reference, room: selectedRoom.number, student: student.name,
        semester: student.semester, status: "PENDING PAYMENT", createdAt: new Date().toISOString()
      });

      $("receiptNumber").textContent = reference;
      $("receiptStudent").textContent = student.name;
      $("receiptRoom").textContent = `${selectedRoom.number} (${selectedRoom.type})`;
      $("receiptSemester").textContent = student.semester;
      $("receiptBalance").textContent = formatUGX(balance);

      showPaymentInstructions(student.paymentMethod, reference);
      $("notifyWhatsApp").href = buildWhatsAppLink(student, reference, balance);

      bookingFormArea.classList.add("hidden");
      receiptArea.classList.remove("hidden");
      bookingModal.querySelector(".modal-content").scrollTop = 0;
      $("notifyWhatsApp").focus();

      refresh();
      submitting = false;
    });

    function showPaymentInstructions(method, reference) {
      const box = $("payInstructions");
      box.innerHTML = "";
      const add = (text, bold) => {
        const p = document.createElement("p");
        if (bold) { const b = document.createElement("b"); b.textContent = text; p.appendChild(b); }
        else p.textContent = text;
        box.appendChild(p);
      };

      add(`Pay ${formatUGX(bookingFee)} using ${method}:`, true);
      if (method === "Mobile Money") {
        add(`Send to: ${payment.momoNumber} (${payment.momoName})`);
      } else {
        add(`Bank: ${payment.bankName}`);
        add(`Account name: ${payment.bankAccountName}`);
        add(`Account number: ${payment.bankAccountNumber}`);
      }
      add(`Use this reference when paying: ${reference}`, true);
      add("Then send your payment proof to the manager on WhatsApp (button below). Your room is confirmed once the manager verifies your payment.");
    }

    function buildWhatsAppLink(student, reference, balance) {
      const lines = [
        "NEW BRILLIANT HOSTEL BOOKING REQUEST",
        "",
        `Reference: ${reference}`,
        `Student: ${student.name}`,
        `Student No: ${student.number}`,
        `Phone: ${student.phone}`,
        `Email: ${student.email}`,
        `Room: ${selectedRoom.number} (${selectedRoom.type})`,
        `Semester: ${student.semester}`,
        `Semester price: ${formatUGX(selectedRoom.price)}`,
        `Balance after fee: ${formatUGX(balance)}`,
        `Booking fee to pay: ${formatUGX(bookingFee)}`,
        `Payment method: ${student.paymentMethod}`,
        "Status: PENDING PAYMENT (I will send my payment proof)"
      ];
      return `https://wa.me/${managerWhatsApp}?text=${encodeURIComponent(lines.join("\n"))}`;
    }

    /* ===== Receipt actions ===== */
    $("printReceipt").addEventListener("click", () => window.print());

    $("finishBooking").addEventListener("click", () => {
      bookingForm.reset();
      clearErrors();
      const submitBtn = $("submitBooking");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Booking Request";
      bookingFormArea.classList.remove("hidden");
      receiptArea.classList.add("hidden");
      selectedRoom = null;
      closeBookingModal();
    });

    refresh();
