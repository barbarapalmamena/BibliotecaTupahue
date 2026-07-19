import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── AUTH ──────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { nombre }
        }
    });
    return { data, error };
}

// ─── ROL ───────────────────────────────────────────────────────────────────

export async function getUserRole(userId) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data.rol;
}

// ─── LIBROS ────────────────────────────────────────────────────────────────

export async function getLibros() {
    const { data, error } = await supabase
        .from('libros')
        .select('*')
        .order('titulo', { ascending: true });
    return { data, error };
}

// ─── RESERVAS ──────────────────────────────────────────────────────────────

export async function reservarLibro(libroId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'No autenticado' } };

    // Obtener datos del libro para calcular días de préstamo
    const { data: libro } = await supabase
        .from('libros')
        .select('paginas')
        .eq('id', libroId)
        .single();

    const diasPrestamo = libro?.paginas <= 100 ? 7 : 14;
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + diasPrestamo);

    // Crear reserva
    const { data, error } = await supabase
        .from('reservas')
        .insert({
            libro_id: libroId,
            usuario_id: user.id,
            estado: 'activa',
            vencimiento: vencimiento.toISOString(),
        })
        .select()
        .single();

    if (error) return { data: null, error };

    // Marcar libro como no disponible
    await supabase
        .from('libros')
        .update({ disponible: false })
        .eq('id', libroId);

    return { data, error: null };
}

export async function getReservasUsuario(userId) {
    const { data, error } = await supabase
        .from('reservas')
        .select('*, libros(titulo, autor)')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function devolverLibro(reservaId, libroId) {
    const { error: errorReserva } = await supabase
        .from('reservas')
        .update({ estado: 'devuelto' })
        .eq('id', reservaId);

    if (errorReserva) return { error: errorReserva };

    const { error: errorLibro } = await supabase
        .from('libros')
        .update({ disponible: true })
        .eq('id', libroId);

    return { error: errorLibro };
}

// ─── ARTÍCULOS ─────────────────────────────────────────────────────────────

export async function getArticulos(limit = 3) {
    const { data, error } = await supabase
        .from('articulos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    return { data, error };
}

// ─── CONFIGURACIÓN ─────────────────────────────────────────────────────────

export async function getConfiguracion() {
    const { data, error } = await supabase
        .from('configuracion')
        .select('*');
    if (error || !data) return {};
    const configMap = {};
    data.forEach(item => { configMap[item.clave] = item.valor; });
    return configMap;
}
