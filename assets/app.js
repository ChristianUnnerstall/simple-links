/**
 * @file app.js
 * @copyright (c) 2026 Christian Unnerstall
 * @author Christian Unnerstall
 */

/* ─── Persistence (localStorage + JSON import/export) ──── */
var STORAGE_KEY = "linklist_categories";

function loadCategories() {
    try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        /* ignore parse errors */
    }
    return null; // no data yet
}

function saveCategories(cats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

var categories = loadCategories() || [];

/* ─── Clock ────────────────────────────────────────────── */
function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    document.getElementById("clock-time").textContent = h + ":" + m;
    document.getElementById("clock-date").textContent = now.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        },
    );
}
updateClock();
setInterval(updateClock, 1000);

/* ─── Accent Color Definitions ─────────────────────────── */
var accentColors = [
    { label: "Blue", value: "var(--accent-blue)", hex: "#5b9cf6" },
    { label: "Purple", value: "var(--accent-purple)", hex: "#a78bfa" },
    { label: "Green", value: "var(--accent-green)", hex: "#6ee7b7" },
    { label: "Orange", value: "var(--accent-orange)", hex: "#fbbf24" },
    { label: "Pink", value: "var(--accent-pink)", hex: "#f472b6" },
    { label: "Cyan", value: "var(--accent-cyan)", hex: "#67e8f9" },
    { label: "Red", value: "var(--accent-red)", hex: "#fb7185" },
    { label: "Indigo", value: "var(--accent-indigo)", hex: "#818cf8" },
];

/* ─── DOM References ───────────────────────────────────── */
var grid = document.getElementById("grid");
var searchInput = document.getElementById("search");
var emptyState = document.getElementById("empty-state");
var filterTagsContainer = document.getElementById("filter-tags");
var filterToggleBtn = document.getElementById("filter-toggle");
var filterTagsWrapper = document.getElementById("filter-tags-wrapper");

/* ─── Modal System ─────────────────────────────────────── */
var modalOverlay = document.getElementById("modal-overlay");
var modalEl = document.getElementById("modal");
var modalTitle = document.getElementById("modal-title");
var modalBody = document.getElementById("modal-body");
var modalFooter = document.getElementById("modal-footer");
var modalCloseBtn = document.getElementById("modal-close");

function openModal(title, bodyHTML, footerHTML) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHTML;
    modalFooter.innerHTML = footerHTML;
    modalOverlay.classList.add("visible");
}

function closeModal() {
    modalOverlay.classList.remove("visible");
}

modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("visible"))
        closeModal();
});

/* ─── Helpers ──────────────────────────────────────────── */
function escHTML(str) {
    var d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
}

function buildColorSwatches(selectedValue) {
    return accentColors
        .map(function (c) {
            var sel = c.value === selectedValue ? " selected" : "";
            return (
                '<div class="color-swatch' +
                sel +
                '" data-accent="' +
                c.value +
                '" style="background:' +
                c.hex +
                ';" title="' +
                c.label +
                '"></div>'
            );
        })
        .join("");
}

/* ─── Render Everything ────────────────────────────────── */
function renderAll() {
    renderGrid();
    renderTagFilter();
    applyFilters();
}

/* ─── Build Cards ──────────────────────────────────────── */
function renderGrid() {
    grid.innerHTML = "";
    categories.forEach(function (cat, catIdx) {
        grid.appendChild(buildCard(cat, catIdx));
    });
}

function buildCard(cat, index) {
    var card = document.createElement("div");
    card.className = "category-card";
    card.style.animationDelay = 0.05 + index * 0.04 + "s";
    card.dataset.title = cat.title.toLowerCase();

    // Header
    var header = document.createElement("div");
    header.className = "category-header";

    var iconSpan = document.createElement("span");
    iconSpan.className = "category-icon";
    iconSpan.textContent = cat.icon;

    var titleEl = document.createElement("h2");
    titleEl.className = "category-title";
    titleEl.textContent = cat.title;

    var chevron = document.createElement("span");
    chevron.className = "category-chevron";
    chevron.textContent = "▼";

    // Card action buttons
    var actions = document.createElement("div");
    actions.className = "card-actions";

    var editGroupBtn = document.createElement("button");
    editGroupBtn.className = "card-action-btn";
    editGroupBtn.title = "Edit group";
    editGroupBtn.textContent = "✏️";
    editGroupBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openGroupModal(index);
    });

    var deleteGroupBtn = document.createElement("button");
    deleteGroupBtn.className = "card-action-btn delete-btn";
    deleteGroupBtn.title = "Delete group";
    deleteGroupBtn.textContent = "🗑️";
    deleteGroupBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        confirmDeleteGroup(index);
    });

    actions.appendChild(editGroupBtn);
    actions.appendChild(deleteGroupBtn);

    header.appendChild(iconSpan);
    header.appendChild(titleEl);
    header.appendChild(actions);
    header.appendChild(chevron);

    header.addEventListener("click", function (e) {
        if (e.target.closest(".card-actions")) return;
        card.classList.toggle("collapsed");
    });

    // Accent line
    var line = document.createElement("div");
    line.className = "accent-line";
    line.style.background =
        "linear-gradient(90deg, " + cat.accent + ", transparent)";

    // Links container
    var linksOuter = document.createElement("div");
    linksOuter.className = "links-container";
    var linksInner = document.createElement("div");
    linksInner.className = "links-inner";

    cat.links.forEach(function (link, linkIdx) {
        var a = document.createElement("a");
        a.className = "link-item";
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.dataset.name = link.name.toLowerCase();
        a.dataset.url = link.url.toLowerCase();
        a.dataset.tags = (link.tags || []).join(" ").toLowerCase();
        a.dataset.linkname = link.name;
        a.dataset.linkurl = link.url;
        if (link.desc) a.dataset.desc = link.desc;

        if (link.icon) {
            var liSpan = document.createElement("span");
            liSpan.className = "link-icon";
            liSpan.textContent = link.icon;
            a.appendChild(liSpan);
        }

        var nameSpan = document.createElement("span");
        nameSpan.className = "link-name";
        nameSpan.textContent = link.name;
        a.appendChild(nameSpan);

        // Link action buttons
        var linkActions = document.createElement("span");
        linkActions.className = "link-actions";

        var editLinkBtn = document.createElement("button");
        editLinkBtn.className = "link-action-btn";
        editLinkBtn.title = "Edit link";
        editLinkBtn.textContent = "✏️";
        editLinkBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            openLinkModal(index, linkIdx);
        });

        var deleteLinkBtn = document.createElement("button");
        deleteLinkBtn.className = "link-action-btn delete-btn";
        deleteLinkBtn.title = "Delete link";
        deleteLinkBtn.textContent = "🗑️";
        deleteLinkBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteLink(index, linkIdx);
        });

        linkActions.appendChild(editLinkBtn);
        linkActions.appendChild(deleteLinkBtn);
        a.appendChild(linkActions);

        var arrow = document.createElement("span");
        arrow.className = "link-arrow";
        arrow.textContent = "→";
        arrow.style.color = cat.accent;
        a.appendChild(arrow);

        linksInner.appendChild(a);
    });

    // Add-link button
    var addLinkBtn = document.createElement("button");
    addLinkBtn.className = "add-link-btn";
    addLinkBtn.innerHTML = "<span>➕</span><span>Add Link</span>";
    addLinkBtn.addEventListener("click", function () {
        openLinkModal(index, -1);
    });
    linksInner.appendChild(addLinkBtn);

    linksOuter.appendChild(linksInner);
    card.appendChild(header);
    card.appendChild(line);
    card.appendChild(linksOuter);
    return card;
}

/* ─── Group Modal (Add / Edit) ─────────────────────────── */
function openGroupModal(catIdx) {
    var isEdit = catIdx >= 0;
    var cat = isEdit
        ? categories[catIdx]
        : { title: "", icon: "📁", accent: "var(--accent-blue)", links: [] };
    var title = isEdit ? "Edit Group" : "New Group";

    var body =
        "" +
        '<div class="modal-field">' +
        '<label class="modal-label">Group Name</label>' +
        '<input class="modal-input" id="m-group-title" value="' +
        escHTML(cat.title) +
        '" placeholder="e.g. Development Tools" />' +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">Icon (emoji)</label>' +
        '<input class="modal-input" id="m-group-icon" value="' +
        escHTML(cat.icon) +
        '" placeholder="e.g. 💼" maxlength="4" style="width:80px;" />' +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">Accent Color</label>' +
        '<div class="color-options" id="m-group-colors">' +
        buildColorSwatches(cat.accent) +
        "</div>" +
        "</div>";

    var footer =
        "" +
        '<button class="modal-btn modal-btn-cancel" id="m-cancel">Cancel</button>' +
        '<button class="modal-btn modal-btn-save" id="m-save">' +
        (isEdit ? "Save Changes" : "Create Group") +
        "</button>";

    openModal(title, body, footer);

    // Color swatch selection
    document
        .getElementById("m-group-colors")
        .addEventListener("click", function (e) {
            var swatch = e.target.closest(".color-swatch");
            if (!swatch) return;
            document
                .querySelectorAll("#m-group-colors .color-swatch")
                .forEach(function (s) {
                    s.classList.remove("selected");
                });
            swatch.classList.add("selected");
        });

    document.getElementById("m-cancel").addEventListener("click", closeModal);
    document.getElementById("m-save").addEventListener("click", function () {
        var newTitle = document.getElementById("m-group-title").value.trim();
        if (!newTitle) {
            document.getElementById("m-group-title").focus();
            return;
        }
        var newIcon =
            document.getElementById("m-group-icon").value.trim() || "📁";
        var selectedSwatch = document.querySelector(
            "#m-group-colors .color-swatch.selected",
        );
        var newAccent = selectedSwatch
            ? selectedSwatch.dataset.accent
            : "var(--accent-blue)";

        if (isEdit) {
            categories[catIdx].title = newTitle;
            categories[catIdx].icon = newIcon;
            categories[catIdx].accent = newAccent;
        } else {
            categories.push({
                title: newTitle,
                icon: newIcon,
                accent: newAccent,
                links: [],
            });
        }
        saveCategories(categories);
        renderAll();
        closeModal();
    });

    document.getElementById("m-group-title").focus();
}

/* ─── Link Modal (Add / Edit) ──────────────────────────── */
function openLinkModal(catIdx, linkIdx) {
    var isEdit = linkIdx >= 0;
    var link = isEdit
        ? categories[catIdx].links[linkIdx]
        : { name: "", icon: "", url: "", desc: "", tags: [] };
    var title = isEdit ? "Edit Link" : "New Link";

    var body =
        "" +
        '<div class="modal-field">' +
        '<label class="modal-label">Name</label>' +
        '<input class="modal-input" id="m-link-name" value="' +
        escHTML(link.name) +
        '" placeholder="e.g. Google Cloud Console" />' +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">Icon (emoji, optional)</label>' +
        '<input class="modal-input" id="m-link-icon" value="' +
        escHTML(link.icon) +
        '" placeholder="e.g. ☁️" maxlength="4" style="width:80px;" />' +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">URL</label>' +
        '<input class="modal-input" id="m-link-url" value="' +
        escHTML(link.url) +
        '" placeholder="https://example.com" />' +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">Description</label>' +
        '<textarea class="modal-textarea" id="m-link-desc" placeholder="Brief description of the link…">' +
        escHTML(link.desc) +
        "</textarea>" +
        "</div>" +
        '<div class="modal-field">' +
        '<label class="modal-label">Tags (comma-separated)</label>' +
        '<input class="modal-input" id="m-link-tags" value="' +
        escHTML((link.tags || []).join(", ")) +
        '" placeholder="e.g. cloud, google, gcp" />' +
        "</div>";

    var footer =
        "" +
        '<button class="modal-btn modal-btn-cancel" id="m-cancel">Cancel</button>' +
        '<button class="modal-btn modal-btn-save" id="m-save">' +
        (isEdit ? "Save Changes" : "Add Link") +
        "</button>";

    openModal(title, body, footer);

    document.getElementById("m-cancel").addEventListener("click", closeModal);
    document.getElementById("m-save").addEventListener("click", function () {
        var newName = document.getElementById("m-link-name").value.trim();
        var newUrl = document.getElementById("m-link-url").value.trim();
        if (!newName) {
            document.getElementById("m-link-name").focus();
            return;
        }
        if (!newUrl) {
            document.getElementById("m-link-url").focus();
            return;
        }

        var newLink = {
            name: newName,
            icon: document.getElementById("m-link-icon").value.trim(),
            url: newUrl,
            desc: document.getElementById("m-link-desc").value.trim(),
            tags: document
                .getElementById("m-link-tags")
                .value.split(",")
                .map(function (t) {
                    return t.trim().toLowerCase();
                })
                .filter(Boolean),
        };

        if (isEdit) {
            categories[catIdx].links[linkIdx] = newLink;
        } else {
            categories[catIdx].links.push(newLink);
        }
        saveCategories(categories);
        renderAll();
        closeModal();
    });

    document.getElementById("m-link-name").focus();
}

/* ─── Delete Confirmations ─────────────────────────────── */
function confirmDeleteGroup(catIdx) {
    var cat = categories[catIdx];
    var body =
        '<div class="confirm-msg">Delete group <strong>' +
        escHTML(cat.title) +
        "</strong> and all its <strong>" +
        cat.links.length +
        " link(s)</strong>?</div>";
    var footer =
        "" +
        '<button class="modal-btn modal-btn-cancel" id="m-cancel">Cancel</button>' +
        '<button class="modal-btn modal-btn-danger" id="m-confirm">Delete Group</button>';

    openModal("Delete Group", body, footer);
    document.getElementById("m-cancel").addEventListener("click", closeModal);
    document.getElementById("m-confirm").addEventListener("click", function () {
        categories.splice(catIdx, 1);
        saveCategories(categories);
        renderAll();
        closeModal();
    });
}

function confirmDeleteLink(catIdx, linkIdx) {
    var link = categories[catIdx].links[linkIdx];
    var body =
        '<div class="confirm-msg">Delete link <strong>' +
        escHTML(link.name) +
        "</strong>?</div>";
    var footer =
        "" +
        '<button class="modal-btn modal-btn-cancel" id="m-cancel">Cancel</button>' +
        '<button class="modal-btn modal-btn-danger" id="m-confirm">Delete Link</button>';

    openModal("Delete Link", body, footer);
    document.getElementById("m-cancel").addEventListener("click", closeModal);
    document.getElementById("m-confirm").addEventListener("click", function () {
        categories[catIdx].links.splice(linkIdx, 1);
        saveCategories(categories);
        renderAll();
        closeModal();
    });
}

/* ─── Reset to Defaults (re-import from data.json) ─────── */
document
    .getElementById("btn-reset-data")
    .addEventListener("click", function () {
        var body =
            '<div class="confirm-msg">This will discard all your changes and restore the original data from <strong>data.json</strong>.<br/>You will be prompted to select the file.</div>';
        var footer =
            "" +
            '<button class="modal-btn modal-btn-cancel" id="m-cancel">Cancel</button>' +
            '<button class="modal-btn modal-btn-danger" id="m-confirm">Reset &amp; Pick File</button>';

        openModal("Reset Data", body, footer);
        document
            .getElementById("m-cancel")
            .addEventListener("click", closeModal);
        document
            .getElementById("m-confirm")
            .addEventListener("click", function () {
                closeModal();
                pickJSONFile(function (data) {
                    categories = data;
                    saveCategories(categories);
                    renderAll();
                });
            });
    });

/* ─── Export JSON ──────────────────────────────────────── */
document
    .getElementById("btn-export-json")
    .addEventListener("click", function () {
        var json = JSON.stringify(categories, null, 2);
        var blob = new Blob([json], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

/* ─── Import JSON ──────────────────────────────────────── */
document
    .getElementById("btn-import-json")
    .addEventListener("click", function () {
        pickJSONFile(function (data) {
            categories = data;
            saveCategories(categories);
            renderAll();
        });
    });

function pickJSONFile(callback) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    input.addEventListener("change", function () {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error("Expected array");
                callback(data);
            } catch (err) {
                openModal(
                    "Import Error",
                    '<div class="confirm-msg">The selected file is not valid JSON.<br/><code>' +
                        escHTML(err.message) +
                        "</code></div>",
                    '<button class="modal-btn modal-btn-cancel" id="m-cancel">OK</button>',
                );
                document
                    .getElementById("m-cancel")
                    .addEventListener("click", closeModal);
            }
        };
        reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

/* ─── Add Group Button ─────────────────────────────────── */
document.getElementById("btn-add-group").addEventListener("click", function () {
    openGroupModal(-1);
});

/* ─── Tag Filter ───────────────────────────────────────── */
var activeTags = [];

function renderTagFilter() {
    filterTagsContainer.innerHTML = "";
    var allTags = [];
    categories.forEach(function (cat) {
        cat.links.forEach(function (link) {
            (link.tags || []).forEach(function (tag) {
                if (allTags.indexOf(tag) === -1) allTags.push(tag);
            });
        });
    });
    allTags.sort();

    // Remove stale active tags
    activeTags = activeTags.filter(function (t) {
        return allTags.indexOf(t) !== -1;
    });

    allTags.forEach(function (tag) {
        var btn = document.createElement("button");
        btn.className =
            "filter-tag-btn" +
            (activeTags.indexOf(tag) !== -1 ? " active" : "");
        btn.textContent = tag;
        btn.dataset.tag = tag;
        btn.addEventListener("click", function () {
            var idx = activeTags.indexOf(tag);
            if (idx !== -1) {
                activeTags.splice(idx, 1);
                btn.classList.remove("active");
            } else {
                activeTags.push(tag);
                btn.classList.add("active");
            }
            clearBtn.classList.toggle("hidden", activeTags.length === 0);
            applyFilters();
        });
        filterTagsContainer.appendChild(btn);
    });

    // Clear button
    var clearBtn = document.createElement("button");
    clearBtn.className =
        "filter-clear" + (activeTags.length === 0 ? " hidden" : "");
    clearBtn.textContent = "✕ Clear";
    clearBtn.addEventListener("click", function () {
        activeTags = [];
        filterTagsContainer
            .querySelectorAll(".filter-tag-btn")
            .forEach(function (b) {
                b.classList.remove("active");
            });
        clearBtn.classList.add("hidden");
        applyFilters();
    });
    filterTagsContainer.appendChild(clearBtn);
}

filterToggleBtn.addEventListener("click", function () {
    filterToggleBtn.classList.toggle("open");
    filterTagsWrapper.classList.toggle("open");
});

/* ─── Search ───────────────────────────────────────────── */
searchInput.addEventListener("input", function () {
    applyFilters();
});

/* ─── Combined Filter (Search + Tags) ──────────────────── */
function applyFilters() {
    var q = searchInput.value.toLowerCase().trim();
    var visibleCount = 0;

    document.querySelectorAll(".category-card").forEach(function (card) {
        var titleMatch = q && card.dataset.title.indexOf(q) !== -1;
        var hasVisibleLink = false;

        card.querySelectorAll(".link-item").forEach(function (link) {
            var searchMatch =
                !q ||
                titleMatch ||
                link.dataset.name.indexOf(q) !== -1 ||
                link.dataset.url.indexOf(q) !== -1 ||
                link.dataset.tags.indexOf(q) !== -1;

            var tagMatch = true;
            if (activeTags.length > 0) {
                var linkTags = link.dataset.tags.split(" ");
                tagMatch = activeTags.every(function (t) {
                    return linkTags.indexOf(t) !== -1;
                });
            }

            var match = searchMatch && tagMatch;
            if (match) {
                link.classList.remove("hidden");
                hasVisibleLink = true;
            } else {
                link.classList.add("hidden");
            }
        });

        var showCard =
            hasVisibleLink || (activeTags.length === 0 && (!q || titleMatch));
        if (showCard) {
            card.classList.remove("hidden");
            visibleCount++;
        } else {
            card.classList.add("hidden");
        }
    });

    emptyState.style.display = visibleCount === 0 ? "block" : "none";
}

/* ─── Tooltip ───────────────────────────────────────────── */
var tooltip = document.createElement("div");
tooltip.className = "link-tooltip";
document.body.appendChild(tooltip);

var tooltipTimeout;

document.addEventListener("mouseover", function (e) {
    var item = e.target.closest(".link-item");
    if (!item) return;
    clearTimeout(tooltipTimeout);

    var html =
        '<div class="tooltip-name">' + (item.dataset.linkname || "") + "</div>";
    html +=
        '<div class="tooltip-url">' + (item.dataset.linkurl || "") + "</div>";
    if (item.dataset.desc) {
        html += '<div class="tooltip-desc">' + item.dataset.desc + "</div>";
    }
    var tags = (item.dataset.tags || "").trim();
    if (tags) {
        html += '<div class="tooltip-tags">';
        tags.split(" ").forEach(function (t) {
            if (t) html += '<span class="tooltip-tag">' + t + "</span>";
        });
        html += "</div>";
    }
    tooltip.innerHTML = html;
    tooltip.classList.add("visible");
    positionTooltip(item);
});

document.addEventListener("mouseout", function (e) {
    var item = e.target.closest(".link-item");
    if (!item) return;
    tooltipTimeout = setTimeout(function () {
        tooltip.classList.remove("visible");
    }, 80);
});

function positionTooltip(anchor) {
    var rect = anchor.getBoundingClientRect();
    tooltip.style.left = rect.left + "px";
    tooltip.style.top = rect.bottom + 6 + "px";
    var tr = tooltip.getBoundingClientRect();
    if (tr.right > window.innerWidth - 12) {
        tooltip.style.left = window.innerWidth - tr.width - 12 + "px";
    }
    if (tr.bottom > window.innerHeight - 12) {
        tooltip.style.top = rect.top - tr.height - 6 + "px";
    }
}

/* ─── Initial Render ───────────────────────────────────── */
(function bootstrap() {
    // Always try to load data.json first; if it succeeds, use it as
    // the source of truth (allows updating the file externally).
    fetch("data.json")
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(function (data) {
            // If localStorage already has data, only overwrite when the
            // user explicitly resets. On very first visit seed localStorage.
            if (categories.length === 0) {
                categories = data;
                saveCategories(categories);
            }
            renderAll();
        })
        .catch(function () {
            // fetch failed (file:// protocol or file missing)
            if (categories.length > 0) {
                renderAll();
            } else {
                emptyState.innerHTML =
                    'No data loaded yet.<br/><button class="mgmt-btn accent-cyan" id="btn-first-import" style="margin-top:12px;">📥 Import data.json</button>';
                emptyState.style.display = "block";
                document
                    .getElementById("btn-first-import")
                    .addEventListener("click", function () {
                        pickJSONFile(function (data) {
                            categories = data;
                            saveCategories(categories);
                            emptyState.style.display = "none";
                            renderAll();
                        });
                    });
            }
        });
})();
