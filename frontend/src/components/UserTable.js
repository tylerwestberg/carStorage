import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("http://127.0.0.1:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email: `${name.replace(" ", "").toLowerCase()}@example.com`,
        password: "password123",
      }),
    });
    setName("");
    fetchUsers();
  };

  const deleteUser = async (id) => {
    await fetch(`http://127.0.0.1:5000/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Users</h2>

      <form onSubmit={addUser} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter user name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition">
          <FiPlus /> Add
        </button>
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 uppercase text-sm">
            <th className="pb-2">Name</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-b border-gray-800 hover:bg-gray-900/40 transition"
            >
              <td className="py-2">{u.name}</td>
              <td className="py-2 text-right">
                <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg mr-2">
                  <FiEdit />
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
