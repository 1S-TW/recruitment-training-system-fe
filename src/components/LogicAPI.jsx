import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FilterBar from "./FilterBar";

function ListPage() {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/items${location.search}`);
        const json = await res.json();

        setData(json.items);
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [location.search]);

  const statusOptions = [
    { value: "NEW", label: "Đã gửi" },
    { value: "IN_PROGRESS", label: "Đang tiến hành" },
    { value: "COMPLETED", label: "Đã hoàn thành" }
  ];

  return (
    <div>
      <FilterBar
        showSearch
        showStatus
        showPlan
        statusOptions={statusOptions}   
      />

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <ul>
          {data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListPage;
