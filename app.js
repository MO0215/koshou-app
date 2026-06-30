// --- 1. 初期データの設定 ---
let appData = JSON.parse(localStorage.getItem('koshou_app_data_v7')) || {
    themeColor: "#25eeff",
    maxEpisodes: 12,
    showImages: true,
    isLightTheme: false,
    characters: [
        { id: 1, name: "綾小路清隆", kana: "あやのこうじ", image: "", episodes: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { id: 2, name: "堀北鈴音", kana: "ほりきた", image: "", episodes: [1,2,3,5,6,7,10,11,12] },
        { id: 3, name: "櫛田桔梗", kana: "くしだ", image: "", episodes: [1,2,4,5,8,9,12] }
    ],
    appellations: {
        "1-1": "オレ", "1-2": "堀北", "1-3": "櫛田",
        "2-1": "綾小路くん", "2-2": "私", "2-3": "櫛田さん",
        "3-1": "綾小路くん", "3-2": "堀北さん", "3-3": "私"
    }
};

let currentEditingCharId = null;
let clickTimer = null; 

const table = document.getElementById("matrix-table");
const themeColorInput = document.getElementById("theme-color");
const viewEpisodeSelect = document.getElementById("view-episode");
const toggleImageCheckbox = document.getElementById("toggle-image");
const epModal = document.getElementById("ep-modal");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

const widthSlider = document.getElementById("size-width");
const heightSlider = document.getElementById("size-height");
const fontSlider = document.getElementById("size-font");

// --- 2. アプリの起動・設定適用 ---
function initApp() {
    updateEpisodeSelect();
    themeColorInput.value = appData.themeColor;
    document.documentElement.style.setProperty('--theme-color', appData.themeColor);

    if (appData.showImages === undefined) appData.showImages = true;
    toggleImageCheckbox.checked = appData.showImages;
    updateImageVisibility();

    if (appData.isLightTheme) {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        themeToggleBtn.textContent = "🌙 ダークモードに切り替え";
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        themeToggleBtn.textContent = "☀️ ライトモードに切り替え";
    }

    document.documentElement.style.setProperty('--cell-width', `${widthSlider.value}px`);
    document.documentElement.style.setProperty('--cell-height', `${heightSlider.value}px`);
    document.documentElement.style.setProperty('--font-size', `${fontSlider.value}px`);

    widthSlider.addEventListener("input", (e) => { document.documentElement.style.setProperty('--cell-width', `${e.target.value}px`); });
    heightSlider.addEventListener("input", (e) => { document.documentElement.style.setProperty('--cell-height', `${e.target.value}px`); });
    fontSlider.addEventListener("input", (e) => { document.documentElement.style.setProperty('--font-size', `${e.target.value}px`); });

    renderTable();
}

themeToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        themeToggleBtn.textContent = "🌙 ダークモードに切り替え";
        appData.isLightTheme = true;
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        themeToggleBtn.textContent = "☀️ ライトモードに切り替え";
        appData.isLightTheme = false;
    }
    saveToLocalStorage();
    renderTable();
});

function updateEpisodeSelect() {
    const currentVal = viewEpisodeSelect.value;
    viewEpisodeSelect.innerHTML = '<option value="all">全話（すべてのキャラ）</option>';
    for (let i = 1; i <= appData.maxEpisodes; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `第${i}話`;
        viewEpisodeSelect.appendChild(opt);
    }
    viewEpisodeSelect.value = currentVal || "all";
}

function updateImageVisibility() {
    if (toggleImageCheckbox.checked) {
        table.classList.remove("hide-image");
    } else {
        table.classList.add("hide-image");
    }
}

// --- 3. 表の描画 ---
function renderTable() {
    table.innerHTML = "";
    const selectedEp = viewEpisodeSelect.value;

    // 表示するキャラクターを定義
    const displayCharacters = appData.characters.filter(char => {
        if (selectedEp === "all") return true;
        return char.episodes && char.episodes.includes(parseInt(selectedEp));
    });

    if (displayCharacters.length === 0) {
        table.innerHTML = "<tr><td style='width:auto;'>該当する話数に登場するキャラクターがいません。</td></tr>";
        return;
    }

    // --- ヘッダー行（横軸） ---
    const headerRow = document.createElement("tr");
    const topLeftTh = document.createElement("th");
    topLeftTh.textContent = "呼ぶ ＼ 呼ばれる";
    headerRow.appendChild(topLeftTh);

    displayCharacters.forEach(char => {
        const th = document.createElement("th");
        setupHeaderCell(th, char, false);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // --- 各行（縦軸） ---
    displayCharacters.forEach((fromChar, index) => {
        const row = document.createElement("tr");
        
        // 【重要】行をドラッグ可能にする属性を付与し、キャラクター固有のIDを記憶させる
        row.draggable = true;
        row.dataset.charId = fromChar.id;

        const rowHeader = document.createElement("th");
        setupHeaderCell(rowHeader, fromChar, true);
        row.appendChild(rowHeader);

        displayCharacters.forEach(toChar => {
            const td = document.createElement("td");
            const key = `${fromChar.id}-${toChar.id}`;
            td.textContent = appData.appellations[key] || "";

            if (fromChar.id === toChar.id) {
                td.classList.add("self-call");
            }

            td.addEventListener("dblclick", () => {
                if (td.querySelector("input")) return;
                const input = document.createElement("input");
                input.type = "text";
                input.value = td.textContent;
                td.textContent = "";
                td.appendChild(input);
                input.focus();

                const saveCall = () => {
                    const newValue = input.value.trim();
                    appData.appellations[key] = newValue;
                    td.textContent = newValue;
                    saveToLocalStorage();
                };
                input.addEventListener("blur", saveCall);
                input.addEventListener("keydown", (e) => { if (e.key === "Enter") saveCall(); });
            });

            row.appendChild(td);
        });

        // ドラッグ＆ドロップイベントの組み込み
        setupDragAndDropEvents(row);
        table.appendChild(row);
    });
    updateImageVisibility();
}

// --- 【新機能】ドラッグ＆ドロップのイベントロジック ---
function setupDragAndDropEvents(row) {
    row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", row.dataset.charId);
    });

    row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        // 並び替えが終わったら最終的な順番をローカルストレージへ即時保存
        saveToLocalStorage();
    });

    row.addEventListener("dragover", (e) => {
        e.preventDefault(); // ドロップを許可するために必須
        const draggingRow = table.querySelector(".dragging");
        if (!draggingRow || draggingRow === row) return;

        // マウスの位置を計算して、行の上半分にいれば上に、下半分にいれば下に差し込む
        const bounding = row.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        if (offset > bounding.height / 2) {
            row.after(draggingRow);
        } else {
            row.before(draggingRow);
        }

        // 画面上のDOM（行）の並び順に合わせて、内部データ（appData.characters）の順番も並び替える
        reorderInternalData();
    });
}

// 画面の見た目の並び順に合わせて、配列データを並び替える関数
function reorderInternalData() {
    const rows = Array.from(table.querySelectorAll("tr")).slice(1); // ヘッダー行を除く
    const newOrderIds = rows.map(r => parseInt(r.dataset.charId));

    // 現在の表示中キャラだけでなく、全データ（appData.characters）を新しい順序にソートする
    appData.characters.sort((a, b) => {
        return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
    });
    
    // 横軸（列ヘッダー）もリアルタイムに並び替えるために再描画
    const headerRow = table.querySelector("tr");
    const ths = Array.from(headerRow.querySelectorAll("th")).slice(1); // 左上除く
    
    // 横軸のth要素を縦の並びと同じ順番に並び替える
    newOrderIds.forEach(id => {
        const char = appData.characters.find(c => c.id === id);
        const targetTh = ths.find(th => th.textContent.includes(char.name));
        if (targetTh) headerRow.appendChild(targetTh);
    });
}

// --- ヘッダーセル（衝突回避・名前編集フォーム） ---
function setupHeaderCell(th, char, includeImage) {
    th.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("v-header-content");

    if (includeImage && char.image) {
        const img = document.createElement("img");
        img.src = char.image;
        img.classList.add("char-icon");
        container.appendChild(img);
    }

    const rubyNode = document.createElement("ruby");
    rubyNode.textContent = char.name;
    if (char.kana) {
        const rtNode = document.createElement("rt");
        rtNode.textContent = char.kana;
        rubyNode.appendChild(rtNode);
    }
    container.appendChild(rubyNode);
    th.appendChild(container);

    th.addEventListener("click", (e) => {
        if (th.querySelector(".edit-form")) return;
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return; }
        clickTimer = setTimeout(() => { openEpisodeModal(char); clickTimer = null; }, 200);
    });

    th.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        if (th.querySelector(".edit-form")) return;

        th.innerHTML = "";
        const formDiv = document.createElement("div");
        formDiv.classList.add("edit-form");
        formDiv.style.display = "flex";
        formDiv.style.flexDirection = "column";
        formDiv.style.gap = "2px";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = char.name;
        nameInput.placeholder = "名前";

        const kanaInput = document.createElement("input");
        kanaInput.type = "text";
        kanaInput.value = char.kana || "";
        kanaInput.placeholder = "フリガナ";
        kanaInput.style.fontSize = "11px";

        formDiv.appendChild(kanaInput);
        formDiv.appendChild(nameInput);
        th.appendChild(formDiv);
        nameInput.focus();

        let isSaved = false;
        const saveHeaderData = () => {
            if (isSaved) return;
            isSaved = true;
            const newName = nameInput.value.trim();
            if (newName) {
                char.name = newName;
                char.kana = kanaInput.value.trim();
                saveToLocalStorage();
            }
            renderTable();
        };

        nameInput.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== kanaInput) saveHeaderData(); }, 100));
        kanaInput.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== nameInput) saveHeaderData(); }, 100));
        formDiv.addEventListener("keydown", (e) => { if (e.key === "Enter") saveHeaderData(); });
    });
}

// --- モーダル制御 ---
function openEpisodeModal(char) {
    currentEditingCharId = char.id;
    document.getElementById("modal-char-name").textContent = `${char.name} の設定`;
    
    const preview = document.getElementById("modal-image-preview");
    if (char.image) { preview.innerHTML = `<img src="${char.image}">`; } else { preview.textContent = "画像なし"; }

    const container = document.getElementById("ep-checkbox-container");
    container.innerHTML = "";

    for (let i = 1; i <= appData.maxEpisodes; i++) {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = i;
        if (char.episodes && char.episodes.includes(i)) checkbox.checked = true;

        checkbox.addEventListener("change", () => {
            const charObj = appData.characters.find(c => c.id === currentEditingCharId);
            if (!charObj.episodes) charObj.episodes = [];
            if (checkbox.checked) {
                if (!charObj.episodes.includes(i)) charObj.episodes.push(i);
            } else {
                charObj.episodes = charObj.episodes.filter(ep => ep !== i);
            }
            charObj.episodes.sort((a, b) => a - b);
            saveToLocalStorage();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`第 ${i} 話`));
        container.appendChild(label);
    }
    epModal.classList.add("open");
}

document.getElementById("char-image-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const charObj = appData.characters.find(c => c.id === currentEditingCharId);
        charObj.image = event.target.result;
        document.getElementById("modal-image-preview").innerHTML = `<img src="${charObj.image}">`;
        saveToLocalStorage();
    };
    reader.readAsDataURL(file);
});

document.getElementById("modal-close-btn").addEventListener("click", () => {
    epModal.classList.remove("open");
    renderTable();
});

// --- 操作パネルの各種ボタンイベント ---
document.getElementById("add-char-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("new-char-name");
    const kanaInput = document.getElementById("new-char-kana");
    const name = nameInput.value.trim();
    const kana = kanaInput.value.trim();

    if (!name) return alert("キャラクター名を入力してください。");

    const newId = appData.characters.length > 0 ? Math.max(...appData.characters.map(c => c.id)) + 1 : 1;
    const allEps = Array.from({length: appData.maxEpisodes}, (_, i) => i + 1);
    
    appData.characters.push({ id: newId, name: name, kana: kana, image: "", episodes: allEps });
    appData.appellations[`${newId}-${newId}`] = "私";

    nameInput.value = ""; kanaInput.value = "";
    renderTable();
    saveToLocalStorage();
});

document.getElementById("add-ep-btn").addEventListener("click", () => {
    appData.maxEpisodes += 1;
    alert(`第 ${appData.maxEpisodes} 話 を追加しました。`);
    updateEpisodeSelect();
    saveToLocalStorage();
});

toggleImageCheckbox.addEventListener("change", () => {
    appData.showImages = toggleImageCheckbox.checked;
    updateImageVisibility();
    saveToLocalStorage();
});

viewEpisodeSelect.addEventListener("change", renderTable);

themeColorInput.addEventListener("input", (e) => {
    appData.themeColor = e.target.value;
    document.documentElement.style.setProperty('--theme-color', e.target.value);
    saveToLocalStorage();
});

function saveToLocalStorage() {
    localStorage.setItem('koshou_app_data_v7', JSON.stringify(appData));
}

// --- 画像（PNG）として保存するロジック ---
document.getElementById("png-btn").addEventListener("click", () => {
    const captureArea = document.getElementById("table-capture-area");
    const selectedEp = viewEpisodeSelect.value;
    const titleName = selectedEp === "all" ? "呼称表_全話分" : `呼称表_第${selectedEp}話時点`;

    html2canvas(captureArea, {
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--table-bg').trim(),
        scale: 2, 
        useCORS: true, 
        logging: false
    }).then(canvas => {
        const imageURI = canvas.toDataURL("image/png");
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = imageURI;
        downloadAnchor.download = `${titleName}.png`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }).catch(err => { alert("画像の書き出し中にエラーが発生しました。"); });
});

// --- Excel書き出しロジック ---
document.getElementById("excel-btn").addEventListener("click", () => {
    const selectedEp = viewEpisodeSelect.value;
    const displayCharacters = appData.characters.filter(char => {
        if (selectedEp === "all") return true;
        return char.episodes && char.episodes.includes(parseInt(selectedEp));
    });

    const wb = XLSX.utils.book_new();
    const ws = {};
    const hexColor = appData.themeColor.replace("#", "");

    const headerStyle = {
        fill: { fgColor: { rgb: hexColor } }, 
        font: { bold: true, color: { rgb: "000000" }, name: "游ゴシック" },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "thin", color: { rgb: "A6A6A6" } }, bottom: { style: "thin", color: { rgb: "A6A6A6" } },
            left: { style: "thin", color: { rgb: "A6A6A6" } }, right: { style: "thin", color: { rgb: "A6A6A6" } }
        }
    };

    const cellStyle = { font: { name: "游ゴシック" }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: headerStyle.border };
    const selfStyle = { fill: { fgColor: { rgb: "EAEAEA" } }, font: { bold: true, name: "游ゴシック" }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: headerStyle.border };

    ws["A1"] = { v: "呼ぶ ＼ 呼ばれる", s: headerStyle };

    displayCharacters.forEach((c, idx) => {
        const colLetter = XLSX.utils.encode_col(idx + 1);
        const cellRef = `${colLetter}1`;
        const fullName = c.kana ? `（${c.kana}）\n${c.name}` : c.name;
        ws[cellRef] = { v: fullName, s: headerStyle };
    });

    displayCharacters.forEach((fromChar, rIdx) => {
        const rowNum = rIdx + 2;
        const fromName = fromChar.kana ? `（${fromChar.kana}）\n${fromChar.name}` : fromChar.name;
        ws[`A${rowNum}`] = { v: fromName, s: headerStyle };

        displayCharacters.forEach((toChar, cIdx) => {
            const colLetter = XLSX.utils.encode_col(cIdx + 1);
            const cellRef = `${colLetter}${rowNum}`;
            const key = `${fromChar.id}-${toChar.id}`;
            const val = appData.appellations[key] || "";
            const targetStyle = (fromChar.id === toChar.id) ? selfStyle : cellStyle;
            ws[cellRef] = { v: val, s: targetStyle };
        });
    });

    const maxColLetter = XLSX.utils.encode_col(displayCharacters.length);
    ws["!ref"] = `A1:${maxColLetter}${displayCharacters.length + 1}`;

    const cols = [{ wch: 20 }]; 
    for (let i = 0; i < displayCharacters.length; i++) { cols.push({ wch: 16 }); }
    ws["!cols"] = cols;

    const rows = [{ hpt: 35 }]; 
    for (let i = 0; i < displayCharacters.length; i++) { rows.push({ hpt: 30 }); }
    ws["!rows"] = rows;

    const titleName = selectedEp === "all" ? "呼称表_全話分" : `呼称表_第${selectedEp}話時点`;
    XLSX.utils.book_append_sheet(wb, ws, "呼称表");
    XLSX.writeFile(wb, `${titleName}.xlsx`);
});

// --- JSONセーブファイル管理 ---
document.getElementById("save-file-btn").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "koshou_app_save_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

document.getElementById("load-file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            if (parsedData.characters && parsedData.appellations) {
                appData = parsedData;
                saveToLocalStorage();
                initApp();
                alert("データを正常に読み込みました！");
            }
        } catch (err) { alert("ファイルの読み込みに失敗しました。"); }
    };
    reader.readAsText(file);
});

document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("すべてのデータを削除して初期状態に戻しますか？")) {
        localStorage.removeItem('koshou_app_data_v7');
        location.reload();
    }
});

initApp();