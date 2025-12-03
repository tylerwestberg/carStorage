import React, { useState, useEffect } from "react";
import { FiCheckSquare, FiTrash2, FiPlus } from "react-icons/fi";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const token = localStorage.getItem("token");

  const fetchTasks = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(await res.json());
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    await fetch("http://127.0.0.1:5000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    fetchTasks();
  };

  const toggleTask = async (id) => {
    await fetch(`http://127.0.0.1:5000/api/tasks/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`http://127.0.0.1:5000/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
        />
        <button className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition">
          <FiPlus /> Add
        </button>
      </form>

      <ul>
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg mb-2"
          >
            <span className={t.done ? "line-through text-gray-500" : ""}>{t.title}</span>
            <div className="flex gap-2">
              <button
                onClick={() => toggleTask(t.id)}
                className="p-2 rounded-lg bg-green-600 hover:bg-green-700"
              >
                <FiCheckSquare />
              </button>
              <button
                onClick={() => deleteTask(t.id)}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-700"
              >
                <FiTrash2 />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
