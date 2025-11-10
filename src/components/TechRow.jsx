// src/components/TechRow.jsx
import { X } from "lucide-react";

export default function TechRow({ tech, index, onChange, onRemove, technologies, totalTechs }) {
  const canRemove = totalTechs > 1;

  return (
    <div className="tech-row-custom">
      {/* SELECT CÔNG NGHỆ */}
      <select
        value={tech.technologyId || ""}
        onChange={(e) => onChange(index, "technologyId", e.target.value)}
        className="tech-select-custom"
        required
        autoFocus={index === totalTechs - 1}
      >
        <option value="">Chọn công nghệ</option>
        {technologies.map(t => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* SỐ LƯỢNG */}
      <input
        type="number"
        min="1"
        value={tech.soLuong}
        onChange={(e) =>
          onChange(index, "soLuong", Math.max(1, parseInt(e.target.value) || 1))
        }
        className="qty-input-custom"
        required
      />

      {/* NÚT XÓA */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="btn-remove-tech-custom"
          aria-label="Xóa công nghệ"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
