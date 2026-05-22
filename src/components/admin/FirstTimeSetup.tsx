import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Plus } from "lucide-react";
import { createCategory } from "@/lib/admin/api";
import type { Category } from "@/lib/admin/types";
import { toast } from "sonner";

export function FirstTimeSetup({
  categories,
  onChange,
  onDone,
}: {
  categories: Category[];
  onChange: (next: Category[]) => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const onAdd = async () => {
    const name = value.trim();
    if (!name) return;
    setLoading(true);
    const cat = await createCategory(name);
    setLoading(false);
    onChange([...categories, cat]);
    setValue("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="admin-fade-up w-full max-w-xl p-7 sm:p-9 rounded-3xl border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow-soft)]">
        <div
          className="admin-float flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4 text-white"
          style={{ background: "var(--admin-gradient)" }}
        >
          <Sparkles className="w-8 h-8 admin-sparkle" />
        </div>
        <h1 className="text-2xl font-bold text-center">لنبدأ بإضافة أنواع المنتجات 🌸</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          أضيفي أنواع الدفاتر والكراريس التي تريدين عرضها في المعرض.
        </p>

        <div className="flex gap-2 mt-6">
          <Input
            placeholder="مثال: دفاتر مدرسية"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            className="h-12 input-girly"
          />
          <Button onClick={onAdd} disabled={loading || !value.trim()} className="btn-girly h-12 px-5 font-bold">
            <Plus className="w-4 h-4 ml-1" />
            إضافة
          </Button>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {categories.map((c) => (
              <span key={c.id} className="chip-girly admin-pop">
                <Sparkles className="w-3.5 h-3.5" />
                {c.labelAr}
              </span>
            ))}
          </div>
        )}

        <Button
          onClick={() => {
            if (categories.length === 0) {
              toast.error("أضيفي نوعًا واحدًا على الأقل");
              return;
            }
            onDone();
          }}
          className="btn-girly w-full h-12 mt-6 text-base font-bold"
        >
          حفظ والانتقال إلى المعرض ✨
        </Button>
      </Card>
    </div>
  );
}
