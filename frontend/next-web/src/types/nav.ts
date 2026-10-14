export interface NavItem {
    title: string;
    href: string;
    // Itens do dropdown (ex: "Pastorais"). Quando presente, o item no header
    // vira um trigger de dropdown em vez de um link direto.
    children?: NavItem[];
}