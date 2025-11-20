import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import "../styles/datepicker.css";

const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const DatePicker = ({ selectedDate, onDateChange }) => {
    const today = new Date();
    const [showCalendar, setShowCalendar] = useState(false);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [tempDate, setTempDate] = useState(selectedDate || null);

    useEffect(() => {
        if (selectedDate) {
            setYear(selectedDate.getFullYear());
            setMonth(selectedDate.getMonth());
            setTempDate(selectedDate);
        }
    }, [selectedDate]);


    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    const handleDateClick = (day) => {
        const date = new Date(year, month, day);
        setTempDate(date);
    };

    const handleApply = () => {
        const dateToApply = tempDate || new Date(year, month, 1); // mặc định là ngày 1
        onDateChange(dateToApply);
        setShowCalendar(false);
    };

    const handleCancel = () => {
        setTempDate(selectedDate || null);
        setShowCalendar(false);
    };

    return (
        <div className="datepicker-wrapper">
            <button className="datepicker-input" onClick={() => setShowCalendar(!showCalendar)}>
                {selectedDate ? selectedDate.toLocaleDateString("vi-VN") : "dd/mm/yyyy"}
                <Calendar size={18} className="calendar-icon" />
            </button>

            {showCalendar && (
                <div className="calendar-popup">
                    <div className="calendar-header">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="month-select"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <div className="year-nav">
                            <button className="year-btn" onClick={() => setYear(year - 1)}>&lt;</button>
                            <span>{year}</span>
                            <button className="year-btn" onClick={() => setYear(year + 1)}>&gt;</button>
                        </div>
                    </div>

                    <div className="calendar-grid">
                        {[...Array(getDaysInMonth(year, month))].map((_, i) => {
                            const day = i + 1;
                            const isSelected =
                                tempDate &&
                                tempDate.getDate() === day &&
                                tempDate.getMonth() === month &&
                                tempDate.getFullYear() === year;

                            return (
                                <div
                                    key={day}
                                    className={`calendar-day ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    <div className="calendar-footer">
                        <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                        <button className="apply-btn" onClick={handleApply}>Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
