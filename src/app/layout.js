import { Inter } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Biblioteca | Iglesia Tupahue",
  description: "Sitio web y biblioteca de la Iglesia Reformada Tupahue",
  icons: {
    icon: "/img/LogoTupahue.png",
    shortcut: "/img/LogoTupahue.png",
    apple: "/img/LogoTupahue.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
