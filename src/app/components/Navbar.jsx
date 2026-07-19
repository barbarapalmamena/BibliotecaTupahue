'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { getCurrentUser, signOut, getUserRole } from '@/lib/supabase';

export default function Navbar({ user: propUser, onLogout }) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [navUser, setNavUser] = useState(propUser || null);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Cargar usuario si no se pasó por props
    useEffect(() => {
        if (propUser) {
            setNavUser(propUser);
        } else {
            const fetchUser = async () => {
                const currentUser = await getCurrentUser();
                setNavUser(currentUser);
            };
            fetchUser();
        }
    }, [propUser]);

    // Cargar rol del usuario
    useEffect(() => {
        if (navUser) {
            const fetchRole = async () => {
                const role = await getUserRole(navUser.id);
                setUserRole(role);
            };
            fetchRole();
        } else {
            setUserRole(null);
        }
    }, [navUser]);

    const handleInternalLogout = async () => {
        if (onLogout) {
            onLogout();
        } else {
            await signOut();
            setNavUser(null);
            setUserRole(null);
            router.push('/');
        }
    };

    // Cerrar menú al cambiar de página
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                <Link href="/" className={styles.navbarBrand}>
                    <Image
                        src="/img/LogoTupahue.png"
                        className={styles.logoNavbar}
                        alt="Logo Iglesia Tupahue"
                        width={150}
                        height={150}
                        priority
                    />
                </Link>

                <button
                    className={styles.navbarToggler}
                    type="button"
                    id="navbarToggle"
                    onClick={toggleMenu}
                    aria-label="Toggle navigation"
                >
                    <span className={styles.navbarTogglerIcon}></span>
                </button>

                <div
                    className={`${styles.navbarCollapse} ${isMenuOpen ? styles.show : ''}`}
                    id="navbarNav"
                >
                    <ul className={styles.navbarNav}>
                        <li className={styles.navItem}>
                            <Link
                                className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
                                href="/"
                            >
                                Inicio
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link
                                className={`${styles.navLink} ${pathname === '/actividades' ? styles.active : ''}`}
                                href="/actividades"
                            >
                                Actividades
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link
                                className={`${styles.navLink} ${pathname === '/nosotros' ? styles.active : ''}`}
                                href="/nosotros"
                            >
                                Nosotros
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link
                                className={`${styles.navLink} ${pathname === '/ministerios' ? styles.active : ''}`}
                                href="/ministerios"
                            >
                                Ministerios
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link
                                className={`${styles.navLink} ${pathname === '/biblioteca' ? styles.active : ''}`}
                                href="/biblioteca"
                            >
                                Biblioteca
                            </Link>
                        </li>
                        {navUser ? (
                            <>
                                {(userRole === 'admin' || navUser.user_metadata?.role === 'admin') && (
                                    <li className={styles.navItem}>
                                        <Link
                                            className={`${styles.navLink} ${pathname === '/admin' ? styles.active : ''}`}
                                            href="/admin"
                                        >
                                            Panel
                                        </Link>
                                    </li>
                                )}
                                <li className={styles.navItem}>
                                    <button
                                        className={styles.btnLogout}
                                        onClick={handleInternalLogout}
                                    >
                                        Cerrar Sesión
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li className={styles.navItem}>
                                <Link className={styles.navLink} href="/login">
                                    Iniciar Sesión
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
