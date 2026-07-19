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
            const diasPrestamo = libro.paginas <= 100 ? 7 : 14;
            alert(`¡Libro reservado exitosamente! Tienes ${diasPrestamo} días para devolverlo.`);
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
                            {misReservas.map(res => (
                                <div
                                    key={res.id}
                                    className={`${styles.reservaCard} ${res.estado === 'activa' ? styles.reservaActiva : styles.reservaDevuelta}`}
                                >
                                    <h4 className={styles.reservaLibroTitulo}>{res.libros?.titulo}</h4>
                                    <p className={styles.reservaDetalle}>
                                        <strong>Estado:</strong> {res.estado === 'activa' ? 'Activa' : 'Devuelto'}
                                    </p>
                                    <p className={styles.reservaDetalle}>
                                        <strong>Vence:</strong>{' '}
                                        {res.vencimiento
                                            ? new Date(res.vencimiento).toLocaleDateString('es-CL')
                                            : 'No definido'}
                                    </p>
                                    {res.estado === 'activa' && (
                                        <button
                                            onClick={() => handleDevolver(res.id, res.libro_id)}
                                            disabled={devolviendo === res.id}
                                            className={styles.btnDevolver}
                                        >
                                            {devolviendo === res.id ? 'Devolviendo…' : 'Marcar como Devuelto'}
                                        </button>
                                    )}
                                </div>
                            ))}
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
                                                    <strong>Préstamo:</strong> {libro.paginas <= 100 ? '7 días' : '14 días'}
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
