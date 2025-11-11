import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import "../styles/datepicker.css";

const months = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const DatePicker = ({ selectedDate, onDateChange }) => {
  const today = new Date();
  const [showCalendar, setShowCalendar] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tempDate, setTempDate] = useState(selectedDate || null);

useEffect(() => {
  if (selectedDate && !showCalendar) {
    setYear(selectedDate.getFullYear());
    setMonth(selectedDate.getMonth());
    setTempDate(selectedDate);
  }
}, [selectedDate, showCalendar]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7; // start Monday

  const handleDateClick = (day) => {
    const date = new Date(year, month, day);
    setTempDate(date);
  };

const handleApply = () => {
  let dateToApply = tempDate;

  // Nếu chưa chọn ngày nào, mặc định chọn ngày 1 của tháng đang hiển thị
  if (!dateToApply) {
    dateToApply = new Date(year, month, 1);
  }

  onDateChange(dateToApply);
  setShowCalendar(false);
};

const handleCancel = () => {
  setShowCalendar(false);
};

  return (
    <div className="datepicker-wrapper">
<button
  className="datepicker-input"
  onClick={() => {
    if (!showCalendar) {
      if (selectedDate) {
        setYear(selectedDate.getFullYear());
        setMonth(selectedDate.getMonth());
      }
    }
    setShowCalendar(!showCalendar);
  }}
>
        {selectedDate
          ? selectedDate.toLocaleDateString("vi-VN")
          : "dd/mm/yyyy"}
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
              <span className="year-display">{year}</span>
              <button className="year-btn" onClick={() => setYear(year + 1)}>&gt;</button>
            </div>
          </div>

          <div className="calendar-days-header">
            {daysOfWeek.map((d, i) => (
              <div key={i} className="day-name">{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
  {[...Array(getFirstDay(year, month))]
    .fill(null)
    .map((_, i) => (
      <div key={`empty-${i}`} className="empty-day"></div>
    ))}

  {[...Array(getDaysInMonth(year, month))].map((_, i) => {
    const day = i + 1;
    const isSelected =
      tempDate &&
      tempDate.getDate() === day &&
      tempDate.getMonth() === month &&
      tempDate.getFullYear() === year;

    const today = new Date();
    const isToday =
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    return (
      <div
        key={day}
        className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
        onClick={() => handleDateClick(day)}
      >
        {day}
      </div>
    );
  })}
</div>
          <div className="calendar-footer">
            <button className="cancel-btn" onClick={handleCancel}>Huỷ</button>
            <button className="apply-btn" onClick={handleApply}>Áp dụng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
