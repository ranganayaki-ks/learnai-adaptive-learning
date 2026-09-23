import { activity, adminQuestions, adminStudents, assessments, chartData, courses, flashcards, lesson, knowledgeGroups, masteryTopics, recommendations, student, studyWeeks, quizQuestions } from '../data/mockData';

const wait = <T,>(value: T, delay = 160): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), delay));

export const api = {
  getStudentDashboard: () => wait({ student, masteryTopics, recommendations, activity, weeklyActivity: [] }),
  getCourses: () => wait(courses),
  getCourseById: (id: string) => wait(courses.find((course) => course.id === id) || courses[0]),
  getLesson: () => wait(lesson),
  getRecommendations: () => wait(recommendations),
  getAnalytics: () => wait({ chartData, masteryTopics, knowledgeGroups }),
  getAssessments: () => wait(assessments),
  getQuizQuestions: () => wait(quizQuestions),
  submitQuiz: (answers: number[]) => wait({ score: answers.filter((answer, index) => answer === quizQuestions[index]?.answer).length, total: quizQuestions.length }),
  getAIResponse: (prompt: string) => wait({ message: `Here’s a useful way to think about “${prompt}”: start with the smallest concrete example, then connect it to the rule. I’ll keep the explanation grounded in your current Java Collections lesson.` }, 500),
  generateStudyPlan: () => wait(studyWeeks, 420),
  generateFlashcards: () => wait(flashcards, 420),
  getAdminStudents: () => wait(adminStudents),
  getAdminQuestions: () => wait(adminQuestions),
};

export default api;
