"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Flame, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

type Recipe = {
  title: string;
  description: string;
  time: string;
  calories: string;
  ingredients: string[];
  instructions: string[];
};

function RecipesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goals = searchParams.get("goals") || "General Heath";
  const allergies = searchParams.get("allergies") || "None";
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 5; // Steadier, less frequent small updates
          return prev;
        });
      }, 1200); // Increased interval for stability
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals, allergies }),
        });
        const data = await res.json();
        
        if (data.invalid) {
          setIsInvalid(true);
        } else if (data.recipes) {
          setRecipes(data.recipes);
          setProgress(100);
        }
      } catch (err) {
        console.error("Could not fetch recipes", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    fetchRecipes();
  }, [goals, allergies]);

  return (
    <div className={styles.container} suppressHydrationWarning>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className={styles.loaderContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            suppressHydrationWarning
          >
            <div className={styles.loadingTypographic} suppressHydrationWarning>
              <span suppressHydrationWarning>Curating Your Recipe</span>
              <div className={styles.progressBarWrapper} suppressHydrationWarning>
                <motion.div 
                   className={styles.progressBar} 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={{ ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : isInvalid ? (
          <motion.div
            key="invalid"
            className={styles.invalidContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            suppressHydrationWarning
          >
            <div className={styles.invalidContent}>
              <span className={styles.discrim}>Out of Bounds</span>
              <h1 className={styles.invalidTitle}>We focus on biological integrity. Not foolish prompts.</h1>
              <button 
                className={styles.backBtn}
                onClick={() => router.push("/")}
              >
                Return to Beginning <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className={styles.dashboard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            suppressHydrationWarning
          >
            <header className={styles.header} suppressHydrationWarning>
              <p className={styles.metaLabel} suppressHydrationWarning>Curated Based On:</p>
              <h1 className={styles.heading} suppressHydrationWarning>{goals}</h1>
              {allergies !== "none" && (
                <p className={styles.exclusion} suppressHydrationWarning>Restrictions: {allergies}</p>
              )}
            </header>

            <div className={styles.grid}>
              {recipes.map((recipe, i) => (
                <motion.div
                  key={`${recipe.title}-${i}`}
                  className={styles.recipeCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className={styles.typographicPlacard}>
                    <span className={styles.discrim}>0{i + 1}</span>
                    <h2 className={styles.cardTitle}>{recipe.title}</h2>
                    <div className={styles.cardMeta}>
                      <span>{recipe.time}</span>
                      <span>{recipe.calories} kcal</span>
                    </div>
                  </div>
                  <p className={styles.cardDesc}>{recipe.description}</p>
                  <div className={styles.divider} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button 
                className={styles.closeBtn} 
                onClick={() => setSelectedRecipe(null)}
              >
                <ArrowLeft size={24} /> <span>Back to curations</span>
              </button>

              <div className={styles.modalLayout}>
                <div className={styles.typographicHero}>
                  <div className={styles.heroInner}>
                    <p className={styles.heroLabel}>Recipe Choice 0{recipes.indexOf(selectedRecipe) + 1}</p>
                    <h2 className={styles.heroTitle}>{selectedRecipe.title}</h2>
                    <p className={styles.heroDesc}>{selectedRecipe.description}</p>
                    <div className={styles.heroMeta}>
                      <span><Clock size={18} /> {selectedRecipe.time}</span>
                      <span><Flame size={18} /> {selectedRecipe.calories} kcal</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <div className={styles.ingredients}>
                    <h3 className={styles.sectionTitle}>Ingredients</h3>
                    <ul>
                      {selectedRecipe.ingredients?.map((ing, i) => (
                        <li key={`ing-${i}`}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.instructions}>
                    <h3 className={styles.sectionTitle}>Method</h3>
                    <ol>
                      {selectedRecipe.instructions?.map((inst, i) => (
                        <li key={`inst-${i}`}><span>{i + 1}</span> <p>{inst}</p></li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RecipesDashboard() {
  return (
    <Suspense fallback={null}>
      <RecipesContent />
    </Suspense>
  );
}
