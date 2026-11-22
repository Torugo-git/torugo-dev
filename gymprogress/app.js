/* GymProgress — Full-Stack Client Engine (LocalStorage + Chart.js + Rest Timer + Device-Bound Licensing) */
(function () {
    'use strict';

    const MODE = window.GYMPROGRESS_MODE || 'full'; // 'full' | 'demo'
    const DB_KEY = MODE === 'demo' ? 'gymprogress_demo_db_v1' : 'gymprogress_db_v1';

    const METRICS = [
        { key: 'weight', label: 'Peso', unit: 'kg', defaultGoal: 79.0 },
        { key: 'waist', label: 'Cintura / Umbigo', unit: 'cm', defaultGoal: 82.0 },
        { key: 'chest', label: 'Peito', unit: 'cm', defaultGoal: 104.0 },
        { key: 'armFlexed', label: 'Braço Contraído', unit: 'cm', defaultGoal: 40.0 },
        { key: 'armRelaxed', label: 'Braço Relaxado', unit: 'cm', defaultGoal: 36.5 },
        { key: 'neck', label: 'Pescoço', unit: 'cm', defaultGoal: 40.0 },
        { key: 'thigh', label: 'Coxa', unit: 'cm', defaultGoal: 61.0 }
    ];

    /* ==================== LICENSING & DEVICE LOCK ==================== */
    function getOrCreateDeviceId() {
        let devId = localStorage.getItem('gymprogress_device_id');
        if (!devId || !/^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(devId)) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            devId = `GP-${block()}-${block()}`;
            localStorage.setItem('gymprogress_device_id', devId);
        }
        return devId;
    }

    function computeDeviceSignature(deviceId, ownerName) {
        const cleanDev = (deviceId || '').toUpperCase().trim();
        const cleanOwner = (ownerName || '').toUpperCase().trim();
        const payload = `${cleanDev}::${cleanOwner}::TORUGO_GYMPROGRESS_2026`;
        let h1 = 0xdeadbeef ^ payload.length;
        let h2 = 0x41c6ce57 ^ payload.length;
        for (let i = 0; i < payload.length; i++) {
            const ch = payload.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        const hex = ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).toUpperCase();
        return hex.slice(0, 6);
    }

    const currentDeviceId = getOrCreateDeviceId();

    function checkAutoVipRedirect() {
        if (MODE !== 'demo') return;
        const params = new URLSearchParams(window.location.search);
        const vipParam = (params.get('vip') || params.get('chave') || '').toLowerCase().trim();
        if (['torugo', 'victor', 'gympro', 'gymprogress2026'].includes(vipParam)) {
            localStorage.setItem('gymprogress_vip', 'true');
            localStorage.setItem('gymprogress_licensed_owner', 'Victor Hugo');
            window.location.replace('app.html');
            return;
        }
        if (localStorage.getItem('gymprogress_vip') === 'true' && params.get('demo') !== '1') {
            const savedSig = localStorage.getItem('gymprogress_license_sig');
            const savedOwner = localStorage.getItem('gymprogress_licensed_owner') || '';
            if (!savedSig || computeDeviceSignature(currentDeviceId, savedOwner) === savedSig) {
                window.location.replace('app.html');
            }
        }
    }
    checkAutoVipRedirect();

    /* ==================== SEED / SAMPLE DATA ==================== */
    function daysAgoISO(days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().slice(0, 10);
    }

    function createSampleData() {
        return {
            isSample: true,
            splits: [
                {
                    id: 'split-a',
                    name: 'Treino A — Costas & Bíceps',
                    exercises: [
                        { id: 'ex-1', name: 'Puxada Frontal Aberta', targetSets: 3, targetReps: '8-10' },
                        { id: 'ex-2', name: 'Remada Curvada Barra', targetSets: 3, targetReps: '6-8' },
                        { id: 'ex-3', name: 'Rosca Direta Barra W', targetSets: 3, targetReps: '8-12' }
                    ]
                },
                {
                    id: 'split-b',
                    name: 'Treino B — Peito & Tríceps',
                    exercises: [
                        { id: 'ex-4', name: 'Supino Reto Halteres', targetSets: 3, targetReps: '6-8' },
                        { id: 'ex-5', name: 'Supino Inclinado Máquina', targetSets: 3, targetReps: '8-10' },
                        { id: 'ex-6', name: 'Tríceps Corda Polia', targetSets: 3, targetReps: '10-12' }
                    ]
                },
                {
                    id: 'split-c',
                    name: 'Treino C — Pernas & Ombros',
                    exercises: [
                        { id: 'ex-7', name: 'Agachamento Livre', targetSets: 3, targetReps: '6-8' },
                        { id: 'ex-8', name: 'Leg Press 45°', targetSets: 3, targetReps: '10-12' },
                        { id: 'ex-9', name: 'Desenvolvimento Halteres', targetSets: 3, targetReps: '8-10' }
                    ]
                }
            ],
            history: [
                {
                    id: 'log-1',
                    splitId: 'split-a',
                    splitName: 'Treino A — Costas & Bíceps',
                    date: daysAgoISO(14),
                    durationMin: 48,
                    totalVolume: 3320,
                    bestEpley1RM: 74.7,
                    exercises: [
                        {
                            name: 'Puxada Frontal Aberta',
                            note: 'Execução bem controlada na excêntrica.',
                            sets: [
                                { weight: 55, reps: 10, rir: 2, done: true },
                                { weight: 55, reps: 9, rir: 1, done: true },
                                { weight: 55, reps: 8, rir: 1, done: true }
                            ]
                        },
                        {
                            name: 'Remada Curvada Barra',
                            note: 'Subir para 60kg na próxima semana.',
                            sets: [
                                { weight: 56, reps: 8, rir: 2, done: true },
                                { weight: 56, reps: 8, rir: 1, done: true },
                                { weight: 56, reps: 7, rir: 1, done: true }
                            ]
                        },
                        {
                            name: 'Rosca Direta Barra W',
                            note: '',
                            sets: [
                                { weight: 20, reps: 10, rir: 2, done: true },
                                { weight: 20, reps: 9, rir: 1, done: true },
                                { weight: 20, reps: 8, rir: 0, done: true }
                            ]
                        }
                    ]
                },
                {
                    id: 'log-2',
                    splitId: 'split-a',
                    splitName: 'Treino A — Costas & Bíceps',
                    date: daysAgoISO(7),
                    durationMin: 52,
                    totalVolume: 3634,
                    bestEpley1RM: 76.0,
                    exercises: [
                        {
                            name: 'Puxada Frontal Aberta',
                            note: 'Senti boa conexão dorsal, manter 60kg.',
                            sets: [
                                { weight: 60, reps: 9, rir: 2, done: true },
                                { weight: 60, reps: 8, rir: 1, done: true },
                                { weight: 60, reps: 8, rir: 1, done: true }
                            ]
                        },
                        {
                            name: 'Remada Curvada Barra',
                            note: 'Progressão feita com ótima postura!',
                            sets: [
                                { weight: 60, reps: 8, rir: 1, done: true },
                                { weight: 60, reps: 8, rir: 1, done: true },
                                { weight: 60, reps: 7, rir: 0, done: true }
                            ]
                        },
                        {
                            name: 'Rosca Direta Barra W',
                            note: 'Tentar 24kg semana que vem.',
                            sets: [
                                { weight: 22, reps: 10, rir: 2, done: true },
                                { weight: 22, reps: 9, rir: 1, done: true },
                                { weight: 22, reps: 9, rir: 0, done: true }
                            ]
                        }
                    ]
                },
                {
                    id: 'log-3',
                    splitId: 'split-b',
                    splitName: 'Treino B — Peito & Tríceps',
                    date: daysAgoISO(3),
                    durationMin: 46,
                    totalVolume: 3490,
                    bestEpley1RM: 81.1,
                    exercises: [
                        {
                            name: 'Supino Reto Halteres',
                            note: 'Peso somado dos dois halteres (32kg cada).',
                            sets: [
                                { weight: 64, reps: 8, rir: 1, done: true },
                                { weight: 64, reps: 8, rir: 1, done: true },
                                { weight: 64, reps: 7, rir: 0, done: true }
                            ]
                        },
                        {
                            name: 'Supino Inclinado Máquina',
                            note: '',
                            sets: [
                                { weight: 50, reps: 10, rir: 2, done: true },
                                { weight: 50, reps: 9, rir: 1, done: true },
                                { weight: 50, reps: 9, rir: 1, done: true }
                            ]
                        },
                        {
                            name: 'Tríceps Corda Polia',
                            note: 'Abrir bem a corda no final.',
                            sets: [
                                { weight: 25, reps: 12, rir: 1, done: true },
                                { weight: 25, reps: 11, rir: 1, done: true },
                                { weight: 25, reps: 10, rir: 0, done: true }
                            ]
                        }
                    ]
                }
            ],
            measurements: [
                {
                    id: 'm-1',
                    date: daysAgoISO(28),
                    weight: 82.4,
                    waist: 87.5,
                    chest: 100.5,
                    armRelaxed: 34.5,
                    armFlexed: 37.8,
                    neck: 39.0,
                    thigh: 58.5
                },
                {
                    id: 'm-2',
                    date: daysAgoISO(2),
                    weight: 80.8,
                    waist: 84.5,
                    chest: 102.2,
                    armRelaxed: 35.3,
                    armFlexed: 38.7,
                    neck: 39.4,
                    thigh: 59.6
                }
            ],
            goals: {
                weight: 79.0,
                waist: 82.0,
                chest: 104.0,
                armRelaxed: 36.5,
                armFlexed: 40.0,
                neck: 40.0,
                thigh: 61.0
            }
        };
    }

    /* ==================== STATE MANAGEMENT ==================== */
    function loadDB() {
        if (MODE === 'demo') {
            return createSampleData();
        }
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.splits)) {
                    parsed.goals = parsed.goals || createSampleData().goals;
                    parsed.measurements = parsed.measurements || [];
                    parsed.history = parsed.history || [];
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Erro ao ler DB:', e);
        }
        const seed = createSampleData();
        localStorage.setItem(DB_KEY, JSON.stringify(seed));
        return seed;
    }

    let db = loadDB();
    let activeTab = 'treinos';
    let activeSession = null; // { splitId, splitName, startedAt, exercises: [{ name, targetSets, targetReps, lastSummary, lastNote, note, sets: [...] }] }
    let selectedMetricChart = 'waist';
    let exerciseChartInstance = null;
    let measureChartInstance = null;

    // Rest Timer State
    let restInterval = null;
    let restRemaining = 90;
    let restDefault = 90;
    let restPaused = false;

    function saveDB() {
        if (MODE === 'demo') return;
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    }

    function requireFullLicense(featureLabel) {
        if (MODE !== 'demo') return true;
        openPaywallModal(featureLabel);
        return false;
    }

    /* ==================== HELPERS ==================== */
    function fmtNum(val, dec = 1) {
        if (val === null || val === undefined || isNaN(val)) return '—';
        return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }

    function fmtInt(val) {
        if (val === null || val === undefined || isNaN(val)) return '0';
        return Math.round(Number(val)).toLocaleString('pt-BR');
    }

    function fmtDateBR(iso) {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }

    function epley1RM(weight, reps) {
        const w = parseFloat(weight) || 0;
        const r = parseInt(reps, 10) || 0;
        if (w <= 0 || r <= 0) return 0;
        if (r === 1) return w;
        return w * (1 + r / 30);
    }

    function showToast(msg) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.remove('show'), 2400);
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function playRestBeep() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            [0, 0.18, 0.36].forEach((offset) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
                gain.gain.setValueAtTime(0.14, ctx.currentTime + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + offset);
                osc.stop(ctx.currentTime + offset + 0.16);
            });
        } catch (_) {}
        if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    }

    /* ==================== NAVIGATION ==================== */
    window.switchTab = function (tab) {
        activeTab = tab;
        ['treinos', 'medidas', 'evolucao'].forEach((t) => {
            document.getElementById(`panel-${t}`)?.classList.toggle('active', t === tab);
            document.getElementById(`nav-${t}`)?.classList.toggle('active', t === tab);
        });
        if (tab === 'medidas') renderMedidas();
        if (tab === 'evolucao') renderEvolucao();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ==================== TAB 1: TREINOS & PROGRESSÃO ==================== */
    function getLastExerciseLog(exerciseName) {
        const target = (exerciseName || '').trim().toLowerCase();
        const sorted = [...db.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        for (const log of sorted) {
            const found = (log.exercises || []).find((e) => (e.name || '').trim().toLowerCase() === target);
            if (found && found.sets && found.sets.length > 0) {
                return { date: log.date, exercise: found };
            }
        }
        return null;
    }

    function formatLastTimeSummary(last) {
        if (!last) return 'Primeira vez registrando este exercício';
        const doneSets = last.exercise.sets.filter((s) => s.done !== false && (parseFloat(s.weight) > 0 || parseInt(s.reps, 10) > 0));
        if (!doneSets.length) return 'Sem séries concluídas no último treino';
        const weights = doneSets.map((s) => Number(s.weight));
        const allSameWeight = weights.every((w) => w === weights[0]);
        const repsList = doneSets.map((s) => s.reps).join(', ');
        if (allSameWeight) {
            return `Última vez (${fmtDateBR(last.date)}): ${weights[0]}kg × ${repsList}`;
        }
        const pairs = doneSets.map((s) => `${s.weight}kg×${s.reps}`).join(' · ');
        return `Última vez (${fmtDateBR(last.date)}): ${pairs}`;
    }

    function renderTreinos() {
        const sampleBanner = document.getElementById('sample-data-banner');
        if (sampleBanner) {
            sampleBanner.classList.toggle('hidden', !db.isSample || MODE === 'demo');
        }

        const listEl = document.getElementById('splits-view');
        const activeEl = document.getElementById('active-workout-view');

        if (activeSession) {
            listEl.classList.add('hidden');
            activeEl.classList.remove('hidden');
            renderActiveSession();
            return;
        }

        activeEl.classList.add('hidden');
        listEl.classList.remove('hidden');

        const container = document.getElementById('splits-container');
        if (!db.splits.length) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:32px 16px;">
                    <div style="font-size:32px; margin-bottom:8px;">🏋️</div>
                    <h3 class="section-title" style="font-size:16px;">Nenhuma ficha criada ainda</h3>
                    <p class="section-sub" style="margin-bottom:16px;">Crie seu primeiro treino (ex.: Treino A — Costas & Bíceps) para começar a registrar suas cargas.</p>
                    <button class="btn btn-primary" onclick="openSplitModal()">+ Criar Primeira Ficha</button>
                </div>`;
            return;
        }

        container.innerHTML = db.splits.map((split) => {
            const lastForSplit = [...db.history]
                .filter((h) => h.splitId === split.id)
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

            const exHtml = (split.exercises || []).length
                ? split.exercises.map((ex) => `
                    <div class="exercise-preview-item">
                        <span class="exercise-preview-name">${escapeHtml(ex.name)}</span>
                        <span class="exercise-preview-target">${ex.targetSets}× ${escapeHtml(ex.targetReps)}</span>
                    </div>`).join('')
                : `<p class="section-sub" style="padding:8px 0;">Nenhum exercício cadastrado nesta ficha.</p>`;

            return `
                <div class="split-card">
                    <div class="card-header" style="margin-bottom:6px;">
                        <div>
                            <h3 class="section-title" style="font-size:16px;">${escapeHtml(split.name)}</h3>
                            <div class="split-meta">
                                <span class="chip">${split.exercises.length} exercícios</span>
                                ${lastForSplit ? `<span class="chip chip-neon">Último: ${fmtDateBR(lastForSplit.date)} · ${fmtInt(lastForSplit.totalVolume)} kg</span>` : '<span class="chip">Ainda não realizado</span>'}
                            </div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button class="icon-btn" title="Editar ficha" onclick="openSplitModal('${split.id}')">✏️</button>
                            <button class="icon-btn" title="Excluir ficha" onclick="deleteSplit('${split.id}')">🗑️</button>
                        </div>
                    </div>
                    <div class="exercise-preview-list">${exHtml}</div>
                    <button class="btn btn-primary btn-block" onclick="startWorkout('${split.id}')">
                        ⚡ Treinar Agora
                    </button>
                </div>`;
        }).join('');
    }

    /* ---- Split Create / Edit Modal ---- */
    let editingSplitExercises = [];

    window.openSplitModal = function (splitId) {
        if (!requireFullLicense('Criar ou Editar Fichas de Treino')) return;
        const modal = document.getElementById('modal-split');
        const idInput = document.getElementById('split-edit-id');
        const nameInput = document.getElementById('split-name-input');
        const title = document.getElementById('modal-split-title');

        if (splitId) {
            const sp = db.splits.find((s) => s.id === splitId);
            if (!sp) return;
            idInput.value = sp.id;
            nameInput.value = sp.name;
            title.textContent = 'Editar Ficha de Treino';
            editingSplitExercises = JSON.parse(JSON.stringify(sp.exercises || []));
        } else {
            idInput.value = '';
            nameInput.value = '';
            title.textContent = 'Nova Ficha de Treino';
            editingSplitExercises = [
                { id: 'ex-' + Date.now(), name: '', targetSets: 3, targetReps: '8-10' }
            ];
        }
        renderSplitEditorExercises();
        modal.classList.add('open');
        setTimeout(() => nameInput.focus(), 80);
    };

    window.closeSplitModal = function () {
        document.getElementById('modal-split').classList.remove('open');
    };

    window.addExerciseRowToEditor = function () {
        editingSplitExercises.push({
            id: 'ex-' + Date.now() + '-' + Math.floor(Math.random() * 999),
            name: '',
            targetSets: 3,
            targetReps: '8-12'
        });
        renderSplitEditorExercises();
    };

    window.removeExerciseRowFromEditor = function (idx) {
        editingSplitExercises.splice(idx, 1);
        renderSplitEditorExercises();
    };

    window.updateEditorExercise = function (idx, field, val) {
        if (!editingSplitExercises[idx]) return;
        editingSplitExercises[idx][field] = field === 'targetSets' ? Math.max(1, parseInt(val, 10) || 1) : val;
    };

    function renderSplitEditorExercises() {
        const box = document.getElementById('split-editor-exercises');
        box.innerHTML = editingSplitExercises.map((ex, idx) => `
            <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:12px; padding:10px; margin-bottom:8px;">
                <div style="display:flex; gap:6px; margin-bottom:8px;">
                    <input type="text" class="input" style="min-height:38px; font-size:13.5px;" placeholder="Nome do exercício (ex: Supino Reto)" value="${escapeHtml(ex.name)}" oninput="updateEditorExercise(${idx}, 'name', this.value)">
                    <button type="button" class="btn btn-danger btn-sm" style="padding:0 10px;" onclick="removeExerciseRowFromEditor(${idx})">✕</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <div class="field">
                        <label style="font-size:10px;">Séries</label>
                        <input type="number" inputmode="numeric" min="1" max="15" class="input" style="min-height:36px; font-size:13.5px;" value="${ex.targetSets}" oninput="updateEditorExercise(${idx}, 'targetSets', this.value)">
                    </div>
                    <div class="field">
                        <label style="font-size:10px;">Faixa de Reps</label>
                        <input type="text" class="input" style="min-height:36px; font-size:13.5px;" placeholder="Ex: 6-8" value="${escapeHtml(ex.targetReps)}" oninput="updateEditorExercise(${idx}, 'targetReps', this.value)">
                    </div>
                </div>
            </div>`).join('');
    }

    window.saveSplitFromModal = function (e) {
        e.preventDefault();
        const editId = document.getElementById('split-edit-id').value;
        const name = document.getElementById('split-name-input').value.trim();
        if (!name) return;

        const cleanExercises = editingSplitExercises
            .map((ex) => ({
                id: ex.id || 'ex-' + Date.now(),
                name: (ex.name || '').trim(),
                targetSets: Math.max(1, parseInt(ex.targetSets, 10) || 3),
                targetReps: (ex.targetReps || '8-12').trim()
            }))
            .filter((ex) => ex.name.length > 0);

        if (!cleanExercises.length) {
            showToast('Adicione pelo menos 1 exercício!');
            return;
        }

        if (editId) {
            const idx = db.splits.findIndex((s) => s.id === editId);
            if (idx >= 0) {
                db.splits[idx] = { id: editId, name, exercises: cleanExercises };
            }
        } else {
            db.splits.push({ id: 'split-' + Date.now(), name, exercises: cleanExercises });
        }

        db.isSample = false;
        saveDB();
        closeSplitModal();
        renderTreinos();
        showToast('✅ Ficha salva com sucesso!');
    };

    window.deleteSplit = function (splitId) {
        if (!requireFullLicense('Excluir Ficha de Treino')) return;
        const sp = db.splits.find((s) => s.id === splitId);
        if (!sp) return;
        if (!confirm(`Excluir a ficha "${sp.name}"? (Seu histórico de treinos já finalizados será mantido.)`)) return;
        db.splits = db.splits.filter((s) => s.id !== splitId);
        saveDB();
        renderTreinos();
        showToast('🗑️ Ficha excluída');
    };

    /* ---- Active Workout Session ("Treinar Agora") ---- */
    window.startWorkout = function (splitId) {
        const split = db.splits.find((s) => s.id === splitId);
        if (!split) return;

        activeSession = {
            splitId: split.id,
            splitName: split.name,
            startedAt: Date.now(),
            exercises: split.exercises.map((ex) => {
                const last = getLastExerciseLog(ex.name);
                const lastSets = last?.exercise?.sets || [];
                const setsCount = Math.max(1, parseInt(ex.targetSets, 10) || 3);
                const sets = Array.from({ length: setsCount }, (_, i) => ({
                    weight: lastSets[i]?.weight ?? (lastSets[0]?.weight ?? ''),
                    reps: '',
                    rir: '',
                    done: false
                }));
                return {
                    name: ex.name,
                    targetSets: setsCount,
                    targetReps: ex.targetReps,
                    lastSummary: formatLastTimeSummary(last),
                    lastNote: last?.exercise?.note || '',
                    note: '',
                    sets
                };
            })
        };

        renderTreinos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelWorkout = function () {
        if (!confirm('Descartar o treino em andamento?')) return;
        activeSession = null;
        closeRestTimer();
        renderTreinos();
    };

    window.updateSetField = function (exIdx, setIdx, field, val) {
        if (!activeSession) return;
        activeSession.exercises[exIdx].sets[setIdx][field] = val;
        updateActiveLiveMetrics();
    };

    window.updateExerciseNote = function (exIdx, val) {
        if (!activeSession) return;
        activeSession.exercises[exIdx].note = val;
    };

    window.toggleSetDone = function (exIdx, setIdx) {
        if (!activeSession) return;
        const setObj = activeSession.exercises[exIdx].sets[setIdx];
        setObj.done = !setObj.done;
        if (setObj.done) {
            startRestTimer(restDefault);
        }
        renderActiveSession();
    };

    window.addExtraSet = function (exIdx) {
        if (!activeSession) return;
        const sets = activeSession.exercises[exIdx].sets;
        const prev = sets[sets.length - 1];
        sets.push({ weight: prev ? prev.weight : '', reps: '', rir: '', done: false });
        renderActiveSession();
    };

    function computeSessionMetrics(session) {
        let totalVolume = 0;
        let completedSets = 0;
        let bestEpley = 0;
        let bestExerciseName = '';

        (session.exercises || []).forEach((ex) => {
            (ex.sets || []).forEach((s) => {
                if (s.done) {
                    const w = parseFloat(s.weight) || 0;
                    const r = parseInt(s.reps, 10) || 0;
                    completedSets++;
                    totalVolume += w * r;
                    const est = epley1RM(w, r);
                    if (est > bestEpley) {
                        bestEpley = est;
                        bestExerciseName = ex.name;
                    }
                }
            });
        });

        return { totalVolume, completedSets, bestEpley, bestExerciseName };
    }

    function updateActiveLiveMetrics() {
        if (!activeSession) return;
        const m = computeSessionMetrics(activeSession);
        const volEl = document.getElementById('live-session-volume');
        const setsEl = document.getElementById('live-session-sets');
        if (volEl) volEl.textContent = `${fmtInt(m.totalVolume)} kg`;
        if (setsEl) setsEl.textContent = `${m.completedSets} séries`;
    }

    function renderActiveSession() {
        const container = document.getElementById('active-workout-view');
        const m = computeSessionMetrics(activeSession);

        container.innerHTML = `
            <div class="active-session-bar">
                <div>
                    <span class="eyebrow" style="color:var(--neon);">● Treino em Andamento</span>
                    <h2 class="section-title" style="font-size:17px; margin-top:2px;">${escapeHtml(activeSession.splitName)}</h2>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="chip chip-neon font-mono" id="live-session-volume">${fmtInt(m.totalVolume)} kg</span>
                    <span class="chip font-mono" id="live-session-sets">${m.completedSets} séries</span>
                </div>
            </div>

            ${activeSession.exercises.map((ex, exIdx) => `
                <div class="card">
                    <div class="card-header" style="margin-bottom:4px;">
                        <div>
                            <h3 class="section-title" style="font-size:16px;">${escapeHtml(ex.name)}</h3>
                            <span class="eyebrow">Meta: ${ex.targetSets}× ${escapeHtml(ex.targetReps)} reps</span>
                        </div>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="addExtraSet(${exIdx})">+ Série</button>
                    </div>

                    <div class="last-time-box">
                        <strong class="font-mono" style="font-size:12px;">${escapeHtml(ex.lastSummary)}</strong>
                        ${ex.lastNote ? `<span>📝 Obs. anterior: "${escapeHtml(ex.lastNote)}"</span>` : ''}
                    </div>

                    <div class="set-grid-head">
                        <span>#</span>
                        <span>Carga (kg)</span>
                        <span>Reps</span>
                        <span>RIR</span>
                        <span>OK</span>
                    </div>

                    ${ex.sets.map((s, sIdx) => `
                        <div class="set-row ${s.done ? 'done' : ''}">
                            <span class="set-num">${sIdx + 1}</span>
                            <input type="number" inputmode="decimal" step="0.5" min="0" class="input-compact" placeholder="kg" value="${escapeHtml(s.weight)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'weight', this.value)">
                            <input type="number" inputmode="numeric" min="0" class="input-compact" placeholder="reps" value="${escapeHtml(s.reps)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'reps', this.value)">
                            <input type="number" inputmode="numeric" min="0" max="10" class="input-compact" placeholder="—" value="${escapeHtml(s.rir)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'rir', this.value)">
                            <button type="button" class="set-check-btn ${s.done ? 'checked' : ''}" onclick="toggleSetDone(${exIdx}, ${sIdx})" aria-label="Marcar série ${sIdx + 1}">
                                ${s.done ? '✓' : '○'}
                            </button>
                        </div>`).join('')}

                    <div style="margin-top:10px;">
                        <input type="text" class="input" style="min-height:38px; font-size:12.5px; font-weight:500;" placeholder="📝 Observação rápida (ex: subir carga na próxima semana)..." value="${escapeHtml(ex.note)}" oninput="updateExerciseNote(${exIdx}, this.value)">
                    </div>
                </div>`).join('')}

            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px; margin-top:16px;">
                <button type="button" class="btn btn-danger" onclick="cancelWorkout()">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="finishWorkout()">🏁 Finalizar Treino</button>
            </div>
        `;
    }

    window.finishWorkout = function () {
        if (!requireFullLicense('Finalizar e Salvar Treino no Histórico')) return;
        if (!activeSession) return;
        const m = computeSessionMetrics(activeSession);
        if (m.completedSets === 0) {
            showToast('Marque pelo menos 1 série concluída!');
            return;
        }

        const durationMin = Math.max(1, Math.round((Date.now() - activeSession.startedAt) / 60000));
        const newLog = {
            id: 'log-' + Date.now(),
            splitId: activeSession.splitId,
            splitName: activeSession.splitName,
            date: new Date().toISOString().slice(0, 10),
            durationMin,
            totalVolume: Math.round(m.totalVolume),
            bestEpley1RM: Number(m.bestEpley.toFixed(1)),
            exercises: activeSession.exercises.map((ex) => ({
                name: ex.name,
                note: (ex.note || '').trim(),
                sets: ex.sets
                    .filter((s) => s.done)
                    .map((s) => ({
                        weight: parseFloat(s.weight) || 0,
                        reps: parseInt(s.reps, 10) || 0,
                        rir: s.rir === '' ? null : parseInt(s.rir, 10),
                        done: true
                    }))
            })).filter((ex) => ex.sets.length > 0)
        };

        db.history.unshift(newLog);
        db.isSample = false;
        saveDB();
        activeSession = null;
        closeRestTimer();
        renderTreinos();

        // Show finish summary modal
        const summaryBody = document.getElementById('workout-summary-body');
        summaryBody.innerHTML = `
            <p class="section-sub" style="margin-bottom:14px;"><strong>${escapeHtml(newLog.splitName)}</strong> salvo no seu histórico com sucesso!</p>
            <div class="stat-row-3" style="margin-bottom:16px;">
                <div class="stat-mini">
                    <span class="stat-mini-val">${fmtInt(newLog.totalVolume)}</span>
                    <span class="stat-mini-lbl">Volume (kg)</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-val">${fmtNum(newLog.bestEpley1RM, 1)} kg</span>
                    <span class="stat-mini-lbl">Melhor 1RM</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-val">${m.completedSets}</span>
                    <span class="stat-mini-lbl">Séries OK</span>
                </div>
            </div>
            ${m.bestExerciseName ? `<p style="font-size:12.5px; color:var(--text-secondary); text-align:center; margin:0 0 14px;">🏆 Destaque 1RM (Epley): <strong style="color:var(--neon-soft);">${escapeHtml(m.bestExerciseName)}</strong></p>` : ''}
            <button class="btn btn-primary btn-block" onclick="document.getElementById('modal-summary').classList.remove('open'); switchTab('evolucao');">
                Ver Gráficos de Evolução →
            </button>
        `;
        document.getElementById('modal-summary').classList.add('open');
    };

    /* ==================== REST TIMER ==================== */
    function renderRestDisplay() {
        const min = Math.floor(restRemaining / 60);
        const sec = restRemaining % 60;
        const el = document.getElementById('rest-countdown-val');
        if (el) el.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        const pauseBtn = document.getElementById('btn-rest-pause');
        if (pauseBtn) pauseBtn.textContent = restPaused ? '▶ Retomar' : '⏸ Pausar';
        document.querySelectorAll('.rest-pill').forEach((btn) => {
            btn.classList.toggle('active', Number(btn.dataset.sec) === restDefault);
        });
    }

    window.startRestTimer = function (seconds) {
        restDefault = seconds || 90;
        restRemaining = restDefault;
        restPaused = false;
        document.getElementById('rest-timer-dock')?.classList.add('visible');
        renderRestDisplay();

        clearInterval(restInterval);
        restInterval = setInterval(() => {
            if (restPaused) return;
            restRemaining--;
            if (restRemaining <= 0) {
                restRemaining = 0;
                clearInterval(restInterval);
                renderRestDisplay();
                playRestBeep();
                showToast('🔔 Descanso finalizado! Hora da próxima série.');
            } else {
                renderRestDisplay();
            }
        }, 1000);
    };

    window.addRestSeconds = function (delta) {
        restRemaining = Math.max(0, restRemaining + delta);
        renderRestDisplay();
    };

    window.toggleRestPause = function () {
        restPaused = !restPaused;
        renderRestDisplay();
    };

    window.closeRestTimer = function () {
        clearInterval(restInterval);
        document.getElementById('rest-timer-dock')?.classList.remove('visible');
    };

    /* ==================== TAB 2: MEDIDAS & METAS ==================== */
    function getSortedMeasurements() {
        return [...db.measurements].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }

    function renderMedidas() {
        const list = getSortedMeasurements();
        const first = list[0] || null;
        const latest = list[list.length - 1] || null;

        // 1. Indicador de Proporção Estética (Cintura / Peito)
        const ratioBox = document.getElementById('aesthetic-ratio-card');
        if (latest && latest.waist > 0 && latest.chest > 0) {
            const ratioPct = (latest.waist / latest.chest) * 100;
            // Gauge maps 60%..100% -> 0%..100%
            const clamped = Math.max(60, Math.min(100, ratioPct));
            const markerLeft = ((clamped - 60) / 40) * 100;
            let statusText = '';
            let statusColor = 'var(--neon-soft)';
            if (ratioPct >= 75 && ratioPct <= 80) {
                statusText = '🔥 Dentro da zona estética ideal (75%–80%)!';
            } else if (ratioPct > 80) {
                const diff = (ratioPct - 80).toFixed(1).replace('.', ',');
                statusText = `Faltam -${diff} pontos % para entrar na faixa ideal (75%–80%).`;
                statusColor = 'var(--warn)';
            } else {
                statusText = 'Proporção em V muito acentuada (abaixo de 75%).';
            }

            ratioBox.innerHTML = `
                <div class="card-header" style="margin-bottom:6px;">
                    <div>
                        <span class="eyebrow" style="color:var(--neon-soft);">Proporção Estética (V-Taper)</span>
                        <h3 class="section-title" style="font-size:16px; margin-top:2px;">Relação Cintura / Peito</h3>
                    </div>
                    <div class="font-mono" style="font-size:26px; font-weight:800; color:var(--neon);">${fmtNum(ratioPct, 1)}%</div>
                </div>
                <div class="ratio-gauge">
                    <div class="ratio-ideal-zone" title="Zona Ideal: 75% a 80%"></div>
                    <div class="ratio-marker" style="left:${markerLeft}%;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-muted); margin-bottom:8px;">
                    <span>60%</span>
                    <span style="color:var(--neon-soft); font-weight:700;">Ideal: 75%–80%</span>
                    <span>100%</span>
                </div>
                <p style="margin:0; font-size:12.5px; color:${statusColor}; font-weight:600;">${statusText}</p>
            `;
        } else {
            ratioBox.innerHTML = `
                <span class="eyebrow">Proporção Estética</span>
                <p class="section-sub" style="margin-top:4px;">Registre suas medidas de <strong>Cintura</strong> e <strong>Peito</strong> para calcular automaticamente sua relação estética ideal (75%–80%).</p>
            `;
        }

        // 2. Painel Comparativo (Dia 1 vs Atual vs Meta)
        const cardsGrid = document.getElementById('metrics-comparative-grid');
        cardsGrid.innerHTML = METRICS.map((m) => {
            const startVal = first ? Number(first[m.key]) : null;
            const curVal = latest ? Number(latest[m.key]) : null;
            const goalVal = db.goals && db.goals[m.key] !== undefined ? Number(db.goals[m.key]) : m.defaultGoal;

            let deltaText = '—';
            let deltaClass = 'neutral';
            let progressPct = 0;

            if (startVal !== null && !isNaN(startVal) && curVal !== null && !isNaN(curVal)) {
                const diff = curVal - startVal;
                const sign = diff > 0 ? '+' : '';
                deltaText = `${sign}${fmtNum(diff, 1)} ${m.unit}`;

                if (goalVal !== null && !isNaN(goalVal)) {
                    const wantsDecrease = goalVal < startVal;
                    if (Math.abs(diff) < 0.01) {
                        deltaClass = 'neutral';
                    } else if ((wantsDecrease && diff < 0) || (!wantsDecrease && diff > 0)) {
                        deltaClass = 'good';
                    } else {
                        deltaClass = 'bad';
                    }

                    const totalSpan = Math.abs(goalVal - startVal);
                    if (totalSpan > 0) {
                        const achieved = wantsDecrease ? (startVal - curVal) : (curVal - startVal);
                        progressPct = Math.max(0, Math.min(100, (achieved / totalSpan) * 100));
                    } else if (Math.abs(curVal - goalVal) < 0.1) {
                        progressPct = 100;
                    }
                }
            }

            return `
                <div class="metric-card">
                    <div class="metric-card-top">
                        <span class="metric-name">${m.label}</span>
                        <span class="metric-delta ${deltaClass}">${deltaText}</span>
                    </div>
                    <div class="metric-current">${curVal !== null && !isNaN(curVal) ? `${fmtNum(curVal, 1)} <span style="font-size:13px; color:var(--text-muted);">${m.unit}</span>` : '—'}</div>
                    <div class="metric-sub-row">
                        <span>Dia 1: <strong class="font-mono" style="color:var(--text-secondary);">${startVal !== null && !isNaN(startVal) ? fmtNum(startVal, 1) : '—'}</strong></span>
                        <span>Meta: <strong class="font-mono" style="color:var(--neon-soft);">${fmtNum(goalVal, 1)} ${m.unit}</strong></span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width:${progressPct.toFixed(0)}%;"></div>
                    </div>
                </div>`;
        }).join('');

        // 3. Default date in form
        const dateInp = document.getElementById('measure-date');
        if (dateInp && !dateInp.value) {
            dateInp.value = new Date().toISOString().slice(0, 10);
        }

        // 4. Recent Measurements List
        const histEl = document.getElementById('measurements-history-list');
        const reversed = [...list].reverse();
        if (!reversed.length) {
            histEl.innerHTML = `<p class="section-sub" style="text-align:center; padding:12px 0;">Nenhum registro de medidas ainda.</p>`;
        } else {
            histEl.innerHTML = reversed.map((rec) => `
                <div class="history-item">
                    <div>
                        <div style="font-weight:700; font-size:13.5px;">📅 ${fmtDateBR(rec.date)}</div>
                        <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
                            Peso: <strong class="font-mono">${fmtNum(rec.weight, 1)}kg</strong> · Cintura: <strong class="font-mono">${fmtNum(rec.waist, 1)}cm</strong> · Peito: <strong class="font-mono">${fmtNum(rec.chest, 1)}cm</strong> · Braço: <strong class="font-mono">${fmtNum(rec.armFlexed, 1)}cm</strong>
                        </div>
                    </div>
                    <button class="icon-btn" style="width:34px; height:34px;" title="Excluir medida" onclick="deleteMeasurement('${rec.id}')">🗑️</button>
                </div>`).join('');
        }
    }

    window.saveMeasurementForm = function (e) {
        e.preventDefault();
        if (!requireFullLicense('Registrar Novas Medidas Corporais')) return;
        const date = document.getElementById('measure-date').value || new Date().toISOString().slice(0, 10);
        const rec = { id: 'm-' + Date.now(), date };
        let hasAny = false;

        METRICS.forEach((m) => {
            const raw = document.getElementById(`m-inp-${m.key}`)?.value;
            if (raw !== '' && raw !== undefined) {
                rec[m.key] = parseFloat(raw);
                hasAny = true;
            }
        });

        if (!hasAny) {
            showToast('Preencha ao menos uma medida!');
            return;
        }

        db.measurements.push(rec);
        db.isSample = false;
        saveDB();
        e.target.reset();
        document.getElementById('measure-date').value = new Date().toISOString().slice(0, 10);
        renderMedidas();
        showToast('📏 Medidas salvas com sucesso!');
    };

    window.deleteMeasurement = function (id) {
        if (!requireFullLicense('Excluir Registro de Medidas')) return;
        if (!confirm('Excluir este registro de medidas?')) return;
        db.measurements = db.measurements.filter((m) => m.id !== id);
        saveDB();
        renderMedidas();
        showToast('🗑️ Registro removido');
    };

    window.openGoalsModal = function () {
        if (!requireFullLicense('Definir Metas Corporais')) return;
        const box = document.getElementById('goals-form-fields');
        box.innerHTML = METRICS.map((m) => `
            <div class="field">
                <label>${m.label} (${m.unit})</label>
                <input type="number" inputmode="decimal" step="0.1" id="goal-inp-${m.key}" class="input" value="${db.goals?.[m.key] ?? m.defaultGoal}">
            </div>`).join('');
        document.getElementById('modal-goals').classList.add('open');
    };

    window.saveGoalsFromModal = function (e) {
        e.preventDefault();
        db.goals = db.goals || {};
        METRICS.forEach((m) => {
            const v = parseFloat(document.getElementById(`goal-inp-${m.key}`)?.value);
            if (!isNaN(v)) db.goals[m.key] = v;
        });
        saveDB();
        document.getElementById('modal-goals').classList.remove('open');
        renderMedidas();
        showToast('🎯 Metas atualizadas!');
    };

    /* ==================== TAB 3: EVOLUÇÃO (CHARTS & HISTORY) ==================== */
    function getAllLoggedExerciseNames() {
        const set = new Set();
        db.history.forEach((h) => (h.exercises || []).forEach((e) => set.add(e.name)));
        db.splits.forEach((s) => (s.exercises || []).forEach((e) => set.add(e.name)));
        return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    function renderEvolucao() {
        // 1. Exercise selector
        const sel = document.getElementById('chart-exercise-select');
        const names = getAllLoggedExerciseNames();
        const prevVal = sel.value;
        sel.innerHTML = names.length
            ? names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')
            : '<option value="">Nenhum exercício registrado</option>';
        if (prevVal && names.includes(prevVal)) sel.value = prevVal;

        renderExerciseChart(sel.value);

        // 2. Measurements filter pills
        const pillsBox = document.getElementById('measure-chart-pills');
        pillsBox.innerHTML = METRICS.map((m) => `
            <button type="button" class="filter-pill ${selectedMetricChart === m.key ? 'active' : ''}" onclick="selectMeasureChartMetric('${m.key}')">
                ${m.label}
            </button>`).join('');
        renderMeasureChart();

        // 3. Workout History List
        const histContainer = document.getElementById('workout-history-list');
        const sorted = [...db.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (!sorted.length) {
            histContainer.innerHTML = `<p class="section-sub" style="text-align:center; padding:14px 0;">Nenhum treino finalizado ainda.</p>`;
        } else {
            histContainer.innerHTML = sorted.map((h) => `
                <div class="history-item">
                    <div style="min-width:0;">
                        <div style="font-weight:700; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.splitName)}</div>
                        <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
                            📅 ${fmtDateBR(h.date)} · Volume: <strong class="font-mono" style="color:var(--neon-soft);">${fmtInt(h.totalVolume)} kg</strong> · 1RM: <strong class="font-mono">${fmtNum(h.bestEpley1RM, 1)} kg</strong>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button class="btn btn-secondary btn-sm" onclick="viewWorkoutDetail('${h.id}')">Detalhes</button>
                        <button class="icon-btn" style="width:36px; height:36px;" onclick="deleteHistoryItem('${h.id}')">🗑️</button>
                    </div>
                </div>`).join('');
        }
    }

    window.onExerciseChartChange = function () {
        const val = document.getElementById('chart-exercise-select')?.value;
        renderExerciseChart(val);
    };

    window.selectMeasureChartMetric = function (key) {
        selectedMetricChart = key;
        renderEvolucao();
    };

    function renderExerciseChart(exName) {
        const ctx = document.getElementById('exercise-chart')?.getContext('2d');
        if (!ctx || typeof Chart === 'undefined') return;
        if (exerciseChartInstance) exerciseChartInstance.destroy();

        const points = [];
        const sorted = [...db.history].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        sorted.forEach((h) => {
            const ex = (h.exercises || []).find((e) => e.name === exName);
            if (!ex || !ex.sets || !ex.sets.length) return;
            let maxW = 0;
            let vol = 0;
            let max1RM = 0;
            ex.sets.forEach((s) => {
                const w = parseFloat(s.weight) || 0;
                const r = parseInt(s.reps, 10) || 0;
                if (w > maxW) maxW = w;
                vol += w * r;
                const est = epley1RM(w, r);
                if (est > max1RM) max1RM = est;
            });
            points.push({ label: fmtDateBR(h.date), maxW, vol, max1RM });
        });

        const kpiBox = document.getElementById('exercise-chart-kpis');
        if (points.length) {
            const prWeight = Math.max(...points.map((p) => p.maxW));
            const pr1RM = Math.max(...points.map((p) => p.max1RM));
            const prVol = Math.max(...points.map((p) => p.vol));
            kpiBox.innerHTML = `
                <div class="stat-mini"><span class="stat-mini-val">${fmtNum(prWeight, 1)} kg</span><span class="stat-mini-lbl">Carga Máx.</span></div>
                <div class="stat-mini"><span class="stat-mini-val">${fmtNum(pr1RM, 1)} kg</span><span class="stat-mini-lbl">1RM (Epley)</span></div>
                <div class="stat-mini"><span class="stat-mini-val">${fmtInt(prVol)} kg</span><span class="stat-mini-lbl">Maior Volume</span></div>
            `;
        } else {
            kpiBox.innerHTML = `<div style="grid-column:1/-1; text-align:center; font-size:12px; color:var(--text-muted); padding:6px;">Ainda não há registros concluídos para este exercício.</div>`;
        }

        exerciseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: points.map((p) => p.label),
                datasets: [
                    {
                        label: 'Carga Máx (kg)',
                        data: points.map((p) => p.maxW),
                        borderColor: '#39ff14',
                        backgroundColor: 'rgba(57, 255, 20, 0.14)',
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#39ff14',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Volume Total (kg)',
                        data: points.map((p) => p.vol),
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        tension: 0.3,
                        pointRadius: 3.5,
                        pointBackgroundColor: '#38bdf8',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#9aa4b2', boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
                },
                scales: {
                    x: { ticks: { color: '#687385', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { position: 'left', ticks: { color: '#4ade80', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y1: { position: 'right', ticks: { color: '#38bdf8', font: { size: 11 } }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    function renderMeasureChart() {
        const ctx = document.getElementById('measure-chart')?.getContext('2d');
        if (!ctx || typeof Chart === 'undefined') return;
        if (measureChartInstance) measureChartInstance.destroy();

        const meta = METRICS.find((m) => m.key === selectedMetricChart) || METRICS[0];
        const sorted = getSortedMeasurements().filter((r) => r[meta.key] !== undefined && r[meta.key] !== null && !isNaN(r[meta.key]));
        const goalVal = db.goals?.[meta.key] ?? meta.defaultGoal;

        const labels = sorted.map((r) => fmtDateBR(r.date));
        const values = sorted.map((r) => Number(r[meta.key]));
        const goalLine = labels.map(() => goalVal);

        measureChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `${meta.label} (${meta.unit})`,
                        data: values,
                        borderColor: '#39ff14',
                        backgroundColor: 'rgba(57, 255, 20, 0.12)',
                        fill: true,
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 4.5,
                        pointBackgroundColor: '#39ff14'
                    },
                    {
                        label: `Meta (${fmtNum(goalVal, 1)} ${meta.unit})`,
                        data: goalLine,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#9aa4b2', boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
                },
                scales: {
                    x: { ticks: { color: '#687385', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#9aa4b2', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    window.viewWorkoutDetail = function (logId) {
        const log = db.history.find((h) => h.id === logId);
        if (!log) return;
        const body = document.getElementById('detail-modal-body');
        body.innerHTML = `
            <div style="margin-bottom:14px;">
                <span class="eyebrow">📅 ${fmtDateBR(log.date)} · ${log.durationMin || 45} min</span>
                <h3 class="section-title" style="margin-top:2px;">${escapeHtml(log.splitName)}</h3>
            </div>
            <div class="stat-row-3" style="margin-bottom:14px;">
                <div class="stat-mini"><span class="stat-mini-val">${fmtInt(log.totalVolume)}</span><span class="stat-mini-lbl">Volume (kg)</span></div>
                <div class="stat-mini"><span class="stat-mini-val">${fmtNum(log.bestEpley1RM, 1)} kg</span><span class="stat-mini-lbl">Melhor 1RM</span></div>
                <div class="stat-mini"><span class="stat-mini-val">${(log.exercises || []).length}</span><span class="stat-mini-lbl">Exercícios</span></div>
            </div>
            ${(log.exercises || []).map((ex) => `
                <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:12px; padding:10px 12px; margin-bottom:8px;">
                    <div style="font-weight:700; font-size:13.5px; margin-bottom:6px;">${escapeHtml(ex.name)}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${(ex.sets || []).map((s, idx) => `
                            <span class="chip font-mono" style="font-size:11px;">S${idx + 1}: ${s.weight}kg × ${s.reps}${s.rir !== null && s.rir !== undefined ? ` (RIR ${s.rir})` : ''}</span>`).join('')}
                    </div>
                    ${ex.note ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:6px;">📝 ${escapeHtml(ex.note)}</div>` : ''}
                </div>`).join('')}
        `;
        document.getElementById('modal-detail').classList.add('open');
    };

    window.deleteHistoryItem = function (logId) {
        if (!requireFullLicense('Excluir Treino do Histórico')) return;
        if (!confirm('Excluir este treino do histórico?')) return;
        db.history = db.history.filter((h) => h.id !== logId);
        saveDB();
        renderEvolucao();
        showToast('🗑️ Treino removido');
    };

    /* ==================== SETTINGS & BACKUP JSON ==================== */
    window.openSettingsModal = function () {
        document.getElementById('modal-settings').classList.add('open');
    };

    window.clearSampleData = function () {
        if (!requireFullLicense('Limpar Dados de Exemplo')) return;
        if (!confirm('Limpar os treinos e medidas de exemplo para começar do zero com seus próprios dados?')) return;
        db = {
            isSample: false,
            splits: [],
            history: [],
            measurements: [],
            goals: createSampleData().goals
        };
        activeSession = null;
        saveDB();
        document.getElementById('modal-settings')?.classList.remove('open');
        renderTreinos();
        renderMedidas();
        renderEvolucao();
        showToast('🧹 Dados de exemplo limpos! Pronto para os seus dados.');
    };

    window.restoreSampleData = function () {
        if (!confirm('Carregar novamente os dados de exemplo? (Isso substituirá os dados atuais.)')) return;
        db = createSampleData();
        activeSession = null;
        saveDB();
        document.getElementById('modal-settings')?.classList.remove('open');
        renderTreinos();
        renderMedidas();
        renderEvolucao();
        showToast('✨ Dados de exemplo restaurados!');
    };

    window.exportBackupJSON = function () {
        if (!requireFullLicense('Exportar Backup JSON')) return;
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gymprogress-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('💾 Backup JSON exportado!');
    };

    window.triggerImportBackup = function () {
        if (!requireFullLicense('Importar Backup JSON')) return;
        document.getElementById('import-backup-file')?.click();
    };

    window.handleImportBackupFile = function (event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!imported || !Array.isArray(imported.splits)) {
                    throw new Error('Formato inválido');
                }
                db = {
                    isSample: false,
                    splits: imported.splits || [],
                    history: imported.history || [],
                    measurements: imported.measurements || [],
                    goals: imported.goals || createSampleData().goals
                };
                saveDB();
                document.getElementById('modal-settings')?.classList.remove('open');
                renderTreinos();
                renderMedidas();
                renderEvolucao();
                showToast('✅ Backup importado com sucesso!');
            } catch (err) {
                alert('Arquivo JSON inválido. Selecione um backup gerado pelo GymProgress.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    /* ==================== PAYWALL & ADMIN KEYGEN (DEMO MODE) ==================== */
    window.openPaywallModal = function (featureName) {
        const modal = document.getElementById('modal-paywall');
        if (!modal) return;
        const badge = document.getElementById('paywall-feature-badge');
        if (badge && featureName) badge.textContent = `🔒 ${featureName}`;
        modal.classList.add('open');
    };

    window.closePaywallModal = function () {
        document.getElementById('modal-paywall')?.classList.remove('open');
    };

    window.copyDeviceId = function () {
        navigator.clipboard?.writeText(currentDeviceId);
        const btn = document.getElementById('btn-copy-device');
        if (btn) {
            btn.textContent = '✓ Copiado!';
            setTimeout(() => (btn.textContent = 'Copiar'), 2000);
        }
    };

    window.generateClientDeviceKey = function () {
        const devInput = (document.getElementById('admin-client-device')?.value || '').toUpperCase().trim();
        const ownerInput = (document.getElementById('admin-client-owner')?.value || '').trim();
        if (!devInput || !ownerInput) {
            alert('Preencha o Código do Aparelho (ex: GP-XXXX-XXXX) e o Nome do Cliente / Personal.');
            return;
        }
        const sig = computeDeviceSignature(devInput, ownerInput);
        const finalKey = `${ownerInput.toUpperCase()}#${sig}`;
        const box = document.getElementById('admin-generated-key-box');
        const val = document.getElementById('admin-generated-key-val');
        if (box && val) {
            val.textContent = finalKey;
            box.classList.remove('hidden');
        }
        navigator.clipboard?.writeText(finalKey);
        showToast('🔑 Chave copiada!');
    };

    window.unlockWithLicenseKey = function () {
        const raw = (document.getElementById('license-key-input')?.value || '').trim();
        const lower = raw.toLowerCase();
        const errEl = document.getElementById('license-key-error');

        if (lower === 'torugo#admin') {
            document.getElementById('torugo-admin-keygen')?.classList.remove('hidden');
            const devField = document.getElementById('admin-client-device');
            if (devField && !devField.value) devField.value = currentDeviceId;
            errEl?.classList.add('hidden');
            return;
        }

        if (['torugo', 'victor', 'gympro', 'gymprogress2026'].includes(lower)) {
            localStorage.setItem('gymprogress_vip', 'true');
            localStorage.setItem('gymprogress_licensed_owner', 'Victor Hugo');
            localStorage.removeItem('gymprogress_license_sig');
            window.location.href = 'app.html';
            return;
        }

        if (raw.includes('#')) {
            const parts = raw.split('#');
            const ownerName = parts.slice(0, -1).join('#').trim();
            const providedSig = (parts[parts.length - 1] || '').toUpperCase().trim();
            const expectedSig = computeDeviceSignature(currentDeviceId, ownerName);

            if (ownerName && providedSig === expectedSig) {
                localStorage.setItem('gymprogress_vip', 'true');
                localStorage.setItem('gymprogress_licensed_owner', ownerName);
                localStorage.setItem('gymprogress_license_sig', expectedSig);
                window.location.href = 'app.html';
                return;
            }
            if (errEl) {
                errEl.textContent = `🔒 Chave pertence a outro aparelho e não funciona no código ${currentDeviceId}.`;
                errEl.classList.remove('hidden');
            }
            return;
        }

        if (errEl) {
            errEl.textContent = 'Chave inválida. Envie o Código do Aparelho no WhatsApp acima para liberar.';
            errEl.classList.remove('hidden');
        }
    };

    /* ==================== INIT ==================== */
    function init() {
        // Dynamic Branding for Licensed Clients
        const licensedOwner = localStorage.getItem('gymprogress_licensed_owner');
        const subEl = document.getElementById('brand-sub');
        if (MODE === 'full' && licensedOwner && subEl) {
            subEl.textContent = `Licenciado · ${licensedOwner}`;
        }

        // Demo Device ID & WhatsApp Link
        const devEl = document.getElementById('display-device-id');
        if (devEl) devEl.textContent = currentDeviceId;
        const waEl = document.getElementById('whatsapp-license-link');
        if (waEl) {
            const msg = encodeURIComponent(`Olá, Torugo Dev! Testei o GymProgress no portfólio e quero liberar minha licença vitalícia.\n\n📱 Código do meu aparelho: ${currentDeviceId}`);
            waEl.href = `https://wa.me/5521970453147?text=${msg}`;
        }

        renderTreinos();
        renderMedidas();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
