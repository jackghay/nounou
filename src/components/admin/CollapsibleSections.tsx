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

const applyPreview = (settings: Partial<Settings>) => {
  if (typeof document === "undefined") return;
  
  // 1. Theme
  if (settings.theme) {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }
  
  // 2. Font Family
  if (settings.fontFamily) {
    document.documentElement.style.setProperty(
      "--font-family-override",
      `'${settings.fontFamily}', 'Cairo', system-ui, sans-serif`
    );
  }
  
  // 3. Card Style (Border radius)
  if (settings.cardStyle) {
    let radius = "1.25rem"; // default medium
    if (settings.cardStyle === "sharp") radius = "0px";
    else if (settings.cardStyle === "round") radius = "2.5rem";
    document.documentElement.style.setProperty("--radius", radius);
  }

  // 4. Custom Colors
  if (settings.primaryColor) {
    document.documentElement.style.setProperty("--primary", settings.primaryColor);
    document.documentElement.style.setProperty("--admin-accent", settings.primaryColor);
  } else {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--admin-accent");
  }

  if (settings.secondaryColor) {
    document.documentElement.style.setProperty("--secondary", settings.secondaryColor);
  } else {
    document.documentElement.style.removeProperty("--secondary");
  }

  if (settings.backgroundColor) {
    document.documentElement.style.setProperty("--background", settings.backgroundColor);
    document.documentElement.style.setProperty("--admin-bg", settings.backgroundColor);
  } else {
    document.documentElement.style.removeProperty("--background");
    document.documentElement.style.removeProperty("--admin-bg");
  }
};

export function SettingsSection() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !data) {
      fetchSettings().then((settings) => {
        setData(settings);
        applyPreview(settings);
      });
    }
  }, [open, data]);

  const onSave = async () => {
    if (!data) return;
    setSaving(true);
    await updateSettings(data);
    setSaving(false);
    toast.success("تم تحديث الإعدادات والقوالب بنجاح 💖");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] hover:bg-[var(--admin-accent-soft)] transition">
          <span className="font-semibold">إعدادات ومظهر الموقع</span>
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

              {/* Theme Picker */}
              <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
                <Label className="font-bold flex items-center gap-1 text-sm">🎨 قوالب المعرض الجاهزة</Label>
                <p className="text-[11px] text-muted-foreground -mt-1 mb-2">اختاري قالب البداية المناسب لنوع مشروعك لتغيير ألوان وتصميم موقعك فورياً:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "royal_gold", label: "الذهبي الملكي ✨", desc: "بنفسجي ملكي وذهبي (للأعمال الراقية والبلانرز)", preview: "linear-gradient(135deg, #4c1d95, #d97706)" },
                    { id: "cute_pastel", label: "باستيل الفراولة 🌸", desc: "وردي ناعم وسماوي (للملصقات والإكسسوارات)", preview: "linear-gradient(135deg, #f472b6, #38bdf8)" },
                    { id: "terracotta_craft", label: "خزف وفخار 🏺", desc: "طين دافئ وبرتقالي محروق (للصلصال والشنط)", preview: "linear-gradient(135deg, #c2410c, #f59e0b)" },
                    { id: "lavender_dream", label: "حلم الخزامى 💜", desc: "لافندر حالم وأخضر نعناعي (للكروشيه والشموع)", preview: "linear-gradient(135deg, #a78bfa, #34d399)" },
                    { id: "vintage_journal", label: "أوراق وكتب 📚", desc: "كريمي عتيق وأخضر دافئ (للكراسات المخصصة)", preview: "linear-gradient(135deg, #15803d, #fef08a)" },
                    { id: "blossom_pink", label: "رقة الورد 🌹", desc: "وردي خوخي رومانسي وكريمي (للورد والريزن)", preview: "linear-gradient(135deg, #fda4af, #fde047)" },
                    { id: "candy_pop", label: "حلوى الكرز 🍒", desc: "وردي فاقع وأحمر حيوي (للخرز وإكسسوارات البوب)", preview: "linear-gradient(135deg, #ec4899, #ef4444)" },
                    { id: "minimal_chic", label: "البساطة الراقية 🕊️", desc: "أبيض حليبي ورمادي هادئ (للمطبوعات والمينيمال)", preview: "linear-gradient(135deg, #374151, #f3f4f6)" },
                  ].map((t) => {
                    const active = (data.theme || "royal_gold") === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const updated = { ...data, theme: t.id };
                          setData(updated);
                          applyPreview(updated);
                        }}
                        className={`flex flex-col text-right p-3 rounded-2xl border transition-all text-sm ${
                          active 
                            ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] scale-102 font-bold ring-2 ring-[var(--admin-accent)]/15" 
                            : "border-[var(--admin-border)] hover:bg-[var(--admin-bg)]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold">{t.label}</span>
                          <span className="w-3.5 h-3.5 rounded-full border border-white/25 shadow-sm shrink-0" style={{ background: t.preview }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal leading-tight">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Visual Customization */}
              <div className="space-y-4 pt-4 border-t border-[var(--admin-border)]">
                <Label className="font-bold flex items-center gap-1 text-sm">🎛️ التعديل البصري الفائق (تخصيص كامل)</Label>
                <p className="text-[11px] text-muted-foreground -mt-3">قومي بتغيير الخطوط والزوايا والألوان والتأثيرات لتناسب ذوقك الشخصي بدقة.</p>

                {/* 1. Arabic Fonts */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">✍️ نوع الخط العربي للموقع</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "Tajawal", label: "تجول الأنيق", style: { fontFamily: "Tajawal" } },
                      { id: "Cairo", label: "كايرو العصري", style: { fontFamily: "Cairo" } },
                      { id: "El Messiri", label: "المسيري الفني", style: { fontFamily: "El Messiri" } },
                      { id: "Lemonada", label: "ليمونادة الكيوت 🍋", style: { fontFamily: "Lemonada" } },
                      { id: "Amiri", label: "الأميري الكلاسيكي", style: { fontFamily: "Amiri" } },
                    ].map((f) => {
                      const active = (data.fontFamily || "Tajawal") === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...data, fontFamily: f.id };
                            setData(updated);
                            applyPreview(updated);
                          }}
                          style={f.style}
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                            active
                              ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] font-bold ring-1 ring-[var(--admin-accent)]/20"
                              : "border-[var(--admin-border)] hover:bg-[var(--admin-bg)]"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Card Border Radius */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">📐 شكل بطاقات وزوايا المعرض</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "sharp", label: "كلاسيكي حاد ⏹️" },
                      { id: "medium", label: "أنيق وناعم 🔲" },
                      { id: "round", label: "كيوت ولطيف ⚪" },
                    ].map((s) => {
                      const active = (data.cardStyle || "medium") === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...data, cardStyle: s.id };
                            setData(updated);
                            applyPreview(updated);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                            active
                              ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] font-bold ring-1 ring-[var(--admin-accent)]/20"
                              : "border-[var(--admin-border)] hover:bg-[var(--admin-bg)]"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Floating particles background */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">✨ مؤثرات متطايرة في الخلفية</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "none", label: "بدون تأثير ❌" },
                      { id: "sparkles", label: "بريق ونجوم ✨" },
                      { id: "hearts", label: "قلوب حب 💖" },
                      { id: "leaves", label: "أوراق تساقط 🍃" },
                      { id: "stars", label: "نجوم حالمة 🌟" },
                    ].map((e) => {
                      const active = (data.bgSparkles || "none") === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...data, bgSparkles: e.id };
                            setData(updated);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                            active
                              ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] font-bold ring-1 ring-[var(--admin-accent)]/20"
                              : "border-[var(--admin-border)] hover:bg-[var(--admin-bg)]"
                          }`}
                        >
                          {e.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Color pickers overrides */}
                <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">🎨 تخصيص الألوان يدوياً بالكامل</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...data, primaryColor: "", secondaryColor: "", backgroundColor: "" };
                        setData(updated);
                        applyPreview(updated);
                      }}
                      className="text-[10px] text-muted-foreground hover:text-destructive transition flex items-center gap-0.5"
                    >
                      إعادة ضبط ألوان القالب 🔄
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-1.5">يمكنك تغيير ألوان الأزرار والخلفية لتتوافق مع هويتك البصرية الخاصة.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                      <span className="text-[11px] font-semibold">اللون الرئيسي</span>
                      <input
                        type="color"
                        value={data.primaryColor || "#421270"}
                        onChange={(e) => {
                          const updated = { ...data, primaryColor: e.target.value };
                          setData(updated);
                          applyPreview(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--admin-border)] p-0"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                      <span className="text-[11px] font-semibold">اللون الثانوي</span>
                      <input
                        type="color"
                        value={data.secondaryColor || "#faf5ff"}
                        onChange={(e) => {
                          const updated = { ...data, secondaryColor: e.target.value };
                          setData(updated);
                          applyPreview(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--admin-border)] p-0"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                      <span className="text-[11px] font-semibold">لون الخلفية</span>
                      <input
                        type="color"
                        value={data.backgroundColor || "#ffffff"}
                        onChange={(e) => {
                          const updated = { ...data, backgroundColor: e.target.value };
                          setData(updated);
                          applyPreview(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--admin-border)] p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={onSave} disabled={saving} className="w-full h-12 rounded-2xl btn-girly text-base font-bold mt-4 shadow-sm hover:scale-[1.01] transition-transform">
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات والقالب 💖"}
              </Button>
            </>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
