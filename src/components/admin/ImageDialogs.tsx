import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, GalleryItem } from "@/lib/admin/types";
import { updateGalleryItem, uploadImage } from "@/lib/admin/api";
import { toast } from "sonner";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export function EditImageDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: GalleryItem | null;
  categories: Category[];
  onSaved: (item: GalleryItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setCategoryId(item.categoryId);
      setIsFeatured(item.isFeatured);
      setImageUrl(item.imageUrl);
    }
  }, [item]);

  const onReplace = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error("حجم الصورة يجب ألا يتجاوز 10MB");
      return;
    }
    const url = await uploadImage(file);
    setImageUrl(url);
  };

  const onSave = async () => {
    if (!item) return;
    setSaving(true);
    const updated = await updateGalleryItem(item.id, {
      title,
      categoryId,
      isFeatured,
      imageUrl,
    });
    setSaving(false);
    if (updated) {
      toast.success("تم تحديث الصورة");
      onSaved(updated);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="font-arabic max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل الصورة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full max-h-56 object-cover rounded-2xl"
            />
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onReplace(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => inputRef.current?.click()}
          >
            استبدال الصورة
          </Button>
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>النوع</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--admin-bg)] border border-[var(--admin-border)]">
            <span className="text-sm">عرض في الصور المميزة</span>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            إلغاء
          </Button>
          <Button onClick={onSave} disabled={saving} className="rounded-xl">
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" className="font-arabic rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">
            هل أنتِ متأكدة من حذف هذه الصورة؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            لا يمكن التراجع بعد الحذف.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
