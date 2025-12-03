import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone_number: "",
    is_admin: false,
  });
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    is_admin: false,
  });

  const token = localStorage.getItem("token") || "";
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const isAdmin = !!payload.is_admin;
  const currentUserId = payload.id;

  const fetchUsers = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/users");
    const data = await res.json();
    setUsers(data);
    // Default the dropdown to the logged-in user (so admins see themselves first)
    if (!selectedUser) {
    const defaultId = currentUserId || data[0]?.id;
    setSelectedUser(defaultId ? String(defaultId) : "");
    }
  };

  const fetchUserData = async (id) => {
    const res = await fetch("http://127.0.0.1:5000/api/users");
    const allUsers = await res.json();
    const user = allUsers.find((u) => u.id === Number(id));
    if (user)
      setEditData({
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || "",
        is_admin: user.is_admin,
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) fetchUserData(selectedUser);
  }, [selectedUser]);

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });
  const handleNewChange = (e) =>
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });

  const toggleEditAdmin = () =>
    setEditData((prev) => ({ ...prev, is_admin: !prev.is_admin }));
  const toggleNewAdmin = () =>
    setNewUserData((prev) => ({ ...prev, is_admin: !prev.is_admin }));

  const saveEdit = async () => {
    try {
      await fetch(`http://127.0.0.1:5000/api/update_user/${selectedUser}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(editData),
      });
      toast.success("✅ User updated successfully!");
      fetchUsers();
    } catch (err) {
      toast.error("❌ Error updating user");
    }
  };

  const deleteUser = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete this user?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/api/users/${selectedUser}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      toast.info("🗑️ User deleted");
      fetchUsers();
    } catch (err) {
      toast.error("❌ Failed to delete user");
    }
  };

  const addUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.warn("⚠️ Please fill out all required fields");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(newUserData),
      });

      if (res.ok) {
        toast.success("✅ User added successfully!");
        setNewUserData({
          name: "",
          email: "",
          phone_number: "",
          password: "",
          is_admin: false,
        });
        fetchUsers();
      } else {
        const errData = await res.json();
        toast.error(`❌ ${errData.error || "Failed to add user"}`);
      }
    } catch (err) {
      toast.error("❌ Error adding user");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* ------------------ USER MANAGEMENT ------------------ */}
        <div className="bg-gray-900/90 p-6 rounded-xl shadow-lg border border-gray-800">
          <h1 className="text-3xl font-bold mb-6 text-center">User Management</h1>

          {isAdmin && (
            <div className="mb-4 flex justify-between items-center">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600 w-full"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) {u.is_admin ? "⭐" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={editData.name || ""}
              onChange={handleEditChange}
              placeholder="Name"
              className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
            />
            <input
              name="email"
              value={editData.email || ""}
              onChange={handleEditChange}
              placeholder="Email"
              className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
            />
            <input
              name="phone_number"
              value={editData.phone_number || ""}
              onChange={handleEditChange}
              placeholder="Phone Number"
              className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600 md:col-span-2"
            />
          </div>

      

          {isAdmin && (
            <div className="flex items-center gap-3 mt-5">
              <input
                type="checkbox"
                checked={editData.is_admin}
                onChange={toggleEditAdmin}
                className="w-5 h-5 accent-blue-600"
              />
              <label className="text-gray-300 font-medium">
                Grant Admin Privileges
              </label>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={saveEdit}
              className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold mr-2"
            >
              Save Changes
            </button>
            {isAdmin && (
              <button
                onClick={deleteUser}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
              >
                Delete User
              </button>
            )}
          </div>
        </div>

        {/* ------------------ ADD NEW USER ------------------ */}
        {isAdmin && (
          <div className="bg-gray-900/90 p-6 rounded-xl shadow-lg border border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-center">Add New User</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="name"
                value={newUserData.name}
                onChange={handleNewChange}
                placeholder="Name"
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
              />
              <input
                name="email"
                value={newUserData.email}
                onChange={handleNewChange}
                placeholder="Email"
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
              />
              <input
                name="phone_number"
                value={newUserData.phone_number}
                onChange={handleNewChange}
                placeholder="Phone Number"
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
              />
              <input
                name="password"
                type="password"
                value={newUserData.password}
                onChange={handleNewChange}
                placeholder="Password"
                className="p-2 rounded-lg bg-gray-800 text-white border border-gray-600"
              />
            </div>

            <div className="flex items-center gap-3 mt-5">
              <input
                type="checkbox"
                checked={newUserData.is_admin}
                onChange={toggleNewAdmin}
                className="w-5 h-5 accent-blue-600"
              />
              <label className="text-gray-300 font-medium">
                Grant Admin Privileges
              </label>
            </div>

            <button
              onClick={addUser}
              className="w-full mt-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
            >
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Toast container */}
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
