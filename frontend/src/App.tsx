import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // ================= LOGIN =================
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.status) {
        setError(data.message);
        return;
      }

      const userToken = data.data.token;
      localStorage.setItem("token", userToken);
      setToken(userToken);
      setError("");

    } catch {
      setError("Login failed");
    }
  };

  // ================= GET PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= ADD PRODUCT =================
  const handleAddProduct = async () => {
    await fetch(`${API_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        stock: Number(stock)
      })
    });

    setName("");
    setPrice("");
    setStock("");
    fetchProducts();
  };

  // ================= DELETE PRODUCT =================
  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchProducts();
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  // ================= LOGIN VIEW =================
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80">
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

          <input
            className="w-full border p-2 mb-3 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border p-2 mb-3 rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>

          <p className="text-red-500 mt-3 text-center">{error}</p>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Parfume Dashboard</h2>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setToken(null);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold">
          Total Products: {products.length}
        </h3>
        <h3 className="text-lg font-semibold">
          Total Stock: {totalStock}
        </h3>
      </div>

      {/* ADD PRODUCT */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h3 className="text-xl font-semibold mb-3">Add Product</h3>

        <div className="flex gap-3">
          <input
            className="border p-2 rounded w-full"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border p-2 rounded w-full"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="border p-2 rounded w-full"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <button
            onClick={handleAddProduct}
            className="bg-green-500 text-white px-4 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="grid md:grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-xl shadow"
          >
            <h4 className="text-lg font-bold">{p.name}</h4>
            <p>Rp {p.price}</p>
            <p>Stock: {p.stock}</p>

            <button
              onClick={() => handleDelete(p.id)}
              className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
