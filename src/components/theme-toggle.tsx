
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | undefined>(undefined);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    let initialTheme: "light" | "dark";
    if (storedTheme) {
      initialTheme = storedTheme;
    } else if (systemPrefersDark) {
      initialTheme = "dark";
    } else {
      initialTheme = "light"; 
    }
    setTheme(initialTheme);

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (theme === undefined) return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "light";
      return "light"; // Default if undefined, though useEffect should set it
    });
  };

  if (theme === undefined) {
    // Render a placeholder or a disabled button while theme is being determined
    // to avoid flash of incorrect icon
    return (
      <Button variant="outline" size="icon" className="rounded-full" disabled aria-label="Loading theme settings...">
        <Sun className="h-[1.2rem] w-[1.2rem] animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full border-border hover:bg-accent/10 focus-visible:ring-ring"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400" />
      )}
    </Button>
  );
}
