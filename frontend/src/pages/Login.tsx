import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminLogin, teacherLogin, studentLogin } from "@/api/client";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as "teacher" | "admin" | "student" | null;
  const role: "teacher" | "admin" | "student" = roleParam === "student" ? "student" : roleParam === "teacher" ? "teacher" : "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // optional: pre-fill only for demo/admin; teacher/student use DB credentials
  useEffect(() => {
    if (role === "admin") {
      setEmail("");
      setPassword("");
    } else if (role === "student") {
      setEmail("");
      setPassword("");
    } else {
      setEmail("");
      setPassword("");
    }
  }, [role]);

  const toLoginErrorMessage = (err: unknown, roleName: "admin" | "teacher" | "student") => {
    if (err instanceof TypeError) {
      return "Unable to connect to server. Please ensure backend is running.";
    }
    if (err instanceof Error && err.message && err.message.trim()) {
      return err.message;
    }
    if (roleName === "student") {
      return "Credentials are wrong";
    }
    return "Login failed. Please try again.";
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "student") {
      try {
        const data = await studentLogin({ email: email.trim(), password });
        login("student", data.name, data.student_unique_id || data.id);
        navigate("/student");
      } catch (err) {
        alert(toLoginErrorMessage(err, "student"));
      }
    } else if (role === "admin") {
      try {
        const data = await adminLogin({ email: email.trim(), password });
        login("admin", data.full_name);
        navigate("/admin");
      } catch (err) {
        alert(toLoginErrorMessage(err, "admin"));
      }
    } else if (role === "teacher") {
      try {
        const data = await teacherLogin({ email: email.trim(), password });
        login("teacher", data.full_name, undefined, data.id);
        navigate("/teacher/setup");
      } catch (err) {
        alert(toLoginErrorMessage(err, "teacher"));
      }
    }
  };

  const roleLabels = { teacher: "Teacher", admin: "Admin", student: "Student" };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-light via-background to-amber-light p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="bg-card rounded-2xl shadow-hover border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {roleLabels[role]} Login
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "student"
                ? "Enter your Student ID or email to continue"
                : role === "teacher"
                  ? "Sign in with your registered email and password"
                  : "Sign in with your admin email and password"}
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <Label htmlFor="email">{role === "student" ? "Student ID or Email" : "Email"}</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1"
                placeholder={role === "student" ? "e.g. TG-01-001" : ""}
              />
              {role === "student" && (
                <p className="text-xs text-muted-foreground mt-1">Use your registered Student Unique ID or email.</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In as {roleLabels[role]}
            </Button>
          </form>
          {role === "admin" && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Use your database credentials to sign in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
