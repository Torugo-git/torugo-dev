/* GymProgress — Full-Stack Client Engine (LocalStorage + Chart.js + Rest Timer + Device-Bound Licensing) */
(function () {
    'use strict';

    const MODE = window.GYMPROGRESS_MODE || 'full'; // 'full' | 'demo'
    const DB_KEY = MODE === 'demo' ? 'gymprogress_demo_db_v1' : 'gymprogress_db_v1';

    const METRICS = [
        { key: 'weight', label: 'Peso', unit: 'kg', defaultGoal: 79.0 },
        { key: 'bodyFat', label: '% de Gordura (BF)', unit: '%', defaultGoal: 12.0 },
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
                    bodyFat: 17.2,
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
                    bodyFat: 14.9,
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
                bodyFat: 12.0,
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

    const ACTIVE_SESSION_KEY = MODE === 'demo' ? 'gymprogress_demo_active_session_v1' : 'gymprogress_active_session_v1';

    let db = loadDB();
    let activeTab = 'treinos';
    let activeSession = null; // { splitId, splitName, startedAt, exercises: [...] }
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

    function saveActiveSession() {
        if (MODE === 'demo') return;
        try {
            if (activeSession) {
                localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
            } else {
                localStorage.removeItem(ACTIVE_SESSION_KEY);
            }
        } catch (e) {
            console.warn('Erro ao salvar treino em andamento:', e);
        }
    }

    function clearSavedActiveSession() {
        try {
            localStorage.removeItem(ACTIVE_SESSION_KEY);
        } catch (_) {}
    }

    function loadSavedActiveSession() {
        if (MODE === 'demo') return null;
        try {
            const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.splitId && Array.isArray(parsed.exercises)) {
                return parsed;
            }
        } catch (e) {
            console.warn('Erro ao restaurar treino em andamento:', e);
        }
        return null;
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
        ['treinos', 'medidas', 'evolucao', 'bf', 'ajuda'].forEach((t) => {
            document.getElementById(`panel-${t}`)?.classList.toggle('active', t === tab);
            document.getElementById(`nav-${t}`)?.classList.toggle('active', t === tab);
        });
        if (tab === 'medidas') renderMedidas();
        if (tab === 'evolucao') renderEvolucao();
        if (tab === 'bf') calculateBodyFat();
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

    function effectiveKg(weightVal, loadType, kgPerPlate) {
        const w = parseFloat(weightVal) || 0;
        if (loadType === 'placas') {
            return w * (parseFloat(kgPerPlate) || 5);
        }
        return w;
    }

    function formatLoadLabel(weightVal, loadType) {
        if (loadType === 'placas') {
            return `${weightVal} ${Number(weightVal) === 1 ? 'placa' : 'placas'}`;
        }
        return `${weightVal}kg`;
    }

    function formatLastTimeSummary(last) {
        if (!last) return 'Primeira vez registrando este exercício';
        const doneSets = last.exercise.sets.filter((s) => s.done !== false && (parseFloat(s.weight) > 0 || parseInt(s.reps, 10) > 0));
        if (!doneSets.length) return 'Sem séries concluídas no último treino';
        const lt = last.exercise.loadType || 'kg';
        const weights = doneSets.map((s) => Number(s.weight));
        const allSameWeight = weights.every((w) => w === weights[0]);
        const repsList = doneSets.map((s) => s.reps).join(', ');
        if (allSameWeight) {
            return `Última vez (${fmtDateBR(last.date)}): ${formatLoadLabel(weights[0], lt)} × ${repsList}`;
        }
        const pairs = doneSets.map((s) => `${formatLoadLabel(s.weight, lt)}×${s.reps}`).join(' · ');
        return `Última vez (${fmtDateBR(last.date)}): ${pairs}`;
    }

    function getDaysAgoText(isoDate) {
        if (!isoDate) return 'Sem registros';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parts = isoDate.split('-');
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const diff = Math.round((today - dt) / 86400000);
        if (diff <= 0) return 'Hoje 🔥';
        if (diff === 1) return 'Ontem';
        return `há ${diff} dias`;
    }

    function getSuggestedNextSplitId() {
        if (!db.splits.length) return null;
        if (!db.history.length) return db.splits[0].id;
        const sorted = [...db.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const lastSplitId = sorted[0]?.splitId;
        const idx = db.splits.findIndex((s) => s.id === lastSplitId);
        if (idx === -1) return db.splits[0].id;
        return db.splits[(idx + 1) % db.splits.length].id;
    }

    function renderHomeHUD() {
        const hud = document.getElementById('home-hud-grid');
        if (!hud) return;

        const sortedHist = [...db.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const lastWorkout = sortedHist[0] || null;
        const prevWorkout = sortedHist[1] || null;

        // 1. Treinos feitos
        const totalWorkouts = db.history.length;
        const lastWhen = lastWorkout ? getDaysAgoText(lastWorkout.date) : 'Comece hoje!';

        // 2. Último volume + variação
        let volVal = '0 kg';
        let volSub = 'Finalize um treino';
        let volGood = false;
        if (lastWorkout) {
            volVal = `${fmtInt(lastWorkout.totalVolume)} kg`;
            if (prevWorkout && prevWorkout.totalVolume > 0) {
                const pct = ((lastWorkout.totalVolume - prevWorkout.totalVolume) / prevWorkout.totalVolume) * 100;
                const sign = pct >= 0 ? '+' : '';
                volSub = `${sign}${fmtNum(pct, 1)}% vs treino anterior`;
                volGood = pct >= 0;
            } else {
                volSub = lastWorkout.splitName.split('—')[0].trim();
            }
        }

        // 3. Recorde 1RM Epley
        let best1RM = 0;
        let bestExName = 'Sem registro';
        db.history.forEach((h) => {
            (h.exercises || []).forEach((ex) => {
                (ex.sets || []).forEach((s) => {
                    const est = epley1RM(effectiveKg(s.weight, ex.loadType, ex.kgPerPlate), s.reps);
                    if (est > best1RM) {
                        best1RM = est;
                        bestExName = ex.name;
                    }
                });
            });
        });

        // 4. Shape Atual (Peso + Cintura / Peito)
        const sortedMeas = getSortedMeasurements();
        const latestMeas = sortedMeas[sortedMeas.length - 1] || null;
        let shapeVal = '—';
        let shapeSub = 'Registre suas medidas';
        if (latestMeas) {
            shapeVal = latestMeas.weight ? `${fmtNum(latestMeas.weight, 1)} kg` : '—';
            if (latestMeas.waist && latestMeas.chest) {
                const ratio = (latestMeas.waist / latestMeas.chest) * 100;
                shapeSub = `Cintura ${fmtNum(latestMeas.waist, 1)}cm · V-Taper ${fmtNum(ratio, 0)}%`;
            } else if (latestMeas.waist) {
                shapeSub = `Cintura: ${fmtNum(latestMeas.waist, 1)} cm`;
            }
        }

        hud.innerHTML = `
            <div class="hud-card highlight">
                <span class="hud-label">🔥 Treinos Feitos</span>
                <span class="hud-value">${totalWorkouts}</span>
                <span class="hud-sub good">Último: ${lastWhen}</span>
            </div>
            <div class="hud-card">
                <span class="hud-label">📦 Último Volume</span>
                <span class="hud-value">${volVal}</span>
                <span class="hud-sub ${volGood ? 'good' : ''}">${escapeHtml(volSub)}</span>
            </div>
            <div class="hud-card">
                <span class="hud-label">🏆 Recorde 1RM</span>
                <span class="hud-value">${best1RM > 0 ? `${fmtNum(best1RM, 1)} kg` : '—'}</span>
                <span class="hud-sub">${escapeHtml(bestExName)}</span>
            </div>
            <div class="hud-card" style="cursor:pointer;" onclick="switchTab('medidas')">
                <span class="hud-label">📏 Shape Atual</span>
                <span class="hud-value">${shapeVal}</span>
                <span class="hud-sub">${escapeHtml(shapeSub)}</span>
            </div>
        `;
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
        renderHomeHUD();

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

        const nextSplitId = getSuggestedNextSplitId();

        container.innerHTML = db.splits.map((split) => {
            const isNext = split.id === nextSplitId;
            const lastForSplit = [...db.history]
                .filter((h) => h.splitId === split.id)
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

            const exHtml = (split.exercises || []).length
                ? split.exercises.map((ex) => {
                    const lastEx = getLastExerciseLog(ex.name);
                    const lastLt = lastEx?.exercise?.loadType || ex.loadType || 'kg';
                    const lastMaxW = lastEx?.exercise?.sets?.length
                        ? Math.max(...lastEx.exercise.sets.map((s) => parseFloat(s.weight) || 0))
                        : 0;
                    return `
                    <div class="exercise-preview-item">
                        <span class="exercise-preview-name">${escapeHtml(ex.name)}${ex.loadType === 'placas' ? ' <span style="font-size:10.5px; color:var(--text-muted);">(🧱 polia)</span>' : ''}</span>
                        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                            ${lastMaxW > 0 ? `<span class="font-mono" style="font-size:11px; color:var(--text-secondary);">Últ: <strong style="color:var(--text-primary);">${formatLoadLabel(lastMaxW, lastLt)}</strong></span>` : ''}
                            <span class="exercise-preview-target">${ex.targetSets}× ${escapeHtml(ex.targetReps)}</span>
                        </div>
                    </div>`;
                }).join('')
                : `<p class="section-sub" style="padding:8px 0;">Nenhum exercício cadastrado nesta ficha.</p>`;

            return `
                <div class="split-card" style="${isNext ? 'border-color:rgba(57,255,20,0.34);' : ''}">
                    <div class="card-header" style="margin-bottom:6px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <h3 class="section-title" style="font-size:16px;">${escapeHtml(split.name)}</h3>
                                ${isNext ? '<span class="badge-next">⭐ Próximo Sugerido</span>' : ''}
                            </div>
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

    /* ---- Popular Exercise Library & Split Templates ---- */
    const EXERCISE_MUSCLES = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen/Glúteo'];

    const POPULAR_EXERCISES = [
        // Peito
        { name: 'Supino Reto Barra', muscle: 'Peito', sets: 3, reps: '6-8' },
        { name: 'Supino Reto Halteres', muscle: 'Peito', sets: 3, reps: '8-10' },
        { name: 'Supino Inclinado Halteres', muscle: 'Peito', sets: 3, reps: '8-10' },
        { name: 'Supino Inclinado Máquina', muscle: 'Peito', sets: 3, reps: '8-10' },
        { name: 'Supino Declinado', muscle: 'Peito', sets: 3, reps: '8-10' },
        { name: 'Crucifixo Máquina (Peck Deck)', muscle: 'Peito', sets: 3, reps: '10-12' },
        { name: 'Crossover Polia Alta', muscle: 'Peito', sets: 3, reps: '12-15' },
        { name: 'Crossover Polia Baixa', muscle: 'Peito', sets: 3, reps: '12-15' },
        { name: 'Flexão de Braços', muscle: 'Peito', sets: 3, reps: '12-20' },
        { name: 'Paralelas (Foco Peito)', muscle: 'Peito', sets: 3, reps: '8-12' },
        // Costas
        { name: 'Puxada Frontal Aberta', muscle: 'Costas', sets: 3, reps: '8-10' },
        { name: 'Puxada Triângulo (Fechada)', muscle: 'Costas', sets: 3, reps: '8-12' },
        { name: 'Barra Fixa (Pull-Up)', muscle: 'Costas', sets: 3, reps: '6-10' },
        { name: 'Remada Curvada Barra', muscle: 'Costas', sets: 3, reps: '6-8' },
        { name: 'Remada Baixa Triângulo', muscle: 'Costas', sets: 3, reps: '8-12' },
        { name: 'Remada Unilateral (Serrote)', muscle: 'Costas', sets: 3, reps: '8-10' },
        { name: 'Remada Cavalinho (Barra T)', muscle: 'Costas', sets: 3, reps: '8-10' },
        { name: 'Remada Máquina Articulada', muscle: 'Costas', sets: 3, reps: '8-12' },
        { name: 'Pulldown na Polia', muscle: 'Costas', sets: 3, reps: '12-15' },
        { name: 'Levantamento Terra', muscle: 'Costas', sets: 3, reps: '5-6' },
        { name: 'Encolhimento Halteres (Trapézio)', muscle: 'Costas', sets: 3, reps: '12-15' },
        // Pernas
        { name: 'Agachamento Livre', muscle: 'Pernas', sets: 3, reps: '6-8' },
        { name: 'Agachamento Smith', muscle: 'Pernas', sets: 3, reps: '8-10' },
        { name: 'Agachamento Búlgaro', muscle: 'Pernas', sets: 3, reps: '8-10' },
        { name: 'Leg Press 45°', muscle: 'Pernas', sets: 3, reps: '10-12' },
        { name: 'Hack Machine', muscle: 'Pernas', sets: 3, reps: '8-10' },
        { name: 'Cadeira Extensora', muscle: 'Pernas', sets: 3, reps: '12-15' },
        { name: 'Mesa Flexora', muscle: 'Pernas', sets: 3, reps: '10-12' },
        { name: 'Cadeira Flexora', muscle: 'Pernas', sets: 3, reps: '10-12' },
        { name: 'Stiff com Barra / Halteres', muscle: 'Pernas', sets: 3, reps: '8-10' },
        { name: 'Cadeira Adutora', muscle: 'Pernas', sets: 3, reps: '12-15' },
        { name: 'Cadeira Abdutora', muscle: 'Pernas', sets: 3, reps: '12-15' },
        { name: 'Panturrilha em Pé', muscle: 'Pernas', sets: 4, reps: '12-15' },
        { name: 'Panturrilha Sentado', muscle: 'Pernas', sets: 4, reps: '12-15' },
        // Ombros
        { name: 'Desenvolvimento Halteres', muscle: 'Ombros', sets: 3, reps: '8-10' },
        { name: 'Desenvolvimento Máquina', muscle: 'Ombros', sets: 3, reps: '8-10' },
        { name: 'Desenvolvimento Militar Barra', muscle: 'Ombros', sets: 3, reps: '6-8' },
        { name: 'Elevação Lateral Halteres', muscle: 'Ombros', sets: 4, reps: '12-15' },
        { name: 'Elevação Lateral Polia', muscle: 'Ombros', sets: 3, reps: '12-15' },
        { name: 'Elevação Frontal', muscle: 'Ombros', sets: 3, reps: '10-12' },
        { name: 'Crucifixo Inverso (Posterior)', muscle: 'Ombros', sets: 3, reps: '12-15' },
        { name: 'Face Pull na Polia', muscle: 'Ombros', sets: 3, reps: '12-15' },
        // Bíceps
        { name: 'Rosca Direta Barra W', muscle: 'Bíceps', sets: 3, reps: '8-12' },
        { name: 'Rosca Direta Barra Reta', muscle: 'Bíceps', sets: 3, reps: '8-10' },
        { name: 'Rosca Alternada Halteres', muscle: 'Bíceps', sets: 3, reps: '10-12' },
        { name: 'Rosca Martelo Halteres', muscle: 'Bíceps', sets: 3, reps: '10-12' },
        { name: 'Rosca Scott Máquina / Barra', muscle: 'Bíceps', sets: 3, reps: '8-12' },
        { name: 'Rosca Inclinada Banco 45°', muscle: 'Bíceps', sets: 3, reps: '10-12' },
        { name: 'Rosca Concentrada', muscle: 'Bíceps', sets: 3, reps: '10-12' },
        // Tríceps
        { name: 'Tríceps Corda Polia', muscle: 'Tríceps', sets: 3, reps: '10-12' },
        { name: 'Tríceps Barra Reta / V Polia', muscle: 'Tríceps', sets: 3, reps: '8-12' },
        { name: 'Tríceps Testa Barra W', muscle: 'Tríceps', sets: 3, reps: '8-10' },
        { name: 'Tríceps Francês Halter / Polia', muscle: 'Tríceps', sets: 3, reps: '10-12' },
        { name: 'Tríceps Banco / Mergulho', muscle: 'Tríceps', sets: 3, reps: '10-15' },
        { name: 'Tríceps Coice na Polia', muscle: 'Tríceps', sets: 3, reps: '12-15' },
        // Abdômen / Glúteo
        { name: 'Elevação Pélvica (Hip Thrust)', muscle: 'Abdômen/Glúteo', sets: 4, reps: '8-12' },
        { name: 'Glúteo na Polia (Coice)', muscle: 'Abdômen/Glúteo', sets: 3, reps: '12-15' },
        { name: 'Abdominal Supra na Polia (Crunch)', muscle: 'Abdômen/Glúteo', sets: 3, reps: '12-15' },
        { name: 'Abdominal Infra Paralela', muscle: 'Abdômen/Glúteo', sets: 3, reps: '12-15' },
        { name: 'Prancha Abdominal (segundos)', muscle: 'Abdômen/Glúteo', sets: 3, reps: '45-60s' }
    ];

    const SPLIT_TEMPLATES = {
        push: {
            name: 'Treino A — Push (Peito, Ombro & Tríceps)',
            exercises: [
                { name: 'Supino Reto Halteres', targetSets: 3, targetReps: '6-8' },
                { name: 'Supino Inclinado Máquina', targetSets: 3, targetReps: '8-10' },
                { name: 'Crucifixo Máquina (Peck Deck)', targetSets: 3, targetReps: '10-12' },
                { name: 'Desenvolvimento Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Elevação Lateral Halteres', targetSets: 4, targetReps: '12-15' },
                { name: 'Tríceps Corda Polia', targetSets: 3, targetReps: '10-12' }
            ]
        },
        pull: {
            name: 'Treino B — Pull (Costas & Bíceps)',
            exercises: [
                { name: 'Puxada Frontal Aberta', targetSets: 3, targetReps: '8-10' },
                { name: 'Remada Curvada Barra', targetSets: 3, targetReps: '6-8' },
                { name: 'Remada Baixa Triângulo', targetSets: 3, targetReps: '8-12' },
                { name: 'Crucifixo Inverso (Posterior)', targetSets: 3, targetReps: '12-15' },
                { name: 'Rosca Direta Barra W', targetSets: 3, targetReps: '8-12' },
                { name: 'Rosca Martelo Halteres', targetSets: 3, targetReps: '10-12' }
            ]
        },
        legs: {
            name: 'Treino C — Pernas Completo',
            exercises: [
                { name: 'Agachamento Livre', targetSets: 3, targetReps: '6-8' },
                { name: 'Leg Press 45°', targetSets: 3, targetReps: '10-12' },
                { name: 'Cadeira Extensora', targetSets: 3, targetReps: '12-15' },
                { name: 'Mesa Flexora', targetSets: 3, targetReps: '10-12' },
                { name: 'Stiff com Barra / Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Panturrilha em Pé', targetSets: 4, targetReps: '12-15' }
            ]
        },
        upper: {
            name: 'Upper — Membros Superiores',
            exercises: [
                { name: 'Supino Reto Halteres', targetSets: 3, targetReps: '6-8' },
                { name: 'Puxada Frontal Aberta', targetSets: 3, targetReps: '8-10' },
                { name: 'Desenvolvimento Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Remada Baixa Triângulo', targetSets: 3, targetReps: '8-12' },
                { name: 'Elevação Lateral Halteres', targetSets: 3, targetReps: '12-15' },
                { name: 'Rosca Direta Barra W', targetSets: 3, targetReps: '8-12' },
                { name: 'Tríceps Corda Polia', targetSets: 3, targetReps: '10-12' }
            ]
        },
        fullbody: {
            name: 'Full Body — Corpo Inteiro',
            exercises: [
                { name: 'Agachamento Livre', targetSets: 3, targetReps: '6-8' },
                { name: 'Supino Reto Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Puxada Frontal Aberta', targetSets: 3, targetReps: '8-10' },
                { name: 'Stiff com Barra / Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Desenvolvimento Halteres', targetSets: 3, targetReps: '8-10' },
                { name: 'Abdominal Supra na Polia (Crunch)', targetSets: 3, targetReps: '12-15' }
            ]
        }
    };

    /* ---- Split Create / Edit Modal ---- */
    let editingSplitExercises = [];
    let selectedLibMuscle = 'Todos';

    function normText(str) {
        return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    window.selectLibMuscle = function (muscle) {
        selectedLibMuscle = muscle;
        renderExerciseLibrary();
    };

    window.applySplitTemplate = function (key) {
        const tpl = SPLIT_TEMPLATES[key];
        if (!tpl) return;
        const nameInput = document.getElementById('split-name-input');
        if (nameInput) nameInput.value = tpl.name;
        editingSplitExercises = tpl.exercises.map((ex, i) => ({
            id: `ex-${Date.now()}-${i}`,
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps
        }));
        renderSplitEditorExercises();
        renderExerciseLibrary();
        showToast(`⚡ Modelo "${tpl.name.split('—')[0].trim()}" carregado!`);
    };

    window.pickLibraryExercise = function (name, sets, reps) {
        // Remove empty placeholder row if user hasn't typed anything yet
        if (editingSplitExercises.length === 1 && !editingSplitExercises[0].name.trim()) {
            editingSplitExercises = [];
        }
        const existingIdx = editingSplitExercises.findIndex((e) => normText(e.name) === normText(name));
        if (existingIdx >= 0) {
            editingSplitExercises.splice(existingIdx, 1);
            showToast(`Removido: ${name}`);
        } else {
            editingSplitExercises.push({
                id: 'ex-' + Date.now() + '-' + Math.floor(Math.random() * 999),
                name,
                targetSets: sets || 3,
                targetReps: reps || '8-12'
            });
            showToast(`✅ Adicionado: ${name}`);
        }
        renderSplitEditorExercises();
        renderExerciseLibrary();
    };

    window.renderExerciseLibrary = function () {
        const musclesBox = document.getElementById('ex-lib-muscles');
        const listBox = document.getElementById('ex-lib-list');
        if (!musclesBox || !listBox) return;

        musclesBox.innerHTML = EXERCISE_MUSCLES.map((m) => `
            <button type="button" class="filter-pill ${selectedLibMuscle === m ? 'active' : ''}" style="padding:5px 10px; font-size:11px;" onclick="selectLibMuscle('${m}')">
                ${m}
            </button>`).join('');

        const q = normText(document.getElementById('ex-lib-search')?.value);
        const addedNames = new Set(editingSplitExercises.map((e) => normText(e.name)));

        const filtered = POPULAR_EXERCISES.filter((ex) => {
            const matchMuscle = selectedLibMuscle === 'Todos' || ex.muscle === selectedLibMuscle;
            const matchSearch = !q || normText(ex.name + ' ' + ex.muscle).includes(q);
            return matchMuscle && matchSearch;
        });

        if (!filtered.length) {
            listBox.innerHTML = `<div style="text-align:center; padding:12px; font-size:12px; color:var(--text-muted);">Nenhum exercício encontrado. Use <strong>+ Personalizado</strong> abaixo!</div>`;
            return;
        }

        listBox.innerHTML = filtered.map((ex) => {
            const isAdded = addedNames.has(normText(ex.name));
            const safeName = ex.name.replace(/'/g, "\\'");
            return `
                <button type="button" class="ex-lib-item ${isAdded ? 'added' : ''}" onclick="pickLibraryExercise('${safeName}', ${ex.sets}, '${ex.reps}')">
                    <div style="min-width:0;">
                        <div style="font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(ex.name)}</div>
                        <div style="font-size:10.5px; color:var(--text-muted);">${ex.muscle} · Sugestão: ${ex.sets}× ${ex.reps}</div>
                    </div>
                    <span class="chip ${isAdded ? 'chip-neon' : ''}" style="font-size:11px; flex-shrink:0;">${isAdded ? '✓ Na ficha' : '+ Adicionar'}</span>
                </button>`;
        }).join('');
    };

    window.openSplitModal = function (splitId) {
        if (!requireFullLicense('Criar ou Editar Fichas de Treino')) return;
        const modal = document.getElementById('modal-split');
        const idInput = document.getElementById('split-edit-id');
        const nameInput = document.getElementById('split-name-input');
        const title = document.getElementById('modal-split-title');
        const searchEl = document.getElementById('ex-lib-search');
        if (searchEl) searchEl.value = '';
        selectedLibMuscle = 'Todos';

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
            editingSplitExercises = [];
        }
        renderExerciseLibrary();
        renderSplitEditorExercises();
        modal.classList.add('open');
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
        renderExerciseLibrary();
    };

    window.moveEditorExercise = function (idx, dir) {
        const target = idx + dir;
        if (target < 0 || target >= editingSplitExercises.length) return;
        const tmp = editingSplitExercises[idx];
        editingSplitExercises[idx] = editingSplitExercises[target];
        editingSplitExercises[target] = tmp;
        renderSplitEditorExercises();
    };

    window.updateEditorExercise = function (idx, field, val) {
        if (!editingSplitExercises[idx]) return;
        editingSplitExercises[idx][field] = field === 'targetSets' ? Math.max(1, parseInt(val, 10) || 1) : val;
    };

    function renderSplitEditorExercises() {
        const box = document.getElementById('split-editor-exercises');
        const countEl = document.getElementById('editor-ex-count');
        if (countEl) countEl.textContent = editingSplitExercises.length;

        if (!editingSplitExercises.length) {
            box.innerHTML = `<div style="text-align:center; padding:14px; border:1px dashed var(--border-strong); border-radius:12px; font-size:12px; color:var(--text-muted);">Toque nos exercícios populares acima ou escolha um <strong>Modelo Pronto</strong> para montar sua ficha!</div>`;
            return;
        }

        box.innerHTML = editingSplitExercises.map((ex, idx) => `
            <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:12px; padding:10px; margin-bottom:8px;">
                <div style="display:flex; gap:5px; margin-bottom:8px;">
                    <input type="text" class="input" style="min-height:38px; font-size:13.5px;" placeholder="Nome do exercício (ex: Supino Reto)" value="${escapeHtml(ex.name)}" oninput="updateEditorExercise(${idx}, 'name', this.value)">
                    <button type="button" class="btn btn-ghost btn-sm" style="padding:0 8px;" title="Subir" onclick="moveEditorExercise(${idx}, -1)">↑</button>
                    <button type="button" class="btn btn-ghost btn-sm" style="padding:0 8px;" title="Descer" onclick="moveEditorExercise(${idx}, 1)">↓</button>
                    <button type="button" class="btn btn-danger btn-sm" style="padding:0 10px;" onclick="removeExerciseRowFromEditor(${idx})">✕</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">
                    <div class="field">
                        <label style="font-size:10px;">Séries</label>
                        <input type="number" inputmode="numeric" min="1" max="15" class="input" style="min-height:36px; font-size:13.5px;" value="${ex.targetSets}" oninput="updateEditorExercise(${idx}, 'targetSets', this.value)">
                    </div>
                    <div class="field">
                        <label style="font-size:10px;">Faixa de Reps</label>
                        <input type="text" class="input" style="min-height:36px; font-size:13.5px;" placeholder="Ex: 6-8" value="${escapeHtml(ex.targetReps)}" oninput="updateEditorExercise(${idx}, 'targetReps', this.value)">
                    </div>
                    <div class="field">
                        <label style="font-size:10px;">Carga em</label>
                        <select class="select" style="min-height:36px; font-size:12.5px; padding:4px 8px;" onchange="updateEditorExercise(${idx}, 'loadType', this.value)">
                            <option value="kg" ${(ex.loadType || 'kg') === 'kg' ? 'selected' : ''}>⚖️ kg</option>
                            <option value="placas" ${ex.loadType === 'placas' ? 'selected' : ''}>🧱 Placas</option>
                        </select>
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
                targetReps: (ex.targetReps || '8-12').trim(),
                loadType: ex.loadType === 'placas' ? 'placas' : 'kg',
                kgPerPlate: parseFloat(ex.kgPerPlate) || 5
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

    function buildOverloadTip(last, targetReps, loadType) {
        if (!last || !last.exercise?.sets?.length) {
            return '💡 Primeira sessão: escolha uma carga que permita fazer a faixa de reps com boa técnica.';
        }
        const sets = last.exercise.sets;
        const lt = loadType || last.exercise.loadType || 'kg';
        const maxW = Math.max(...sets.map((s) => parseFloat(s.weight) || 0));
        const maxR = Math.max(...sets.map((s) => parseInt(s.reps, 10) || 0));
        const minR = Math.min(...sets.map((s) => parseInt(s.reps, 10) || 0));
        const upperTarget = parseInt((String(targetReps || '').split('-')[1] || targetReps || '0').replace(/\D/g, ''), 10) || 0;
        const nextLoadStr = lt === 'placas' ? `${maxW + 1} placas` : `${maxW + 2}kg`;

        if (upperTarget > 0 && minR >= upperTarget) {
            return `💡 Meta hoje: você bateu o teto (${upperTarget} reps)! Tente subir para ${nextLoadStr}.`;
        }
        return `💡 Meta hoje: tente fazer +1 rep em alguma série (${maxR + 1} reps) ou subir para ${nextLoadStr}.`;
    }

    let showWorkoutGuide = false;

    window.toggleWorkoutGuide = function () {
        showWorkoutGuide = !showWorkoutGuide;
        renderActiveSession();
    };

    window.toggleExerciseLoadType = function (exIdx) {
        if (!activeSession) return;
        const ex = activeSession.exercises[exIdx];
        ex.loadType = ex.loadType === 'placas' ? 'kg' : 'placas';
        if (!ex.kgPerPlate) ex.kgPerPlate = 5;
        // Persist preference back to split so next workout remembers it automatically
        const split = db.splits.find((s) => s.id === activeSession.splitId);
        if (split) {
            const spEx = (split.exercises || []).find((e) => normText(e.name) === normText(ex.name));
            if (spEx) {
                spEx.loadType = ex.loadType;
                spEx.kgPerPlate = ex.kgPerPlate;
                saveDB();
            }
        }
        const last = getLastExerciseLog(ex.name);
        ex.overloadTip = buildOverloadTip(last, ex.targetReps, ex.loadType);
        renderActiveSession();
        showToast(ex.loadType === 'placas' ? '🧱 Modo Placas ativado (1 placa ≈ ' + ex.kgPerPlate + 'kg)' : '⚖️ Modo Quilos (kg) ativado');
    };

    window.setExerciseKgPerPlate = function (exIdx, kgVal) {
        if (!activeSession) return;
        const ex = activeSession.exercises[exIdx];
        ex.kgPerPlate = Math.max(1, parseFloat(kgVal) || 5);
        const split = db.splits.find((s) => s.id === activeSession.splitId);
        if (split) {
            const spEx = (split.exercises || []).find((e) => normText(e.name) === normText(ex.name));
            if (spEx) {
                spEx.kgPerPlate = ex.kgPerPlate;
                saveDB();
            }
        }
        renderActiveSession();
    };

    window.repeatLastExerciseSets = function (exIdx) {
        if (!activeSession) return;
        const ex = activeSession.exercises[exIdx];
        if (!ex || !ex.lastSetsRaw || !ex.lastSetsRaw.length) {
            showToast('Sem registro anterior para copiar.');
            return;
        }
        ex.sets = ex.lastSetsRaw.map((s) => ({
            weight: s.weight ?? '',
            reps: s.reps ?? '',
            rir: s.rir ?? '',
            done: false
        }));
        renderActiveSession();
        showToast('⚡ Cargas e reps anteriores copiadas!');
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
                const loadType = ex.loadType || last?.exercise?.loadType || 'kg';
                const kgPerPlate = parseFloat(ex.kgPerPlate || last?.exercise?.kgPerPlate) || 5;
                const setsCount = Math.max(1, parseInt(ex.targetSets, 10) || 3);
                const sets = Array.from({ length: setsCount }, (_, i) => ({
                    weight: lastSets[i]?.weight ?? (lastSets[0]?.weight ?? ''),
                    reps: '',
                    rir: '',
                    done: false
                }));
                return {
                    name: ex.name,
                    loadType,
                    kgPerPlate,
                    targetSets: setsCount,
                    targetReps: ex.targetReps,
                    lastSummary: formatLastTimeSummary(last),
                    lastNote: last?.exercise?.note || '',
                    lastSetsRaw: lastSets,
                    overloadTip: buildOverloadTip(last, ex.targetReps, loadType),
                    note: '',
                    sets
                };
            })
        };

        saveActiveSession();
        renderTreinos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelWorkout = function () {
        if (!confirm('Descartar o treino em andamento?')) return;
        activeSession = null;
        clearSavedActiveSession();
        closeRestTimer();
        renderTreinos();
    };

    window.updateSetField = function (exIdx, setIdx, field, val) {
        if (!activeSession) return;
        activeSession.exercises[exIdx].sets[setIdx][field] = val;
        saveActiveSession();
        updateActiveLiveMetrics();
    };

    window.updateExerciseNote = function (exIdx, val) {
        if (!activeSession) return;
        activeSession.exercises[exIdx].note = val;
        saveActiveSession();
    };

    function getExerciseHistoricalPR(exerciseName) {
        const target = normText(exerciseName);
        let maxWeight = 0;
        let max1RM = 0;
        let hasHistory = false;
        db.history.forEach((h) => {
            (h.exercises || []).forEach((ex) => {
                if (normText(ex.name) !== target) return;
                const lt = ex.loadType || 'kg';
                const kpp = ex.kgPerPlate || 5;
                (ex.sets || []).forEach((s) => {
                    const wKg = effectiveKg(s.weight, lt, kpp);
                    const r = parseInt(s.reps, 10) || 0;
                    if (wKg > 0 && r > 0) {
                        hasHistory = true;
                        if (wKg > maxWeight) maxWeight = wKg;
                        const est = epley1RM(wKg, r);
                        if (est > max1RM) max1RM = est;
                    }
                });
            });
        });
        return { hasHistory, maxWeight, max1RM };
    }

    function checkSetIsPR(ex, weight, reps) {
        const wKg = effectiveKg(weight, ex.loadType, ex.kgPerPlate);
        const r = parseInt(reps, 10) || 0;
        if (wKg <= 0 || r <= 0) return false;
        const prev = getExerciseHistoricalPR(ex.name);
        if (!prev.hasHistory) return false;
        const est = epley1RM(wKg, r);
        return (wKg > prev.maxWeight) || (est > prev.max1RM + 0.25);
    }

    window.toggleSetDone = function (exIdx, setIdx) {
        if (!activeSession) return;
        const ex = activeSession.exercises[exIdx];
        const setObj = ex.sets[setIdx];
        setObj.done = !setObj.done;
        if (setObj.done) {
            startRestTimer(restDefault);
            if (checkSetIsPR(ex, setObj.weight, setObj.reps)) {
                setObj.isPR = true;
                const wKg = effectiveKg(setObj.weight, ex.loadType, ex.kgPerPlate);
                const est = epley1RM(wKg, setObj.reps);
                showToast(`🏆 NOVO PR em ${ex.name}! (${formatLoadLabel(setObj.weight, ex.loadType)} · 1RM ${fmtNum(est, 1)}kg)`);
                if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200]);
            } else {
                setObj.isPR = false;
            }
        } else {
            setObj.isPR = false;
        }
        renderActiveSession();
    };

    window.setExerciseLoadType = function (exIdx, newType) {
        if (!activeSession) return;
        const ex = activeSession.exercises[exIdx];
        const targetType = newType === 'placas' ? 'placas' : 'kg';
        if (ex.loadType === targetType) return;
        ex.loadType = targetType;
        if (!ex.kgPerPlate) ex.kgPerPlate = 5;
        const split = db.splits.find((s) => s.id === activeSession.splitId);
        if (split) {
            const spEx = (split.exercises || []).find((e) => normText(e.name) === normText(ex.name));
            if (spEx) {
                spEx.loadType = ex.loadType;
                spEx.kgPerPlate = ex.kgPerPlate;
                saveDB();
            }
        }
        const last = getLastExerciseLog(ex.name);
        ex.overloadTip = buildOverloadTip(last, ex.targetReps, ex.loadType);
        renderActiveSession();
        showToast(ex.loadType === 'placas' ? `🧱 Modo Placas (1 placa ≈ ${ex.kgPerPlate}kg)` : '⚖️ Modo Quilos (kg)');
    };

    window.addExtraSet = function (exIdx) {
        if (!activeSession) return;
        const sets = activeSession.exercises[exIdx].sets;
        const prev = sets[sets.length - 1];
        sets.push({ weight: prev ? prev.weight : '', reps: '', rir: '', done: false });
        renderActiveSession();
    };

    window.removeLastSet = function (exIdx) {
        if (!activeSession) return;
        const sets = activeSession.exercises[exIdx].sets;
        if (sets.length <= 1) {
            showToast('O exercício precisa ter pelo menos 1 série.');
            return;
        }
        const lastSet = sets[sets.length - 1];
        if (lastSet.done && !confirm('Remover a última série (já marcada como concluída)?')) {
            return;
        }
        sets.pop();
        renderActiveSession();
        showToast('🗑️ Última série removida');
    };

    function computeSessionMetrics(session) {
        let totalVolume = 0;
        let completedSets = 0;
        let bestEpley = 0;
        let bestExerciseName = '';

        (session.exercises || []).forEach((ex) => {
            (ex.sets || []).forEach((s) => {
                if (s.done) {
                    const wKg = effectiveKg(s.weight, ex.loadType, ex.kgPerPlate);
                    const r = parseInt(s.reps, 10) || 0;
                    completedSets++;
                    totalVolume += wKg * r;
                    const est = epley1RM(wKg, r);
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
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span class="chip chip-neon font-mono" id="live-session-volume">${fmtInt(m.totalVolume)} kg</span>
                    <span class="chip font-mono" id="live-session-sets">${m.completedSets} séries</span>
                    <button type="button" class="btn btn-ghost btn-sm" style="min-height:28px; padding:2px 9px; font-size:11px;" onclick="toggleWorkoutGuide()">
                        ${showWorkoutGuide ? '✕ Fechar guia' : '❓ Guia RIR / 1RM'}
                    </button>
                </div>
            </div>

            ${showWorkoutGuide ? `
                <div class="guide-box">
                    <div><strong>• ⚖️ kg / 🧱 Placas:</strong> alterne a qualquer momento em cada exercício entre peso em quilos ou número de placas da polia (1 placa ≈ 5 kg por padrão).</div>
                    <div><strong>• RIR (Repetições na Reserva):</strong> quantas reps ainda sobrariam antes da falha. <strong>0</strong> = falha total · <strong>1–2</strong> = zona ideal para hipertrofia.</div>
                    <div><strong>• Volume Total:</strong> Carga × Reps × Séries concluídas. Subir esse número nas semanas gera progressão real.</div>
                    <div><strong>• 1RM (Fórmula de Epley):</strong> estima sua força máxima para 1 repetição sem precisar arriscar carga máxima.</div>
                </div>` : ''}

            ${activeSession.exercises.map((ex, exIdx) => {
                const hasExPR = (ex.sets || []).some((s) => s.done && s.isPR);
                const isPlacas = ex.loadType === 'placas';
                const kpp = ex.kgPerPlate || 5;
                return `
                <div class="card" style="${hasExPR ? 'border-color:rgba(57,255,20,0.45);' : ''}">
                    <div class="card-header" style="margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
                                <h3 class="section-title" style="font-size:16px;">${escapeHtml(ex.name)}</h3>
                                ${hasExPR ? '<span class="pr-badge">🏆 NOVO PR!</span>' : ''}
                            </div>
                            <span class="eyebrow">Meta: ${ex.targetSets}× ${escapeHtml(ex.targetReps)} reps</span>
                        </div>
                        <div style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
                            <!-- Seletor claro kg | Placas -->
                            <div style="display:inline-flex; background:var(--bg-input); border:1px solid var(--border-strong); border-radius:10px; padding:2px; gap:2px;">
                                <button type="button" onclick="setExerciseLoadType(${exIdx}, 'kg')" style="min-height:28px; padding:3px 9px; border-radius:8px; border:none; font-family:inherit; font-size:11.5px; font-weight:700; cursor:pointer; ${!isPlacas ? 'background:var(--neon); color:var(--neon-ink);' : 'background:transparent; color:var(--text-secondary);'}">⚖️ kg</button>
                                <button type="button" onclick="setExerciseLoadType(${exIdx}, 'placas')" style="min-height:28px; padding:3px 9px; border-radius:8px; border:none; font-family:inherit; font-size:11.5px; font-weight:700; cursor:pointer; ${isPlacas ? 'background:var(--neon); color:var(--neon-ink);' : 'background:transparent; color:var(--text-secondary);'}">🧱 Placas</button>
                            </div>
                            ${ex.lastSetsRaw && ex.lastSetsRaw.length ? `<button type="button" class="btn btn-secondary btn-sm" style="min-height:32px; padding:4px 9px; font-size:11.5px;" onclick="repeatLastExerciseSets(${exIdx})" title="Preencher com cargas e reps da última vez">⚡ Repetir</button>` : ''}
                            <button type="button" class="btn btn-ghost btn-sm" style="min-height:32px; padding:4px 9px; font-size:11.5px;" onclick="addExtraSet(${exIdx})">+ Série</button>
                            ${ex.sets.length > 1 ? `<button type="button" class="btn btn-danger btn-sm" style="min-height:32px; padding:4px 9px; font-size:11.5px;" onclick="removeLastSet(${exIdx})" title="Remover última série">− Série</button>` : ''}
                        </div>
                    </div>

                    ${isPlacas ? `
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:6px 10px; margin-bottom:8px; font-size:11.5px; color:var(--text-secondary);">
                            <span>🧱 <strong>Polia:</strong> 1 placa ≈ <strong class="font-mono" style="color:var(--neon-soft);">${kpp} kg</strong></span>
                            <div style="display:flex; gap:4px; align-items:center;">
                                ${[5, 7, 10].map((v) => `<button type="button" class="filter-pill ${kpp === v ? 'active' : ''}" style="padding:2px 8px; font-size:10.5px;" onclick="setExerciseKgPerPlate(${exIdx}, ${v})">${v}kg</button>`).join('')}
                            </div>
                        </div>` : ''}

                    <div class="last-time-box">
                        <strong class="font-mono" style="font-size:12px;">${escapeHtml(ex.lastSummary)}</strong>
                        ${ex.lastNote ? `<span>📝 Obs. anterior: "${escapeHtml(ex.lastNote)}"</span>` : ''}
                    </div>
                    <div class="overload-tip">${escapeHtml(ex.overloadTip)}</div>

                    <div class="set-grid-head">
                        <span>#</span>
                        <span>${isPlacas ? 'Placas' : 'Carga (kg)'}</span>
                        <span>Reps</span>
                        <span>RIR</span>
                        <span>OK</span>
                    </div>

                    ${ex.sets.map((s, sIdx) => `
                        <div class="set-row ${s.done ? 'done' : ''}">
                            <span class="set-num">${s.isPR ? '🏆' : sIdx + 1}</span>
                            <input type="number" inputmode="${isPlacas ? 'numeric' : 'decimal'}" step="${isPlacas ? '1' : '0.5'}" min="0" class="input-compact" placeholder="${isPlacas ? 'nº' : 'kg'}" value="${escapeHtml(s.weight)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'weight', this.value)">
                            <input type="number" inputmode="numeric" min="0" class="input-compact" placeholder="reps" value="${escapeHtml(s.reps)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'reps', this.value)">
                            <input type="number" inputmode="numeric" min="0" max="10" class="input-compact" placeholder="—" value="${escapeHtml(s.rir)}" oninput="updateSetField(${exIdx}, ${sIdx}, 'rir', this.value)">
                            <button type="button" class="set-check-btn ${s.done ? 'checked' : ''}" onclick="toggleSetDone(${exIdx}, ${sIdx})" aria-label="Marcar série ${sIdx + 1}">
                                ${s.done ? '✓' : '○'}
                            </button>
                        </div>`).join('')}

                    <div style="margin-top:10px;">
                        <input type="text" class="input" style="min-height:38px; font-size:12.5px; font-weight:500;" placeholder="📝 Observação rápida (ex: subir carga na próxima semana)..." value="${escapeHtml(ex.note)}" oninput="updateExerciseNote(${exIdx}, this.value)">
                    </div>
                </div>`;
            }).join('')}

            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px; margin-top:16px;">
                <button type="button" class="btn btn-danger" onclick="cancelWorkout()">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="finishWorkout()">🏁 Finalizar Treino</button>
            </div>
        `;
        saveActiveSession();
    }

    window.finishWorkout = function () {
        if (!requireFullLicense('Finalizar e Salvar Treino no Histórico')) return;
        if (!activeSession) return;
        const m = computeSessionMetrics(activeSession);
        if (m.completedSets === 0) {
            showToast('Marque pelo menos 1 série concluída!');
            return;
        }

        // Detect all PRs broken in this workout before saving to history
        const sessionPRs = [];
        activeSession.exercises.forEach((ex) => {
            const prev = getExerciseHistoricalPR(ex.name);
            if (!prev.hasHistory) return;
            let bestWKg = 0;
            let bestRawW = 0;
            let bestR = 0;
            let bestEst = 0;
            (ex.sets || []).filter((s) => s.done).forEach((s) => {
                const rawW = parseFloat(s.weight) || 0;
                const wKg = effectiveKg(rawW, ex.loadType, ex.kgPerPlate);
                const r = parseInt(s.reps, 10) || 0;
                const est = epley1RM(wKg, r);
                if (est > bestEst) {
                    bestEst = est;
                    bestWKg = wKg;
                    bestRawW = rawW;
                    bestR = r;
                }
            });
            if (bestWKg > prev.maxWeight || bestEst > prev.max1RM + 0.25) {
                sessionPRs.push({
                    exercise: ex.name,
                    weight: bestRawW,
                    loadType: ex.loadType || 'kg',
                    reps: bestR,
                    est1RM: Number(bestEst.toFixed(1))
                });
            }
        });

        const durationMin = Math.max(1, Math.round((Date.now() - activeSession.startedAt) / 60000));
        const newLog = {
            id: 'log-' + Date.now(),
            splitId: activeSession.splitId,
            splitName: activeSession.splitName,
            date: new Date().toISOString().slice(0, 10),
            durationMin,
            totalVolume: Math.round(m.totalVolume),
            bestEpley1RM: Number(m.bestEpley.toFixed(1)),
            prs: sessionPRs,
            exercises: activeSession.exercises.map((ex) => ({
                name: ex.name,
                loadType: ex.loadType || 'kg',
                kgPerPlate: ex.kgPerPlate || 5,
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
        clearSavedActiveSession();
        closeRestTimer();
        renderTreinos();

        // Show finish summary modal
        const summaryBody = document.getElementById('workout-summary-body');
        summaryBody.innerHTML = `
            <p class="section-sub" style="margin-bottom:14px;"><strong>${escapeHtml(newLog.splitName)}</strong> salvo no seu histórico com sucesso!</p>
            ${sessionPRs.length ? `
                <div style="background:rgba(57,255,20,0.1); border:1px solid rgba(57,255,20,0.4); border-radius:14px; padding:12px; margin-bottom:14px;">
                    <div style="font-weight:800; font-size:13px; color:var(--neon); margin-bottom:6px;">🏆 ${sessionPRs.length} NOVO(S) RECORDE(S) PESSOAL(IS)!</div>
                    ${sessionPRs.map((pr) => `<div style="font-size:12px; color:var(--text-primary); margin-bottom:3px;">• <strong>${escapeHtml(pr.exercise)}</strong>: <span class="font-mono" style="color:var(--neon-soft);">${formatLoadLabel(pr.weight, pr.loadType)} × ${pr.reps}</span> (1RM ${fmtNum(pr.est1RM, 1)}kg)</div>`).join('')}
                </div>` : ''}
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
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button type="button" class="btn btn-primary btn-block" onclick="shareWorkoutCard('${newLog.id}')">
                    📸 Gerar Card p/ Stories / WhatsApp
                </button>
                <button type="button" class="btn btn-secondary btn-block" onclick="document.getElementById('modal-summary').classList.remove('open'); switchTab('evolucao');">
                    Ver Gráficos de Evolução →
                </button>
            </div>
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

        // 2. Painel Comparativo (Dia 1 vs Atual vs Meta) + Cálculo do Progresso Médio
        const cardsGrid = document.getElementById('metrics-comparative-grid');
        let progressSum = 0;
        let progressCount = 0;

        cardsGrid.innerHTML = METRICS.map((m) => {
            const startVal = first ? Number(first[m.key]) : null;
            const curVal = latest ? Number(latest[m.key]) : null;
            const goalVal = db.goals && db.goals[m.key] !== undefined ? Number(db.goals[m.key]) : m.defaultGoal;

            let deltaText = '—';
            let deltaClass = 'neutral';
            let progressPct = 0;
            let remainText = 'Defina sua meta';

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
                    progressSum += progressPct;
                    progressCount++;

                    const remaining = wantsDecrease ? (curVal - goalVal) : (goalVal - curVal);
                    if (remaining <= 0.05) {
                        remainText = '🎉 Meta batida!';
                    } else {
                        remainText = `Faltam ${fmtNum(remaining, 1)} ${m.unit}`;
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
                    <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-muted); margin-top:5px;">
                        <span>${remainText}</span>
                        <strong class="font-mono" style="color:var(--neon-soft);">${progressPct.toFixed(0)}%</strong>
                    </div>
                </div>`;
        }).join('');

        // Resumo Rápido do Shape (topo da aba Medidas)
        const summaryHud = document.getElementById('measures-summary-hud');
        if (summaryHud) {
            const avgPct = progressCount > 0 ? Math.round(progressSum / progressCount) : 0;
            const wDiff = (first?.weight && latest?.weight) ? (latest.weight - first.weight) : null;
            const waistDiff = (first?.waist && latest?.waist) ? (latest.waist - first.waist) : null;
            summaryHud.innerHTML = `
                <div class="hud-card highlight">
                    <span class="hud-label">🎯 Progresso Geral</span>
                    <span class="hud-value">${avgPct}%</span>
                    <span class="hud-sub good">Média das suas ${progressCount || METRICS.length} metas</span>
                </div>
                <div class="hud-card">
                    <span class="hud-label">📅 Avaliações</span>
                    <span class="hud-value">${list.length}</span>
                    <span class="hud-sub">${latest ? `Última: ${fmtDateBR(latest.date)}` : 'Nenhuma ainda'}</span>
                </div>
                <div class="hud-card">
                    <span class="hud-label">⚖️ Variação Peso</span>
                    <span class="hud-value">${wDiff !== null ? `${wDiff > 0 ? '+' : ''}${fmtNum(wDiff, 1)} kg` : '—'}</span>
                    <span class="hud-sub">${latest?.weight ? `Atual: ${fmtNum(latest.weight, 1)} kg` : 'Sem peso'}</span>
                </div>
                <div class="hud-card">
                    <span class="hud-label">📐 Variação Cintura</span>
                    <span class="hud-value">${waistDiff !== null ? `${waistDiff > 0 ? '+' : ''}${fmtNum(waistDiff, 1)} cm` : '—'}</span>
                    <span class="hud-sub ${waistDiff !== null && waistDiff < 0 ? 'good' : ''}">${latest?.waist ? `Atual: ${fmtNum(latest.waist, 1)} cm` : 'Sem cintura'}</span>
                </div>
            `;
        }

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

    window.adjustWeeklyGoal = function (delta) {
        if (!requireFullLicense('Ajustar Meta Semanal de Treinos')) return;
        const cur = db.weeklyGoal || 4;
        db.weeklyGoal = Math.max(1, Math.min(7, cur + delta));
        saveDB();
        renderConsistencyCalendar();
    };

    function renderConsistencyCalendar() {
        const box = document.getElementById('consistency-calendar-card');
        if (!box) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayISO = now.toISOString().slice(0, 10);
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        // Map trained dates -> latest logId on that date
        const trainedMap = {};
        db.history.forEach((h) => {
            if (h.date && !trainedMap[h.date]) trainedMap[h.date] = h.id;
        });

        // Count workouts in current week (Sunday to Saturday)
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekTrainedDays = new Set();
        let monthTrainedCount = 0;
        db.history.forEach((h) => {
            if (!h.date) return;
            const parts = h.date.split('-');
            if (parts.length !== 3) return;
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (d >= startOfWeek && d <= endOfWeek) weekTrainedDays.add(h.date);
            if (d.getFullYear() === year && d.getMonth() === month) monthTrainedCount++;
        });

        const weeklyGoal = db.weeklyGoal || 4;
        const weekDone = weekTrainedDays.size;
        const weekPct = Math.min(100, Math.round((weekDone / weeklyGoal) * 100));

        // Build calendar cells for current month
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let cellsHtml = '';
        for (let i = 0; i < firstDayOfMonth; i++) {
            cellsHtml += `<div class="cal-day empty"></div>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const logId = trainedMap[iso];
            const isToday = iso === todayISO;
            const cls = `cal-day ${logId ? 'trained' : ''} ${isToday ? 'today' : ''}`;
            const clickAttr = logId ? `onclick="viewWorkoutDetail('${logId}')" title="Ver treino de ${fmtDateBR(iso)}"` : '';
            cellsHtml += `<div class="${cls}" ${clickAttr}>${day}</div>`;
        }

        box.innerHTML = `
            <div class="card-header" style="margin-bottom:10px;">
                <div>
                    <span class="eyebrow" style="color:var(--neon-soft);">🔥 Constância & Disciplina</span>
                    <h3 class="section-title" style="font-size:15.5px; margin-top:2px;">${monthNames[month]} ${year} · ${monthTrainedCount} treino(s)</h3>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="font-size:11px; color:var(--text-muted);">Meta/sem:</span>
                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:28px; padding:0 8px;" onclick="adjustWeeklyGoal(-1)">−</button>
                    <strong class="font-mono" style="font-size:13px; color:var(--neon); min-width:18px; text-align:center;">${weeklyGoal}</strong>
                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:28px; padding:0 8px;" onclick="adjustWeeklyGoal(1)">+</button>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                    <span style="color:var(--text-secondary);">Esta semana: <strong class="font-mono" style="color:var(--text-primary);">${weekDone} de ${weeklyGoal} treinos</strong></span>
                    <strong class="font-mono" style="color:var(--neon-soft);">${weekDone >= weeklyGoal ? '🎉 Meta batida!' : `${weekPct}%`}</strong>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${weekPct}%;"></div>
                </div>
            </div>

            <div class="cal-weekdays">
                <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
            </div>
            <div class="cal-grid">${cellsHtml}</div>
            <p style="margin:8px 0 0; font-size:11px; color:var(--text-muted); text-align:center;">🟢 Dias em verde = treino concluído (toque no dia para ver detalhes)</p>
        `;
    }

    function renderEvolucao() {
        renderConsistencyCalendar();

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
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span style="font-weight:700; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.splitName)}</span>
                            ${h.prs && h.prs.length ? `<span class="pr-badge" style="font-size:9.5px;">🏆 ${h.prs.length} PR</span>` : ''}
                        </div>
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
                const w = effectiveKg(s.weight, ex.loadType, ex.kgPerPlate);
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
                            <span class="chip font-mono" style="font-size:11px;">S${idx + 1}: ${formatLoadLabel(s.weight, ex.loadType)} × ${s.reps}${s.rir !== null && s.rir !== undefined ? ` (RIR ${s.rir})` : ''}</span>`).join('')}
                    </div>
                    ${ex.note ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:6px;">📝 ${escapeHtml(ex.note)}</div>` : ''}
                </div>`).join('')}
            <button type="button" class="btn btn-primary btn-block" style="margin-top:12px;" onclick="shareWorkoutCard('${log.id}')">
                📸 Gerar Card p/ Stories / WhatsApp
            </button>
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
        clearSavedActiveSession();
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
        clearSavedActiveSession();
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

    /* ==================== BODY FAT CALCULATOR (U.S. NAVY + IMC) ==================== */
    const BF_PROFILE_KEY = 'gymprogress_bf_profile_v1';
    let bfGender = 'male';

    const ACE_RANGES = {
        male: [
            { name: 'Gordura Essencial', min: 2, max: 5.99, label: '2% – 5%' },
            { name: 'Atleta', min: 6, max: 13.99, label: '6% – 13%' },
            { name: 'Fitness (Atlético)', min: 14, max: 17.99, label: '14% – 17%' },
            { name: 'Aceitável (Média)', min: 18, max: 24.99, label: '18% – 24%' },
            { name: 'Obesidade / Acima', min: 25, max: 100, label: '25%+' }
        ],
        female: [
            { name: 'Gordura Essencial', min: 10, max: 13.99, label: '10% – 13%' },
            { name: 'Atleta', min: 14, max: 20.99, label: '14% – 20%' },
            { name: 'Fitness (Atlético)', min: 21, max: 24.99, label: '21% – 24%' },
            { name: 'Aceitável (Média)', min: 25, max: 31.99, label: '25% – 31%' },
            { name: 'Obesidade / Acima', min: 32, max: 100, label: '32%+' }
        ]
    };

    // Jackson & Pollock Ideal Body Fat % by age
    function getIdealBodyFatByAge(gender, age) {
        const a = Math.max(20, Math.min(55, age || 25));
        if (gender === 'male') {
            if (a <= 20) return 8.5;
            if (a <= 25) return 10.5;
            if (a <= 30) return 12.7;
            if (a <= 35) return 13.7;
            if (a <= 40) return 15.3;
            if (a <= 45) return 16.4;
            if (a <= 50) return 18.9;
            return 20.9;
        } else {
            if (a <= 20) return 17.7;
            if (a <= 25) return 18.4;
            if (a <= 30) return 19.3;
            if (a <= 35) return 21.5;
            if (a <= 40) return 22.2;
            if (a <= 45) return 22.9;
            if (a <= 50) return 25.2;
            return 26.3;
        }
    }

    function getAceCategory(gender, bf) {
        const ranges = ACE_RANGES[gender] || ACE_RANGES.male;
        if (bf < ranges[0].min) return ranges[0];
        return ranges.find((r) => bf >= r.min && bf <= r.max) || ranges[ranges.length - 1];
    }

    window.setBFGender = function (g) {
        bfGender = g === 'female' ? 'female' : 'male';
        document.getElementById('bf-gender-male')?.classList.toggle('active', bfGender === 'male');
        document.getElementById('bf-gender-female')?.classList.toggle('active', bfGender === 'female');
        const hipWrap = document.getElementById('bf-hip-wrap');
        const waistWrap = document.getElementById('bf-waist-wrap');
        if (hipWrap) hipWrap.classList.toggle('hidden', bfGender !== 'female');
        if (waistWrap) waistWrap.style.gridColumn = bfGender === 'female' ? '' : '1/-1';
        calculateBodyFat();
    };

    window.pullLatestMeasurementsToBF = function () {
        const list = getSortedMeasurements();
        const latest = list[list.length - 1];
        if (!latest) {
            showToast('Nenhuma medida salva ainda na aba Medidas.');
            return;
        }
        if (latest.weight && document.getElementById('bf-weight')) document.getElementById('bf-weight').value = latest.weight;
        if (latest.waist && document.getElementById('bf-waist')) document.getElementById('bf-waist').value = latest.waist;
        if (latest.neck && document.getElementById('bf-neck')) document.getElementById('bf-neck').value = latest.neck;
        calculateBodyFat(true);
        showToast('⚡ Peso, Cintura e Pescoço puxados da aba Medidas!');
    };

    function loadSavedBFProfile() {
        try {
            const raw = localStorage.getItem(BF_PROFILE_KEY);
            if (!raw) return;
            const p = JSON.parse(raw);
            if (p.gender) setBFGender(p.gender);
            if (p.age && document.getElementById('bf-age')) document.getElementById('bf-age').value = p.age;
            if (p.height && document.getElementById('bf-height')) document.getElementById('bf-height').value = p.height;
            if (p.weight && document.getElementById('bf-weight')) document.getElementById('bf-weight').value = p.weight;
            if (p.neck && document.getElementById('bf-neck')) document.getElementById('bf-neck').value = p.neck;
            if (p.waist && document.getElementById('bf-waist')) document.getElementById('bf-waist').value = p.waist;
            if (p.hip && document.getElementById('bf-hip')) document.getElementById('bf-hip').value = p.hip;
        } catch (_) {}
    }

    window.calculateBodyFat = function (notify) {
        const resBox = document.getElementById('bf-result-container');
        const aceBox = document.getElementById('bf-ace-table-wrap');
        if (!resBox) return;

        const age = parseFloat(document.getElementById('bf-age')?.value) || 25;
        const weight = parseFloat(document.getElementById('bf-weight')?.value) || 0;
        const height = parseFloat(document.getElementById('bf-height')?.value) || 0;
        const neck = parseFloat(document.getElementById('bf-neck')?.value) || 0;
        const waist = parseFloat(document.getElementById('bf-waist')?.value) || 0;
        const hip = parseFloat(document.getElementById('bf-hip')?.value) || 0;

        try {
            localStorage.setItem(BF_PROFILE_KEY, JSON.stringify({ gender: bfGender, age, weight, height, neck, waist, hip }));
        } catch (_) {}

        let bfNavy = NaN;
        if (bfGender === 'male') {
            if (waist > neck && height > 0) {
                bfNavy = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
            }
        } else {
            if (waist + hip > neck && height > 0) {
                bfNavy = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
            }
        }

        if (isNaN(bfNavy) || !isFinite(bfNavy) || weight <= 0 || height <= 0) {
            resBox.innerHTML = `
                <div class="card" style="text-align:center;">
                    <p class="section-sub">Preencha <strong>Altura, Peso, Pescoço e Cintura</strong> (e Quadril, se feminino) com valores válidos para ver o resultado.</p>
                </div>`;
            return;
        }

        bfNavy = Math.max(2, Math.min(60, bfNavy));
        const fatMass = weight * (bfNavy / 100);
        const leanMass = weight - fatMass;
        const idealBF = getIdealBodyFatByAge(bfGender, age);
        const targetWeightAtIdeal = leanMass / (1 - idealBF / 100);
        const fatToLose = weight - targetWeightAtIdeal;

        // BMI & Deurenberg Body Fat estimate for comparison
        const hMeters = height / 100;
        const bmi = weight / (hMeters * hMeters);
        const sexBit = bfGender === 'male' ? 1 : 0;
        const bfBmi = Math.max(2, Math.min(60, 1.2 * bmi + 0.23 * age - 10.8 * sexBit - 5.4));

        const aceCat = getAceCategory(bfGender, bfNavy);
        const minScale = bfGender === 'male' ? 4 : 10;
        const maxScale = bfGender === 'male' ? 35 : 42;
        const markerPct = Math.max(0, Math.min(100, ((bfNavy - minScale) / (maxScale - minScale)) * 100));

        const goalActionText = fatToLose > 0.3
            ? `Perder ~<strong>${fmtNum(fatToLose, 1)} kg</strong> de gordura para atingir o ideal (${fmtNum(idealBF, 1)}%)`
            : (fatToLose < -0.5
                ? `Você já está abaixo do ideal (${fmtNum(idealBF, 1)}%) — ótimo momento para foco em ganho de massa magra!`
                : `🔥 Você está exatamente na faixa ideal para sua idade (${fmtNum(idealBF, 1)}%)!`);

        resBox.innerHTML = `
            <div class="ratio-card">
                <div class="card-header" style="margin-bottom:4px;">
                    <div>
                        <span class="eyebrow" style="color:var(--neon-soft);">Resultado (Método Marinha EUA)</span>
                        <h3 class="section-title" style="font-size:17px; margin-top:2px;">${aceCat.name}</h3>
                    </div>
                    <div class="font-mono" style="font-size:32px; font-weight:800; color:var(--neon);">${fmtNum(bfNavy, 1)}%</div>
                </div>

                <div class="bf-scale-bar">
                    <div class="bf-scale-marker" style="left:${markerPct.toFixed(1)}%;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:14px;">
                    <span>Essencial</span>
                    <span>Atleta</span>
                    <span>Fitness</span>
                    <span>Aceitável</span>
                    <span>Alto</span>
                </div>

                <div class="stat-row-3" style="margin-bottom:12px;">
                    <div class="stat-mini">
                        <span class="stat-mini-val">${fmtNum(leanMass, 1)} kg</span>
                        <span class="stat-mini-lbl">Massa Magra</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-val" style="color:var(--warn);">${fmtNum(fatMass, 1)} kg</span>
                        <span class="stat-mini-lbl">Massa Gorda</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-val" style="color:var(--info);">${fmtNum(idealBF, 1)}%</span>
                        <span class="stat-mini-lbl">Ideal (${Math.round(age)}a)</span>
                    </div>
                </div>

                <div class="guide-box" style="margin-bottom:12px;">
                    <div>🎯 ${goalActionText}</div>
                    <div>📊 <strong>Comparativo pelo IMC (${fmtNum(bmi, 1)}):</strong> ~<strong>${fmtNum(bfBmi, 1)}%</strong> <span style="color:var(--text-muted);">(o método da Marinha é mais fiel para quem faz musculação porque considera a cintura e o pescoço!)</span></div>
                </div>

                <button type="button" class="btn btn-secondary btn-block btn-sm" onclick="saveBFToEvolution(${bfNavy.toFixed(1)})">
                    💾 Salvar ${fmtNum(bfNavy, 1)}% no Gráfico de Evolução
                </button>
            </div>
        `;

        if (aceBox) {
            const rows = ACE_RANGES[bfGender] || ACE_RANGES.male;
            aceBox.innerHTML = `
                <table class="ace-table">
                    <thead>
                        <tr><th>Categoria</th><th>Faixa (${bfGender === 'male' ? 'Homens' : 'Mulheres'})</th></tr>
                    </thead>
                    <tbody>
                        ${rows.map((r) => `
                            <tr class="${r.name === aceCat.name ? 'active-row' : ''}">
                                <td>${r.name === aceCat.name ? '👉 ' : ''}${r.name}</td>
                                <td class="font-mono">${r.label}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            `;
        }

        calculateMacros();
        if (notify) showToast(`🧮 BF% calculado: ${fmtNum(bfNavy, 1)}% (${aceCat.name})`);
    };

    window.saveBFToEvolution = function (bfVal) {
        if (!requireFullLicense('Salvar BF% no Gráfico de Evolução')) return;
        const val = parseFloat(bfVal);
        if (isNaN(val)) return;
        const today = new Date().toISOString().slice(0, 10);
        const existingToday = db.measurements.find((m) => m.date === today);
        const curWeight = parseFloat(document.getElementById('bf-weight')?.value);
        const curWaist = parseFloat(document.getElementById('bf-waist')?.value);
        const curNeck = parseFloat(document.getElementById('bf-neck')?.value);

        if (existingToday) {
            existingToday.bodyFat = Number(val.toFixed(1));
        } else {
            const rec = { id: 'm-' + Date.now(), date: today, bodyFat: Number(val.toFixed(1)) };
            if (!isNaN(curWeight) && curWeight > 0) rec.weight = curWeight;
            if (!isNaN(curWaist) && curWaist > 0) rec.waist = curWaist;
            if (!isNaN(curNeck) && curNeck > 0) rec.neck = curNeck;
            db.measurements.push(rec);
        }
        db.isSample = false;
        saveDB();
        renderMedidas();
        showToast(`✅ BF% (${fmtNum(val, 1)}%) salvo na sua evolução!`);
    };

    /* ==================== MACROS, TDEE & WATER CALCULATOR ==================== */
    window.calculateMacros = function () {
        const box = document.getElementById('macro-result-container');
        if (!box) return;

        const age = parseFloat(document.getElementById('bf-age')?.value) || 25;
        const weight = parseFloat(document.getElementById('bf-weight')?.value) || 0;
        const height = parseFloat(document.getElementById('bf-height')?.value) || 0;
        const goal = document.getElementById('macro-goal')?.value || 'maintain';
        const activity = parseFloat(document.getElementById('macro-activity')?.value) || 1.55;

        if (weight <= 0 || height <= 0) {
            box.innerHTML = `<p class="section-sub" style="text-align:center;">Preencha Peso, Altura e Idade acima para calcular seus macros.</p>`;
            return;
        }

        // Mifflin-St Jeor BMR (TMB)
        const bmr = bfGender === 'male'
            ? (10 * weight) + (6.25 * height) - (5 * age) + 5
            : (10 * weight) + (6.25 * height) - (5 * age) - 161;
        const tdee = bmr * activity;

        let targetKcal = tdee;
        let proteinPerKg = 2.0;
        let fatPerKg = 0.85;
        let goalBadge = '⚖️ Manutenção / Recomposição';
        let goalTip = 'Calorias equilibradas para manter o peso enquanto troca gordura por massa magra.';

        if (goal === 'cut') {
            targetKcal = Math.max(bmr * 1.05, tdee - 450);
            proteinPerKg = 2.2;
            fatPerKg = 0.75;
            goalBadge = '🔥 Déficit Calórico (Cutting)';
            goalTip = 'Déficit seguro (~450 kcal/dia) com proteína alta (2,2 g/kg) para queimar gordura preservando seus músculos.';
        } else if (goal === 'bulk') {
            targetKcal = tdee + 300;
            proteinPerKg = 2.0;
            fatPerKg = 0.9;
            goalBadge = '💪 Superávit Limpo (Bulking)';
            goalTip = 'Superávit controlado (+300 kcal/dia) com carboidratos altos para gerar energia no treino e ganhar massa magra sem acumular excesso de gordura.';
        }

        const proteinG = Math.round(weight * proteinPerKg);
        const fatG = Math.round(weight * fatPerKg);
        const proteinKcal = proteinG * 4;
        const fatKcal = fatG * 9;
        const remainingKcal = Math.max(160, targetKcal - proteinKcal - fatKcal);
        const carbsG = Math.round(remainingKcal / 4);
        const finalKcal = proteinKcal + fatKcal + (carbsG * 4);

        const pPct = Math.round((proteinKcal / finalKcal) * 100);
        const cPct = Math.round(((carbsG * 4) / finalKcal) * 100);
        const fPct = Math.max(0, 100 - pPct - cPct);

        // Água recomendada: 35ml/kg base + bônus pelo nível de treino
        const waterMlPerKg = activity >= 1.725 ? 42 : (activity >= 1.55 ? 38 : 35);
        const waterLiters = (weight * waterMlPerKg) / 1000;
        const bottles500 = Math.round(waterLiters / 0.5);

        box.innerHTML = `
            <div style="background:linear-gradient(145deg, #121c14 0%, #0e1319 100%); border:1px solid rgba(57,255,20,0.28); border-radius:14px; padding:14px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
                    <div>
                        <span class="eyebrow" style="color:var(--neon-soft);">${goalBadge}</span>
                        <div class="font-mono" style="font-size:28px; font-weight:800; color:var(--neon); line-height:1.15;">${fmtInt(finalKcal)} <span style="font-size:13px; color:var(--text-secondary);">kcal/dia</span></div>
                    </div>
                    <div style="text-align:right; font-size:11px; color:var(--text-secondary);">
                        <div>TMB (repouso): <strong class="font-mono">${fmtInt(bmr)} kcal</strong></div>
                        <div>Gasto (TDEE): <strong class="font-mono">${fmtInt(tdee)} kcal</strong></div>
                    </div>
                </div>

                <!-- Barra de distribuição dos macros -->
                <div style="display:flex; height:10px; border-radius:999px; overflow:hidden; margin-bottom:12px; gap:2px;">
                    <div style="width:${pPct}%; background:#39ff14;" title="Proteína ${pPct}%"></div>
                    <div style="width:${cPct}%; background:#38bdf8;" title="Carboidratos ${cPct}%"></div>
                    <div style="width:${fPct}%; background:#f59e0b;" title="Gorduras ${fPct}%"></div>
                </div>

                <div class="stat-row-3" style="margin-bottom:10px;">
                    <div class="stat-mini">
                        <span class="stat-mini-val" style="color:#39ff14;">${proteinG}g</span>
                        <span class="stat-mini-lbl">🥩 Proteína (${pPct}%)</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-val" style="color:#38bdf8;">${carbsG}g</span>
                        <span class="stat-mini-lbl">🍚 Carbos (${cPct}%)</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-val" style="color:#f59e0b;">${fatG}g</span>
                        <span class="stat-mini-lbl">🥑 Gordura (${fPct}%)</span>
                    </div>
                </div>

                <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); border-radius:11px; padding:9px 11px; display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px;">
                    <div style="font-size:12px; color:var(--text-primary);">💧 <strong>Meta de Água Diária</strong></div>
                    <div class="font-mono" style="font-size:13.5px; font-weight:800; color:var(--info);">${fmtNum(waterLiters, 1)} L <span style="font-size:10.5px; font-weight:500; color:var(--text-secondary);">(~${bottles500} garrafas 500ml)</span></div>
                </div>

                <p style="margin:0; font-size:11.5px; color:var(--text-secondary);">💡 ${goalTip}</p>
            </div>
        `;
    };

    /* ==================== SHARE WORKOUT CARD (STORIES / WHATSAPP PNG) ==================== */
    window.shareWorkoutCard = async function (logId) {
        const log = db.history.find((h) => h.id === logId);
        if (!log) return;

        const W = 1080;
        const H = 1350;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#090b0e');
        bg.addColorStop(0.55, '#0f1612');
        bg.addColorStop(1, '#090b0e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle radial neon glow top-right
        const glow = ctx.createRadialGradient(W * 0.85, H * 0.12, 20, W * 0.85, H * 0.12, 460);
        glow.addColorStop(0, 'rgba(57, 255, 20, 0.22)');
        glow.addColorStop(1, 'rgba(57, 255, 20, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // Helper rounded rect
        function roundRect(x, y, w, h, r, fill, stroke) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
        }

        // Brand Header
        roundRect(72, 76, 310, 56, 28, 'rgba(57,255,20,0.14)', 'rgba(57,255,20,0.45)');
        ctx.fillStyle = '#39ff14';
        ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('⚡ TREINO CONCLUÍDO', 102, 113);

        if (log.prs && log.prs.length) {
            roundRect(402, 76, 240, 56, 28, '#39ff14', '#39ff14');
            ctx.fillStyle = '#051404';
            ctx.font = '800 23px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`🏆 ${log.prs.length} NOVO(S) PR!`, 426, 113);
        }

        ctx.fillStyle = '#9aa4b2';
        ctx.font = '700 26px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(fmtDateBR(log.date), W - 72, 113);
        ctx.textAlign = 'left';

        // Split Title
        ctx.fillStyle = '#f4f6f9';
        ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
        const titleStr = (log.splitName || 'Treino').slice(0, 32);
        ctx.fillText(titleStr, 72, 232);

        const totalSets = (log.exercises || []).reduce((acc, ex) => acc + (ex.sets || []).length, 0);

        // 3 Big KPI Cards
        const kpis = [
            { label: 'VOLUME TOTAL', val: `${fmtInt(log.totalVolume)} kg`, color: '#39ff14' },
            { label: 'MELHOR 1RM', val: `${fmtNum(log.bestEpley1RM, 1)} kg`, color: '#f4f6f9' },
            { label: 'SÉRIES FEITAS', val: `${totalSets} OK`, color: '#38bdf8' }
        ];
        kpis.forEach((k, i) => {
            const x = 72 + i * 320;
            roundRect(x, 290, 296, 175, 26, '#12171e', 'rgba(255,255,255,0.12)');
            ctx.fillStyle = '#687385';
            ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(k.label, x + 28, 342);
            ctx.fillStyle = k.color;
            ctx.font = '800 44px "JetBrains Mono", monospace';
            ctx.fillText(k.val, x + 28, 418);
        });

        // Exercises Breakdown Card
        roundRect(72, 510, W - 144, 650, 30, '#11161c', 'rgba(255,255,255,0.1)');
        ctx.fillStyle = '#39ff14';
        ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('RESUMO DOS EXERCÍCIOS', 112, 568);

        const exList = (log.exercises || []).slice(0, 6);
        exList.forEach((ex, i) => {
            const y = 626 + i * 86;
            const maxW = Math.max(...(ex.sets || []).map((s) => parseFloat(s.weight) || 0), 0);
            const repsStr = (ex.sets || []).map((s) => s.reps).join(', ');

            ctx.fillStyle = '#f4f6f9';
            ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(ex.name.slice(0, 34), 112, y);

            ctx.fillStyle = '#4ade80';
            ctx.font = '700 24px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${formatLoadLabel(maxW, ex.loadType)} × ${repsStr}`, W - 112, y);
            ctx.textAlign = 'left';

            if (i < exList.length - 1) {
                ctx.strokeStyle = 'rgba(255,255,255,0.07)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(112, y + 28);
                ctx.lineTo(W - 112, y + 28);
                ctx.stroke();
            }
        });

        // Footer Branding
        ctx.fillStyle = '#f4f6f9';
        ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Gym', 72, H - 86);
        const gymW = ctx.measureText('Gym').width;
        ctx.fillStyle = '#39ff14';
        ctx.fillText('Progress', 72 + gymW, H - 86);

        ctx.fillStyle = '#687385';
        ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('App desenvolvido por Torugo Dev', W - 72, H - 86);
        ctx.textAlign = 'left';

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const fileName = `gymprogress-treino-${log.date || 'hoje'}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Treino Concluído — ${log.splitName}`,
                        text: `🔥 ${log.splitName} concluído no GymProgress! Volume: ${fmtInt(log.totalVolume)} kg`
                    });
                    return;
                } catch (_) {}
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            showToast('📸 Card salvo! Pronto para postar nos Stories ou WhatsApp.');
        }, 'image/png');
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

        activeSession = loadSavedActiveSession();
        renderTreinos();
        renderMedidas();
        loadSavedBFProfile();
        calculateBodyFat();
        calculateMacros();

        if (activeSession) {
            showToast('🔄 Treino em andamento restaurado!');
        }
    }

    window.addEventListener('pagehide', saveActiveSession);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) saveActiveSession();
    });

    document.addEventListener('DOMContentLoaded', init);
})();
