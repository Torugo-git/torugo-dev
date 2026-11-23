/* GymProgress — Supabase Cloud Sync Module (Offline-First)
 * Cole sua Project URL e Anon Public Key abaixo quando criar o projeto no Supabase.
 * Enquanto estiverem vazias, o app funciona 100% offline via localStorage sem nenhum erro.
 */
(function () {
    'use strict';

    const SUPABASE_URL = '';       // Ex: 'https://xxxxxxxxxxxx.supabase.co'
    const SUPABASE_ANON_KEY = '';  // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    let client = null;

    function isConfigured() {
        return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
    }

    function getClient() {
        if (!isConfigured()) return null;
        if (!client) {
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return client;
    }

    async function getCurrentUser() {
        const sb = getClient();
        if (!sb) return null;
        const { data } = await sb.auth.getUser();
        return data?.user || null;
    }

    async function signUp(email, password, fullName) {
        const sb = getClient();
        if (!sb) throw new Error('Supabase ainda não configurado.');
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName || '' } }
        });
        if (error) throw error;
        return data.user;
    }

    async function signIn(email, password) {
        const sb = getClient();
        if (!sb) throw new Error('Supabase ainda não configurado.');
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    }

    async function signOut() {
        const sb = getClient();
        if (!sb) return;
        await sb.auth.signOut();
    }

    /**
     * Envia todo o banco local (splits, history, measurements, goals, weeklyGoal) para a nuvem.
     * Usa UPSERT para nunca duplicar nem perder dados.
     */
    async function pushLocalToCloud(localDb, bfProfile) {
        const sb = getClient();
        const user = await getCurrentUser();
        if (!sb || !user) return { ok: false, reason: 'not_authenticated' };

        const uid = user.id;

        // 1. Profile preferences
        await sb.from('profiles').update({
            weekly_goal: localDb.weeklyGoal || 4,
            bf_profile: bfProfile || {},
            updated_at: new Date().toISOString()
        }).eq('id', uid);

        // 2. Splits
        if (Array.isArray(localDb.splits) && localDb.splits.length) {
            const splitRows = localDb.splits.map((s, idx) => ({
                id: s.id,
                user_id: uid,
                name: s.name,
                exercises: s.exercises || [],
                sort_order: idx,
                updated_at: new Date().toISOString()
            }));
            const { error } = await sb.from('workout_splits').upsert(splitRows);
            if (error) throw error;
        }

        // 3. Workout Logs
        if (Array.isArray(localDb.history) && localDb.history.length) {
            const logRows = localDb.history.map((h) => ({
                id: h.id,
                user_id: uid,
                split_id: h.splitId || null,
                split_name: h.splitName,
                workout_date: h.date,
                duration_min: h.durationMin || 45,
                total_volume: h.totalVolume || 0,
                best_epley_1rm: h.bestEpley1RM || 0,
                prs: h.prs || [],
                exercises: h.exercises || []
            }));
            const { error } = await sb.from('workout_logs').upsert(logRows);
            if (error) throw error;
        }

        // 4. Measurements
        if (Array.isArray(localDb.measurements) && localDb.measurements.length) {
            const measRows = localDb.measurements.map((m) => ({
                id: m.id,
                user_id: uid,
                measured_at: m.date,
                weight: m.weight ?? null,
                body_fat: m.bodyFat ?? null,
                waist: m.waist ?? null,
                chest: m.chest ?? null,
                arm_relaxed: m.armRelaxed ?? null,
                arm_flexed: m.armFlexed ?? null,
                neck: m.neck ?? null,
                thigh: m.thigh ?? null
            }));
            const { error } = await sb.from('body_measurements').upsert(measRows);
            if (error) throw error;
        }

        // 5. Goals
        if (localDb.goals) {
            const { error } = await sb.from('body_goals').upsert({
                user_id: uid,
                goals: localDb.goals,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
        }

        return { ok: true };
    }

    /**
     * Baixa todos os dados do usuário da nuvem no formato exato do GymProgress local.
     */
    async function pullCloudToLocal() {
        const sb = getClient();
        const user = await getCurrentUser();
        if (!sb || !user) return null;

        const uid = user.id;
        const [profRes, splitsRes, logsRes, measRes, goalsRes] = await Promise.all([
            sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
            sb.from('workout_splits').select('*').eq('user_id', uid).order('sort_order', { ascending: true }),
            sb.from('workout_logs').select('*').eq('user_id', uid).order('workout_date', { ascending: false }),
            sb.from('body_measurements').select('*').eq('user_id', uid).order('measured_at', { ascending: true }),
            sb.from('body_goals').select('*').eq('user_id', uid).maybeSingle()
        ]);

        return {
            isSample: false,
            weeklyGoal: profRes.data?.weekly_goal || 4,
            bfProfile: profRes.data?.bf_profile || null,
            splits: (splitsRes.data || []).map((s) => ({
                id: s.id,
                name: s.name,
                exercises: s.exercises || []
            })),
            history: (logsRes.data || []).map((h) => ({
                id: h.id,
                splitId: h.split_id,
                splitName: h.split_name,
                date: h.workout_date,
                durationMin: h.duration_min,
                totalVolume: Number(h.total_volume) || 0,
                bestEpley1RM: Number(h.best_epley_1rm) || 0,
                prs: h.prs || [],
                exercises: h.exercises || []
            })),
            measurements: (measRes.data || []).map((m) => ({
                id: m.id,
                date: m.measured_at,
                weight: m.weight !== null ? Number(m.weight) : undefined,
                bodyFat: m.body_fat !== null ? Number(m.body_fat) : undefined,
                waist: m.waist !== null ? Number(m.waist) : undefined,
                chest: m.chest !== null ? Number(m.chest) : undefined,
                armRelaxed: m.arm_relaxed !== null ? Number(m.arm_relaxed) : undefined,
                armFlexed: m.arm_flexed !== null ? Number(m.arm_flexed) : undefined,
                neck: m.neck !== null ? Number(m.neck) : undefined,
                thigh: m.thigh !== null ? Number(m.thigh) : undefined
            })),
            goals: goalsRes.data?.goals || null
        };
    }

    window.GymCloud = {
        isConfigured,
        getCurrentUser,
        signUp,
        signIn,
        signOut,
        pushLocalToCloud,
        pullCloudToLocal
    };
})();
