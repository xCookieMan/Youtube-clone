import Video from "../models/Video.js";
import User from "../models/User.js";

// Basic English Stopwords
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each",
  "few", "for", "from", "further",
  "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
  "let's",
  "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not",
  "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up",
  "very",
  "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't",
  "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

/**
 * Simple Tokenizer
 * Removes punctuation, lowercases, removes stopwords.
 */
const tokenize = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
};

/**
 * TF-IDF Vectorizer Logic
 */
class TfidfVectorizer {
  constructor() {
    this.vocabulary = new Map(); // word -> index
    this.idf = [];
    this.docCount = 0;
  }

  fit(documents) {
    this.docCount = documents.length;
    const df = new Map(); // word -> document frequency

    // Build vocabulary and count DF
    documents.forEach((doc) => {
      const tokens = new Set(tokenize(doc));
      tokens.forEach((token) => {
        df.set(token, (df.get(token) || 0) + 1);
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, this.vocabulary.size);
        }
      });
    });

    // Calculate IDF
    this.idf = new Array(this.vocabulary.size).fill(0);
    this.vocabulary.forEach((index, token) => {
      const count = df.get(token) || 0;
      // IDF formula: log(N / (1 + DF)) + 1 (smoothing)
      this.idf[index] = Math.log(this.docCount / (1 + count)) + 1;
    });
  }

  transform(documents) {
    return documents.map((doc) => {
      const tokens = tokenize(doc);
      const vector = new Array(this.vocabulary.size).fill(0);
      const tf = new Map();

      tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

      tf.forEach((count, token) => {
        const index = this.vocabulary.get(token);
        if (index !== undefined) {
          // TF formula: count / total_terms_in_doc (optional, usually just count is fine for simple similarity)
          // Here using raw count * idf
          vector[index] = count * this.idf[index];
        }
      });

      // L2 Normalization (Important for Cosine Similarity)
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
          vector[i] /= magnitude;
        }
      }

      return vector;
    });
  }
}

/**
 * Calculate Cosine Similarity between two normalized vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
};

/**
 * Main Recommendation Function
 */
export const getRecommendations = async (userId, limit = 20) => {
  try {
    // 1. Fetch Data
    const [allVideos, user] = await Promise.all([
      Video.find({ isDeleted: false }, "_id title description category isShort views").lean(),
      User.findById(userId, "watchHistory").lean(),
    ]);

    if (!allVideos.length) return [];

    // 2. Prepare Data
    const watchedIds = new Set(
      (user?.watchHistory || []).map((h) => h.video.toString())
    );

    const docs = allVideos.map((v) => 
      `${v.title || ""} ${v.description || ""} ${v.category || ""}`
    );

    // 3. Vectorize
    const vectorizer = new TfidfVectorizer();
    vectorizer.fit(docs);
    const vectors = vectorizer.transform(docs);

    // 4. Build User Profile Vector
    // Filter vectors for videos the user has watched
    const watchedIndices = allVideos
      .map((v, i) => (watchedIds.has(v._id.toString()) ? i : -1))
      .filter((i) => i !== -1);

    let finalScores = [];

    if (watchedIndices.length > 0) {
      // Average the vectors of watched videos
      const userVector = new Array(vectorizer.vocabulary.size).fill(0);
      watchedIndices.forEach((idx) => {
        const vec = vectors[idx];
        for (let i = 0; i < vec.length; i++) {
          userVector[i] += vec[i];
        }
      });

      // Normalize user vector
      const magnitude = Math.sqrt(userVector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let i = 0; i < userVector.length; i++) {
          userVector[i] /= magnitude;
        }
      }

      // Calculate similarity for all videos
      finalScores = allVideos.map((video, index) => {
        // Skip watched videos
        if (watchedIds.has(video._id.toString())) return { id: video._id, score: -1 };

        const sim = cosineSimilarity(userVector, vectors[index]);
        return { id: video._id, score: sim };
      });
    } else {
      // Cold Start: Sort by views
      finalScores = allVideos.map((video) => ({
        id: video._id,
        score: video.views || 0,
      }));
    }

    // 5. Sort and Return Top N
    finalScores.sort((a, b) => b.score - a.score);

    const topIds = finalScores
      .filter((item) => item.score > -1) // Ensure we filter out watched if we marked them -1
      .slice(0, limit)
      .map((item) => item.id);

    return topIds;

  } catch (err) {
    console.error("Recommendation Engine Error:", err);
    return []; // Fallback to empty, controller handles default
  }
};
