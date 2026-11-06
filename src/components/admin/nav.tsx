"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Languages,
  Inbox,
  Tags,
  ArrowRightLeft,
  ScrollText,
  Users,
  ExternalLink,
  FileCode2,
} from "lucide-react";

const items = [
  { href: "/admin", label: "İdarə paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Məhsullar", icon: Package },
  { href: "/admin/translations", label: "Tərcümələr", icon: Languages },
  { href: "/admin/rfqs", label: "Sorğular (RFQ)", icon: Inbox },
  { href: "/admin/categories", label: "Kateqoriyalar", icon: Tags },
  { href: "/admin/redirects", label: "Redirect-lər", icon: ArrowRightLeft },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/users", label: "İstifadəçilər", icon: Users },
  { href: "/admin/api", label: "REST API", icon: FileCode2 },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-white/15 font-semibold text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
      >
        <ExternalLink className="size-4" aria-hidden /> Sayta keç
      </Link>
    </nav>
  );
}
