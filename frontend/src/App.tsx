import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, BarChart2, Table2, FileText, BookMarked, Users } from "lucide-react";

import InicioPage from "@/pages/Inicio";
import MapaPage from "@/pages/Mapa";
import GraficasPage from "@/pages/Graficas";
import TablaPage from "@/pages/Tabla";
import FichaPage from "@/pages/Ficha";
import LibroPage from "@/pages/Libro";
import AcercaPage from "@/pages/Acerca";

const NAV_ITEMS = [
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/graficas", label: "Gráficas", icon: BarChart2 },
  { to: "/tabla", label: "Tabla", icon: Table2 },
  { to: "/ficha", label: "Ficha", icon: FileText },
  { to: "/libro", label: "Libro", icon: BookMarked },
  { to: "/acerca", label: "Acerca", icon: Users },
];

function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-8">
          <Link
            to="/"
            className="font-display font-semibold text-selva text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            Guatemala <span className="text-maiz">·</span> Datos Básicos 2026
          </Link>

          <nav className="flex items-center gap-1 ml-4">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-selva text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <Routes>
            <Route path="/" element={<InicioPage />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/graficas" element={<GraficasPage />} />
            <Route path="/tabla" element={<TablaPage />} />
            <Route path="/ficha" element={<FichaPage />} />
            <Route path="/ficha/:slug" element={<FichaPage />} />
            <Route path="/libro" element={<LibroPage />} />
            <Route path="/acerca" element={<AcercaPage />} />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
