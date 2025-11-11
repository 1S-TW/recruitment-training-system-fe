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
  const [selectedDay, setSelectedDay] = useState(null);

  // Khi có selectedDate mới → cập nhật hiển thị
  useEffect(() => {
    if (selectedDate) {
      const displayY = selectedDate.displayYear || selectedDate.getFullYear();
      const displayM = selectedDate.displayMonth || selectedDate.getMonth();
      setYear(displayY);
      setMonth(displayM);
      setSelectedDay(selectedDate.hasDaySelection ? selectedDate.getDate() : null);
    } else {
      setSelectedDay(null);
    }
  }, [selectedDate]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7; // Bắt đầu từ T2

  const handleDateClick = (day) => setSelectedDay(day);

  const handleApply = () => {
    let dateToSend = new Date(year, month, selectedDay || 1);
    dateToSend.displayYear = year;
    dateToSend.displayMonth = month;

    if (selectedDay !== null) {
      dateToSend.filterMode = "day";
      dateToSend.hasDaySelection = true;
      dateToSend.displayText = dateToSend.toLocaleDateString("vi-VN");
    } else {
      dateToSend.filterMode = "month";
      dateToSend.hasDaySelection = false;
      dateToSend.displayText = `${months[month]} ${year}`;
    }

    onDateChange(dateToSend);
    setShowCalendar(false);
  };

  const handleCancel = () => setShowCalendar(false);

  return (
    <div className="datepicker-wrapper">
      {/* Nút chính hiển thị ngày/tháng/năm */}
      <button
        className="datepicker-input"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        {selectedDate ? (
          selectedDate.filterMode === "year" ? (
            `Năm ${selectedDate.displayYear}`
          ) : selectedDate.filterMode === "month" ? (
            `${months[selectedDate.displayMonth]} ${selectedDate.displayYear}`
          ) : (
            selectedDate.toLocaleDateString("vi-VN")
          )
        ) : (
          "dd/mm/yyyy"
        )}
        <Calendar size={18} className="calendar-icon" />
      </button>

      {showCalendar && (
        <div className="calendar-popup">
          {/* === Header chọn tháng và năm === */}
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
              <span
                className="year-display"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const yearOnly = new Date(year, 0, 1);
                  yearOnly.filterMode = "year";
                  yearOnly.displayYear = year;
                  yearOnly.displayText = `Năm ${year}`;
                  onDateChange(yearOnly);
                  setShowCalendar(false);
                }}
              >
                {year}
              </span>
              <button className="year-btn" onClick={() => setYear(year + 1)}>&gt;</button>
            </div>
          </div>

          {/* === Hàng thứ trong tuần === */}
          <div className="calendar-days-header">
            {daysOfWeek.map((d, i) => (
              <div key={i} className="day-name">{d}</div>
            ))}
          </div>

          {/* === Lưới ngày === */}
          <div className="calendar-grid">
            {[...Array(getFirstDay(year, month))].fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="empty-day"></div>
            ))}

            {[...Array(getDaysInMonth(year, month))].map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isSelected ? "selected" : ""} ${
                    isToday ? "today" : ""
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* === Nút Hủy / Áp dụng === */}
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
