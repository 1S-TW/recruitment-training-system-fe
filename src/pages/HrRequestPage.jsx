// src/pages/HrRequestPage.jsx
import React, { useState, useEffect } from "react";
import useHrRequests from "../hooks/useHrRequests";
import Layout from "../components/Layout";
import ActionButtons from "../components/ActionButtons.jsx";
import Pagination from "../components/Pagination";
import CreateRequestModal from "../components/CreateRequestModal.jsx";
import HRRequestModal from "../components/HRRequestModal.jsx";

import "../styles/request.css";
import "../styles/toast.css"; // CSS riêng cho toast

export default function HRRequestPage() {
  // Lấy data + refetch để gọi lại API sau khi tạo/cập nhật (không cần F5)
  const { requests, loading, error, refetch } = useHrRequests();

  // --- State phân trang & filter ---
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // --- Modal create/edit (tận dụng form add để sửa) ---
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // --- Modal xem chi tiết (approve/reject…) ---
  const [selectedRequest, setSelectedRequest] = useState(null);

  // --- Toast góc phải dưới ---
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // === Guard inline: chỉ NEW mới được thao tác (phê duyệt/khởi tạo/sửa) ===
  const isActionable = (status) => String(status || "").toUpperCase() === "NEW";

  // --- Filter theo tên, trạng thái, ngày ---
  const filteredRequests = (requests || []).filter((req) => {
    const matchesName = req.requestTitle?.toLowerCase().includes(searchName.toLowerCase());
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    const matchesDate = dateFilter
      ? (req.createdAt && new Date(req.createdAt).toISOString().split("T")[0] === dateFilter)
      : true;
    return matchesName && matchesStatus && matchesDate;
  });

  // --- Sắp xếp mới nhất lên đầu ---
  const filteredSorted = [...filteredRequests].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da; // desc
  });

  // --- Phân trang ---
  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRequests = filteredSorted.slice(indexOfFirst, indexOfLast);

  const handleChangeItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsAnimating(false);
    }, 180);
  };

  // === Mở modal tạo/sửa ===
  const openCreate = () => {
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (req) => {
    setEditData({
      requestId: req.requestId,
      requestTitle: req.requestTitle || "",
      expectedDeliveryDate: req.expectedDeliveryDate || "",
      note: req.note || "",
      techQuantities: req.techQuantities || [], // mảng [{technologyId, quantity}]
      status: req.status,
    });
    setShowModal(true);
  };

  // === helper tooltip tạm thời khi không phải NEW ===
  const flashEditTooltip = (btnWrapperEl) => {
    const tip = btnWrapperEl?.querySelector(".action-tooltip");
    if (!tip) return;
    const original = tip.textContent;
    tip.textContent = "Chỉ trạng thái NEW mới được sửa";
    tip.style.opacity = "1";
    tip.style.transform = "translateX(-50%) scale(1)";
    setTimeout(() => {
      tip.textContent = original;
      tip.removeAttribute("style");
    }, 1200);
  };

  // === Lắng nghe event toàn cục sau khi create/update từ modal ===
  useEffect(() => {
    const handler = () => {
      refetch?.();
      setCurrentPage(1);
    };
    window.addEventListener("hr:requests:changed", handler);
    return () => window.removeEventListener("hr:requests:changed", handler);
  }, [refetch]);

  return (
    <Layout>
      {/* === Breadcrumb === */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">💼</span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Nhu cầu tuyển dụng</span>
        </div>

        <div className="breadcrumb-right">
          <div className="mini-pagination">
            <label className="mini-pagination-label">Hiển thị:</label>
            <select
              value={itemsPerPage}
              onChange={handleChangeItemsPerPage}
              className="mini-pagination-select"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Nhu cầu tuyển dụng</h2>

          <div className="filter-bar">
            {/* Search theo tên */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <span className="filter-icon">🔍</span>
            </div>

            {/* Trạng thái */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="NEW">NEW</option>
                <option value="PENDING">Đang chờ</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELED">Đã hủy</option>

              </select>
            </div>

            {/* Lọc theo ngày tạo (yyyy-mm-dd) */}
            <div className="filter-item">
              <input
                type="date"
                className="filter-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Nút thêm nhu cầu */}
            <button className="add-plan-btn clean" onClick={openCreate}>
              ＋ Thêm nhu cầu tuyển dụng
            </button>
          </div>
        </div>

        {/* === Table === */}
        <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="text-center text-error">{error}</p>
          ) : filteredSorted.length === 0 ? (
            <p className="text-center">Không có dữ liệu</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên nhu cầu</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Người gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((req, index) => {
                  const canEdit = isActionable(req.status);
                  const rowAttrs = {
                    "data-status": req.status || "",
                    "data-editable": canEdit ? "true" : "false",
                  };

                  return (
                    <tr key={req.requestId || index} {...rowAttrs}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{req.requestTitle}</td>
                      <td>
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span className="status-badge">{req.status}</span>
                      </td>
                      <td>{req.createdByName || "Không rõ"}</td>
                      <td className="actions-cell text-center">
                        <div className="btn-action-wrapper">
                          <ActionButtons
                            onView={() => setSelectedRequest(req)}
                            onEdit={(e) => {
                              if (!canEdit) {
                                e?.preventDefault?.();
                                const wrapper =
                                  e?.currentTarget?.closest?.(".btn-action-wrapper") ||
                                  e?.target?.closest?.(".btn-action-wrapper");
                                flashEditTooltip(wrapper);
                                return;
                              }
                              openEdit(req);
                            }}
                          />
                          {/* tooltip ẩn mặc định; flashEditTooltip sẽ tô sáng khi không cho edit */}
                          <div className="action-tooltip">Sửa</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* === Pagination === */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* === Modal create/edit === */}
      <CreateRequestModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        onSuccess={(msgFromBE) => {
          // gọi lại API + đưa về trang 1 để thấy item mới
          refetch?.();
          setCurrentPage(1);
          setShowModal(false);
          setEditData(null);
          // Toast thành công
          showToast(
            msgFromBE || (editData ? "Cập nhật thành công!" : "Tạo mới thành công!"),
            "success"
          );
        }}
        initialData={editData} // null => tạo mới; có object => sửa
      />

      {/* === Modal xem chi tiết (approve/reject) ===
          Lưu ý: HRRequestModal sẽ tự chặn 2 nút khi status ≠ NEW */}
      <HRRequestModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onActionSuccess={() => {
          refetch?.();
          setSelectedRequest(null);
          showToast("Thực hiện thành công!", "success");
        }}
        onActionError={(msg) => showToast(msg || "Có lỗi xảy ra", "error")}
      />

      {/* === Toast góc phải dưới === */}
      {toast && (
        <div
          className={`toast-container ${toast.type === "success" ? "toast-success" : "toast-error"}`}
          role="status"
        >
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
