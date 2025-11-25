import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";

export function useFilterParams() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    setSearchName(params.get("name") || "");
    setStatusFilter(params.get("status") || "");
    setDateFilter(params.get("date") || "");
    setPlanFilter(params.get("planId") || "");
    setPageNumber(Number(params.get("page")) || 1);
  }, [location.search]);

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (searchName) params.set("name", searchName);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);
    if (planFilter) params.set("planId", planFilter);

    params.set("page", pageNumber);

    navigate(`?${params.toString()}`);
  }, [
    searchName,
    statusFilter,
    dateFilter,
    planFilter,
    pageNumber,
    navigate
  ]);

  // Debounce CHỈ áp dụng cho searchName
  useEffect(() => {
    const handler = setTimeout(() => updateURL(), 500);
    return () => clearTimeout(handler);
  }, [searchName, updateURL]);

  return {
    searchName, setSearchName,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    planFilter, setPlanFilter,
    pageNumber, setPageNumber,
    updateURL
  };
}
