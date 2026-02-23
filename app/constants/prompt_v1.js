export const generate_prompt = (
  BUSINESS_NAME,
  BUSINESS_TYPE,
  SERVICES,
  LOCATION
) => {
  const prompt_v1 = `
      Generate 100 unique customer reviews for ${BUSINESS_NAME}, a ${BUSINESS_TYPE} located in ${LOCATION}. They specialize in ${SERVICES}.

      Guidelines for Review Generation:
      1. Each review must:
        - Be between 30-45 words
        - Sound natural and conversational
        - Focus on different aspects of the business
        - Have unique perspective and experiences
        - Express satisfaction and appreciation
      2. Include mentions of:
        - Specific services from ${SERVICES}
        - Friendly staff interactions
        - Great value for money
        - Pleasant atmosphere/environment
        - High quality of service/product
        - Positive recommendations
        - Wait times/efficiency
      3. Variation Requirements:
        - Mix of short and medium-length reviews
        - Different writing styles
        - Various customer types (first-time, regular, occasional)
        - Different visit times (morning, afternoon, evening)
        - Seasonal experiences when relevant
        - Mix of recent and returning customer experiences
      4. Language Style:
        - Use contractions
        - Include common conversational phrases
        - Vary sentence structures
        - Add occasional minor typos (max 5% of reviews)
        - Mix formal and informal language

      Important Notes:
      - Avoid repetitive phrases or patterns
      - Don't use exact same words to start multiple reviews
      - Include specific details but keep within word limit
      - Maintain authenticity in tone and content
      - Never mention exact dates to maintain evergreen content
      - Keep all reviews genuinely positive

      Response Requirements:
      - Generate exactly 100 reviews
      - Each review unique with no duplicates
      - All reviews should be positive in nature
      - Strict adherence to 45-word maximum limit
      - Maintain natural, human-like variation
    `;

  return prompt_v1;
};
