import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CarDashboard() {
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [formData, setFormData] = useState({
    color: "",
    make: "",
    model: "",
    year: "",
    notes: "",
    proj_pickup_date: "",
  });
  const [editId, setEditId] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);

  const token = localStorage.getItem("token") || "";
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const isAdmin = !!payload.is_admin;

  // ------------------------------
  // Fetch helpers
  // ------------------------------
  const fetchUsers = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/users");
    const data = await res.json();
    setUsers([{ id: "all", name: "All Users", email: "View all cars" }, ...data]);
    setSelectedUser("all");
  };

  const fetchCars = async (userId = null) => {
    let url = "http://127.0.0.1:5000/api/cars";
    if (isAdmin && userId && userId !== "all") url += `?user_id=${userId}`;
    else if (isAdmin && userId === "all") url += `?user_id=all`;
    const res = await fetch(url, { headers: { Authorization: token } });
    const data = await res.json();
    setCars(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else fetchCars();
  }, []);

  useEffect(() => {
    if (isAdmin && selectedUser) fetchCars(selectedUser);
  }, [selectedUser]);

  // ------------------------------
  // CRUD handlers
  // ------------------------------
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.make || !formData.model) {
      toast.warn("⚠️ Make and model are required.");
      return;
    }

    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `http://127.0.0.1:5000/api/cars/${editId}`
      : "http://127.0.0.1:5000/api/cars";

    const body =
      !editId && isAdmin && selectedUser && selectedUser !== "all"
        ? { ...formData, user_id: Number(selectedUser) }
        : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editId ? "✅ Car updated successfully!" : "🚗 Car added!");
        setFormData({
          color: "",
          make: "",
          model: "",
          year: "",
          notes: "",
          proj_pickup_date: "",
        });
        setEditId(null);
        isAdmin ? fetchCars(selectedUser) : fetchCars();
      } else {
        const err = await res.json();
        toast.error(`❌ ${err.error || "Failed to save car"}`);
      }
    } catch {
      toast.error("❌ Server error while saving car");
    }
  };

  const handleEdit = (car) => {
    setEditId(car.id);
    setFormData({
      color: car.color || "",
      make: car.make,
      model: car.model,
      year: car.year || "",
      notes: car.notes || "",
      proj_pickup_date: car.proj_pickup_date || "",
    });
    toast.info("✏️ Edit mode enabled");
  };

  const confirmDelete = (car) => {
    setCarToDelete(car);
    setShowConfirmModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!carToDelete) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/cars/${carToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      if (res.ok) {
        toast.info("🗑️ Car deleted");
        isAdmin ? fetchCars(selectedUser) : fetchCars();
      } else {
        toast.error("❌ Failed to delete car");
      }
    } catch {
      toast.error("❌ Server error deleting car");
    } finally {
      setShowConfirmModal(false);
      setCarToDelete(null);
    }
  };

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
  };

  const sortedCars = [...cars].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField] || "";
    const bVal = b[sortField] || "";
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const filteredCars = sortedCars.filter((car) =>
    Object.values(car).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white relative">
      <div className="max-w-6xl mx-auto pt-10 pb-16 px-4">
        <div className="bg-gray-900/90 p-6 rounded-2xl shadow-xl border border-gray-800 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-center mb-6">
            Car Storage Dashboard
          </h1>

          {isAdmin && (
            <div className="flex justify-center mb-6">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add/Edit Form */}
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-3 mb-4">
            {["color", "make", "model", "year", "notes", "proj_pickup_date"].map(
              (field) => (
                <input
                  key={field}
                  name={field}
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [e.target.name]: e.target.value,
                    }))
                  }
                  placeholder={field
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold"
          >
            {editId ? "Update Car" : "Add Car"}
          </button>

          {/* Search bar */}
          <div className="mt-6 mb-4">
            <input
              type="text"
              placeholder="Search by color, make, model, year, notes, or pickup date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse border border-gray-700 text-gray-200">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  {[
                    "color",
                    "make",
                    "model",
                    "year",
                    "notes",
                    "date_added",
                    "proj_pickup_date",
                  ].map((field) => (
                    <th
                      key={field}
                      className="border border-gray-700 p-2 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort(field)}
                    >
                      {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                      {sortField === field
                        ? sortOrder === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                  ))}
                  {isAdmin && selectedUser === "all" && (
                    <th className="border border-gray-700 p-2">Owner Info</th>
                  )}
                  <th className="border border-gray-700 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-800 transition">
                      <td className="border border-gray-700 p-2">{car.color}</td>
                      <td className="border border-gray-700 p-2">{car.make}</td>
                      <td className="border border-gray-700 p-2">{car.model}</td>
                      <td className="border border-gray-700 p-2">{car.year}</td>
                      <td className="border border-gray-700 p-2">{car.notes}</td>
                      <td className="border border-gray-700 p-2">
                        {car.date_added
                          ? new Date(car.date_added).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {car.proj_pickup_date || "-"}
                      </td>
                      {isAdmin && selectedUser === "all" && (
                        <td className="border border-gray-700 p-2 text-gray-300">
                          {car.user_name} <br />
                          <span className="text-sm text-gray-400">
                            {car.user_email}
                            {car.user_phone ? ` | ${car.user_phone}` : ""}
                          </span>
                        </td>
                      )}
                      <td className="border border-gray-700 p-2 space-x-2 text-right">
                        <button
                          onClick={() => handleEdit(car)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(car)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin && selectedUser === "all" ? 9 : 8}
                      className="text-center text-gray-400 py-4 italic"
                    >
                      No cars found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-80 text-center shadow-xl">
            <h2 className="text-xl font-semibold mb-3 text-white">Confirm Delete</h2>
            <p className="text-gray-300 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-red-400">
                {carToDelete?.make} {carToDelete?.model}
              </span>
              ?
            </p>
            <div className="flex justify-around">
              <button
                onClick={handleDeleteConfirmed}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
