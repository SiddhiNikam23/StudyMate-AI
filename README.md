# StudyMate-AI: The Memory-Powered AI Study Companion

StudyMate-AI is a "second brain" for students, leveraging AI to remember every study session, quiz, and mistake to provide a truly personalised learning journey.

## 🚀 The Mission: Solving information Overload

Students often forget their weak topics or recurring mistake patterns. StudyMate-AI uses **Hindsight AI Memory** to track student behavior over time, turning raw study data into a **"Learning DNA"** profile.

## ✨ Key Features

- **🧬 Learning DNA Dashboard**: A visual representation of your academic profile, including mastery radars and mistake pattern analysis.
- **🧠 Hindsight Integration**: Deep memory of past quizzes, coding challenges, and study sessions.
- **🛡️ Quality Arena**: Practice coding and concepts with real-time AI feedback.
- **📋 Authentic History**: A chronological log of all learning activities fetched directly from AI memory.
- **🎯 Personalized Plans**: Automatic recommendations on what to study next based on your current performance.

## 🛠️ Technical Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (Premium Dark Mode UI)
- **Database**: [Upstash Redis](https://upstash.com) (Streaks & Quiz History)
- **AI Engine**: [Groq](https://groq.com) & [Hindsight API](https://lib.hindsight.com)
- **Visualizations**: [Recharts](https://recharts.org) (Radar & Bar Charts)

## 🏁 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## 📂 Project Structure

- `src/app/dna`: The Learning DNA dashboard.
- `src/lib/hindsight.ts`: Core logic for interacting with AI memory.
- `src/app/api/dna`: API routes for synthesizing student data.
- `src/components`: Reusable UI components for the dashboard and quizzes.

---
Built with ❤️ by StudyMate-AI Team.
