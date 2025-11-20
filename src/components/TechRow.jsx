import React from "react";
import { X } from "lucide-react";

export default function TechRow({
  tech,
  index,
  onChange,
  onRemove,
  technologies,
  totalTechs,
}) {
  const handleTechChange = (e) => {
    onChange(index, "technologyId", e.target.value);
  };

  const handleQtyChange = (e) => {
    onChange(index, "soLuong", e.target.value);
  };

  return (
    <div className="tech-row-custom">
      <select
        className="tech-select-custom"
        value={tech.technologyId || ""}
        onChange={handleTechChange}
      >
        <option value="">Chọn công nghệ</option>
        {(technologies || []).map((t) => {
          const id = String(t.id ?? t.technologyId);
          const name = t.name ?? t.technologyName ?? t.technology ?? "";
          return (
            <option key={id} value={id}>
              {name}
            </option>
          );
        })}
      </select>

      <input
        type="number"
        className="qty-input-custom"
        min="1"
        placeholder="Số lượng"
        value={tech.soLuong}
        onChange={handleQtyChange}
      />

      {/* ẨN HOÀN TOÀN NÚT X NẾU CHỈ CÓ 1 DÒNG */}
      {totalTechs > 1 && (
        <button
          type="button"
          className="btn-remove-tech-custom"
          onClick={() => onRemove(index)}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
