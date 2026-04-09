"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [dietaryGoals, setDietaryGoals] = useState("");
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietaryGoals.trim()) {
      setError("Please share your primary dietary goals to continue.");
      return;
    }
    setError("");
    
    // Encode parameters and push to the recipe generation dashboard
    const params = new URLSearchParams({
      goals: dietaryGoals,
      allergies: allergies || "none",
    });
    
    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <main className={styles.container} suppressHydrationWarning>
      <div className={styles.hero} suppressHydrationWarning>
        <h1 className={styles.title} suppressHydrationWarning>
          Curated for Your Body.
        </h1>
        <p className={styles.subtitle} suppressHydrationWarning>
          Tell us about your health ambitions. We’ll craft visually stunning, deeply flavorful recipes aligned entirely with your biological needs.
        </p>

        <form className={styles.formContainer} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="goals">
              What are your targets?
            </label>
            <input
              id="goals"
              type="text"
              className={styles.textInput}
              placeholder="e.g. Under 500 calories, High Protein, Keto..."
              value={dietaryGoals}
              onChange={(e) => setDietaryGoals(e.target.value)}
              autoComplete="off"
              suppressHydrationWarning
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="allergies">
              Any strict aversions or allergies?
            </label>
            <input
              id="allergies"
              type="text"
              className={styles.textInput}
              placeholder="e.g. Dairy-free, No Nightshades, Peanuts..."
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>

          <button type="submit" className={styles.submitBtn} suppressHydrationWarning>
            Curate My Menu <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
