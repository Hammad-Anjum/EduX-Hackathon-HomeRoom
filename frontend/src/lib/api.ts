import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// --- Communication Hub ---
export const draftUpdate = (teacher_notes: string, classroom_id: string, year_level?: string, subject?: string) =>
  api.post('/updates/draft', { teacher_notes, classroom_id, year_level, subject });

export const sendUpdate = (id: string) =>
  api.post(`/updates/${id}/send`);

export const deleteUpdate = (id: string) =>
  api.delete(`/updates/${id}`);

export const editUpdate = (id: string, teacher_notes: string, classroom_id: string) =>
  api.put(`/updates/${id}`, { teacher_notes, classroom_id });

export const getFeed = (user_id: string, role: 'teacher' | 'parent', classroom_id?: string) =>
  api.get('/updates/feed', { params: { user_id, role, classroom_id } });

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

export const getClassrooms = (teacherId?: string) =>
  api.get('/users/classrooms', { params: teacherId ? { teacher_id: teacherId } : {} });

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

export const updateNaplan = (studentId: string, data: any) =>
  api.post(`/progress/student/${studentId}/naplan`, data);

export const updateStudentAssignmentResult = (studentId: string, assignmentId: string, score: number | null, feedback: string) =>
  api.post(`/progress/student/${studentId}/assignment-result`, null, { params: { assignment_id: assignmentId, score, feedback } });

export const getChildProgress = (parentId: string) =>
  api.get(`/progress/parent/${parentId}/children`);

// --- Wellbeing ---
export const logCheckin = (studentId: string, data: { zone: number; teacher_note?: string; classroom_id?: string }) =>
  api.post(`/progress/student/${studentId}/checkin`, data);

export const getStudentCheckins = (studentId: string, days?: number) =>
  api.get(`/progress/student/${studentId}/checkins`, { params: { days } });

export const getClassroomCheckins = (classroomId: string) =>
  api.get(`/progress/classroom/${classroomId}/checkins`);

// --- Recommendations ---
export const generateRecommendations = (studentId: string) =>
  api.post(`/recommendations/generate/${studentId}`);

export const getStudentRecommendations = (studentId: string) =>
  api.get(`/recommendations/student/${studentId}`);

export const updateRecommendationItem = (recId: string, itemId: string, data: { status: string; edited_text?: string }) =>
  api.patch(`/recommendations/${recId}/items/${itemId}`, data);

export const getChildRecommendations = (parentId: string) =>
  api.get(`/recommendations/parent/${parentId}/children`);

// --- Forum ---
export const getForumPosts = () =>
  api.get('/forum/');

export const getForumPost = (postId: string) =>
  api.get(`/forum/${postId}`);

export const createForumPost = (author_id: string, title: string, body: string) =>
  api.post('/forum/', { author_id, title, body });

export const replyToForumPost = (postId: string, author_id: string, body: string) =>
  api.post(`/forum/${postId}/reply`, { author_id, body });

// --- Integrations ---
export const importGoogleClassroom = (classroomId: string) =>
  api.post('/progress/import/google-classroom', { classroom_id: classroomId });

export const exportCsv = (classroomId: string) =>
  api.get(`/progress/export/csv/${classroomId}`, { responseType: 'blob' });

// --- Translation ---
export const translateText = (text: string, target_language: string, source_language: string = 'auto') =>
  api.post('/translate/', { text, target_language, source_language });

export default api;
