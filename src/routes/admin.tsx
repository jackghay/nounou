import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة إدارة المعرض" },
      { name: "description", content: "لوحة إدارة المعرض - إضافة وتعديل صور المعرض" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div dir="rtl" lang="ar" className="font-arabic min-h-screen admin-bg-pattern text-[var(--admin-fg)]">
      <Outlet />
    </div>
  );
}
