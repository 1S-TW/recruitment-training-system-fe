// src/components/HRRequestModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HRRequestModal.css";
import Modal from "./Modal"; // dùng lại Modal giống bên kế hoạch

export default function HRRequestModal({
  isOpen,
  onClose,
  request,
  onActionSuccess,
  onActionError,
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [techDict, setTechDict] = useState({});

  // modal lý do từ chối
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const navigate = useNavigate();

  // tải danh mục công nghệ để map id -> name
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/api/hr-request/technologies", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((list) => {
        const dict = {};
        (list || []).forEach((t) => (dict[t.id] = t.name));
        setTechDict(dict);
      })
      .catch(() => setTechDict({}));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && request) {
      setNote(request.note || "");
      setShowRejectModal(false); // mỗi lần mở lại thì quay về bước "chi tiết"
      setRejectReason("");
    }
  }, [isOpen, request]);

  const techRows = useMemo(() => {
    const arr = request?.techQuantities || [];
    return arr.map((t) => ({
      name: techDict[t.technologyId] || `#${t.technologyId}`,
      quantity: t.soLuong,
    }));
  }, [request?.techQuantities, techDict]);

  const createdAtText = useMemo(() => {
    if (!request?.createdAt) return "—";
    return new Date(request.createdAt).toLocaleString("vi-VN");
  }, [request?.createdAt]);

  const expectedDeliveryText = useMemo(() => {
    if (!request?.expectedDeliveryDate) return "—";
    return new Date(request.expectedDeliveryDate).toLocaleDateString("vi-VN");
  }, [request?.expectedDeliveryDate]);

  const totalCandidates = useMemo(() => {
    return techRows.reduce((sum, row) => sum + (row.quantity || 0), 0);
  }, [techRows]);

  // Map mã trạng thái -> label tiếng Việt
  const getStatusLabel = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "NEW":
        return "Đã gửi";
      case "PENDING":
        return "Đang chờ";
      case "IN_PROGRESS":
        return "Đang tiến hành";
      case "COMPLETED":
        return "Đã hoàn thành";
      case "CANCELED":
        return "Bị từ chối";
      default:
        return status || "Không rõ";
    }
  };

  const statusRaw = (request?.status || "").toUpperCase();
  const statusLabel = getStatusLabel(request?.status);

  const status = statusRaw;
  const isNew = status === "NEW";
  const isApproved = status === "APPROVED";
  const isCanceled = status === "CANCELED";

  // tách chuỗi "Người từ chối kế hoạch: X. Lý do: Y"
  const parsedReject = useMemo(() => {
    const raw = request?.rejectReason || "";
    if (!raw) return { by: "", reason: "" };

    const nameLabel = "Người từ chối kế hoạch:";
    const reasonLabel = "Lý do:";

    let by = "";
    let reason = raw.trim();

    const reasonIdx = raw.indexOf(reasonLabel);
    if (reasonIdx !== -1) {
      reason = raw.slice(reasonIdx + reasonLabel.length).trim();
    }

    const nameIdx = raw.indexOf(nameLabel);
    if (nameIdx !== -1) {
      const endIdx = reasonIdx === -1 ? raw.length : reasonIdx;
      const namePart = raw.slice(nameIdx + nameLabel.length, endIdx);
      by = namePart.replace(/[.\s]+$/g, "").trim();
    }

    return { by, reason };
  }, [request?.rejectReason]);

  const progressSteps = useMemo(() => {
    const createdBy = request?.createdByName || "Không rõ";
    const requestTitle = request?.requestTitle || "nhu cầu";
    const requestLabel = `nhu cầu "${requestTitle}"`;
    const approverName =
      request?.approvedByName || request?.updatedByName || "Người phê duyệt";

    const planName =
      request?.planName ||
      request?.plan?.planName ||
      request?.recruitmentPlanName ||
      request?.planTitle ||
      "";
    const planLabel = planName
      ? `kế hoạch "${planName}"`
      : "kế hoạch tuyển dụng";

    const planStatus = (request?.planStatus || request?.plan?.status || "")
      .toString()
      .toUpperCase();

    const planCreator =
      request?.planCreatedByName ||
      request?.plan?.createdByName ||
      approverName ||
      createdBy ||
      "Chưa thực hiện";

    const planApprover =
      request?.planApprovedByName ||
      request?.plan?.approvedByName ||
      approverName;

    const createdAt = request?.createdAt
      ? new Date(request.createdAt).toLocaleString("vi-VN")
      : "";

    const steps = [
      {
        key: "request",
        title: "Khởi tạo nhu cầu",
        status: "success",
        actor: createdBy,
        detail: createdAt
          ? `Tạo bởi ${createdBy} • ${createdAt}`
          : `Tạo bởi ${createdBy}`,
      },
      {
        key: "approve-request",
        title: "Phê duyệt nhu cầu",
        status: "pending",
        actor: "Chưa thực hiện",
        detail: `Chờ phê duyệt ${requestLabel}`,
      },
      {
        key: "plan-create",
        title: "Khởi tạo kế hoạch",
        status: "pending",
        actor: "Chưa thực hiện",
        detail: `Chờ ${requestLabel} được phê duyệt để lập kế hoạch mới`,
      },
      {
        key: "plan-approve",
        title: "Phê duyệt kế hoạch",
        status: "pending",
        actor: "Chưa thực hiện",
        detail: `Chờ phê duyệt ${planLabel} để triển khai tuyển dụng`,
      },
      {
        key: "candidate",
        title: "Quản lý ứng viên",
        status: "pending",
        actor: "Chưa thực hiện",
        detail: "Chờ kế hoạch được duyệt",
      },
      {
        key: "training",
        title: "Đào tạo",
        status: "pending",
        actor: "Chưa thực hiện",
        detail: "Chờ ứng viên đạt yêu cầu",
      },
    ];

    // ===== 1. ĐỔI THEO TRẠNG THÁI CỦA NHU CẦU (HrRequest) =====
    if (statusRaw === "APPROVED") {
      steps[1] = {
        ...steps[1],
        status: "success",
        actor: approverName,
        detail: `Phê duyệt ${requestLabel} bởi ${approverName}`,
      };
    } else if (statusRaw === "IN_PROGRESS") {
      steps[1] = {
        ...steps[1],
        status: "success",
        actor: approverName,
        detail: `Phê duyệt ${requestLabel} bởi ${approverName}`,
      };
      steps[2] = {
        ...steps[2],
        status: "success",
        actor: planCreator,
        detail: `${planLabel.charAt(0).toUpperCase()}${planLabel.slice(
          1
        )} đã được khởi tạo`,
      };
    } else if (statusRaw === "COMPLETED") {
      // ❗ Sửa tại đây: chỉ đánh hoàn thành tới PHÊ DUYỆT KẾ HOẠCH,
      // "Quản lý ứng viên" và "Đào tạo" vẫn để Đang chờ
      steps.forEach((s, idx) => {
        if (idx <= 3) {
          // 0: khởi tạo, 1: duyệt nhu cầu, 2: tạo KH, 3: duyệt KH
          steps[idx] = {
            ...s,
            status: "success",
            actor: idx === 0 ? createdBy : "Đã hoàn thành",
            detail: idx === 0 ? s.detail : "Giai đoạn đã hoàn tất",
          };
        } else if (idx === 4) {
          // Quản lý ứng viên
          steps[idx] = {
            ...s,
            status: "pending",
            actor: "Chưa thực hiện",
            detail: "Chờ triển khai quản lý ứng viên",
          };
        } else if (idx === 5) {
          // Đào tạo
          steps[idx] = {
            ...s,
            status: "pending",
            actor: "Chưa thực hiện",
            detail: "Chờ triển khai đào tạo",
          };
        }
      });
    } else if (statusRaw === "CANCELED") {
      const reasonLower = (parsedReject.reason || request?.rejectReason || "")
        .toLowerCase()
        .trim();
      let rejectIndex = 1;

      if (
        reasonLower.includes("phê duyệt nhu cầu") ||
        reasonLower.includes("nhu cầu")
      ) {
        rejectIndex = 1;
      } else if (reasonLower.includes("khởi tạo kế hoạch")) {
        rejectIndex = 2;
      } else if (
        reasonLower.includes("phê duyệt kế hoạch") ||
        reasonLower.includes("kế hoạch")
      ) {
        rejectIndex = 3;
      } else if (reasonLower.includes("ứng viên")) {
        rejectIndex = 4;
      } else if (reasonLower.includes("đào tạo")) {
        rejectIndex = 5;
      }

      const rejectActor =
        parsedReject.by ||
        request?.updatedByName ||
        request?.approvedByName ||
        request?.createdByName ||
        "Không rõ";

      steps.forEach((s, idx) => {
        if (idx < rejectIndex) {
          steps[idx] = { ...s, status: "success" };
        } else if (idx === rejectIndex) {
          steps[idx] = {
            ...s,
            status: "rejected",
            actor: rejectActor,
            detail:
              parsedReject.reason || request?.rejectReason || "Không rõ lý do",
            rejectReason:
              parsedReject.reason || request?.rejectReason || "Không rõ lý do",
          };
        } else {
          steps[idx] = { ...s, status: "pending" };
        }
      });
    }

    // ===== 2. GHI ĐÈ THEO TRẠNG THÁI KẾ HOẠCH (RecruitmentPlan) =====
    if (statusRaw !== "CANCELED" && planStatus) {
      const isPlanApproved = [
        "CONFIRMED",
        "APPROVED",
        "IN_PROGRESS",
        "COMPLETED",
      ].includes(planStatus);

      const isPlanRejected = ["REJECTED", "CANCELED"].includes(planStatus);

      // Nếu đã có kế hoạch thì coi như NHU CẦU ĐÃ ĐƯỢC PHÊ DUYỆT
      if (steps[1].status !== "success") {
        steps[1] = {
          ...steps[1],
          status: "success",
          actor: approverName,
          detail: `Phê duyệt ${requestLabel} để lập ${planLabel}`,
        };
      }

      // Khởi tạo kế hoạch
      steps[2] = {
        ...steps[2],
        status: "success",
        actor: planCreator,
        detail: `${planLabel.charAt(0).toUpperCase()}${planLabel.slice(
          1
        )} đã được khởi tạo`,
      };

      // Phê duyệt / Từ chối kế hoạch
      if (isPlanApproved) {
        steps[3] = {
          ...steps[3],
          status: "success",
          actor: planApprover || planCreator,
          detail: `${planLabel.charAt(0).toUpperCase()}${planLabel.slice(
            1
          )} đã được phê duyệt`,
        };
      } else if (isPlanRejected) {
        steps[3] = {
          ...steps[3],
          status: "rejected",
          actor: planApprover || planCreator || "Không rõ",
          detail:
            parsedReject.reason ||
            request?.rejectReason ||
            "Kế hoạch tuyển dụng đã bị từ chối.",
          rejectReason:
            parsedReject.reason ||
            request?.rejectReason ||
            "Kế hoạch tuyển dụng đã bị từ chối.",
        };
      } else {
        steps[3] = {
          ...steps[3],
          status: steps[3].status === "success" ? steps[3].status : "pending",
          actor: steps[3].actor || "Chưa thực hiện",
          detail: `Chờ phê duyệt ${planLabel}`,
        };
      }
    }

    return steps;
  }, [
    request?.createdAt,
    request?.createdByName,
    request?.approvedByName,
    request?.updatedByName,
    request?.requestTitle,
    request?.rejectReason,
    request?.planName,
    request?.plan?.planName,
    request?.recruitmentPlanName,
    request?.planTitle,
    request?.planStatus,
    request?.plan?.status,
    request?.planCreatedByName,
    request?.plan?.createdByName,
    request?.planApprovedByName,
    request?.plan?.approvedByName,
    statusRaw,
    parsedReject,
  ]);

  const readErrorMessage = async (res) => {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data?.message || text || "Có lỗi xảy ra.";
    } catch {
      return text || "Có lỗi xảy ra.";
    }
  };

  // =============== PHÊ DUYỆT =================
  const handleApprove = async () => {
    if (!request || !isNew) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8080/api/hr-request/${
        request.requestId
      }/approve?note=${encodeURIComponent(note || "")}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        if (res.status === 401)
          alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        else if (res.status === 403)
          alert("⚠️ Bạn không có quyền phê duyệt yêu cầu này.");
        else if (res.status === 409) alert(`⚠️ Không thể phê duyệt: ${msg}`);
        else if (res.status === 400)
          alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
        else alert(`⚠️ Lỗi khi phê duyệt yêu cầu: ${msg}`);
        onActionError?.(msg);
        return;
      }

      onActionSuccess?.();
      onClose();
      navigate(`/recruitment/plan?requestId=${request.requestId}`);
    } catch (err) {
      const msg = err?.message || "";
      alert(`⚠️ Lỗi mạng khi phê duyệt yêu cầu: ${msg}`);
      onActionError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // =============== BẮT ĐẦU TỪ CHỐI (mở bước 2) =================
  const handleStartReject = () => {
    if (!request || !isNew) return;
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =============== GỬI LÝ DO TỪ CHỐI =================
  const handleSubmitReject = async () => {
    if (!request || !isNew) return;
    if (!rejectReason.trim()) {
      alert("Lý do từ chối không được để trống.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/api/hr-request/${request.requestId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason: rejectReason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        if (res.status === 401)
          alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        else if (res.status === 403)
          alert("⚠️ Bạn không có quyền từ chối yêu cầu này.");
        else if (res.status === 409) alert(`⚠️ Không thể từ chối: ${msg}`);
        else if (res.status === 400) alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
        else alert(`⚠️ Lỗi khi từ chối yêu cầu: ${msg}`);
        onActionError?.(msg);
        return;
      }

      onActionSuccess?.();
      setShowRejectModal(false);
      onClose();
    } catch (err) {
      const msg = err?.message || "";
      alert(`⚠️ Lỗi mạng khi từ chối yêu cầu: ${msg}`);
      onActionError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const disableActions = loading || !isNew;
  const hasNote = note && note.trim().length > 0;

  return (
    <>
      {/* ====== BƯỚC 1: CHI TIẾT YÊU CẦU NHÂN SỰ ====== */}
      {!showRejectModal && (
        <div className="hrmodal-overlay">
          <div className="hrmodal-card">
            {/* Header */}
            <div className="hrmodal-header">
              <div>
                <h3 className="hrmodal-title">Chi tiết yêu cầu nhân sự</h3>
                <span
                  className={`status-pill status-${statusRaw.toLowerCase()}`}
                >
                  {statusLabel}
                </span>
              </div>
              <button
                className="hrmodal-close"
                onClick={onClose}
                aria-label="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="hrmodal-body">
              {/* khối thông tin chung */}
              <div className="request-overview">
                <div className="overview-top">
                  <div className="overview-heading">
                    <p className="overview-label">Thông tin yêu cầu</p>
                    <h4 className="overview-title">{request.requestTitle}</h4>
                    <p className="overview-sub">
                      Nhìn tổng quan về người gửi, thời gian và trạng thái
                    </p>
                  </div>
                  <div className="overview-status" aria-label="Trạng thái">
                    <span
                      className={`status-dot status-${statusRaw.toLowerCase()}`}
                    />
                    <span className="overview-status-text">{statusLabel}</span>
                  </div>
                </div>

                <dl className="overview-list">
                  <div className="overview-row">
                    <dt>Người gửi</dt>
                    <dd>{request.createdByName}</dd>
                  </div>
                  <div className="overview-row">
                    <dt>Ngày tạo</dt>
                    <dd>{createdAtText}</dd>
                  </div>
                  <div className="overview-row">
                    <dt>Ngày bàn giao dự kiến</dt>
                    <dd>{expectedDeliveryText}</dd>
                  </div>
                  <div className="overview-row">
                    <dt>Tổng số lượng ứng viên</dt>
                    <dd>{totalCandidates}</dd>
                  </div>
                </dl>
              </div>

              <div className="section-block progress-block">
                <div className="process-header">
                  <h4 className="process-title">Quy trình thực hiện</h4>
                  <span className="process-sub">
                    Tuân theo thứ tự bước (có thể xem người thực hiện và lý do)
                  </span>
                </div>

                <div className="process-timeline" role="list">
                  {progressSteps.map((step, idx) => {
                    const isLast = idx === progressSteps.length - 1;
                    const statusClass =
                      step.status === "success"
                        ? "timeline-success"
                        : step.status === "rejected"
                        ? "timeline-rejected"
                        : "timeline-pending";
                    const statusText =
                      step.status === "success"
                        ? "Đã hoàn thành"
                        : step.status === "rejected"
                        ? "Từ chối"
                        : "Đang chờ";

                    return (
                      <div
                        key={step.key}
                        className={`timeline-item ${statusClass}`}
                        role="listitem"
                        aria-label={step.title}
                      >
                        <div className="timeline-marker" aria-hidden>
                          <span className="timeline-icon">
                            {step.status === "success" && "✓"}
                            {step.status === "pending" && "•"}
                            {step.status === "rejected" && "✕"}
                          </span>
                          {!isLast && <span className="timeline-connector" />}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title-row">
                            <div className="timeline-title">{step.title}</div>
                            <span className={`timeline-badge ${statusClass}`}>
                              {statusText}
                            </span>
                          </div>
                          <div className="timeline-desc">{step.detail}</div>
                          {step.status === "rejected" && (
                            <div className="timeline-reject-reason">
                              <span className="reject-label-inline">
                                Lý do:
                              </span>
                              <span className="reject-text-inline">
                                {step.rejectReason ||
                                  step.detail ||
                                  "Không rõ lý do"}
                              </span>
                            </div>
                          )}
                          <div className="timeline-meta">
                            Người thực hiện: {step.actor}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú: chỉ hiển thị khi THỰC SỰ có ghi chú, và chỉ đọc */}
              {hasNote && (
                <div className="section-block">
                  <div className="section-header">
                    <h4>Ghi chú</h4>
                  </div>
                  <textarea
                    className="note-input note-readonly"
                    value={note}
                    readOnly
                    onFocus={(e) => e.target.blur()} // không cho focus/gõ
                  />
                </div>
              )}

              {(isApproved || isCanceled) && (
                <p className="hint-text">
                  {isApproved &&
                    "Yêu cầu đã được phê duyệt — thao tác “Từ chối / Phê duyệt” không khả dụng."}
                  {isCanceled &&
                    "Yêu cầu đã bị từ chối — thao tác “Từ chối / Phê duyệt” không khả dụng."}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="hrmodal-footer">
              <div className="footer-left" />
              <div className="footer-actions">
                <button
                  className={`btn-reject-main ${
                    disableActions ? "btn-disabled" : ""
                  }`}
                  onClick={handleStartReject}
                  disabled={disableActions}
                  title={
                    !isNew
                      ? "Chỉ trạng thái ĐÃ GỬI (NEW) mới được thao tác"
                      : undefined
                  }
                >
                  Từ chối
                </button>

                <button
                  className={`btn-approve-main ${
                    disableActions ? "btn-disabled" : ""
                  }`}
                  onClick={handleApprove}
                  disabled={disableActions}
                  title={
                    !isNew
                      ? "Chỉ trạng thái ĐÃ GỬI (NEW) mới được thao tác"
                      : undefined
                  }
                >
                  Phê duyệt và Khởi tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== BƯỚC 2: MODAL LÝ DO TỪ CHỐI ====== */}
      {showRejectModal && (
        <Modal
          title="Lý do Từ chối Nhu cầu"
          onClose={() => setShowRejectModal(false)}
          width={520}
        >
          <div className="reject-form">
            <label htmlFor="rejectReason" className="reject-label">
              Vui lòng nhập lý do từ chối nhu cầu:{" "}
              <span className="reject-plan-name">
                "{request.requestTitle}"
              </span>
            </label>
            <textarea
              id="rejectReason"
              className="reject-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do cụ thể, rõ ràng để người lập nhu cầu dễ dàng điều chỉnh..."
            />
          </div>
          <div className="modal-footer modal-footer-actions">
            <button
              className="modal-btn btn-secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Hủy
            </button>
            <button
              className="modal-btn btn-reject"
              onClick={handleSubmitReject}
              disabled={!rejectReason.trim() || loading}
            >
              Xác nhận từ chối
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
  