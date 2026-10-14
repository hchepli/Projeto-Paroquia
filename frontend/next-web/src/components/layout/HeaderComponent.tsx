"use client";

import type { ComponentType } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    User,
    ChevronDown,
    X,
    Home,
    CalendarDays,
    PartyPopper,
    Megaphone,
    Church,
    Images,
    HeartHandshake,
    Info,
    Phone,
    Circle,
} from "lucide-react";
import { navigation } from "@/data/navigation";

// Mapeia o título do item de navegação para um ícone lucide correspondente.
// Ajuste as chaves conforme os títulos exatos usados em @/data/navigation.
const NAV_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
    "Início": Home,
    "Calendário": CalendarDays,
    "Eventos": PartyPopper,
    "Comunicados": Megaphone,
    "Sacramentos": Church,
    "Pastorais": HeartHandshake,
    "Galeria": Images,
    "Sobre Nós": Info,
    "Contato": Phone,
};

const getNavIcon = (title: string) => NAV_ICONS[title] ?? Circle;

export default function HeaderComponent() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [hideHeader, setHideHeader] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const lastScrollY = useRef(0);

    // Dropdown desktop (ex: "Pastorais"): controla qual item está aberto.
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLLIElement>(null);

    // Submenu mobile (accordion dentro do menu mobile).
    const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);

    // Fecha o dropdown desktop ao clicar fora dele.
    useEffect(() => {
        if (!openDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            setIsAtTop(currentScrollY < 80);

            if (window.innerWidth >= 1050) {
                setHideHeader(false);
                lastScrollY.current = currentScrollY;
                return;
            }

            if (currentScrollY < 80) {
                setHideHeader(false);
            } else if (currentScrollY > lastScrollY.current) {
                setHideHeader(true);
                setIsOpen(false);
            } else {
                setHideHeader(false);
            }

            lastScrollY.current = currentScrollY;
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleToggleMobileMenu = () => {
        setIsOpen((prev) => {
            const next = !prev;
            if (!next) {
                setOpenMobileSubmenu(null);
            }
            return next;
        });
    };

    const isHome = pathname === "/";
    const transparent = isHome && isAtTop && !isOpen;

    const linkClass = (href: string) => {
        const active = pathname === href;
        const color = transparent
            ? active
                ? "text-white font-semibold"
                : "text-white/70 hover:text-white"
            : active
            ? "text-black font-semibold"
            : "text-black/60 hover:text-black";

        return `group relative pb-1 whitespace-nowrap text-[13px] lg:text-[15px] xl:text-base transition-colors duration-300 ${color}`;
    };

    const underlineClass = (href: string, isActive: boolean) => {
        const bgColor = transparent ? "bg-white" : "bg-black";

        if (isActive) {
            // Ativo: barra sempre visível, ancorada à esquerda
            return `absolute left-0 bottom-0 h-[2px] w-full origin-left ${bgColor}`;
        }

        // Inativo: cresce da esquerda ao passar o mouse,
        // e ao sair, encolhe continuando pra direita (não "volta")
        return `absolute left-0 bottom-0 h-[2px] w-full ${bgColor}
                scale-x-0 origin-left
                transition-transform duration-300 ease-out
                group-hover:origin-left group-hover:scale-x-100
                origin-right`;
    };

    const mobileLinkClass = (href: string) =>
        `text-lg py-2 transition-colors ${
            pathname === href
                ? "text-black font-semibold"
                : "text-black/60"
        }`;

    return (
        <header
            className={`fixed top-0 left-0 z-50 w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-17 py-4 md:py-5 lg:py-7 flex items-center justify-between transition-all duration-300 ease-in-out ${
                hideHeader ? "-translate-y-full" : "translate-y-0"
            } ${
                transparent
                    ? "bg-transparent border-b border-transparent"
                    : "bg-white border-b border-gray-200"
            }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <img
                    src="/img/institucional/logo.png"
                    alt="Logo"
                    className="w-11 sm:w-12 md:w-14 lg:w-16 xl:w-18 h-auto shrink-0"
                />

                <h2
                    className={`text-sm sm:text-base md:text-[15px] lg:text-lg xl:text-xl font-bold flex flex-col leading-[1.15] md:leading-5 tracking-wide md:tracking-wider transition-colors duration-300 whitespace-nowrap ${
                        transparent ? "text-white" : "text-black"
                    }`}
                >
                    <span>Paróquia Divino</span>
                    <span>Espírito Santo</span>
                </h2>
            </div>

            {/* Desktop */}
            <nav className="hidden min-[1050px]:block">
                <ul className="flex items-center gap-3 lg:gap-5 xl:gap-6">
                    {navigation.map((item) => {
                        const hasChildren = !!item.children?.length;
                        const active =
                            pathname === item.href ||
                            (hasChildren && item.children!.some((child) => pathname === child.href));

                        if (hasChildren) {
                            const isDropdownOpen = openDropdown === item.href;
                            return (
                                <li
                                    key={item.href}
                                    ref={isDropdownOpen ? dropdownRef : undefined}
                                    className="relative"
                                    onMouseEnter={() => setOpenDropdown(item.href)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    <button
                                        type="button"
                                        className={`${linkClass(item.href)} flex items-center gap-1`}
                                        onClick={() =>
                                            setOpenDropdown(isDropdownOpen ? null : item.href)
                                        }
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="true"
                                    >
                                        {item.title}
                                        <ChevronDown
                                            size={15}
                                            className={`transition-transform duration-200 ${
                                                isDropdownOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                        <span className={underlineClass(item.href, active)} />
                                    </button>

                                    {/* Wrapper com padding-top (em vez de margin no <ul>) para que o
                                        espaço entre o botão e o dropdown continue "dentro" da área
                                        hoverável, evitando que o mouse dispare mouseleave no meio do
                                        caminho e feche o menu antes de chegar nas opções. */}
                                    <div
                                        className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 ${
                                            isDropdownOpen ? "" : "pointer-events-none"
                                        }`}
                                    >
                                        <ul
                                            className={`min-w-[240px] overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-xl ring-1 ring-black/5 transition-all duration-200 origin-top ${
                                                isDropdownOpen
                                                    ? "opacity-100 scale-100 translate-y-0"
                                                    : "opacity-0 scale-95 -translate-y-1"
                                            }`}
                                        >
                                            {item.children!.map((child, index) => (
                                                <li key={child.href}>
                                                    <Link
                                                        href={child.href}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className={`group/child flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                                            pathname === child.href
                                                                ? "bg-gray-50 text-black font-semibold"
                                                                : "text-black/60 hover:bg-gray-50 hover:text-black"
                                                        }`}
                                                    >
                                                        <span>{child.title}</span>
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full bg-[#701513] transition-opacity ${
                                                                pathname === child.href
                                                                    ? "opacity-100"
                                                                    : "opacity-0 group-hover/child:opacity-60"
                                                            }`}
                                                        />
                                                    </Link>
                                                    {index < item.children!.length - 1 && (
                                                        <div className="mx-4 border-t border-gray-100" />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            );
                        }

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={linkClass(item.href)}
                                >
                                    {item.title}
                                    <span className={underlineClass(item.href, active)} />
                                </Link>
                            </li>
                        );
                    })}

{/* 
                    <li>
                        <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-full bg-[#701513] px-4 py-2 font-semibold text-white transition hover:opacity-90"
                        >
                            <User size={20} />
                            Seu Perfil
                        </Link>
                    </li> */}
                </ul>
            </nav>

            {/* Botão Mobile */}
            <button
                className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-[6px] min-[1050px]:hidden shrink-0"
                onClick={handleToggleMobileMenu}
                aria-label="Abrir menu"
            >
                <span
                    className={`block h-[2px] w-7 rounded-full transition-all duration-300 ${
                        transparent ? "bg-white" : "bg-black"
                    } ${isOpen ? "translate-y-[8px] rotate-45 !bg-black" : ""}`}
                />

                <span
                    className={`block h-[2px] w-7 rounded-full transition-all duration-300 ${
                        transparent ? "bg-white" : "bg-black"
                    } ${isOpen ? "opacity-0" : ""}`}
                />

                <span
                    className={`block h-[2px] w-7 rounded-full transition-all duration-300 ${
                        transparent ? "bg-white" : "bg-black"
                    } ${isOpen ? "-translate-y-[8px] -rotate-45 !bg-black" : ""}`}
                />
            </button>

            {/* Menu Mobile — drawer full screen: topo com identidade + lista de links com ícone */}
            <nav
                className={`fixed inset-0 z-[55] h-[100dvh] w-screen overflow-y-auto bg-white transition-all duration-400 ease-[cubic-bezier(.22,1,.36,1)] min-[1050px]:hidden ${
                    isOpen
                        ? "translate-x-0 opacity-100"
                        : "translate-x-4 opacity-0 pointer-events-none"
                }`}
            >
                {/* Topo com identidade da paróquia — mesmo padding/tamanho do header fixo,
                    pra logo e nome ficarem exatamente alinhados com a posição de quando o menu está fechado. */}
                <div className="relative border-b-2 border-black/10 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-17 py-4 md:py-5 lg:py-7">
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <img
                            src="/img/institucional/logo.png"
                            alt="Logo"
                            className="w-11 sm:w-12 md:w-14 lg:w-16 xl:w-18 h-auto shrink-0"
                        />

                        <h2 className="text-sm sm:text-base md:text-[15px] lg:text-lg xl:text-xl font-bold flex flex-col leading-[1.15] md:leading-5 tracking-wide md:tracking-wider text-black whitespace-nowrap">
                            <span>Paróquia Divino</span>
                            <span>Espírito Santo</span>
                        </h2>
                    </div>

                </div>

                {/* Lista de navegação */}
                <ul className="flex flex-col px-2 py-2">
                    {navigation.map((item) => {
                        const hasChildren = !!item.children?.length;
                        const Icon = getNavIcon(item.title);
                        const active =
                            pathname === item.href ||
                            (hasChildren && item.children!.some((child) => pathname === child.href));

                        if (hasChildren) {
                            const isSubmenuOpen = openMobileSubmenu === item.href;
                            return (
                                <li key={item.href} className="border-b border-gray-100 last:border-b-0">
                                    <button
                                        type="button"
                                        className={`flex w-full items-center justify-between px-4 py-4 transition-colors ${
                                            active ? "text-black" : "text-black/70"
                                        }`}
                                        onClick={() =>
                                            setOpenMobileSubmenu(isSubmenuOpen ? null : item.href)
                                        }
                                        aria-expanded={isSubmenuOpen}
                                    >
                                        <span className="flex items-center gap-4">
                                            <Icon size={20} className="text-[#701513]" />
                                            <span
                                                className={`text-base ${
                                                    active ? "font-semibold" : "font-medium"
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-black/40 transition-transform duration-200 ${
                                                isSubmenuOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-out ${
                                            isSubmenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <ul className="flex flex-col gap-1 pb-3 pl-[52px] pr-4">
                                            {item.children!.map((child) => (
                                                <li key={child.href}>
                                                    <Link
                                                        href={child.href}
                                                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                                            pathname === child.href
                                                                ? "bg-gray-50 font-semibold text-black"
                                                                : "text-black/60 hover:bg-gray-50 hover:text-black"
                                                        }`}
                                                        onClick={() => {
                                                            setOpenMobileSubmenu(null);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        {child.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            );
                        }

                        return (
                            <li key={item.href} className="border-b border-gray-100 last:border-b-0">
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-4 transition-colors ${
                                        active ? "text-black" : "text-black/70"
                                    }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon size={20} className="text-[#701513]" />
                                    <span className={`text-base ${active ? "font-semibold" : "font-medium"}`}>
                                        {item.title}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </header>
    );
}