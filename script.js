
let entries = [];

try {
    entries = JSON.parse(
        localStorage.getItem("mindspaceEntries") || "[]"
    );

    if (!Array.isArray(entries)) entries = [];
} catch (error) {
    console.error("Loading entries failed:", error);
    entries = [];
}

let selectedMood = "";
let editingId = null;

const journalForm = document.getElementById("journalForm");
const entryTitle = document.getElementById("entryTitle");
const entryText = document.getElementById("entryText");
const entriesList = document.getElementById("entriesList");
const saveBtn = document.getElementById("saveBtn");
const cancelEdit = document.getElementById("cancelEdit");

const analyseBtn = document.getElementById("analyseBtn");
const aiResult = document.getElementById("aiResult");
const aiResponse = document.getElementById("aiResponse");


// CURRENT DATE

document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


// MOOD SELECTION

document.querySelectorAll(".mood-btn").forEach(button => {
    button.addEventListener("click", () => {

        selectedMood = button.dataset.mood;

        document.querySelectorAll(".mood-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        document.getElementById("todayMood").textContent =
            selectedMood;
    });
});


// SAVE JOURNAL ENTRY

journalForm.addEventListener("submit", event => {

    event.preventDefault();

    const title = entryTitle.value.trim();
    const content = entryText.value.trim();

    if (!title || !content) {
        alert("Please enter your journal title and thoughts.");
        return;
    }

    if (editingId !== null) {

        const entry = entries.find(item => item.id === editingId);

        if (entry) {
            entry.title = title;
            entry.content = content;
            entry.mood = selectedMood || entry.mood;
        }

        editingId = null;
        saveBtn.textContent = "Save Entry";
        cancelEdit.hidden = true;

    } else {

        entries.unshift({
            id: Date.now(),
            title: title,
            content: content,
            mood: selectedMood || "Not selected",
            date: new Date().toISOString()
        });

    }

    if (!saveData()) return;

    journalForm.reset();
    selectedMood = "";

    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    renderEntries();
    updateStats();
    renderChart();

    alert("Your journal entry has been saved successfully!");

});


// SAVE DATA

function saveData() {

    try {
        localStorage.setItem(
            "mindspaceEntries",
            JSON.stringify(entries)
        );

        return true;

    } catch (error) {
        console.error(error);
        alert("Unable to save your journal entry.");
        return false;
    }

}


// DISPLAY ENTRIES

function renderEntries() {

    const search = document.getElementById("searchInput")
        .value.toLowerCase();

    const filter = document.getElementById("moodFilter").value;

    const filteredEntries = entries.filter(entry => {

        const matchesSearch =
            entry.title.toLowerCase().includes(search) ||
            entry.content.toLowerCase().includes(search);

        const matchesMood =
            filter === "All" || entry.mood === filter;

        return matchesSearch && matchesMood;
    });

    entriesList.innerHTML = "";

    if (filteredEntries.length === 0) {
        entriesList.innerHTML =
            '<p class="empty-message">No journal entries found. Start writing!</p>';
        return;
    }

    filteredEntries.forEach(entry => {

        const card = document.createElement("div");
        card.className = "entry-card";

        const title = document.createElement("h3");
        title.textContent = entry.title;

        const meta = document.createElement("div");
        meta.className = "entry-meta";
        meta.textContent =
            new Date(entry.date).toLocaleDateString("en-IN") +
            " | Mood: " + entry.mood;

        const content = document.createElement("p");
        content.textContent = entry.content;

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editEntry(entry.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteEntry(entry.id));

        actions.append(editButton, deleteButton);
        card.append(title, meta, content, actions);
        entriesList.appendChild(card);
    });

}


// EDIT ENTRY

function editEntry(id) {

    const entry = entries.find(item => item.id === id);
    if (!entry) return;

    entryTitle.value = entry.title;
    entryText.value = entry.content;

    selectedMood =
        entry.mood === "Not selected" ? "" : entry.mood;

    editingId = id;

    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.mood === selectedMood
        );
    });

    saveBtn.textContent = "Update Entry";
    cancelEdit.hidden = false;

    document.getElementById("journal").scrollIntoView({
        behavior: "smooth"
    });

}


// CANCEL EDIT

cancelEdit.addEventListener("click", () => {

    editingId = null;
    selectedMood = "";

    journalForm.reset();

    saveBtn.textContent = "Save Entry";
    cancelEdit.hidden = true;

    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.remove("active");
    });

});


// DELETE ENTRY

function deleteEntry(id) {

    if (!confirm("Are you sure you want to delete this entry?")) {
        return;
    }

    const previousEntries = entries;

    entries = entries.filter(item => item.id !== id);

    if (!saveData()) {
        entries = previousEntries;
        return;
    }

    renderEntries();
    updateStats();
    renderChart();

}


// UPDATE STATISTICS

function updateStats() {

    document.getElementById("totalEntries").textContent =
        entries.length;

    const today = new Date().toDateString();

    const todayEntry = entries.find(entry =>
        new Date(entry.date).toDateString() === today
    );

    document.getElementById("todayMood").textContent =
        todayEntry ? todayEntry.mood : "Not set";

    const uniqueDays = [...new Set(entries.map(entry =>
        new Date(entry.date).toDateString()
    ))];

    let streak = 0;
    let currentDate = new Date();

    if (!uniqueDays.includes(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    while (uniqueDays.includes(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    document.getElementById("streak").textContent =
        streak + (streak === 1 ? " day" : " days");

}


// WEEKLY CHART

function renderChart() {

    const chart = document.getElementById("weeklyChart");
    chart.innerHTML = "";

    const today = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const count = entries.filter(entry =>
            new Date(entry.date).toDateString() === date.toDateString()
        ).length;

        days.push({
            name: date.toLocaleDateString("en-IN", {
                weekday: "short"
            }),
            count: count
        });
    }

    const maxCount = Math.max(
        ...days.map(day => day.count),
        1
    );

    days.forEach(day => {

        const item = document.createElement("div");
        item.className = "chart-item";

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height =
            (day.count / maxCount * 100) + "%";
        bar.title = day.count + " entries";

        const label = document.createElement("span");
        label.textContent = day.name;

        item.append(bar, label);
        chart.appendChild(item);
    });

}


// SEARCH AND FILTER

document.getElementById("searchInput")
    .addEventListener("input", renderEntries);

document.getElementById("moodFilter")
    .addEventListener("change", renderEntries);


// GEMINI AI ANALYSIS

analyseBtn.addEventListener("click", async () => {

    const journalText = entryText.value.trim();

    if (!journalText) {
        alert("Please write your journal entry first!");
        return;
    }

    analyseBtn.disabled = true;
    analyseBtn.textContent = "Analysing...";

    aiResult.hidden = false;
    aiResponse.textContent = "AI is analysing your journal...";

    try {

        const response = await fetch("/api/analyse", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ journalText })
        });

        const responseText = await response.text();

        if (!responseText.trim()) {
            throw new Error(
                "The server returned an empty response. Check server.js and the terminal."
            );
        }

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(
                "The server did not return valid JSON. Check the backend terminal for errors."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || "Server error: " + response.status
            );
        }

        aiResponse.textContent =
            data.result || "Gemini returned an empty response.";

    } catch (error) {

        console.error("AI Analysis Error:", error);

        aiResponse.textContent = error.message;

    } finally {

        analyseBtn.disabled = false;
        analyseBtn.textContent =
            "✨ Analyse My Journal with AI";

    }

});


// LOAD SAVED DATA

renderEntries();
updateStats();
renderChart();
