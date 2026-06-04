require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("../models/Movie");

const movies = [
  {
    title: "The Pursuit of Happyness",
    genres: ["Drama", "Family"],
    moods: ["uplifting", "hopeful", "inspirational"],
    ageRating: "PG-13",
    description: "A determined father navigates hardship and hope while fighting to create a better life for his son.",
    poster: "https://image.tmdb.org/t/p/w500/8b5b0e196f69d16ffeaa1e513d50fdbf.jpg",
    streamingPlatforms: ["Netflix", "Amazon Prime"],
  },
  {
    title: "Inside Out",
    genres: ["Animation", "Family", "Comedy"],
    moods: ["uplifting", "hopeful", "calming"],
    ageRating: "PG",
    description: "Follow Riley and the emotions inside her mind as they learn how sadness and joy can both be helpful.",
    poster: "https://image.tmdb.org/t/p/w500/aAmfIX3TT40zUHGcCKrlOZRKC7u.jpg",
    streamingPlatforms: ["Disney+", "Netflix"],
  },
  {
    title: "The Secret Life of Walter Mitty",
    genres: ["Adventure", "Comedy", "Drama"],
    moods: ["hopeful", "inspirational", "lighthearted"],
    ageRating: "PG",
    description: "A daydreamer escapes his mundane life on a global journey full of wonder, courage, and small miracles.",
    poster: "https://image.tmdb.org/t/p/w500/3m7MY5nXgo6a8lEtKb3pbjQ55z1.jpg",
    streamingPlatforms: ["Hulu", "Amazon Prime"],
  },
  {
    title: "Amélie",
    genres: ["Romance", "Comedy", "Drama"],
    moods: ["cozy", "hopeful", "lighthearted"],
    ageRating: "R",
    description: "A whimsical Parisian woman decides to change the lives of those around her for the better while navigating her own isolation.",
    poster: "https://image.tmdb.org/t/p/w500/h7fD8BO31U13z4Z0q7hN7Fsee5P.jpg",
    streamingPlatforms: ["Netflix", "Hulu"],
  },
  {
    title: "Good Will Hunting",
    genres: ["Drama", "Romance"],
    moods: ["thoughtful", "hopeful", "uplifting"],
    ageRating: "R",
    description: "A gifted young janitor confronts his past and discovers the power of connection with the help of a caring therapist.",
    poster: "https://image.tmdb.org/t/p/w500/bjY3vn1XnTXI022LhEueZ1ltiqc.jpg",
    streamingPlatforms: ["Starz", "Hulu"],
  },
  {
    title: "Chef",
    genres: ["Comedy", "Drama"],
    moods: ["lighthearted", "uplifting", "cozy"],
    ageRating: "R",
    description: "After quitting his restaurant job, a chef rediscovers his passion for cooking, family, and creative joy on a food truck adventure.",
    poster: "https://image.tmdb.org/t/p/w500/9wTrwtpA2K2plMly9rgG3ZitGL4.jpg",
    streamingPlatforms: ["Netflix", "Amazon Prime"],
  },
  {
    title: "A Beautiful Day in the Neighborhood",
    genres: ["Drama", "Biography"],
    moods: ["calming", "hopeful", "uplifting"],
    ageRating: "PG",
    description: "A journalist forms an unlikely friendship with Fred Rogers while learning lessons about kindness, compassion, and empathy.",
    poster: "https://image.tmdb.org/t/p/w500/1YJolB2k1ZEie1RGXVl9bGNc7qg.jpg",
    streamingPlatforms: ["HBO Max", "Amazon Prime"],
  },
  {
    title: "The Intouchables",
    genres: ["Biography", "Comedy", "Drama"],
    moods: ["uplifting", "hopeful", "inspirational"],
    ageRating: "R",
    description: "An aristocrat forms a life-changing friendship with his caregiver, discovering humor, gratitude, and resilience together.",
    poster: "https://image.tmdb.org/t/p/w500/4lXV2pml36Rzp7O3ETZ1YVBCv4O.jpg",
    streamingPlatforms: ["Netflix", "Amazon Prime"],
  },
  {
    title: "Julie & Julia",
    genres: ["Biography", "Comedy", "Drama"],
    moods: ["lighthearted", "uplifting", "cozy"],
    ageRating: "PG-13",
    description: "Two women in different decades find meaning through cooking, creativity, and finding joy in small daily rituals.",
    poster: "https://image.tmdb.org/t/p/w500/qt7seNexWxYC3GS6io1G2z46w0x.jpg",
    streamingPlatforms: ["Netflix", "Hulu"],
  },
  {
    title: "The Martian",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    moods: ["hopeful", "inspirational"],
    ageRating: "PG-13",
    description: "Stranded on Mars, an astronaut uses creativity and humor to survive as he waits for rescue and refuses to give up.",
    poster: "https://image.tmdb.org/t/p/w500/kdEPO1xjHMg0cjF1t1FTnUh4gNJ.jpg",
    streamingPlatforms: ["Hulu", "Amazon Prime"],
  },
];

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mental-ai";

async function seed() {
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB for movie seeding.");

    for (const movieData of movies) {
      const existing = await Movie.findOne({ title: movieData.title }).lean();
      if (existing) {
        console.log(`Skipping existing movie: ${movieData.title}`);
        continue;
      }
      await Movie.create(movieData);
      console.log(`Seeded movie: ${movieData.title}`);
    }

    console.log("Movie seeding completed.");
  } catch (err) {
    console.error("Movie seeding failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
