/* =========================================================
   Riverbend Yoga Studio - script.js (Touchstone 4)

   1. Data          - arrays of objects for classes and workshops,
                      plus objects for storage keys and validation rules
   2. Storage       - small helpers around localStorage / sessionStorage
   3. Class Finder  - filter classes and save a preferred class (services.html)
   4. Saved banner  - show the saved class on the home page (index.html)
   5. Workshops     - add/remove workshop interests (events.html)
   6. Form          - build options, pre-fill, validate, submit (events.html)
   7. Start-up      - run only the parts that exist on the current page
   ========================================================= */

/* ---------- 1. Data ---------- */

// Array of objects: every regular class the studio offers.
const yogaClasses = [
  { id: "gentle-flow",  name: "Gentle Flow",         level: "beginner",     time: "morning", schedule: "Tue & Thu, 10:00 AM", instructor: "Maya Chen",     description: "Slow, supported movement that builds balance and confidence." },
  { id: "chair-yoga",   name: "Chair Yoga",          level: "beginner",     time: "midday",  schedule: "Wed, 11:00 AM",       instructor: "Maya Chen",     description: "Every pose done seated or with a chair for support. Great for older adults." },
  { id: "beginner-basics", name: "Beginner Basics",  level: "beginner",     time: "morning", schedule: "Sat, 9:00 AM",        instructor: "Rosa Alvarez",  description: "Learn the foundational poses and breathing step by step." },
  { id: "restorative",  name: "Restorative",         level: "beginner",     time: "evening", schedule: "Mon, 6:30 PM",        instructor: "Rosa Alvarez",  description: "Deep rest with bolsters and blankets to calm the nervous system." },
  { id: "yin-restore",  name: "Yin & Restore",       level: "intermediate", time: "evening", schedule: "Wed, 7:00 PM",        instructor: "Rosa Alvarez",  description: "Longer holds that gently stretch connective tissue." },
  { id: "vinyasa-am",   name: "Morning Vinyasa",     level: "intermediate", time: "morning", schedule: "Mon, 7:00 AM",        instructor: "Daniel Osei",   description: "An energizing flow linking breath and movement to start the day." },
  { id: "vinyasa-pm",   name: "Evening Vinyasa",     level: "intermediate", time: "evening", schedule: "Tue, 5:30 PM",        instructor: "Daniel Osei",   description: "Release the workday with a steady, flowing practice." },
  { id: "lunch-express", name: "Lunchtime Express",  level: "intermediate", time: "midday",  schedule: "Thu, 12:15 PM",       instructor: "Daniel Osei",   description: "A 45-minute flow for busy professionals on a lunch break." }
];

// Array of objects: monthly workshops listed on the Events page.
const workshops = [
  { id: "ws-breath",   title: "Breathing for Better Sleep",    date: "Sat, Dec 6",  time: "2:00 - 3:30 PM", spots: 5 },
  { id: "ws-back",     title: "Yoga for a Healthy Back",       date: "Sat, Dec 13", time: "10:00 - 11:30 AM", spots: 8 },
  { id: "ws-reset",    title: "New Year Restorative Reset",    date: "Sun, Jan 4",  time: "4:00 - 6:00 PM", spots: 12 },
  { id: "ws-balance",  title: "Balance & Fall Prevention",     date: "Sat, Jan 17", time: "11:00 AM - 12:30 PM", spots: 10 }
];

// Object: one place for every storage key so names never get mistyped.
const STORAGE_KEYS = {
  preferredClass: "riverbend.preferredClass",   // localStorage - remembered selected option
  finderFilters:  "riverbend.finderFilters",    // localStorage - selection kept across page loads
  workshopInterests: "riverbend.workshopInterests", // localStorage - saved favorite items
  contactInfo:    "riverbend.contactInfo",      // localStorage - pre-fills the form
  messageDraft:   "riverbend.messageDraft"      // sessionStorage - unsent message for this visit
};

// Object: validation rules for each form field. Each rule returns an error
// message string, or an empty string when the value is valid.
const validationRules = {
  name(value) {
    if (value === "") return "Please enter your name.";
    if (value.length < 2) return "Your name must be at least 2 characters.";
    if (value.length > 60) return "Please keep your name under 60 characters.";
    return "";
  },
  email(value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (value === "") return "Please enter your email address.";
    if (!emailPattern.test(value)) return "Please enter a valid email, like name@example.com.";
    return "";
  },
  phone(value, form) {
    const wantsPhone = form.elements.contact.value === "phone";
    const digits = value.replace(/\D/g, "");
    if (wantsPhone && value === "") return "Please add a phone number so we can call you.";
    if (value !== "" && digits.length !== 10) return "Phone numbers need 10 digits, like 555-555-5555.";
    return "";
  },
  interest(value) {
    return value === "" ? "Please choose a class or workshop." : "";
  },
  experience(value) {
    return value === "" ? "Please choose your experience level." : "";
  },
  message(value) {
    if (value === "") return "Please add a short message.";
    if (value.length < 10) return `Please write at least 10 characters (${10 - value.length} more to go).`;
    if (value.length > 500) return "Please keep your message under 500 characters.";
    return "";
  }
};

/* ---------- 2. Storage helpers ---------- */

// Wrapped in try/catch because storage can be blocked (e.g. private mode).
function saveData(key, value, storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save to storage:", error);
  }
}

function loadData(key, fallback, storage = localStorage) {
  try {
    const stored = storage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

function removeData(key, storage = localStorage) {
  try { storage.removeItem(key); } catch (error) { /* ignore */ }
}

function findClassById(id) {
  return yogaClasses.find((yogaClass) => yogaClass.id === id);
}

function findWorkshopById(id) {
  return workshops.find((workshop) => workshop.id === id);
}

/* ---------- 3. Class Finder (services.html) ---------- */

function filterClasses(level, time) {
  return yogaClasses.filter((yogaClass) => {
    const levelMatches = level === "all" || yogaClass.level === level;
    const timeMatches = time === "all" || yogaClass.time === time;
    return levelMatches && timeMatches;
  });
}

function createClassCard(yogaClass, preferredId) {
  const isSaved = yogaClass.id === preferredId;
  const card = document.createElement("article");
  card.className = "class-card" + (isSaved ? " is-saved" : "");
  card.innerHTML = `
    <h3>${yogaClass.name}</h3>
    ${isSaved ? '<p class="saved-tag">&#9733; Your preferred class</p>' : ""}
    <p class="class-meta">${yogaClass.schedule} &middot; ${capitalize(yogaClass.level)} &middot; ${yogaClass.instructor}</p>
    <p>${yogaClass.description}</p>
    <button type="button" class="button ${isSaved ? "secondary" : ""}" data-class-id="${yogaClass.id}" aria-pressed="${isSaved}">
      ${isSaved ? "Saved &#10003; (click to remove)" : "Save as my class"}
    </button>`;
  return card;
}

function renderClassList() {
  const list = document.getElementById("class-list");
  const status = document.getElementById("finder-status");
  const filters = loadData(STORAGE_KEYS.finderFilters, { level: "all", time: "all" });
  const preferredId = loadData(STORAGE_KEYS.preferredClass, null);
  const matches = filterClasses(filters.level, filters.time);

  list.innerHTML = "";
  if (matches.length === 0) {
    list.innerHTML = "<p>No classes match those filters yet. Try another time of day or contact us about a private session.</p>";
  } else {
    matches.forEach((yogaClass) => list.appendChild(createClassCard(yogaClass, preferredId)));
  }
  status.textContent = `Showing ${matches.length} of ${yogaClasses.length} classes.`;
}

function updateFilterControls(filters) {
  document.querySelectorAll("#level-filters .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.level === filters.level));
  });
  document.getElementById("time-filter").value = filters.time;
}

function handleLevelClick(event) {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  const filters = loadData(STORAGE_KEYS.finderFilters, { level: "all", time: "all" });
  filters.level = chip.dataset.level;
  saveData(STORAGE_KEYS.finderFilters, filters);
  updateFilterControls(filters);
  renderClassList();
}

function handleTimeChange(event) {
  const filters = loadData(STORAGE_KEYS.finderFilters, { level: "all", time: "all" });
  filters.time = event.target.value;
  saveData(STORAGE_KEYS.finderFilters, filters);
  renderClassList();
}

function handleSaveClass(event) {
  const button = event.target.closest("[data-class-id]");
  if (!button) return;
  const currentId = loadData(STORAGE_KEYS.preferredClass, null);
  const clickedId = button.dataset.classId;

  if (currentId === clickedId) {
    removeData(STORAGE_KEYS.preferredClass);          // clicking again un-saves it
  } else {
    saveData(STORAGE_KEYS.preferredClass, clickedId); // remember the chosen class
  }
  renderClassList();
  // Return keyboard focus to the same button after the list re-renders.
  const sameButton = document.querySelector(`[data-class-id="${clickedId}"]`);
  if (sameButton) sameButton.focus();
}

function initClassFinder() {
  const filters = loadData(STORAGE_KEYS.finderFilters, { level: "all", time: "all" });
  updateFilterControls(filters);
  renderClassList();

  document.getElementById("level-filters").addEventListener("click", handleLevelClick);
  document.getElementById("time-filter").addEventListener("change", handleTimeChange);
  document.getElementById("class-list").addEventListener("click", handleSaveClass);
}

/* ---------- 4. Saved class banner (index.html) ---------- */

function initSavedBanner() {
  const banner = document.getElementById("saved-class-banner");
  const savedClass = findClassById(loadData(STORAGE_KEYS.preferredClass, null));
  const contact = loadData(STORAGE_KEYS.contactInfo, null);

  if (!savedClass) return; // nothing saved yet - keep the banner hidden

  const greeting = contact && contact.name ? `Welcome back, ${contact.name.split(" ")[0]}!` : "Welcome back!";
  banner.innerHTML = `
    <p><strong>${greeting}</strong> Your preferred class is <strong>${savedClass.name}</strong>, ${savedClass.schedule} with ${savedClass.instructor}.</p>
    <a class="button" href="events.html">Request a spot</a>`;
  banner.hidden = false;
}

/* ---------- 5. Workshop interests (events.html) ---------- */

function getInterests() {
  return loadData(STORAGE_KEYS.workshopInterests, []);
}

function toggleInterest(workshopId) {
  const interests = getInterests();
  const index = interests.indexOf(workshopId);
  if (index === -1) {
    interests.push(workshopId);
  } else {
    interests.splice(index, 1);
  }
  saveData(STORAGE_KEYS.workshopInterests, interests);
  return interests;
}

function renderWorkshops() {
  const list = document.getElementById("workshop-list");
  const interests = getInterests();

  list.innerHTML = "";
  workshops.forEach((workshop) => {
    const isInterested = interests.includes(workshop.id);
    const item = document.createElement("li");
    item.className = "workshop-item" + (isInterested ? " is-interested" : "");
    item.innerHTML = `
      <div>
        <h3>${workshop.title}</h3>
        <p>${workshop.date} &middot; ${workshop.time} &middot; ${workshop.spots} spots left</p>
      </div>
      <button type="button" class="button ${isInterested ? "" : "secondary"}" data-workshop-id="${workshop.id}" aria-pressed="${isInterested}">
        ${isInterested ? "&#10003; Interested" : "Add to my interests"}
      </button>`;
    list.appendChild(item);
  });
  renderInterestSummary(interests);
}

function renderInterestSummary(interests) {
  const summary = document.getElementById("interest-summary");
  if (interests.length === 0) {
    summary.textContent = "You have not added any workshops yet.";
    return;
  }
  const titles = interests.map((id) => findWorkshopById(id)).filter(Boolean).map((w) => w.title);
  summary.textContent = `Your saved interests (${titles.length}): ${titles.join(", ")}.`;
}

function handleWorkshopClick(event) {
  const button = event.target.closest("[data-workshop-id]");
  if (!button) return;
  const id = button.dataset.workshopId;
  const interests = toggleInterest(id);
  renderWorkshops();

  // Pre-select the workshop in the form when it is first added.
  const interestSelect = document.getElementById("interest");
  if (interests.includes(id) && interestSelect.value === "") {
    interestSelect.value = id;
    validateField("interest");
  }
  document.querySelector(`[data-workshop-id="${id}"]`).focus();
}

function initWorkshops() {
  renderWorkshops();
  document.getElementById("workshop-list").addEventListener("click", handleWorkshopClick);
}

/* ---------- 6. Form: options, pre-fill, validation, submit (events.html) ---------- */

function buildInterestOptions() {
  const select = document.getElementById("interest");
  const classGroup = document.createElement("optgroup");
  classGroup.label = "Weekly classes";
  yogaClasses.forEach((yogaClass) => {
    classGroup.appendChild(new Option(`${yogaClass.name} (${yogaClass.schedule})`, yogaClass.id));
  });
  const workshopGroup = document.createElement("optgroup");
  workshopGroup.label = "Workshops";
  workshops.forEach((workshop) => {
    workshopGroup.appendChild(new Option(`${workshop.title} (${workshop.date})`, workshop.id));
  });
  select.append(classGroup, workshopGroup);
}

function prefillForm(form) {
  const contact = loadData(STORAGE_KEYS.contactInfo, null);
  if (contact) {
    form.elements.name.value = contact.name || "";
    form.elements.email.value = contact.email || "";
  }
  // Preferred class first, otherwise the first saved workshop.
  const preferredId = loadData(STORAGE_KEYS.preferredClass, null);
  const firstInterest = getInterests()[0];
  form.elements.interest.value = preferredId || firstInterest || "";

  // Restore an unsent message from this browser session.
  form.elements.message.value = loadData(STORAGE_KEYS.messageDraft, "", sessionStorage);
  updateCharCount();
}

function getFieldValue(form, fieldName) {
  const field = form.elements[fieldName];
  // RadioNodeList (radio buttons) and regular inputs both expose .value
  return (field.value || "").trim();
}

function showError(fieldName, message) {
  const form = document.getElementById("interest-form");
  const errorEl = document.getElementById(`${fieldName}-error`);
  const field = form.elements[fieldName];
  const inputs = field instanceof RadioNodeList ? Array.from(field) : [field];

  errorEl.textContent = message;
  inputs.forEach((input) => {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (!(field instanceof RadioNodeList)) input.classList.toggle("is-valid", !message && input.value.trim() !== "");
  });
}

function validateField(fieldName) {
  const form = document.getElementById("interest-form");
  const message = validationRules[fieldName](getFieldValue(form, fieldName), form);
  showError(fieldName, message);
  return message === "";
}

function validateForm() {
  // Run every rule (not just until the first failure) so all errors show at once.
  const results = Object.keys(validationRules).map((fieldName) => ({
    fieldName,
    isValid: validateField(fieldName)
  }));
  return results.filter((result) => !result.isValid).map((result) => result.fieldName);
}

function updateCharCount() {
  const message = document.getElementById("message");
  document.getElementById("char-count").textContent = message.value.length;
}

function handleSubmit(event) {
  event.preventDefault(); // always stop the page from reloading
  const form = event.target;
  const invalidFields = validateForm();
  const success = document.getElementById("form-success");

  if (invalidFields.length > 0) {
    success.hidden = true;
    // Move focus to the first field with a problem. User input is kept.
    const first = form.elements[invalidFields[0]];
    (first instanceof RadioNodeList ? first[0] : first).focus();
    return;
  }

  const name = getFieldValue(form, "name");
  const email = getFieldValue(form, "email");
  if (form.elements.remember.checked) {
    saveData(STORAGE_KEYS.contactInfo, { name, email });
  } else {
    removeData(STORAGE_KEYS.contactInfo);
  }
  removeData(STORAGE_KEYS.messageDraft, sessionStorage);

  const chosen = findClassById(form.elements.interest.value) || findWorkshopById(form.elements.interest.value);
  const chosenName = chosen.name || chosen.title;
  success.textContent = `Thank you, ${name.split(" ")[0]}! Your request for ${chosenName} has been sent. We will contact you by ${form.elements.contact.value} within one business day.`;
  success.hidden = false;

  form.elements.message.value = "";
  updateCharCount();
  form.querySelectorAll(".is-valid").forEach((el) => el.classList.remove("is-valid"));
  success.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initForm() {
  const form = document.getElementById("interest-form");
  form.noValidate = true; // JS shows custom messages; HTML attributes remain as a no-JS fallback

  buildInterestOptions();
  prefillForm(form);

  // Validate a field when the user leaves it, then live-update while they fix it.
  ["name", "email", "phone", "interest", "message"].forEach((fieldName) => {
    const field = form.elements[fieldName];
    field.addEventListener("blur", () => validateField(fieldName));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(fieldName);
    });
  });

  form.elements.message.addEventListener("input", () => {
    updateCharCount();
    saveData(STORAGE_KEYS.messageDraft, form.elements.message.value, sessionStorage);
  });

  Array.from(form.elements.experience).forEach((radio) => {
    radio.addEventListener("change", () => validateField("experience"));
  });
  // Changing contact method changes whether phone is required.
  Array.from(form.elements.contact).forEach((radio) => {
    radio.addEventListener("change", () => {
      if (form.elements.phone.value !== "" || form.elements.phone.getAttribute("aria-invalid") === "true") {
        validateField("phone");
      }
    });
  });

  form.addEventListener("submit", handleSubmit);
}

/* ---------- Utility ---------- */

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/* ---------- 7. Start-up: only run what exists on this page ---------- */

function init() {
  if (document.getElementById("class-list")) initClassFinder();
  if (document.getElementById("saved-class-banner")) initSavedBanner();
  if (document.getElementById("workshop-list")) initWorkshops();
  if (document.getElementById("interest-form")) initForm();
}

document.addEventListener("DOMContentLoaded", init);
