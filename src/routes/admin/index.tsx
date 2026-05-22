import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, Pencil, Trash2, Star, ImageOff } from "lucide-react";
import {
  fetchCategories,
  fetchGalleryItems,
  deleteGalleryItem,
  isLoggedIn,
  logout,
} from "@/lib/admin/api";
import type { Category, GalleryItem } from "@/lib/admin/types";
import { FirstTimeSetup } from "@/components/admin/FirstTimeSetup";
import { AddImageSection } from "@/components/admin/AddImageSection";
import {
  ConfirmDeleteDialog,
  EditImageDialog,
} from "@/components/admin/ImageDialogs";
import {
  ManageCategoriesSection,
  SettingsSection,
} from "@/components/admin/CollapsibleSections";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [setupDone, setSetupDone] = useState(false);

  const [editTarget, setEditTarget] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const ok = isLoggedIn();
    setAuthed(ok);
    setAuthChecked(true);
    if (!ok) return;
    (async () => {
      try {
        const [cs, is] = await Promise.all([fetchCategories(), fetchGalleryItems()]);
        setCategories(cs);
        setItems(is);
      } catch {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        await logout();
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authChecked && !authed) return <Navigate to="/admin/login" />;

  const showSetup = !setupDone && categories.length === 0;

  const onLogout = async () => {
    await logout();
    navigate({ to: "/admin/login" });
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteGalleryItem(deleteTarget.id);
    setItems(items.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("تم حذف الصورة");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }

  if (showSetup) {
    return (
      <>
        <Toaster position="top-center" />
        <FirstTimeSetup
          categories={categories}
          onChange={setCategories}
          onDone={() => setSetupDone(true)}
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="admin-fade-up flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="admin-float w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg" style={{ background: "var(--admin-gradient)" }}>
            🌷
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">لوحة إدارة المعرض</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              أضيفي الصور ونظميها بسهولة 💕
            </p>
          </div>
        </div>
        <Button
          onClick={onLogout}
          className="btn-soft h-10 px-4 font-semibold"
        >
          <LogOut className="w-4 h-4 ml-2" />
          خروج
        </Button>
      </header>

      <div className="space-y-6">
        {/* Add Image */}
        <AddImageSection
          categories={categories}
          onCreated={(item) => setItems([item, ...items])}
        />

        {/* Current Gallery */}
        <Card className="admin-fade-up p-5 sm:p-6 rounded-3xl border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">🖼️ المعرض الحالي</h2>
            <span className="chip-girly text-xs">{items.length} صورة</span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="admin-float w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white" style={{ background: "var(--admin-gradient)" }}>
                <ImageOff className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium">لا توجد صور بعد ✨</p>
              <p className="text-xs mt-1">أضيفي أول صورة من الأعلى.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="admin-card-hover admin-pop rounded-2xl overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-card)] flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={it.imageUrl}
                      alt={it.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    {it.isFeatured && (
                      <Badge className="absolute top-2 right-2 border-0 gap-1 text-white shadow-md" style={{ background: "var(--admin-gradient)" }}>
                        <Star className="w-3 h-3 fill-current" />
                        مميزة
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-sm font-semibold truncate">
                      {it.title || "بدون عنوان"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {it.categoryName}
                    </p>
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        className="btn-soft flex-1 h-9 font-semibold"
                        onClick={() => setEditTarget(it)}
                      >
                        <Pencil className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full h-9 px-3 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-0 transition-all"
                        onClick={() => setDeleteTarget(it)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ManageCategoriesSection categories={categories} onChange={setCategories} />
        <SettingsSection />
      </div>

      <EditImageDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        item={editTarget}
        categories={categories}
        onSaved={(updated) =>
          setItems(items.map((i) => (i.id === updated.id ? updated : i)))
        }
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
