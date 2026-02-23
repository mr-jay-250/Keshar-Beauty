import db from "./firebase";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generate_prompt } from "../../constants/prompt_v1";

const MAX_STORAGE_CAPACITY = 1000;
const CONTEXT_SIZE = 100;
const BATCH_SIZE = 100;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateAIReviews = async (prompt) => {
  const startTime = new Date();
  let status = "SUCCESS";
  let inputTokens = 0;
  let outputTokens = 0;
  let totalPrice = 0;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      temperature: 0.9,
      max_tokens: 50,
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let reviews = response
      .split('\n')
      .filter(Boolean)
      .map(review => {
        review = review.replace(/^\d+\.\s*/, '');
        review = review.replace(/^Here are \d+ unique customer reviews.*?:/i, '');
        review = review.replace(/^Guidelines for Review Generation:.*$/im, '');
        return review.trim();
      })
      .filter(review => review && !review.startsWith("===") && !review.startsWith("IMPORTANT"));

    if (!reviews.length) {
      throw new Error("Invalid AI-generated reviews.");
    }

    const endTime = new Date();

    return reviews;
  } catch (error) {
    status = "ERROR";
    const endTime = new Date();
    console.error("Error generating AI reviews:", error);
    throw error;
  }
};

const loadReviews = async () => {
  try {
    const snapshot = await db.ref("reviews").once("value");
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error("Error loading reviews from Firebase:", error);
    throw error;
  }
};

const saveReviews = async (reviews) => {
  try {
    // Create array of review objects without explicit IDs
    const reviewsArray = reviews.map(review => ({
      text: review.text || review,
      is_used: review.is_used || false,
      createdAt: review.createdAt || new Date().toISOString()
    }));

    await db.ref("reviews").set(reviewsArray);
    console.log("Reviews successfully saved to Firebase.");
  } catch (error) {
    console.error("Error saving reviews to Firebase:", error);
    throw error;
  }
};

const generateNewReviewsBatch = async (contextReviews) => {
  const contextString = contextReviews.length
    ? `
      === PREVIOUSLY GENERATED REVIEWS ===
      ${contextReviews.join("\n")}

      IMPORTANT INSTRUCTIONS:
      1. Analyze the above reviews carefully
      2. Ensure new reviews are completely unique in phrasing and content
      3. Avoid similar word patterns or expressions used in above reviews
      4. Do not repeat specific service combinations mentioned above
      5. Use different descriptive words and sentence structures

      === GENERATE NEW REVIEWS BELOW ===
    `
    : "";

  const prompt_text = generate_prompt(
    "Keshar Beauty",
    "Beauty Parlor",
    "Braids, Permanent makeup, Bridal services, Hair threading, Wedding and event preparation, Bridal services, Eyebrow beautification, Body waxing, Acne treatments, Eyebrow shaping, Make-up, Make-up services, Hairstyling, Massage, Skin care, Mobile salon service, Facials",
    "Kadi, Gujarat"
  );

  const prompt = `${contextString}\n${prompt_text}`;
  return await generateAIReviews(prompt);
};

// GET Handler - Get an unused review
export async function GET(request) {
  try {
    const reviews = await loadReviews();
    const unusedReviewIndex = reviews.findIndex(review => !review.is_used);

    if (unusedReviewIndex === -1) {
      // Generate new batch if no unused reviews are available
      const usedReviews = reviews.filter(review => review.is_used).slice(-CONTEXT_SIZE);
      const contextReviews = usedReviews.map(review => review.text);
      const newReviews = await generateNewReviewsBatch(contextReviews);

      const formattedReviews = newReviews.map(text => ({
        text,
        is_used: false,
        createdAt: new Date().toISOString()
      }));

      const updatedReviews = [...reviews, ...formattedReviews].slice(-MAX_STORAGE_CAPACITY);
      await saveReviews(updatedReviews);

      // Return the first new review with index 0
      return NextResponse.json({
        review: formattedReviews[0],
        reviewIndex: 0
      });
    }

    return NextResponse.json({
      review: reviews[unusedReviewIndex],
      reviewIndex: unusedReviewIndex
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// POST Handler - Generate new batch of reviews
export async function POST(request) {
  try {
    const reviews = await loadReviews();
    const unusedReviewsCount = reviews.filter(review => !review.is_used).length;

    // Only generate new reviews if we're running low
    if (unusedReviewsCount < BATCH_SIZE * 0.2) {
      const usedReviews = reviews.filter(review => review.is_used).slice(-CONTEXT_SIZE);
      const contextReviews = usedReviews.map(review => review.text);

      const newReviews = await generateNewReviewsBatch(contextReviews);
      const formattedReviews = newReviews.map(text => ({
        text,
        is_used: false,
        createdAt: new Date().toISOString()
      }));

      const updatedReviews = [...reviews, ...formattedReviews].slice(-MAX_STORAGE_CAPACITY);
      await saveReviews(updatedReviews);

      return NextResponse.json({
        message: "New reviews generated successfully.",
        unusedReviewsCount: formattedReviews.length
      });
    }

    return NextResponse.json({
      message: "Sufficient unused reviews available.",
      unusedReviewsCount
    });
  } catch (error) {
    console.error("Error generating reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH Handler - Mark review as used
export async function PATCH(request) {
  try {
    const body = await request.json();
    const reviewIndex = body.reviewIndex;

    if (typeof reviewIndex !== "number") {
      throw new Error("Review index is required and must be a number.");
    }

    const reviews = await loadReviews();
    if (reviewIndex < 0 || reviewIndex >= reviews.length) {
      throw new Error("Invalid review index.");
    }

    reviews[reviewIndex].is_used = true;
    reviews[reviewIndex].usedAt = new Date().toISOString();

    await saveReviews(reviews);

    return NextResponse.json({
      message: "Review marked as used.",
      reviewIndex
    });
  } catch (error) {
    console.error("Error updating review status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
