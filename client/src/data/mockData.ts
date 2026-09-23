export const student = {
  name: 'Ranganayaki KS',
  initials: 'RK',
  role: 'Student',
  course: 'Java Programming',
  mastery: 72,
  streak: 7,
  topicsMastered: 18,
  questionsSolved: 247,
  dailyGoal: 60,
  dailyGoalLabel: '6 / 10 questions',
  email: 'ranganayaki.ks@learnai.dev',
  college: 'Kumaraguru College of Technology',
  department: 'Computer Science & Engineering',
};

export const courses = [
  { id: 'java', title: 'Java Programming', category: 'Programming', description: 'Build a durable foundation in Java, from syntax to clean object-oriented design.', modules: 8, lessons: 42, difficulty: 'Intermediate', progress: 72, rating: '4.9', learners: '12.4k', color: '#5146e5', accent: '#e8e6ff', icon: '☕', featured: true },
  { id: 'sql', title: 'SQL & Database Management', category: 'Database', description: 'Query with confidence, model relational data, and reason about performance.', modules: 6, lessons: 28, difficulty: 'Beginner', progress: 64, rating: '4.8', learners: '8.1k', color: '#0b8f8f', accent: '#d9f6f1', icon: '◈' },
  { id: 'javascript', title: 'Modern JavaScript', category: 'Programming', description: 'Master the language behind the web with practical, production-ready patterns.', modules: 7, lessons: 36, difficulty: 'Intermediate', progress: 38, rating: '4.9', learners: '15.7k', color: '#d28b24', accent: '#fff0d3', icon: 'JS' },
  { id: 'react', title: 'React.js in Practice', category: 'Web Development', description: 'Design interfaces that feel fast, intuitive, and easy to evolve.', modules: 5, lessons: 24, difficulty: 'Intermediate', progress: 16, rating: '4.9', learners: '10.2k', color: '#2c8bc7', accent: '#def1ff', icon: '⚛' },
  { id: 'spring', title: 'Spring Boot Essentials', category: 'Web Development', description: 'Ship resilient Java services with Spring Boot and RESTful architecture.', modules: 8, lessons: 38, difficulty: 'Advanced', progress: 12, rating: '4.7', learners: '6.8k', color: '#529b47', accent: '#e2f4dd', icon: '❖' },
  { id: 'ml', title: 'Machine Learning Basics', category: 'AI / ML', description: 'Understand the mental models behind models, data, and evaluation.', modules: 6, lessons: 30, difficulty: 'Beginner', progress: 0, rating: '4.8', learners: '9.6k', color: '#c0578a', accent: '#fbe5f0', icon: '✦' },
];

export const masteryTopics = [
  { name: 'Java OOP', value: 82, status: 'Strong' },
  { name: 'SQL Joins', value: 67, status: 'Needs practice' },
  { name: 'Java Collections', value: 48, status: 'Weak' },
  { name: 'Spring Boot', value: 43, status: 'Weak' },
  { name: 'JavaScript', value: 71, status: 'Needs practice' },
];

export const recommendations = [
  { title: 'HashMap Fundamentals', type: 'Lesson', reason: '4 recent errors related to key-value operations.', why: ['Weak topic', 'Recent repeated errors', 'Prerequisite for advanced Collections'], duration: '12 min', color: 'violet', icon: '↗' },
  { title: 'Polymorphism Practice', type: 'Practice', reason: 'Your current mastery is 48%.', why: ['Below your target mastery', 'Builds on Inheritance', 'Ready for targeted practice'], duration: '10 questions', color: 'coral', icon: '◎' },
  { title: 'Collections: Choosing the Right Tool', type: 'Video', reason: 'Because you are ready for a higher difficulty.', why: ['Strong OOP foundation', 'Bridges to real-world Java', 'Recommended by your learning path'], duration: '18 min', color: 'teal', icon: '▶' },
];

export const activity = [
  { title: 'Completed Java OOP lesson', meta: 'Inheritance & interfaces', time: 'Today, 9:42 AM', icon: '✓', tone: 'green' },
  { title: 'Scored 8/10 in SQL Quiz', meta: 'JOIN operations', time: 'Yesterday, 6:18 PM', icon: '↗', tone: 'blue' },
  { title: 'Practiced HashMap', meta: 'Adaptive practice set', time: 'Yesterday, 4:05 PM', icon: '◌', tone: 'violet' },
  { title: 'Generated AI study summary', meta: 'Java Collections', time: 'Mon, 8:12 AM', icon: '✦', tone: 'amber' },
  { title: 'Completed adaptive assessment', meta: 'Java foundations', time: 'Sun, 11:30 AM', icon: '▤', tone: 'teal' },
];

export const weeklyActivity = [
  { day: 'Mon', value: 82, active: true }, { day: 'Tue', value: 68, active: true }, { day: 'Wed', value: 91, active: true }, { day: 'Thu', value: 54, active: true }, { day: 'Fri', value: 76, active: true }, { day: 'Sat', value: 20, active: false }, { day: 'Sun', value: 62, active: true },
];

export const chartData = [
  { week: 'W1', mastery: 48, time: 3.2, accuracy: 61 }, { week: 'W2', mastery: 54, time: 4.1, accuracy: 67 }, { week: 'W3', mastery: 57, time: 3.8, accuracy: 64 }, { week: 'W4', mastery: 63, time: 5.2, accuracy: 72 }, { week: 'W5', mastery: 67, time: 6.1, accuracy: 76 }, { week: 'W6', mastery: 72, time: 7.4, accuracy: 81 },
];

export const assessments = [
  { id: 'adaptive-java', name: 'Java Collections Adaptive Check', topic: 'Java Collections', questions: 10, difficulty: 'Adaptive', time: '12 min', score: '—', status: 'recommended', accent: 'violet' },
  { id: 'oop-advanced', name: 'Object-Oriented Design', topic: 'Java OOP', questions: 15, difficulty: 'Advanced', time: '18 min', score: '78%', status: 'available', accent: 'coral' },
  { id: 'sql-joins', name: 'SQL Join Patterns', topic: 'SQL', questions: 10, difficulty: 'Intermediate', time: '10 min', score: '80%', status: 'completed', accent: 'teal' },
];

export const quizQuestions = [
  { id: 1, topic: 'Java Collections', difficulty: 'Medium', question: 'Which statement correctly describes HashMap in Java?', options: ['It stores values in insertion order.', 'It stores key-value pairs and allows one null key.', 'It only accepts primitive data types.', 'It is synchronized by default.'], answer: 1, explanation: 'HashMap stores key-value pairs and permits one null key. Ordering is not guaranteed and it is not synchronized by default.' },
  { id: 2, topic: 'Java Collections', difficulty: 'Hard', question: 'What is the average time complexity for a HashMap get() operation?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], answer: 2, explanation: 'A well-distributed hash function gives HashMap constant average-time lookups, O(1).'},
  { id: 3, topic: 'Polymorphism', difficulty: 'Easy', question: 'Which Java feature lets a subclass provide its own implementation of a parent method?', options: ['Method overriding', 'Method hiding', 'Constructor chaining', 'Encapsulation'], answer: 0, explanation: 'Method overriding is runtime polymorphism: a subclass supplies a specialized implementation.' },
];

export const lesson = {
  id: 'hashmap-fundamentals',
  title: 'Understanding HashMap',
  course: 'Java Programming',
  module: 'Module 3 · Collections',
  duration: '12 min read',
  objectives: ['Explain how key-value storage works', 'Choose a HashMap for the right use case', 'Avoid common equality and hashing mistakes'],
  intro: 'A HashMap is Java’s go-to collection when you need to associate a unique key with a value. It is fast, flexible, and shows up everywhere from caching to indexing.',
  code: `Map<String, Integer> attempts = new HashMap<>();\nattempts.put("hashmap", 4);\nattempts.put("polymorphism", 6);\n\nInteger mistakes = attempts.get("hashmap");`,
  takeaways: ['Keys are unique; adding the same key replaces its value.', 'Average lookup, insert, and remove operations are O(1).', 'Use equals() and hashCode() together for custom keys.'],
};

export const flashcards = [
  { front: 'What is HashMap?', back: 'A Java collection that stores key-value pairs, allowing fast average-time lookup by key.', tag: 'Collections' },
  { front: 'What is method overriding?', back: 'When a subclass provides a specific implementation for a method already defined by its parent class.', tag: 'Polymorphism' },
  { front: 'What is a primary key?', back: 'A column or set of columns that uniquely identifies each row in a database table.', tag: 'SQL' },
];

export const knowledgeGroups = [
  { title: 'OOP', children: [{ label: 'Encapsulation', value: 82 }, { label: 'Inheritance', value: 78 }, { label: 'Polymorphism', value: 48 }, { label: 'Abstraction', value: 64 }] },
  { title: 'Collections', children: [{ label: 'ArrayList', value: 72 }, { label: 'HashMap', value: 41 }, { label: 'HashSet', value: 58 }] },
];

export const studyWeeks = [
  { week: 'Week 1', title: 'Java fundamentals', status: 'complete', days: [{ label: 'Syntax & types', type: 'Lesson', time: '25 min', status: 'complete' }, { label: 'Variables practice', type: 'Practice', time: '15 min', status: 'complete' }, { label: 'Foundations check', type: 'Quiz', time: '10 min', status: 'complete' }] },
  { week: 'Week 2', title: 'Object-oriented thinking', status: 'current', days: [{ label: 'Inheritance', type: 'Lesson', time: '20 min', status: 'complete' }, { label: 'Polymorphism', type: 'Lesson', time: '25 min', status: 'current' }, { label: 'OOP targeted practice', type: 'Practice', time: '20 min', status: 'upcoming' }] },
  { week: 'Week 3', title: 'Collections', status: 'upcoming', days: [{ label: 'ArrayList & Set', type: 'Lesson', time: '25 min', status: 'upcoming' }, { label: 'HashMap Fundamentals', type: 'Lesson', time: '15 min', status: 'upcoming' }, { label: 'Collections adaptive quiz', type: 'Quiz', time: '15 min', status: 'upcoming' }] },
  { week: 'Week 4', title: 'Exception handling', status: 'upcoming', days: [{ label: 'Exceptions in practice', type: 'Lesson', time: '20 min', status: 'upcoming' }, { label: 'Debugging drill', type: 'Practice', time: '15 min', status: 'upcoming' }, { label: 'Final readiness check', type: 'Quiz', time: '20 min', status: 'upcoming' }] },
];

export const adminStats = [
  { label: 'Total students', value: '2,481', trend: '+12.8%', icon: '♙' }, { label: 'Published courses', value: '24', trend: '+3 this month', icon: '▦' }, { label: 'Total lessons', value: '612', trend: '+48 this month', icon: '◫' }, { label: 'Question bank', value: '8,940', trend: '+6.2%', icon: '◌' },
];

export const adminStudents = [
  { name: 'Ananya Rao', email: 'ananya.rao@gmail.com', course: 'Java Programming', mastery: 86, progress: 82, active: '2 min ago', status: 'Active' }, { name: 'Vikram Shah', email: 'vikram.shah@gmail.com', course: 'SQL & Database', mastery: 68, progress: 61, active: '1 hour ago', status: 'Active' }, { name: 'Meera Iyer', email: 'meera.iyer@gmail.com', course: 'React.js in Practice', mastery: 74, progress: 48, active: 'Yesterday', status: 'At risk' }, { name: 'Arjun Nair', email: 'arjun.nair@gmail.com', course: 'Machine Learning', mastery: 55, progress: 34, active: '3 days ago', status: 'Inactive' }, { name: 'Sana Khan', email: 'sana.khan@gmail.com', course: 'JavaScript', mastery: 91, progress: 94, active: '8 min ago', status: 'Active' },
];

export const adminQuestions = [
  { question: 'Which statement correctly describes HashMap?', topic: 'Java Collections', difficulty: 'Medium', type: 'MCQ', usage: 284 }, { question: 'Explain method overriding with an example.', topic: 'Polymorphism', difficulty: 'Hard', type: 'Short answer', usage: 117 }, { question: 'What does an INNER JOIN return?', topic: 'SQL Joins', difficulty: 'Easy', type: 'MCQ', usage: 362 }, { question: 'Which principle hides internal state?', topic: 'Encapsulation', difficulty: 'Easy', type: 'MCQ', usage: 198 }, { question: 'Predict the output of this code snippet.', topic: 'Java Basics', difficulty: 'Medium', type: 'Code', usage: 76 },
];
