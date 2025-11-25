import { useFilterParams } from "../hooks/useFilterParams";

function FilterBar({
  showSearch = true,
  showStatus = true,
  showDate = true,
  showPlan = true,
  statusOptions = []
}) {
  const {
    searchName, setSearchName,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    planFilter, setPlanFilter,
    pageNumber, setPageNumber,
    updateURL
  } = useFilterParams();

  return (
    <div className="filter-bar">

      {/* Search */}
      {showSearch && (
        <input
          type="text"
          placeholder="Tìm theo tên..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      )}

      {/* Status */}
      {showStatus && (
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageNumber(1);
            updateURL();
          }}
        >
          <option value="">Trạng thái</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Date */}
      {showDate && (
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPageNumber(1);
            updateURL();
          }}
        />
      )}

      {/* Plan */}
      {showPlan && (
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPageNumber(1);
            updateURL();
          }}
        >
          <option value="">Chọn kế hoạch</option>
          <option value="123">Kế hoạch A</option>
          <option value="456">Kế hoạch B</option>
        </select>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={pageNumber === 1}
          onClick={() => {
            setPageNumber(pageNumber - 1);
            updateURL();
          }}
        >
          Prev
        </button>

        <span>Trang {pageNumber}</span>

        <button
          onClick={() => {
            setPageNumber(pageNumber + 1);
            updateURL();
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
