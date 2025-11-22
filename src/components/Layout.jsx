import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

function Layout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="app__main">
        <Header />
        <main className="app__container">{children}</main>
      </div>
    </div>
  );
}

export default Layout; // ✅ BẮT BUỘC CÓ DÒNG NÀY
