import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  fetchSettings,
  updateCategory,
  updateSettings,
} from "@/lib/admin/api";
import type { Category, Settings } from "@/lib/admin/types";

export function ManageCategoriesSection({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: (next: Category[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const cat = await createCategory(name);
    onChange([...categories, cat]);
    setNewName("");
    toast.success("تمت إضافة النوع");
  };

  const onSaveEdit = async (id: string) => {
    const name = editingValue.trim();
    if (!name) return;
    const updated = await updateCategory(id, name);
    if (updated) {
      onChange(categories.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      toast.success("تم تحديث النوع");
    }
  };

  const onDelete = async (id: string) => {
    const res = await deleteCategory(id);
    if (!res.ok && res.reason === "has_items") {
      toast.error("لا يمكن حذف هذا النوع لأنه يحتوي على صور. احذفي الصور أو انقليها أولًا.");
      return;
    }
    onChange(categories.filter((c) => c.id !== id));
    toast.success("تم حذف النوع");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] hover:bg-[var(--admin-accent-soft)] transition">
          <span className="font-semibold">إدارة الأنواع</span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="p-5 mt-3 rounded-3xl border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm">
          <div className="flex gap-2">
            <Input
              placeholder="اسم النوع الجديد"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAdd()}
            />
            <Button onClick={onAdd} className="rounded-xl">
              <Plus className="w-4 h-4 ml-1" />
              إضافة
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {categories.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                لا توجد أنواع بعد
              </p>
            )}
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--admin-bg)] border border-[var(--admin-border)]"
              >
                {editingId === c.id ? (
                  <>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-9"
                    />
                    <Button size="icon" variant="ghost" onClick={() => onSaveEdit(c.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{c.labelAr}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingValue(c.labelAr);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SettingsSection() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !data) {
      fetchSettings().then(setData);
    }
  }, [open, data]);

  const onSave = async () => {
    if (!data) return;
    setSaving(true);
    await updateSettings(data);
    setSaving(false);
    toast.success("تم تحديث الإعدادات");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] hover:bg-[var(--admin-accent-soft)] transition">
          <span className="font-semibold">إعدادات الموقع</span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="p-5 mt-3 rounded-3xl border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm space-y-4">
          {!data ? (
            <p className="text-center text-sm text-muted-foreground py-4">جارٍ التحميل...</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>رقم واتساب</Label>
                <Input
                  dir="ltr"
                  className="text-right"
                  value={data.whatsappNumber}
                  onChange={(e) => setData({ ...data, whatsappNumber: e.target.value })}
                  placeholder="+9665XXXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>الرسالة الافتراضية لواتساب</Label>
                <Textarea
                  rows={2}
                  value={data.whatsappMessage}
                  onChange={(e) => setData({ ...data, whatsappMessage: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>عنوان الواجهة</Label>
                <Input
                  value={data.heroTitle}
                  onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>العنوان الفرعي للواجهة</Label>
                <Input
                  value={data.heroSubtitle}
                  onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
                />
              </div>
              <Button onClick={onSave} disabled={saving} className="w-full h-11 rounded-xl">
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
