import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Question, Quizz } from "@/lib/types";

interface State {
  quizzes: Quizz[];
  questions: Question[];
  selectedQuizz: Quizz | null;
  currentQuestion: number;
  hasCompleteAll: boolean;
  score: number;
  selectQuizz: (quizz: Quizz) => void;
  fetchQuizzes: () => Promise<void>;
  selectAnswer: (questionId: number, selectedAnswer: string) => void;
  goNextQuestion: () => void;
  goPreviousQuestion: () => void;
  onCompleteQuestions: () => void;
  reset: () => void;
}

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://bac-quizz.vercel.app/"
    : "http://localhost:3000/";

export const useQuestionStore = create<State>()(
  persist(
    (set, get) => {
      return {
        quizzes: [],
        questions: [],
        score: 0,
        selectedQuizz: null,
        currentQuestion: 0,
        hasCompleteAll: false,
        selectQuizz: (quizz: Quizz) => {
          set({ selectedQuizz: quizz, questions: quizz.questions });
        },
        fetchQuizzes: async () => {
          try {
            const res = await fetch(`${API_URL}/data.json`);
            const json = await res.json();
            const quizzes = json.quizzes as Quizz[];
            set({ quizzes, hasCompleteAll: false }, false);
          } catch (error) {
            console.log(error);
          }
        },

        selectAnswer: (questionId: number, selectedAnswer: string) => {
          const { questions } = get();
          // Use structuredClone to clone the questions array
          const newQuestions = structuredClone(questions);
          // Find the index of the question
          const questionIndex = newQuestions.findIndex((q) => q.id === questionId);
          // Get the question information
          const questionInfo = newQuestions[questionIndex];
          // Check if the selected answer is correct
          const isCorrectUserAnswer = questionInfo.answer === selectedAnswer;
        
          // Update the question object with correct answer if the user's answer is incorrect
          newQuestions[questionIndex] = {
            ...questionInfo,
            isCorrectUserAnswer,
            userSelectedAnswer: selectedAnswer,
            correctAnswer: !isCorrectUserAnswer ? questionInfo.answer : undefined, // Add correct answer if incorrect
          };
          // Update the state
          set({ questions: newQuestions }, false);
        },
        onCompleteQuestions: () => {
          const { questions } = get();
          const score = questions.filter((q) => q.isCorrectUserAnswer).length;

          set({ hasCompleteAll: true, currentQuestion: 0, score });
        },
        goNextQuestion: () => {
          const { currentQuestion, questions } = get();
          const nextQuestion = currentQuestion + 1;
          if (nextQuestion < questions.length) {
            set({ currentQuestion: nextQuestion }, false);
          }
        },

        goPreviousQuestion: () => {
          const { currentQuestion } = get();
          const previousQuestion = currentQuestion - 1;

          if (previousQuestion >= 0) {
            set({ currentQuestion: previousQuestion }, false);
          }
        },

        reset: () => {
          set(
            {
              currentQuestion: 0,
              questions: [],
              hasCompleteAll: false,
              selectedQuizz: null,
            },
            false
          );
        },
      };
    },
    {
      name: "quizz",
    }
  )
);
