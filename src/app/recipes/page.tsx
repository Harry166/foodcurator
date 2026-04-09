"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Flame, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

type Recipe = {
  time: string;
  calories: string;
  visual_keyword: string;
  imageUrl?: string;
  photographer?: string;
  photographerUrl?: string;
  ingredients: string[];
  instructions: string[];
};

function RecipesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goals = searchParams.get("goals") || "General Heath";
  const allergies = searchParams.get("allergies") || "None";
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg(null);
      setLoading(true);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals, allergies }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Biological curation timed out.");
        }

        if (data.invalid) {
          setIsInvalid(true);
        } else if (data.recipe) {
          // Post-process with Unsplash if key is available
          const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
          let enhancedRecipe = data.recipe;

          if (accessKey && enhancedRecipe.visual_keyword) {
            try {
              // Enhanced search query focusing on high-end culinary photography
              const searchQuery = encodeURIComponent(`${enhancedRecipe.visual_keyword} food photography editorial`);
              const unsplashRes = await fetch(
                `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&orientation=landscape&client_id=${accessKey}`
              );
              const unsplashData = await unsplashRes.json();
              if (unsplashData.results?.length > 0) {
                const photo = unsplashData.results[0];
                enhancedRecipe = {
                  ...enhancedRecipe,
                  imageUrl: photo.urls.regular,
                  photographer: photo.user.name,
                  photographerUrl: photo.user.links.html,
                };
              }
            } catch (e) {
              console.error("Unsplash fetch failed", e);
            }
          }
          setRecipe(enhancedRecipe);
          setProgress(100);
        }
      } catch (err: any) {
        console.error("Could not fetch recipes", err);
        setErrorMsg(err.message);
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
        ) : errorMsg ? (
          <motion.div
            key="error"
            className={styles.invalidContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            suppressHydrationWarning
          >
            <div className={styles.invalidContent}>
              <span className={styles.discrim}>Network Disturbance</span>
              <h1 className={styles.invalidTitle}>The curation process was interrupted.</h1>
              <p className={styles.invalidText}>{errorMsg || "Check your API connection and environment variables."}</p>
              <button 
                className={styles.backBtn}
                onClick={() => router.push("/")}
              >
                Retry Curation <ArrowRight size={18} />
              </button>
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
        ) : recipe ? (
          <motion.div
            key="masterclass"
            className={styles.masterclassContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            suppressHydrationWarning
          >
            <div className={styles.masterHero}>
              {recipe.imageUrl && (
                <div className={styles.masterImageWrapper}>
                  <img src={recipe.imageUrl} alt={recipe.title} className={styles.masterHeroImage} />
                  <a href={recipe.photographerUrl} target="_blank" rel="noopener noreferrer" className={styles.masterAttribution}>
                    Captured by {recipe.photographer}
                  </a>
                </div>
              )}
            </div>

            <div className={styles.masterContentBody}>
              <header className={styles.masterHeader}>
                <p className={styles.masterLabel}>Masterclass curation for: {goals}</p>
                <h1 className={styles.masterTitle}>{recipe.title}</h1>
                <div className={styles.masterMeta}>
                  <span><Clock size={20} /> {recipe.time}</span>
                  <span><Flame size={20} /> {recipe.calories} kcal</span>
                </div>
              </header>

              <section className={styles.masterIntroduction}>
                <div className={styles.introLeft}>
                  <p className={styles.introLead}>The Curative Intent</p>
                </div>
                <div className={styles.introRight}>
                  <p className={styles.masterDescription}>{recipe.description}</p>
                </div>
              </section>

              <div className={styles.recipeDetailsGrid}>
                <section className={styles.ingredientsSection}>
                  <h3 className={styles.sectionHeading}>Biological Ingredients</h3>
                  <ul>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </section>

                <section className={styles.methodSection}>
                  <h3 className={styles.sectionHeading}>The Method</h3>
                  <ol>
                    {recipe.instructions.map((step, i) => (
                      <li key={i}>
                        <span className={styles.stepNum}>{i + 1 < 10 ? `0${i + 1}` : i + 1}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              <footer className={styles.masterFooter}>
                <button className={styles.backBtn} onClick={() => router.push("/")}>
                  <ArrowLeft size={18} /> Re-curate Biological Direction
                </button>
              </footer>
            </div>
          </motion.div>
        ) : null}
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
