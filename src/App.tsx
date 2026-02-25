import { useState, useCallback } from 'react'
import './App.css'

interface Task {
  id: number
  text: string
  done: boolean
  category: Category
  createdAt: Date
}

type Category = 'work' | 'learning' | 'personal'
type Filter = 'all' | 'active' | 'done'

const CATEGORY_META: Record<Category, { label: string; color: string; icon: string }> = {
  work:     { label: 'Work',     color: '#0078d4', icon: '💼' },
  learning: { label: 'Learning', color: '#5c2d91', icon: '📚' },
  personal: { label: 'Personal', color: '#107c10', icon: '🌱' },
}

const DEMO_TASKS: Task[] = [
  { id: 1, text: 'Set up GitHub Copilot in VS Code',    done: true,  category: 'work',     createdAt: new Date() },
  { id: 2, text: 'Write code by describing your intent', done: true,  category: 'learning', createdAt: new Date() },
  { id: 3, text: 'Generate unit tests with Copilot',     done: false, category: 'work',     createdAt: new Date() },
  { id: 4, text: 'Explore Copilot Chat for refactoring', done: false, category: 'learning', createdAt: new Date() },
  { id: 5, text: 'Share vibecoding tips with the team',  done: false, category: 'personal', createdAt: new Date() },
]

let nextId = DEMO_TASKS.length + 1

export default function App() {
  const [tasks, setTasks]           = useState<Task[]>(DEMO_TASKS)
  const [input, setInput]           = useState('')
  const [category, setCategory]     = useState<Category>('work')
  const [filter, setFilter]         = useState<Filter>('all')
  const [filterCat, setFilterCat]   = useState<Category | 'all'>('all')

  const addTask = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setTasks(prev => [...prev, { id: nextId++, text, done: false, category, createdAt: new Date() }])
    setInput('')
  }, [input, category])

  const toggleTask = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const deleteTask = (id: number) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const clearDone = () => setTasks(prev => prev.filter(t => !t.done))

  const visible = tasks.filter(t => {
    const byStatus = filter === 'all' ? true : filter === 'done' ? t.done : !t.done
    const byCat = filterCat === 'all' ? true : t.category === filterCat
    return byStatus && byCat
  })

  const doneCount   = tasks.filter(t => t.done).length
  const totalCount  = tasks.length
  const progress    = totalCount ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="layout">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <svg className="ms-logo" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="1"  width="10" height="10" fill="#f25022"/>
              <rect x="12" y="1"  width="10" height="10" fill="#7fba00"/>
              <rect x="1"  y="12" width="10" height="10" fill="#00a4ef"/>
              <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
            </svg>
            <span className="brand-title">Vibecoding Demo</span>
          </div>
          <div className="header-meta">
            <span className="badge">Software Finland</span>
            <span className="badge badge-blue">× Microsoft</span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Hero ── */}
        <section className="hero">
          <h1 className="hero-title">Build with your vibe, not your keyboard 🎉</h1>
          <p className="hero-sub">
            Describe what you want&nbsp;→&nbsp;GitHub Copilot writes the code.&nbsp;
            <em>That's vibecoding.</em>
          </p>
        </section>

        {/* ── Stats ── */}
        <div className="stats-row">
          <Stat value={totalCount} label="Total tasks" color="var(--ms-blue)" />
          <Stat value={doneCount}  label="Completed"   color="var(--ms-green)" />
          <Stat value={totalCount - doneCount} label="Remaining" color="var(--ms-yellow)" />
          <div className="stat-card progress-card">
            <div className="progress-label">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* ── Add task ── */}
        <section className="add-card card">
          <h2 className="section-title">Add a task</h2>
          <div className="add-row">
            <input
              className="text-input"
              type="text"
              placeholder="Describe your next task…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <div className="cat-select-wrap">
              {(Object.keys(CATEGORY_META) as Category[]).map(c => (
                <button
                  key={c}
                  className={`cat-btn ${category === c ? 'cat-btn--active' : ''}`}
                  style={category === c ? { borderColor: CATEGORY_META[c].color, background: CATEGORY_META[c].color + '18' } : {}}
                  onClick={() => setCategory(c)}
                >
                  {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={addTask}>Add&nbsp;+</button>
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="filters-row">
          <div className="filter-group">
            {(['all', 'active', 'done'] as Filter[]).map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <button className={`filter-btn ${filterCat === 'all' ? 'filter-btn--active' : ''}`} onClick={() => setFilterCat('all')}>All</button>
            {(Object.keys(CATEGORY_META) as Category[]).map(c => (
              <button key={c} className={`filter-btn ${filterCat === c ? 'filter-btn--active' : ''}`} onClick={() => setFilterCat(c)}>
                {CATEGORY_META[c].icon}
              </button>
            ))}
          </div>
          {doneCount > 0 && (
            <button className="btn-ghost btn-sm" onClick={clearDone}>Clear done</button>
          )}
        </div>

        {/* ── Task list ── */}
        <section className="task-list card">
          {visible.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <p>No tasks here – add one above!</p>
            </div>
          ) : (
            visible.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Built at lightning speed with <strong>GitHub Copilot</strong> · Software Finland × Microsoft · 2025</p>
      </footer>
    </div>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const cat = CATEGORY_META[task.category]
  return (
    <div className={`task-row ${task.done ? 'task-row--done' : ''}`}>
      <button className={`checkbox ${task.done ? 'checkbox--checked' : ''}`} onClick={onToggle} aria-label="toggle task">
        {task.done && <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      <span className="task-text">{task.text}</span>
      <span className="task-cat" style={{ background: cat.color + '20', color: cat.color }}>
        {cat.icon} {cat.label}
      </span>
      <button className="delete-btn" onClick={onDelete} aria-label="delete task">✕</button>
    </div>
  )
}
