import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { isLoggedIn, login } from "@/lib/admin/api";

export const Route = createFileRoute("/dashboard-entry/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isLoggedIn());
  }, []);

  if (authed) return <Navigate to="/dashboard-entry" />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("تم تسجيل الدخول");
      navigate({ to: "/dashboard-entry" });
    } else {
      toast.error("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Toaster position="top-center" />
      <Card className="admin-fade-up w-full max-w-sm p-8 rounded-3xl shadow-[var(--admin-shadow-soft)] border-[var(--admin-border)] bg-[var(--admin-card)]">
        <div className="text-center mb-6">
          <div className="admin-float admin-pop w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "var(--admin-gradient)" }}>
            <span className="admin-sparkle">✨</span>
          </div>
          <h1 className="text-2xl font-bold">لوحة إدارة المعرض</h1>
          <p className="text-sm text-muted-foreground mt-1">سجّلي الدخول للمتابعة 💖</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="text-right input-girly h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="text-right input-girly h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="btn-girly w-full h-12 text-base font-bold" disabled={loading}>
            {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
