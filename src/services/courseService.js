import api from './api';

export const getCourses = async () => (await api.get('/courses')).data;
export const createCourse = async (data) => (await api.post('/courses', data)).data;
export const updateCourse = async (id, data) => (await api.put(`/courses/${id}`, data)).data;
export const deleteCourse = async (id) => (await api.delete(`/courses/${id}`)).data;