import React, { useState, useEffect } from 'react';
import { BaseModal, ModalFooter } from '../Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { createCourse, updateCourse } from '../../services/courseService';

export default function CourseModal({ isOpen, onClose, onSuccess, course }) {
    const [formData, setFormData] = useState({ courseName: '', durationDays: '', description: '' });
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (course) {
            setFormData({
                courseName: course.courseName,
                durationDays: course.durationDays || '',
                description: course.description || ''
            });
        } else {
            setFormData({ courseName: '', durationDays: '', description: '' });
        }
    }, [course, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (course) {
                await updateCourse(course.courseId, formData);
                showNotification("Cập nhật thành công", "success");
            } else {
                await createCourse(formData);
                showNotification("Thêm mới thành công", "success");
            }
            onSuccess();
            onClose();
        } catch (err) {
            showNotification(err.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            title={course ? "Chỉnh sửa môn học" : "Thêm môn học"}
            onClose={onClose}
            size="sm"
        >
            <form onSubmit={handleSubmit}>
                <div className="modal-form-group">
                    <label className="modal-form-label">Tên môn học *</label>
                    <input
                        className="modal-form-input"
                        value={formData.courseName}
                        onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                        required
                    />
                </div>
                <div className="modal-form-group">
                    <label className="modal-form-label">Số ngày học (Dự kiến) *</label>
                    <input
                        type="number"
                        min="1"
                        className="modal-form-input"
                        value={formData.durationDays}
                        onChange={e => setFormData({ ...formData, durationDays: e.target.value })}
                        required
                    />
                </div>
                <div className="modal-form-group">
                    <label className="modal-form-label">Mô tả</label>
                    <textarea
                        className="modal-form-textarea"
                        rows="3"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                
                <ModalFooter
                    secondaryAction={{
                        label: "Hủy",
                        onClick: onClose
                    }}
                    primaryAction={{
                        label: loading ? 'Đang lưu...' : 'Lưu',
                        onClick: handleSubmit,
                        loading: loading,
                        type: "submit"
                    }}
                />
            </form>
        </BaseModal>
    );
}