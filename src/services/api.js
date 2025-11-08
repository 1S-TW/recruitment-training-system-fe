import axios from 'axios';

// Tạo một instance Axios trỏ đến backend của bạn
const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Cổng backend Spring Boot
    withCredentials: true,
});

// (Sau này chúng ta sẽ thêm Interceptor ở đây để tự động gắn token)

export default api;