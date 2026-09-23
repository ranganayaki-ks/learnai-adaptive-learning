import { activity, adminQuestions, adminStudents, assessments, chartData, courses, flashcards, lesson, knowledgeGroups, masteryTopics, recommendations, student, studyWeeks, quizQuestions } from '../data/mockData';

type LearnerState = {
  mastery: number;
  lastScore: number | null;
  attempts: number;
  errorPatterns: string[];
  recommendation: string;
  reviewDue: number;
};

const wait = <T,>(value: T, delay = 160): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), delay));

const learnerState: LearnerState = {
  mastery: student.mastery,
  lastScore: null,
  attempts: 4,
  errorPatterns: ['Key-value operations', 'Choosing the right collection'],
  recommendation: 'Review HashMap fundamentals',
  reviewDue: 5,
};

export const api = {
  getStudentDashboard: () => wait({ student: { ...student, mastery: learnerState.mastery }, masteryTopics, recommendations, activity, weeklyActivity: [] }),
  getCourses: () => wait(courses),
  getCourseById: (id: string) => wait(courses.find((course) => course.id === id) || courses[0]),
  getModules: (courseId = 'java') => wait({ courseId, modules: courses.find((course) => course.id === courseId)?.modules || 0 }),
  getTopics: (courseId = 'java') => wait({ courseId, topics: ['Java basics', 'OOP', 'Collections', 'HashMap', 'Spring prerequisites'] }),
  getLessons: (courseId = 'java') => wait({ courseId, lessons: [lesson] }),
  getLesson: () => wait(lesson),
  getRecommendations: () => wait(recommendations.map((item, index) => index === 0 ? { ...item, reason: `${learnerState.errorPatterns.length} repeated errors related to ${learnerState.errorPatterns[0].toLowerCase()}.` } : item)),
  getLearningPath: () => wait({ stages: ['Assess', 'Analyze', 'Personalize', 'Learn', 'Adapt', 'Improve'], current: 'Personalize', mastery: learnerState.mastery }),
  getReviewCenter: () => wait({ dueToday: learnerState.reviewDue, overdue: 1, upcoming: 4, cards: flashcards }),
  getKnowledgeGraph: () => wait({ groups: knowledgeGroups, updatedAt: new Date().toISOString() }),
  getAnalytics: () => wait({ chartData, masteryTopics, knowledgeGroups, learnerState: { ...learnerState } }),
  getSkillGap: (target = 'Java Developer') => wait({ target, skills: [{ name: 'Java', current: 90, required: 90 }, { name: 'OOP', current: 82, required: 85 }, { name: 'Collections', current: learnerState.mastery - 24, required: 80 }, { name: 'Spring Boot', current: 43, required: 78 }, { name: 'REST API', current: 32, required: 74 }] }),
  getAssessments: () => wait(assessments),
  getQuizQuestions: () => wait(quizQuestions),
  getAdaptiveQuestion: (difficulty = 'Medium') => wait({ ...quizQuestions[Math.min(learnerState.attempts % quizQuestions.length, quizQuestions.length - 1)], difficulty }),
  submitQuiz: (answers: number[]) => {
    const score = answers.filter((answer, index) => answer === quizQuestions[index]?.answer).length;
    learnerState.lastScore = Math.round((score / quizQuestions.length) * 100);
    learnerState.attempts += 1;
    learnerState.mastery = Math.min(96, Math.max(38, Math.round(learnerState.mastery + (score >= 2 ? 4 : -3))));
    learnerState.reviewDue = score >= 2 ? Math.max(2, learnerState.reviewDue - 1) : learnerState.reviewDue + 1;
    learnerState.recommendation = score >= 2 ? 'Try Polymorphism practice' : 'Review HashMap fundamentals';
    if (score < quizQuestions.length) learnerState.errorPatterns = Array.from(new Set([...learnerState.errorPatterns, 'Adaptive quiz retrieval']));
    return wait({ score, total: quizQuestions.length, mastery: learnerState.mastery, recommendation: learnerState.recommendation, errorPatterns: learnerState.errorPatterns });
  },
  getLearningState: () => wait({ ...learnerState }),
  getStudyPlan: () => wait(studyWeeks, 420),
  generateStudyPlan: (goal = 'Java Developer') => wait({ goal, weeks: studyWeeks, prioritizedTopic: learnerState.recommendation }, 420),
  getFlashcards: () => wait(flashcards),
  generateFlashcards: (topic = 'Java Collections') => wait(flashcards.map((card) => ({ ...card, tag: topic })), 420),
  getAIResponse: (prompt: string) => wait({ message: `Here’s a useful way to think about “${prompt}”: start with the smallest concrete example, then connect it to the rule. I’ll keep the explanation grounded in your current Java Collections lesson.` }, 500),
  generateQuestions: (topic = 'HashMap', count = 3) => wait({ topic, count, status: 'draft', questions: Array.from({ length: count }, (_, index) => ({ id: index + 1, prompt: `Which statement best explains ${topic} in a real-world scenario?`, difficulty: index === 0 ? 'Easy' : 'Intermediate' })) }, 520),
  generateSummary: (topic = 'Java Collections') => wait({ topic, status: 'draft', summary: `${topic} becomes easier when you connect each abstraction to the retrieval problem it solves. Review the core trade-offs, then practice choosing a tool from a concrete scenario.` }, 420),
  uploadDocument: (fileName: string) => wait({ fileName, status: 'processing', generated: ['Summary', 'Quiz', 'Flashcards', 'Key concepts'] }, 650),
  getAdminStudents: () => wait(adminStudents),
  getAdminQuestions: () => wait(adminQuestions),
  getAdminAnalytics: () => wait({ activeUsers: 1842, completion: 74, difficultTopics: ['Java Collections', 'SQL Joins', 'Spring Security'] }),
};

export default api;
