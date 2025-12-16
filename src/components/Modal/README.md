# Modal Design System

Hệ thống modal thống nhất cho recruitment-training-system với thiết kế chuyên nghiệp giống như phần admin.

## Tính năng chính

- ✅ **Thiết kế thống nhất**: Màu sắc và giao diện giống admin
- ✅ **Responsive**: Tối ưu cho mobile và desktop
- ✅ **Accessibility**: Hỗ trợ screen reader và keyboard navigation
- ✅ **Customizable**: Dễ dàng tùy chỉnh kích thước và style
- ✅ **Focus management**: Tự động quản lý focus khi mở/đóng modal

## Cách sử dụng

### 1. Import components

```jsx
import { BaseModal, ModalFooter } from './components/Modal';
```

### 2. Sử dụng BaseModal cơ bản

```jsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BaseModal
      isOpen={isOpen}
      title="Tiêu đề modal"
      onClose={() => setIsOpen(false)}
      size="md"
    >
      <p>Nội dung modal của bạn</p>
    </BaseModal>
  );
}
```

### 3. Sử dụng với ModalFooter

```jsx
<BaseModal
  isOpen={isOpen}
  title="Xác nhận hành động"
  onClose={() => setIsOpen(false)}
  size="sm"
>
  <p>Bạn có chắc chắn muốn thực hiện hành động này?</p>
  
  <ModalFooter
    secondaryAction={{
      label: "Hủy",
      onClick: () => setIsOpen(false)
    }}
    primaryAction={{
      label: "Xác nhận",
      onClick: handleConfirm,
      loading: isLoading
    }}
  />
</BaseModal>
```

### 4. Form modal với validation

```jsx
<BaseModal
  isOpen={isOpen}
  title="Thêm người dùng"
  onClose={() => setIsOpen(false)}
  size="lg"
>
  <form onSubmit={handleSubmit}>
    <div className="modal-form-group">
      <label className="modal-form-label">Họ và tên *</label>
      <input
        className={`modal-form-input ${errors.name ? "error" : ""}`}
        value={formData.name}
        onChange={handleChange}
        required
      />
      {errors.name && <span className="modal-error-message">{errors.name}</span>}
    </div>
    
    <div className="modal-form-group">
      <label className="modal-form-label">Email *</label>
      <input
        type="email"
        className={`modal-form-input ${errors.email ? "error" : ""}`}
        value={formData.email}
        onChange={handleChange}
        required
      />
      {errors.email && <span className="modal-error-message">{errors.email}</span>}
    </div>

    <ModalFooter
      secondaryAction={{
        label: "Hủy",
        onClick: () => setIsOpen(false)
      }}
      primaryAction={{
        label: "Lưu",
        onClick: handleSubmit,
        type: "submit",
        loading: isLoading
      }}
    />
  </form>
</BaseModal>
```

## Props API

### BaseModal Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `isOpen` | `boolean` | - | Trạng thái hiển thị modal |
| `onClose` | `function` | - | Callback khi đóng modal |
| `title` | `string` | - | Tiêu đề modal |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Kích thước modal |
| `className` | `string` | `''` | CSS class bổ sung |
| `children` | `ReactNode` | - | Nội dung modal |
| `showCloseButton` | `boolean` | `true` | Hiển thị nút đóng |
| `closeOnBackdrop` | `boolean` | `true` | Đóng khi click backdrop |
| `closeOnEscape` | `boolean` | `true` | Đóng khi nhấn Escape |

### ModalFooter Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `primaryAction` | `ActionConfig` | - | Nút hành động chính |
| `secondaryAction` | `ActionConfig` | - | Nút hành động phụ |
| `variant` | `'primary' \| 'light'` | `'primary'` | Kiểu footer |
| `children` | `ReactNode` | - | Nội dung custom |

### ActionConfig

```typescript
interface ActionConfig {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}
```

## CSS Classes

### Form Elements

- `modal-form-group`: Container cho form field
- `modal-form-label`: Label cho input
- `modal-form-input`: Input field
- `modal-form-select`: Select dropdown
- `modal-form-textarea`: Textarea
- `modal-error-message`: Thông báo lỗi

### Layout

- `modal-form-grid`: Grid layout 2 cột
- `modal-form-row`: Flex layout ngang
- `full-width`: Chiếm toàn bộ chiều rộng

### Alerts

- `modal-alert alert-success`: Thông báo thành công
- `modal-alert alert-error`: Thông báo lỗi
- `modal-alert alert-warning`: Thông báo cảnh báo
- `modal-alert alert-info`: Thông báo thông tin

## Kích thước Modal

- `sm`: 400px - Cho confirm dialog, form đơn giản
- `md`: 600px - Mặc định, form trung bình
- `lg`: 800px - Form phức tạp, nhiều field
- `xl`: 1200px - Form rất lớn, bảng dữ liệu

## Accessibility

Modal system tự động hỗ trợ:

- **Focus trapping**: Focus bị giữ trong modal
- **Focus restoration**: Trả focus về element trước đó khi đóng
- **Screen reader**: Thông báo khi mở modal
- **Keyboard navigation**: Tab, Shift+Tab, Escape
- **ARIA attributes**: Proper roles và labels

## Migration từ Modal cũ

### Trước

```jsx
import Modal from './Modal';

<Modal
  title="Tiêu đề"
  onClose={onClose}
  width={500}
>
  <div>Nội dung</div>
</Modal>
```

### Sau

```jsx
import { BaseModal } from './Modal';

<BaseModal
  isOpen={isOpen}
  title="Tiêu đề"
  onClose={onClose}
  size="sm"
>
  <div>Nội dung</div>
</BaseModal>
```

## Troubleshooting

### Modal không hiển thị
- Kiểm tra `isOpen={true}`
- Đảm bảo modal được render trong DOM

### Styling không đúng
- Import đầy đủ CSS files:
  ```jsx
  import "../../styles/modal-system.css";
  import "../../styles/modal-components.css";
  import "../../styles/modal-responsive.css";
  ```

### Focus không hoạt động
- Đảm bảo modal có focusable elements
- Kiểm tra `tabIndex` attributes

### Mobile không responsive
- Kiểm tra viewport meta tag
- Đảm bảo CSS responsive được load