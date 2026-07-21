'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import styles from './page.module.css';
import {
    getLibros,
    reservarLibro,
    getCurrentUser,
    signOut,
    getReservasUsuario,
    devolverLibro,
    getUserRole
} from '@/lib/supabase';

export default function BibliotecaClient() {
    const router = useRouter();

    const getDiasPrestamo = (paginas) => {
        if (!paginas) return 14;
        if (paginas <= 100) return 7;
        if (paginas <= 200) return 14;
        if (paginas <= 299) return 21;
        return 30;
    };

    const calcularDias = (reserva) => {
        const inicio = new Date(reserva.created_at);
        const vence  = new Date(reserva.vencimiento);
        const hoy    = new Date();
        const total      = Math.round((vence - inicio) / (1000 * 60 * 60 * 24));
        const transcurridos = Math.round((hoy - inicio)  / (1000 * 60 * 60 * 24));
        const restantes  = Math.max(0, Math.round((vence - hoy) / (1000 * 60 * 60 * 24)));
        const progreso   = Math.min(100, Math.round((transcurridos / total) * 100));
        const vencido    = hoy > vence;
        return { total, transcurridos, restantes, progreso, vencido };
    };
    const [busqueda, setBusqueda] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [reservando, setReservando] = useState(null);
    const [misReservas, setMisReservas] = useState([]);
    const [devolviendo, setDevolviendo] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const { data, error } = await getLibros();
            if (!error && data) setLibros(data);

            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser || null);

                if (currentUser) {
                    const role = await getUserRole(currentUser.id);
                    setUserRole(role);

                    const isAdmin = role === 'admin' || currentUser.user_metadata?.role === 'admin';
                    if (!isAdmin) {
                        const { data: resData } = await getReservasUsuario(currentUser.id);
                        if (resData) setMisReservas(resData);
                    }
                }
            } catch (authError) {
                setUser(null);
            }
        } catch (err) {
            console.error('Error en cargarDatos:', err);
        }
        setLoading(false);
    };

    const handleReservar = async (libro) => {
        if (!user) {
            alert('Debes iniciar sesión para reservar un libro');
            router.push('/login');
            return;
        }

        const isAdmin = userRole === 'admin' || user.user_metadata?.role === 'admin';
        if (isAdmin) {
            alert('Los administradores no pueden realizar reservas de libros.');
            return;
        }

        setReservando(libro.id);
        const { data, error } = await reservarLibro(libro.id);

        if (error) {
            alert(error.message || 'Error al reservar el libro');
        } else {
            const diasPrestamo = getDiasPrestamo(libro.paginas);
            alert(`¡Libro reservado exitosamente! Tienes ${diasPrestamo} días para devolverlo.`);
            
            // Enviar correo de confirmación
            fetch('/api/reservas/confirmacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    nombre: user.user_metadata?.nombre || user.email.split('@')[0],
                    libroTitulo: libro.titulo,
                    autor: libro.autor,
                    diasPrestamo: diasPrestamo
                })
            }).catch(err => console.error('Error enviando correo de confirmación:', err));

            cargarDatos();
        }
        setReservando(null);
    };

    const handleDevolver = async (reservaId, libroId) => {
        if (!confirm('¿Estás seguro de que quieres devolver este libro?')) return;
        setDevolviendo(reservaId);
        const { error } = await devolverLibro(reservaId, libroId);
        if (error) {
            alert('Error al devolver: ' + error.message);
        } else {
            alert('¡Libro devuelto exitosamente!');
            cargarDatos();
        }
        setDevolviendo(null);
    };

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        router.push('/');
    };

    const normalize = (str) =>
        (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const librosFiltrados = libros.filter(libro => {
        const search = normalize(busqueda);
        return normalize(libro.titulo).includes(search) || normalize(libro.autor).includes(search);
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLibros = librosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(librosFiltrados.length / itemsPerPage);

    const isAdmin = userRole === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'barbarapalmamena@gmail.com';

    return (
        <div className={styles.pageContainer}>
            <Navbar user={user} onLogout={handleLogout} />

            <div className={styles.mainContainer}>
                <h1 className={styles.pageTitle}>Biblioteca</h1>

                {user && (
                    <div className={styles.welcomeMessage}>
                        <i className="bi bi-person-check"></i> Bienvenido/a,{' '}
                        {user.user_metadata?.nombre || user.email}
                    </div>
                )}

                {/* ── MIS RESERVAS ── */}
                {user && !isAdmin && misReservas.length > 0 && (
                    <div className={styles.reservasContainer}>
                        <h2 className={styles.reservasTitle}>
                            <i className="bi bi-bookmark-check" style={{ color: '#0d6efd', marginRight: '0.5rem' }}></i>
                            Tus Reservas
                        </h2>
                        <div className={styles.reservasGrid}>
                            {misReservas.map(res => {
                                const dias = res.estado === 'activa' ? calcularDias(res) : null;
                                return (
                                    <div
                                        key={res.id}
                                        className={`${styles.reservaCard} ${res.estado === 'activa' ? (dias?.vencido ? styles.reservaVencida : styles.reservaActiva) : styles.reservaDevuelta}`}
                                    >
                                        {/* Título y autor */}
                                        <h4 className={styles.reservaLibroTitulo}>
                                            <i className="bi bi-book" style={{ marginRight: '0.4rem', color: '#3c4d6b' }}></i>
                                            {res.libros?.titulo}
                                        </h4>
                                        {res.libros?.autor && (
                                            <p className={styles.reservaDetalle} style={{ marginBottom: '0.75rem' }}>
                                                <i className="bi bi-person" style={{ marginRight: '0.3rem' }}></i>
                                                {res.libros.autor}
                                            </p>
                                        )}

                                        {/* Estado */}
                                        <p className={styles.reservaDetalle}>
                                            <strong>Estado:</strong>{' '}
                                            {res.estado === 'activa'
                                                ? <span style={{ color: dias?.vencido ? '#dc3545' : '#17a2b8', fontWeight: 600 }}>
                                                    {dias?.vencido ? '⚠️ Vencida' : '✅ Activa'}
                                                  </span>
                                                : <span style={{ color: '#28a745', fontWeight: 600 }}>✔ Devuelto</span>
                                            }
                                        </p>

                                        {/* Info de tiempo (solo reservas activas) */}
                                        {res.estado === 'activa' && dias && (
                                            <>
                                                <p className={styles.reservaDetalle}>
                                                    <i className="bi bi-calendar3" style={{ marginRight: '0.3rem' }}></i>
                                                    <strong>Llevas:</strong> {dias.transcurridos} día{dias.transcurridos !== 1 ? 's' : ''} con este libro
                                                </p>
                                                <p className={styles.reservaDetalle}>
                                                    <i className="bi bi-clock" style={{ marginRight: '0.3rem', color: dias.vencido ? '#dc3545' : dias.restantes <= 2 ? '#ffc107' : '#28a745' }}></i>
                                                    <strong>Tiempo restante:</strong>{' '}
                                                    <span style={{ fontWeight: 600, color: dias.vencido ? '#dc3545' : dias.restantes <= 2 ? '#e0a800' : '#28a745' }}>
                                                        {dias.vencido ? 'Plazo vencido' : `${dias.restantes} día${dias.restantes !== 1 ? 's' : ''}`}
                                                    </span>
                                                </p>
                                                <p className={styles.reservaDetalle}>
                                                    <i className="bi bi-calendar-x" style={{ marginRight: '0.3rem' }}></i>
                                                    <strong>Vence:</strong>{' '}
                                                    {new Date(res.vencimiento).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>

                                                {/* Barra de progreso */}
                                                <div style={{ margin: '0.75rem 0 0.25rem' }}>
                                                    <div style={{
                                                        height: '8px',
                                                        borderRadius: '99px',
                                                        background: '#e9ecef',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${dias.progreso}%`,
                                                            borderRadius: '99px',
                                                            background: dias.vencido ? '#dc3545' : dias.progreso >= 80 ? '#ffc107' : '#17a2b8',
                                                            transition: 'width 0.4s ease'
                                                        }} />
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem', textAlign: 'right' }}>
                                                        {dias.progreso}% del tiempo usado
                                                    </p>
                                                </div>

                                                {dias.vencido && (
                                                    <p style={{ fontSize: '0.82rem', color: '#dc3545', fontWeight: 600, marginTop: '0.25rem' }}>
                                                        ⚠️ Por favor, devuelve el libro lo antes posible.
                                                    </p>
                                                )}
                                                {!dias.vencido && dias.restantes <= 2 && (
                                                    <p style={{ fontSize: '0.82rem', color: '#e0a800', fontWeight: 600, marginTop: '0.25rem' }}>
                                                        ⏰ ¡Te quedan pocos días! Recuerda devolver el libro.
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {/* Fecha devolución (reservas devueltas) */}
                                        {res.estado !== 'activa' && res.fecha_devolucion && (
                                            <p className={styles.reservaDetalle}>
                                                <i className="bi bi-check-circle" style={{ marginRight: '0.3rem', color: '#28a745' }}></i>
                                                <strong>Devuelto el:</strong>{' '}
                                                {new Date(res.fecha_devolucion).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        )}

                                        {/* Botón devolver */}
                                        {res.estado === 'activa' && (
                                            <button
                                                onClick={() => handleDevolver(res.id, res.libro_id)}
                                                disabled={devolviendo === res.id}
                                                className={styles.btnDevolver}
                                                style={{ marginTop: '1rem', width: '100%' }}
                                            >
                                                <i className="bi bi-arrow-return-left" style={{ marginRight: '0.4rem' }}></i>
                                                {devolviendo === res.id ? 'Devolviendo…' : 'Marcar como Devuelto'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── BUSCADOR ── */}
                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <i className={`bi bi-search ${styles.searchIcon}`}></i>
                        <input
                            type="text"
                            placeholder="Buscar libro por nombre o autor…"
                            className={styles.searchInput}
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* ── LIBROS ── */}
                {loading ? (
                    <div className={styles.loadingMessage}>
                        <i className="bi bi-hourglass-split"></i> Cargando libros…
                    </div>
                ) : (
                    <>
                        <div className={styles.booksGrid}>
                            {currentLibros.length > 0 ? (
                                currentLibros.map(libro => (
                                    <div key={libro.id} className={styles.bookCard}>
                                        <div className={styles.cardImageContainer}>
                                            {libro.imagen_url ? (
                                                <Image
                                                    src={libro.imagen_url}
                                                    className={styles.cardImage}
                                                    alt={libro.titulo}
                                                    width={300}
                                                    height={400}
                                                    style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                                                />
                                            ) : (
                                                <div className={styles.placeholderImage}>
                                                    <i className="bi bi-book" style={{ fontSize: '3rem', color: '#aaa' }}></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h5 className={styles.cardTitle}>{libro.titulo}</h5>
                                            <p className={styles.cardText}>
                                                <strong>Autor:</strong> {libro.autor}
                                            </p>
                                            {libro.paginas && (
                                                <p className={styles.cardText}>
                                                    <strong>Páginas:</strong> {libro.paginas}
                                                </p>
                                            )}
                                            {libro.disponible && libro.paginas && (
                                                <p className={styles.cardText}>
                                                    <strong>Préstamo:</strong> {getDiasPrestamo(libro.paginas)} días
                                                </p>
                                            )}

                                            {libro.disponible ? (
                                                isAdmin ? (
                                                    <p className={styles.adminNote}>
                                                        Los administradores no realizan reservas.
                                                    </p>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReservar(libro)}
                                                        className={styles.btnPrimary}
                                                        disabled={reservando === libro.id}
                                                    >
                                                        {reservando === libro.id ? (
                                                            <><i className="bi bi-hourglass-split"></i> Reservando…</>
                                                        ) : (
                                                            <><i className="bi bi-bookmark-plus"></i> Reservar</>
                                                        )}
                                                    </button>
                                                )
                                            ) : (
                                                <span className={styles.badgeDanger}>
                                                    <i className="bi bi-x-circle"></i> No disponible
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noBooks}>
                                    No se encontraron libros{busqueda ? ` para "${busqueda}"` : ''}.
                                </p>
                            )}
                        </div>

                        {/* ── PAGINACIÓN ── */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={styles.paginationBtn}
                                >
                                    <i className="bi bi-chevron-left"></i> Anterior
                                </button>
                                <span className={styles.paginationInfo}>
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={styles.paginationBtn}
                                >
                                    Siguiente <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}
