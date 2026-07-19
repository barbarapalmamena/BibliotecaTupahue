'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar({ user, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                {/* Brand / Logo */}
                <div className={styles.navbarBrand}>
                    <Link href="/">
                        <Image
                            src="/img/LogoTupahue.png"
                            alt="Logo Iglesia Tupahue"
                            width={150}
                            height={150}
                            className={styles.logoNavbar}
                            priority
                        />
                    </Link>
                </div>

                {/* Hamburger */}
                <button
                    className={styles.navbarToggler}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    <span className={styles.navbarTogglerIcon}></span>
                </button>

                {/* Links */}
                <div className={`${styles.navbarCollapse} ${menuOpen ? styles.show : ''}`}>
                    <ul className={styles.navbarNav}>
                        <li className={styles.navItem}>
                            <Link
                                href="/"
                                className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Inicio
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link
                                href="/biblioteca"
                                className={`${styles.navLink} ${isActive('/biblioteca') ? styles.active : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Biblioteca
                            </Link>
                        </li>

                        {user ? (
                            <li className={styles.navItem}>
                                <button
                                    className={styles.btnLogin}
                                    onClick={() => { onLogout?.(); setMenuOpen(false); }}
                                >
                                    <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
                                </button>
                            </li>
                        ) : (
                            <li className={styles.navItem}>
                                <Link
                                    href="/login"
                                    className={`${styles.btnLogin} ${isActive('/login') ? styles.active : ''}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <i className="bi bi-person"></i> Iniciar Sesión
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
