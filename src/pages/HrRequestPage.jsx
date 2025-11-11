// src/pages/HrRequestPage.jsx

import React, { useState, useEffect } from "react";

import useHrRequests from "../hooks/useHrRequests";

import Layout from "../components/Layout";

import ActionButtons from "../components/ActionButtons";

import Pagination from "../components/Pagination";

import "../styles/request.css";

// Nếu bạn đã có CreateRequestModal, import để mở form sửa/tạo

import CreateRequestModal from "../components/CreateRequestModal.jsx";

export default function HRRequestPage() {

  // ✅ CHỈ THÊM: lấy refetch từ hook để gọi lại API sau khi tạo/cập nhật

  const { requests, loading, error, refetch } = useHrRequests();

  // --- State phân trang & filter ---

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [isAnimating, setIsAnimating] = useState(false);

  const [searchName, setSearchName] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [dateFilter, setDateFilter] = useState("");

  // --- THÊM: modal create/edit (tận dụng form add để sửa)

  const [showModal, setShowModal] = useState(false);

  const [editData, setEditData] = useState(null);

  // --- Filter dữ liệu theo tên, trạng thái, ngày ---

  const filteredRequests = requests.filter((req) => {

    const matchesName = req.requestTitle

      ?.toLowerCase()

      .includes(searchName.toLowerCase());

    const matchesStatus = statusFilter ? req.status === statusFilter : true;

    const matchesDate = dateFilter

      ? new Date(req.createdAt).toISOString().split("T")[0] === dateFilter

      : true;

    return matchesName && matchesStatus && matchesDate;

  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const indexOfLast = currentPage * itemsPerPage;

  const indexOfFirst = indexOfLast - itemsPerPage;

  const currentRequests = filteredRequests.slice(indexOfFirst, indexOfLast);

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

  // === THÊM: hàm mở modal tạo/sửa ===

  const openCreate = () => {

    setEditData(null);

    setShowModal(true);

  };

  const openEdit = (req) => {

    // map tối thiểu trường cần cho form

    setEditData({

      requestId: req.requestId,

      requestTitle: req.requestTitle || "",

      expectedDeliveryDate: req.expectedDeliveryDate || "",

      note: req.note || "",

      techQuantities: req.techQuantities || [],

      status: req.status,

    });

    setShowModal(true);

  };

  // === THÊM: helper show tooltip tạm thời khi không phải NEW ===

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

  // ✅ DỰ PHÒNG: nếu modal có phát event toàn cục sau khi create/update

  useEffect(() => {

    const handler = () => {

      // gọi lại API để lấy danh sách mới

      refetch?.();

      // trở về trang 1 để dễ thấy item mới

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

            {/* Nút thêm nhu cầu (GIỮ NGUYÊN) */}
<button className="add-plan-btn clean" onClick={openCreate}>

              ＋ Thêm nhu cầu tuyển dụng
</button>
</div>
</div>

        {/* === Table === */}
<div

          className={`table-container table-fade ${

            isAnimating ? "fade-out" : "fade-in"

          }`}
>

          {loading ? (
<p className="loading-text">Đang tải dữ liệu...</p>

          ) : filteredRequests.length === 0 ? (
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

                  const canEdit = req.status === "NEW";

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
<td>{req.createdBy || "Không rõ"}</td>
<td className="actions-cell text-center">
<ActionButtons

                          onView={() => console.log("Xem", req.requestId)}

                          onEdit={(e) => {

                            // “Gác cổng”: nếu không phải NEW thì chặn + show tooltip

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

      {/* Modal create/edit (tận dụng form add) */}
<CreateRequestModal

        isOpen={showModal}

        onClose={() => setShowModal(false)}

        onSuccess={() => {

          // ✅ gọi lại API, không cần F5

          refetch?.();

          // đưa về trang 1 để thấy rõ item mới cập nhật/thêm

          setCurrentPage(1);

          setShowModal(false);

          setEditData(null);

        }}

        initialData={editData} // null => tạo mới; có object => sửa

      />
</Layout>

  );

}
 