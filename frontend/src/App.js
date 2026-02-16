import React, { useEffect, useMemo, useState } from "react";
import { getTasks, addTask, updateTask, deleteTask } from "./api";

// Enhanced Task Manager UI (No extra libraries)
// Works with Injee: http://localhost:4125/api/tasks

export default function App() {
  const [tasks, setTasks] = useState([]);

  // create form
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [file, setFile] = useState(null);
  const [deadline, setDeadline] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // UI state
  const [activeTab, setActiveTab] = useState("Tasks"); // Tasks | Analytics | About
  const [compactView, setCompactView] = useState(false);
  const [sortBy, setSortBy] = useState("Newest"); // Newest | Oldest | Priority

  // -----------------------------
  // Fetch
  // -----------------------------
  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // -----------------------------
  // File -> Base64
  // -----------------------------
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // -----------------------------
  // Add
  // -----------------------------
  const handleAddTask = async () => {
    if (!newTask.trim()) {
      alert("Please enter a task title!");
      return;
    }

    const taskData = {
      title: newTask.trim(),
      priority,
      completed: false,
      deadline: deadline || null,
    };

    try {
      if (file) {
        const base64 = await fileToBase64(file);
        taskData.attachment = {
          name: file.name,
          type: file.type,
          data: base64,
        };
      }

      await addTask(taskData);

      setNewTask("");
      setPriority("Medium");
      setFile(null);
      setDeadline("");

      fetchTasks();
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  // -----------------------------
  // Toggle
  // -----------------------------
  const handleToggleComplete = async (task) => {
    try {
      await updateTask(task.id, { ...task, completed: !task.completed });
      fetchTasks();
    } catch (err) {
      console.error("Error toggling:", err);
    }
  };

  // -----------------------------
  // Edit
  // -----------------------------
  const handleEditTask = async (task) => {
    const newTitle = prompt("Edit task title:", task.title);
    if (!newTitle || !newTitle.trim()) return;

    try {
      await updateTask(task.id, { ...task, title: newTitle.trim() });
      fetchTasks();
    } catch (err) {
      console.error("Error editing:", err);
    }
  };

  // -----------------------------
  // Delete
  // -----------------------------
  const handleDeleteTask = async (id) => {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;

    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // -----------------------------
  // Extra Features
  // -----------------------------
  const clearCompleted = async () => {
    const completed = tasks.filter((t) => t.completed);
    if (completed.length === 0) return alert("No completed tasks to clear.");

    const ok = window.confirm(`Clear ${completed.length} completed tasks?`);
    if (!ok) return;

    try {
      for (const t of completed) {
        await deleteTask(t.id);
      }
      fetchTasks();
    } catch (err) {
      console.error("Error clearing completed:", err);
    }
  };

  const markAll = async (value) => {
    const list = tasks.filter((t) => t.completed !== value);
    if (list.length === 0) return;

    const ok = window.confirm(
      value
        ? `Mark ${list.length} tasks as completed?`
        : `Mark ${list.length} tasks as pending?`
    );
    if (!ok) return;

    try {
      for (const t of list) {
        await updateTask(t.id, { ...t, completed: value });
      }
      fetchTasks();
    } catch (err) {
      console.error("Error markAll:", err);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks-export.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  // -----------------------------
  // Derived Data
  // -----------------------------
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    const high = tasks.filter((t) => t.priority === "High").length;
    const med = tasks.filter((t) => t.priority === "Medium").length;
    const low = tasks.filter((t) => t.priority === "Low").length;

    return { total, completed, pending, high, med, low };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // search
    if (search.trim()) {
      list = list.filter((t) =>
        (t.title || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    // status
    if (statusFilter === "Completed") list = list.filter((t) => t.completed);
    if (statusFilter === "Pending") list = list.filter((t) => !t.completed);

    // priority
    if (priorityFilter !== "All")
      list = list.filter((t) => t.priority === priorityFilter);

    // sort
    if (sortBy === "Newest") {
      list.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
    }
    if (sortBy === "Oldest") {
      list.sort((a, b) =>
        (a.created_at || "").localeCompare(b.created_at || "")
      );
    }
    if (sortBy === "Priority") {
      const rank = { High: 3, Medium: 2, Low: 1 };
      list.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0));
    }

    return list;
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  // -----------------------------
  // UI Helpers
  // -----------------------------
  const pill = (text, tone) => {
    const map = {
      gray: { bg: "#eef2ff", fg: "#3730a3", bd: "#c7d2fe" },
      red: { bg: "#fff1f2", fg: "#9f1239", bd: "#fecdd3" },
      orange: { bg: "#fff7ed", fg: "#9a3412", bd: "#fed7aa" },
      green: { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" },
      blue: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    };

    const c = map[tone] || map.gray;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: 999,
          background: c.bg,
          color: c.fg,
          border: `1px solid ${c.bd}`,
          fontSize: 12,
          fontWeight: 700,
          marginRight: 8,
        }}
      >
        {text}
      </span>
    );
  };

  const priorityTone = (p) => {
    if (p === "High") return "red";
    if (p === "Medium") return "orange";
    return "green";
  };

  const getDeadlineStatus = (task) => {
    if (!task.deadline) return null;

    const now = new Date();
    const d = new Date(task.deadline);

    const diffMs = d - now;
    const diffMin = Math.floor(diffMs / 60000);

    if (task.completed) return { text: "Completed", tone: "green" };

    if (diffMin < 0) return { text: "Overdue", tone: "red" };
    if (diffMin <= 60)
      return { text: `Due Soon (${diffMin} min)`, tone: "orange" };

    return { text: d.toLocaleString(), tone: "blue" };
  };

  // -----------------------------
  // Deadline Reminder Alerts
  // -----------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      tasks.forEach((t) => {
        if (!t.deadline) return;
        if (t.completed) return;

        const d = new Date(t.deadline);
        const diffMin = Math.floor((d - now) / 60000);

        if (diffMin === 30) {
          alert(`⏰ Reminder: "${t.title}" deadline in 30 minutes!`);
        }

        if (diffMin === 5) {
          alert(`⚠️ Hurry! "${t.title}" deadline in 5 minutes!`);
        }
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [tasks]);

  // -----------------------------
  // Styles
  // -----------------------------
  const S = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(1200px 700px at 10% 10%, #e0f2fe 0%, rgba(224,242,254,0) 55%), radial-gradient(900px 600px at 90% 0%, #ede9fe 0%, rgba(237,233,254,0) 50%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      padding: 18,
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      color: "#0f172a",
    },
    shell: { maxWidth: 1150, margin: "0 auto" },
    nav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 16px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(148,163,184,0.35)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
      backdropFilter: "blur(10px)",
      position: "sticky",
      top: 12,
      zIndex: 10,
    },
    brand: { display: "flex", alignItems: "center", gap: 10 },
    logo: {
      width: 40,
      height: 45,
      borderRadius: 14,
      background: "linear-gradient(135deg, #4f46e5 0%, #22c55e 100%)",
      display: "grid",
      placeItems: "center",
      color: "white",
      boxShadow: "0 14px 35px rgba(79,70,229,0.25)",
      fontWeight: 900,
    },
    h1: {
      fontSize: 18,
      lineHeight: 1.1,
      margin: 0,
      fontWeight: 900,
      letterSpacing: "-0.02em",
    },
    sub: {
      margin: 0,
      marginTop: 3,
      fontSize: 12,
      color: "#475569",
      fontWeight: 600,
    },
    tabs: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    tabBtn: (active) => ({
      border: "1px solid rgba(148,163,184,0.35)",
      background: active
        ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
        : "white",
      color: active ? "white" : "#0f172a",
      padding: "9px 12px",
      borderRadius: 999,
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: active ? "0 12px 30px rgba(79,70,229,0.25)" : "none",
    }),
    navRight: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    btn: (variant) => {
      const map = {
        primary: {
          bg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          fg: "white",
          bd: "transparent",
        },
        ghost: {
          bg: "white",
          fg: "#0f172a",
          bd: "rgba(148,163,184,0.35)",
        },
        danger: { bg: "#fff1f2", fg: "#9f1239", bd: "#fecdd3" },
      };

      const c = map[variant] || map.ghost;

      return {
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
        padding: "10px 12px",
        borderRadius: 12,
        fontWeight: 900,
        cursor: "pointer",
        boxShadow:
          variant === "primary" ? "0 16px 40px rgba(79,70,229,0.25)" : "none",
      };
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginTop: 16,
    },
    card: {
      background: "rgba(255,255,255,0.78)",
      border: "1px solid rgba(148,163,184,0.35)",
      borderRadius: 18,
      boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
      padding: 16,
      backdropFilter: "blur(10px)",
    },
    cardTitle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    cardH: {
      margin: 0,
      fontSize: 16,
      fontWeight: 900,
      letterSpacing: "-0.02em",
    },
    label: {
      fontSize: 12,
      fontWeight: 800,
      color: "#334155",
      marginBottom: 6,
      display: "block",
    },
    input: {
      width: "95%",
      padding: "12px 12px",
      borderRadius: 14,
      border: "1px solid rgba(148,163,184,0.45)",
      outline: "none",
      fontWeight: 700,
      background: "rgba(255,255,255,0.9)",
    },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
      marginTop: 12,
    },
    stat: {
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.35)",
      padding: "14px 12px",
      textAlign: "center",
    },
    statNum: { fontSize: 22, fontWeight: 950, letterSpacing: "-0.02em" },
    statLbl: { marginTop: 2, fontSize: 12, color: "#475569", fontWeight: 800 },
    listCard: { marginTop: 16 },
    taskRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: compactView ? "12px 12px" : "16px 14px",
      borderRadius: 18,
      border: "1px solid rgba(148,163,184,0.35)",
      background: "rgba(255,255,255,0.9)",
      marginBottom: 12,
    },
    taskLeft: {
      display: "flex",
      alignItems: compactView ? "center" : "flex-start",
      gap: 12,
      minWidth: 0,
    },
    checkbox: {
      width: 16,
      height: 18,
      marginTop: compactView ? 0 : 4,
      cursor: "pointer",
    },
    taskTitle: (done) => ({
      fontSize: 16,
      fontWeight: 950,
      margin: 0,
      textDecoration: done ? "line-through" : "none",
      color: done ? "#64748b" : "#0f172a",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 350,
    }),
    taskMeta: {
      marginTop: compactView ? 0 : 8,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    taskActions: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    smallBtn: (variant) => {
      const base = S.btn(variant);
      return { ...base, padding: "9px 10px", borderRadius: 12, fontWeight: 900 };
    },
    footer: {
      marginTop: 16,
      textAlign: "center",
      color: "#64748b",
      fontWeight: 700,
      fontSize: 12,
    },
  };

  // -----------------------------
  // Sections
  // -----------------------------
  const TasksTab = () => (
    <>
      <div style={S.grid}>
        {/* Create */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <h2 style={S.cardH}>➕ Create a Task</h2>
            {pill("/api/tasks", "blue")}
          </div>

          <label style={S.label}>Task Title</label>
          <input
            style={S.input}
            placeholder="Eg: Finish ML assignment..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />

          <div style={{ height: 12 }} />

          <label style={S.label}>Deadline (Date & Time)</label>
          <input
            style={S.input}
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <div style={{ height: 12 }} />

          <div style={S.row2}>
            <div>
              <label style={S.label}>Priority</label>
              <select
                style={S.input}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Attachment (Optional)</label>
              <input
                style={S.input}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div style={{ height: 14 }} />

          <button style={S.btn("primary")} onClick={handleAddTask}>
            Add Task
          </button>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={S.btn("ghost")} onClick={() => markAll(true)}>
              ✅ Mark All Completed
            </button>
            <button style={S.btn("ghost")} onClick={() => markAll(false)}>
              ↩️ Mark All Pending
            </button>
            <button style={S.btn("danger")} onClick={clearCompleted}>
              🧹 Clear Completed
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <h2 style={S.cardH}>🔎 Search & Filter</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pill(`Total: ${stats.total}`, "gray")}
              {pill(`Done: ${stats.completed}`, "green")}
              {pill(`Pending: ${stats.pending}`, "orange")}
            </div>
          </div>

          <label style={S.label}>Search by Title</label>
          <input
            style={S.input}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={{ height: 12 }} />

          <div style={S.row2}>
            <div>
              <label style={S.label}>Status</label>
              <select
                style={S.input}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Priority</label>
              <select
                style={S.input}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={S.row2}>
            <div>
              <label style={S.label}>Sort By</label>
              <select
                style={S.input}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Newest</option>
                <option>Oldest</option>
                <option>Priority</option>
              </select>
            </div>

            <div>
              <label style={S.label}>View</label>
              <button style={S.btn("ghost")} onClick={() => setCompactView((v) => !v)}>
                {compactView ? "📄 Comfortable" : "⚡ Compact"}
              </button>
            </div>
          </div>

          <div style={S.stats}>
            <div style={S.stat}>
              <div style={S.statNum}>{stats.high}</div>
              <div style={S.statLbl}>High Priority</div>
            </div>
            <div style={S.stat}>
              <div style={S.statNum}>{stats.med}</div>
              <div style={S.statLbl}>Medium Priority</div>
            </div>
            <div style={S.stat}>
              <div style={S.statNum}>{stats.low}</div>
              <div style={S.statLbl}>Low Priority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ ...S.card, ...S.listCard }}>
        <div style={S.cardTitle}>
          <h2 style={S.cardH}>📌 Tasks</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={S.btn("ghost")} onClick={exportJSON}>
              ⬇️ Export JSON
            </button>
            <button style={S.btn("ghost")} onClick={fetchTasks}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: "1px dashed rgba(148,163,184,0.6)",
              background: "rgba(255,255,255,0.6)",
              color: "#475569",
              fontWeight: 800,
            }}
          >
            No tasks found. Try adding one ✨
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={S.taskRow}>
              <div style={S.taskLeft}>
                <input
                  type="checkbox"
                  style={S.checkbox}
                  checked={!!task.completed}
                  onChange={() => handleToggleComplete(task)}
                />

                <div style={{ minWidth: 0 }}>
                  <p style={S.taskTitle(task.completed)}>{task.title}</p>

                  <div style={S.taskMeta}>
                    {pill(task.priority || "Medium", priorityTone(task.priority))}
                    {pill(
                      task.completed ? "Completed" : "Pending",
                      task.completed ? "green" : "gray"
                    )}

                    {task.deadline && (() => {
                      const ds = getDeadlineStatus(task);
                      return pill(`⏰ ${ds.text}`, ds.tone);
                    })()}

                    {task.attachment?.data && (
                      <a
                        href={task.attachment.data}
                        download={task.attachment.name}
                        style={{ textDecoration: "none" }}
                      >
                        {pill(`📎 ${task.attachment.name}`, "blue")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={S.taskActions}>
                <button style={S.smallBtn("ghost")} onClick={() => handleEditTask(task)}>
                  ✏️ Edit
                </button>
                <button style={S.smallBtn("danger")} onClick={() => handleDeleteTask(task.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={S.footer}>
        Built with ❤️ using React + Injee API (<b>/api/tasks</b>)
      </div>
    </>
  );

  const AnalyticsTab = () => (
    <div style={{ ...S.card, marginTop: 16 }}>
      <div style={S.cardTitle}>
        <h2 style={S.cardH}>📊 Analytics</h2>
        {pill("Live Stats", "blue")}
      </div>

      <div style={S.stats}>
        <div style={S.stat}>
          <div style={S.statNum}>{stats.total}</div>
          <div style={S.statLbl}>Total Tasks</div>
        </div>
        <div style={S.stat}>
          <div style={S.statNum}>{stats.completed}</div>
          <div style={S.statLbl}>Completed</div>
        </div>
        <div style={S.stat}>
          <div style={S.statNum}>{stats.pending}</div>
          <div style={S.statLbl}>Pending</div>
        </div>
      </div>

      <div style={S.footer}>
        Tip: Analytics is computed from tasks already stored in Injee.
      </div>
    </div>
  );

  const AboutTab = () => (
    <div style={{ ...S.card, marginTop: 16 }}>
      <div style={S.cardTitle}>
        <h2 style={S.cardH}>ℹ️ About</h2>
        {pill("Mini Project", "gray")}
      </div>

      <div style={{ color: "#334155", fontWeight: 700, lineHeight: 1.7 }}>
        <p style={{ marginTop: 0 }}>
          <b>Enhanced Task Manager</b> is a mini full-stack project.
          The frontend is built using <b>React</b> and the backend is <b>Injee</b>.
        </p>

        <ul>
          <li>Backend API: <b>http://localhost:4125/api/tasks</b></li>
          <li>Supports CRUD, search, filters, and attachments</li>
          <li>Deadlines stored as Date-Time</li>
          <li>Popup reminders before deadline (30 min & 5 min)</li>
        </ul>
      </div>

      <div style={S.footer}>Made for demo / exam use ✨</div>
    </div>
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={S.page}>
      <div style={S.shell}>
        {/* Navbar */}
        <div style={S.nav}>
          <div style={S.brand}>
            <div style={S.logo}>TM</div>
            <div>
              <h1 style={S.h1}>Enhanced Task Management System </h1>
              <p style={S.sub}>
                React Frontend + Injee Backend • Priority • Search • Attachments • Filters • Deadlines
              </p>
            </div>
          </div>

          <div style={S.tabs}>
            <button style={S.tabBtn(activeTab === "Tasks")} onClick={() => setActiveTab("Tasks")}>
              🧾 Tasks
            </button>
            <button
              style={S.tabBtn(activeTab === "Analytics")}
              onClick={() => setActiveTab("Analytics")}
            >
              📊 Analytics
            </button>
            <button style={S.tabBtn(activeTab === "About")} onClick={() => setActiveTab("About")}>
              ℹ️ About
            </button>
          </div>

          <div style={S.navRight}>
            <button style={S.btn("ghost")} onClick={fetchTasks}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "Tasks" && TasksTab()}
        {activeTab === "Analytics" && AnalyticsTab()}
        {activeTab === "About" && AboutTab()}
      </div>
    </div>
  );
}
