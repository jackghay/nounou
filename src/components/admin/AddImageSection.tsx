import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, ImagePlus, X } from "lucide-react";
import {
  uploadImage,
  createGalleryItem,
  fetchCategories,
} from "@/lib/admin/api";
import type { Category, GalleryItem } from "@/lib/admin/types";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export function AddImageSection({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: (item: GalleryItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length && !categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }
    if (f.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error("حجم الصورة يجب ألا يتجاوز 10MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setIsFeatured(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSave = async () => {
    if (!file) return toast.error("اختاري صورة أولًا");
    if (!categoryId) return toast.error("اختاري نوع المنتج");
    setSaving(true);
    try {
      const url = await uploadImage(file);
      // refetch categories denormalized name via API
      const cats = await fetchCategories();
      const cat = cats.find((c) => c.id === categoryId);
      const item = await createGalleryItem({
        title: title.trim(),
        categoryId,
        imageUrl: url,
        isFeatured,
      });
      onCreated({ ...item, categoryName: cat?.labelAr ?? item.categoryName });
      toast.success("تم حفظ الصورة بنجاح");
      reset();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="admin-fade-up p-5 sm:p-6 rounded-3xl border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow-soft)]">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--admin-gradient)" }}>
          <ImagePlus className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold">إضافة صورة جديدة</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        اختاري صورة، ثم اختاري نوع المنتج، وأخيرًا اضغطي حفظ.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
          dragOver
            ? "border-[var(--admin-accent)] scale-[1.01]"
            : "border-[var(--admin-border)] hover:border-[var(--admin-accent)]"
        }`}
        style={{ background: dragOver ? "var(--admin-gradient-soft)" : "var(--admin-bg)" }}
      >
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="معاينة"
              className="max-h-64 rounded-xl object-cover mx-auto"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow border border-[var(--admin-border)]"
              aria-label="إزالة الصورة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <div className="admin-float w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: "var(--admin-gradient)" }}>
              <ImagePlus className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">اسحبي الصورة هنا أو اضغطي للاختيار 📸</p>
            <p className="text-xs">PNG, JPG حتى 10MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">عنوان الصورة (اختياري)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: دفتر ملاحظات وردي"
            className="input-girly h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label>نوع المنتج</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="input-girly h-11">
              <SelectValue placeholder="اختاري النوع" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.labelAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 p-4 rounded-2xl border border-[var(--admin-border)]" style={{ background: "var(--admin-gradient-soft)" }}>
        <div>
          <p className="text-sm font-bold flex items-center gap-1.5">⭐ عرض في الصور المميزة</p>
          <p className="text-xs text-muted-foreground mt-0.5">ستظهر في القسم المميز بأعلى الصفحة</p>
        </div>
        <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="btn-girly w-full mt-5 h-12 text-base font-bold"
      >
        <Upload className="w-4 h-4 ml-2" />
        {saving ? "جارٍ الحفظ..." : "حفظ الصورة 💖"}
      </Button>
    </Card>
  );
}
