import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerSection}>
                    <h5 className={styles.footerTitle}>Ubicación</h5>
                    <a
                        href="https://www.google.com/maps/dir//Deber+Cumplido+253,+Puerto+Montt,+Los+Lagos/"
                        className={styles.footerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Deber Cumplido 253, Puerto Montt, Los Lagos
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <h5 className={styles.footerTitle}>Redes sociales</h5>
                    <div className={styles.socialLinks}>
                        <a
                            href="https://www.instagram.com/iglesiatupahue"
                            className={styles.footerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="bi bi-instagram"></i> Instagram
                        </a>
                        <a
                            href="https://www.youtube.com/@iglesiareformadapuertomontt"
                            className={styles.footerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="bi bi-youtube"></i> YouTube
                        </a>
                        <a
                            href="https://www.facebook.com/iglesiatupahue"
                            className={styles.footerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="bi bi-facebook"></i> Facebook
                        </a>
                    </div>
                </div>
                <div className={styles.footerSection}>
                    <h5 className={styles.footerTitle}>Contáctanos</h5>
                    <a href="tel:+56956088059" className={styles.footerLink}>
                        <i className="bi bi-telephone"></i> +56 9 5608 8059
                    </a>
                </div>
            </div>
            <hr className={styles.footerDivider} />
            <div className={styles.footerCopyright}>
                <p>©️ Copyright 2025 | Todos los derechos Reservados. Iglesia Reformada Tupahue.</p>
            </div>
        </footer>
    );
}
