import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// --- Communication Hub ---
export const draftUpdate = (teacher_notes: string, classroom_id: string) =>
  api.post('/updates/draft', { teacher_notes, classroom_id });

export const sendUpdate = (id: string) =>
  api.post(`/updates/${id}/send`);

export const getFeed = (user_id: string, role: 'teacher' | 'parent') =>
  api.get('/updates/feed', { params: { user_id, role } });

export const respondToUpdate = (updateId: string, data: {
  parent_id: string;
  student_id: string;
  prompt_index: number;
  response_text: string;
}) => api.post(`/updates/${updateId}/respond`, data);

export const getInsights = (updateId: string) =>
  api.get(`/updates/${updateId}/insights`);

// --- Curriculum RAG ---
export const ingestCurriculum = () =>
  api.post('/curriculum/ingest');

export const askCurriculum = (question: string, year_level?: string, subject?: string, language?: string, model?: string) =>
  api.post('/curriculum/ask', { question, year_level, subject, language, model });

export const getCurriculumStats = () =>
  api.get('/curriculum/stats');

export const getCurriculumModels = () =>
  api.get('/curriculum/models');

// --- Messaging ---
export const sendMessage = (sender_id: string, receiver_id: string, text: string) =>
  api.post('/messages/send', { sender_id, receiver_id, text });

export const getConversations = (user_id: string) =>
  api.get('/messages/conversations', { params: { user_id } });

export const getThread = (other_user_id: string, user_id: string) =>
  api.get(`/messages/${other_user_id}`, { params: { user_id } });

// --- Users ---
export const getUsers = (exclude?: string) =>
  api.get('/users/', { params: exclude ? { exclude } : {} });

// --- Student Progress ---
export const getClassroomStudents = (classroomId: string) =>
  api.get(`/progress/classroom/${classroomId}/students`);

export const getStudentDetail = (studentId: string) =>
  api.get(`/progress/student/${studentId}`);

export const updateAchievement = (studentId: string, data: any) =>
  api.post(`/progress/student/${studentId}/achievement`, data);

export const updateSkill = (studentId: string, data: any) =>
  api.post(`/progress/student/${studentId}/skill`, data);

export const createAssignment = (data: any) =>
  api.post('/progress/assignments', data);

export const updateAssignmentResults = (assignmentId: string, data: any) =>
  api.put(`/progress/assignments/${assignmentId}/results`, data);

export const getChildProgress = (parentId: string) =>
  api.get(`/progress/parent/${parentId}/children`);

// --- Translation ---
export const translateText = (text: string, target_language: string, source_language: string = 'auto') =>
  api.post('/translate/', { text, target_language, source_language });

export default api;
