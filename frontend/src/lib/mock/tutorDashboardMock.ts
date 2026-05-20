import {
  Plus,
  FilePlus,
  PlayCircle,
  CheckCircle2,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';

export const tutorIdentityMock = {
  name: 'Sarah Jenkins',
  title: 'Senior Teacher',
  avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=indigo&color=fff',
};

export const tutorWorkspaceMock = {
  code: 'S1',
  name: 'Springfield High',
  academicYearLabel: 'Academic Year 2023-24',
};

export const tutorDashboardStatsMock = [
  { label: 'Pending Evaluations', value: '14', trend: '+2 today', color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Active Classes', value: '6', trend: 'Normal', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Upcoming Tests', value: '3', trend: 'This week', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Average Class Perf.', value: '78%', trend: '+5%', color: 'text-blue-600', bg: 'bg-blue-50' },
];

export type TutorQuickAction = { label: string; icon: LucideIcon; color: string; href: string };

export const tutorQuickActionsMock: TutorQuickAction[] = [
  { label: 'Create Question', icon: Plus, color: 'bg-indigo-600', href: '/tutordashboard/questions' },
  { label: 'Create Paper', icon: FilePlus, color: 'bg-emerald-600', href: '/tutordashboard/papers' },
  { label: 'Start Evaluation', icon: PlayCircle, color: 'bg-amber-600', href: '/tutordashboard/evaluation' },
  { label: 'Publish Results', icon: CheckCircle2, color: 'bg-blue-600', href: '/tutordashboard/results' },
  { label: 'Add Assignment', icon: ClipboardCheck, color: 'bg-purple-600', href: '/tutordashboard/assignments' },
];

export const tutorScheduleMock = [
  { time: '09:00 AM', class: 'Grade 10 - Mathematics', room: 'Room 102', type: 'Class' },
  { time: '11:30 AM', class: 'Grade 9 - Physics Lab', room: 'Lab B', type: 'Lab' },
  { time: '02:00 PM', class: 'Grade 11 - Advanced Algebra', room: 'Room 205', type: 'Class' },
];

export const tutorRecentPapersMock = [
  { title: 'Calculus Mid-Term', subject: 'Maths', class: 'Grade 12', date: '24 Oct 2023', status: 'Published' },
  { title: 'Kinematics Quiz', subject: 'Physics', class: 'Grade 10', date: '26 Oct 2023', status: 'Draft' },
];

export const tutorQuestionsMock = [
  {
    id: 1,
    title: 'What is the derivative of sin(x)?',
    subject: 'Mathematics',
    topic: 'Calculus',
    marks: 2,
    difficulty: 'Easy',
    type: 'Objective',
    updatedAt: '2 days ago',
  },
  {
    id: 2,
    title: 'Explain the process of photosynthesis in detail and its importance to the ecosystem.',
    subject: 'Biology',
    topic: 'Plant Physiology',
    marks: 10,
    difficulty: 'Hard',
    type: 'Subjective',
    updatedAt: '5 days ago',
  },
  {
    id: 3,
    title: 'Solve for x: 2x + 5 = 15',
    subject: 'Mathematics',
    topic: 'Algebra',
    marks: 1,
    difficulty: 'Easy',
    type: 'Objective',
    updatedAt: '1 week ago',
  },
  {
    id: 4,
    title: 'What are the laws of motion defined by Newton?',
    subject: 'Physics',
    topic: 'Mechanics',
    marks: 5,
    difficulty: 'Medium',
    type: 'Subjective',
    updatedAt: '3 days ago',
  },
  {
    id: 5,
    title: 'Balance the following chemical equation: H2 + O2 -> H2O',
    subject: 'Chemistry',
    topic: 'Equations',
    marks: 3,
    difficulty: 'Medium',
    type: 'Objective',
    updatedAt: '1 day ago',
  },
];

export const tutorPapersMock = [
  {
    id: 1,
    title: 'Mathematics Mid-Term Assessment',
    subject: 'Mathematics',
    class: 'Grade 10',
    marks: 100,
    questions: 25,
    status: 'Published',
    createdAt: '12 Oct 2023',
    duration: '3 Hours',
  },
  {
    id: 2,
    title: 'Introductory Physics Quiz',
    subject: 'Physics',
    class: 'Grade 9',
    marks: 20,
    questions: 10,
    status: 'Draft',
    createdAt: '25 Oct 2023',
    duration: '45 Mins',
  },
  {
    id: 3,
    title: 'Organic Chemistry Revision Paper',
    subject: 'Chemistry',
    class: 'Grade 12',
    marks: 50,
    questions: 15,
    status: 'Archived',
    createdAt: '05 Sep 2023',
    duration: '1.5 Hours',
  },
  {
    id: 4,
    title: 'Biology Final Practice',
    subject: 'Biology',
    class: 'Grade 11',
    marks: 80,
    questions: 20,
    status: 'Published',
    createdAt: '20 Oct 2023',
    duration: '2.5 Hours',
  },
];

export const tutorEvaluationSubmissionsMock = [
  {
    id: 1,
    student: 'John Doe',
    test: 'Mathematics Mid-Term',
    class: 'Grade 10-A',
    status: 'Pending',
    autoScore: '35/50',
    submittedAt: '2 hours ago',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
  },
  {
    id: 2,
    student: 'Jane Smith',
    test: 'Mathematics Mid-Term',
    class: 'Grade 10-A',
    status: 'Completed',
    totalScore: '88/100',
    submittedAt: '5 hours ago',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
  },
  {
    id: 3,
    student: 'Robert Brown',
    test: 'Physics Quiz 1',
    class: 'Grade 9-B',
    status: 'Pending',
    autoScore: '12/15',
    submittedAt: '1 day ago',
    avatar: 'https://ui-avatars.com/api/?name=Robert+Brown&background=random',
  },
  {
    id: 4,
    student: 'Emily White',
    test: 'Physics Quiz 1',
    class: 'Grade 9-B',
    status: 'Completed',
    totalScore: '18/20',
    submittedAt: '1 day ago',
    avatar: 'https://ui-avatars.com/api/?name=Emily+White&background=random',
  },
  {
    id: 5,
    student: 'Michael Ross',
    test: 'Chemistry Lab Report',
    class: 'Grade 12-C',
    status: 'Needs Review',
    autoScore: '0/0',
    submittedAt: '3 days ago',
    avatar: 'https://ui-avatars.com/api/?name=Michael+Ross&background=random',
  },
];

export const tutorResultsSummaryMock = {
  publishedTests: 12,
  readyToRelease: 3,
  inProgress: 5,
};

export const tutorTestResultsMock = [
  {
    id: 1,
    title: 'Mathematics Mid-Term',
    class: 'Grade 10-A',
    averageScore: '72%',
    highestScore: '98%',
    lowestScore: '45%',
    evaluated: '45/45',
    status: 'Published',
    publishingMode: 'Manual',
    lastUpdated: '2 days ago',
  },
  {
    id: 2,
    title: 'Physics Quiz 1',
    class: 'Grade 9-B',
    averageScore: '85%',
    highestScore: '100%',
    lowestScore: '60%',
    evaluated: '32/32',
    status: 'Ready to Publish',
    publishingMode: 'Auto',
    lastUpdated: '5 hours ago',
  },
  {
    id: 3,
    title: 'Chemistry Unit Test',
    class: 'Grade 12-C',
    averageScore: '-',
    highestScore: '-',
    lowestScore: '-',
    evaluated: '12/40',
    status: 'Evaluating',
    publishingMode: 'Manual',
    lastUpdated: '1 day ago',
  },
  {
    id: 4,
    title: 'English Essay Writing',
    class: 'Grade 11-A',
    averageScore: '68%',
    highestScore: '92%',
    lowestScore: '40%',
    evaluated: '28/28',
    status: 'Draft',
    publishingMode: 'Manual',
    lastUpdated: '1 week ago',
  },
];

