"use client";
import { Send, Instagram, Youtube, Facebook, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

const Home = () => {
  const [review, setReview] = useState("");
  const [currentReviewIndex, setCurrentReviewIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews");
      const data = await response.json();

      if (response.ok && data.review) {
        setReview(data.review.text);
        setCurrentReviewIndex(data.reviewIndex);
      } else {
        setError(data.error || "Failed to fetch review");
        setReview("");
      }
    } catch (error) {
      setError("Failed to fetch review. Please try again.");
      setReview("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const handleSubmitReview = async () => {
    if (currentReviewIndex === null) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewIndex: currentReviewIndex }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to mark review as used");
      const googleReviewUrl = "https://g.page/r/CSd-qXz3ScmqEBM/review";
      try {
        await navigator.clipboard.writeText(review);
        window.location.href = googleReviewUrl;
      } catch {
        window.location.href = googleReviewUrl;
      }
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.heroBg}>
      <div className={styles.centerCard}>
        <div className={styles.logoRow}>
          <Image
            src="/keshar-logo.png"
            alt="Keshar Beauty Kadi Logo"
            width={70}
            height={84}
            className={styles.logo}
            priority
          />
          <div>
            <h1 className={styles.title}>Keshar Beauty Kadi</h1>
            <p className={styles.subtitle}>AI-powered Review Generator</p>
          </div>
        </div>
        <div className={styles.reviewSection}>
          <textarea
            value={error || review}
            readOnly
            rows="4"
            placeholder="Your AI-generated review will appear here..."
            className={error ? styles.error : styles.reviewBox}
          />
          <button
            onClick={handleSubmitReview}
            disabled={isLoading || !review || error}
            className={styles.submitBtn}
          >
            <Send size={20} />
            {isLoading ? "Loading..." : "Submit Review"}
          </button>
        </div>
        <div className={styles.socialSection}>
          <span>Connect with us</span>
          <div className={styles.socialIcons}>
            <a href="https://www.instagram.com/keshar_beauty_kadi/profilecard/?igsh=MWFueWRsbHNuMmpsOA==" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={22} />
            </a>
            <a href="https://youtube.com/@kesharbeautyparlour?si=pbgF0yLUfKzsI9RH" target="_blank" rel="noreferrer" aria-label="YouTube">
              <Youtube size={22} />
            </a>
            <a href="https://www.facebook.com/share/wFDJtgy8GzUvwDR3/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook size={22} />
            </a>
            <a href="https://maps.app.goo.gl/Ddttf28x5CExKP179?g_st=com.google.maps.preview.copy" target="_blank" rel="noreferrer" aria-label="Google Maps">
              <MapPin size={22} />
            </a>
          </div>
        </div>
        <div className={styles.footerNote}>
          <span>Thank you for visiting Keshar Beauty Kadi</span>
        </div>
      </div>
    </div>
  );
};

export default Home;