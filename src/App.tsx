import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { User, Task, ViewMode, Results } from './types';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import EditorScreen from './components/EditorScreen';
import SettingsScreen from './components/SettingsScreen';
import LoadingScreen from './components/LoadingScreen';
import ExecutionsScreen from './components/ExecutionsScreen';

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [, setUser] = useState<User | null>(null);
    const [authStatus, setAuthStatus] = useState<'checking' | 'login' | 'setup' | 'authenticated'>('checking');

    // Auth Screen State
    const [authError, setAuthError] = useState('');

    // Dashboard State
    const [tasks, setTasks] = useState<Task[]>([]);

    // Editor State
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [editorView, setEditorView] = useState<ViewMode>('visual');
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState<Results | null>(null);
    const [saveMsg, setSaveMsg] = useState('');

    const [centerAlert, setCenterAlert] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);
    const [centerConfirm, setCenterConfirm] = useState<{ message: string } | null>(null);
    const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
    const showAlert = (message: string, tone: 'success' | 'error' = 'success') => {
        setCenterAlert({ message, tone });
        if (tone === 'success') {
            setTimeout(() => {
                setCenterAlert((prev) => (prev && prev.message === message ? null : prev));
            }, 2000);
        }
    };
    const requestConfirm = (message: string) => {
        return new Promise<boolean>((resolve) => {
            confirmResolverRef.current = resolve;
            setCenterConfirm({ message });
        });
    };
    const closeConfirm = (result: boolean) => {
        const resolver = confirmResolverRef.current;
        confirmResolverRef.current = null;
        setCenterConfirm(null);
        if (resolver) resolver(result);
    };
    const formatLabel = (value: string) => value ? value[0].toUpperCase() + value.slice(1) : value;


    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (!location.pathname.startsWith('/tasks') && editorView === 'history') {
            setEditorView('visual');
        }
    }, [location.pathname, editorView]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.authenticated) {
                setUser(data.user);
                setAuthStatus('authenticated');
                loadTasks();
            } else {
                const sRes = await fetch('/api/auth/check-setup');
                const sData = await sRes.json();
                setAuthStatus(sData.setupRequired ? 'setup' : 'login');
            }
        } catch (e) {
            setAuthStatus('login');
        }
    };

    const handleAuthSubmit = async (email: string, pass: string, name?: string, passConfirm?: string) => {
        if (!email || !pass) return;
        if (authStatus === 'setup' && (!name || pass !== passConfirm)) {
            setAuthError(name ? "Passwords do not match" : "Name required");
            return;
        }

        const endpoint = authStatus === 'setup' ? '/api/auth/setup' : '/api/auth/login';
        const payload = authStatus === 'setup'
            ? { name, email, password: pass }
            : { email, password: pass };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setAuthError('');
                await checkAuth();
                navigate('/');
            } else {
                setAuthError(authStatus === 'setup' ? "Setup failed" : "Invalid credentials");
            }
        } catch (e) {
            setAuthError("Network error");
        }
    };

    const loadTasks = async () => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            const sorted = [...data].sort((a: Task, b: Task) => (b.last_opened || 0) - (a.last_opened || 0));
            setTasks(sorted);
            return sorted;
        } catch (e) {
            console.error("Failed to load tasks", e);
            return [];
        }
    };

    const logout = async () => {
        const confirmed = await requestConfirm('Are you sure you want to log out?');
        if (!confirmed) return;
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setAuthStatus('login');
        navigate('/');
        showAlert('Logged out.', 'success');
    };

    const createNewTask = () => {
        const newTask: Task = {
            name: "Task " + Math.floor(Math.random() * 100),
            url: "",
            mode: "scrape",
            wait: 3,
            selector: "",
            rotateUserAgents: false,
            humanTyping: false,
            stealth: {
                allowTypos: false,
                idleMovements: false,
                overscroll: false,
                deadClicks: false,
                fatigue: false,
                naturalTyping: false
            },
            actions: [],
            variables: {}
        };
        setCurrentTask(newTask);
        setResults(null);
        navigate('/tasks/new');
    };

    const touchTask = async (id: string) => {
        try {
            await fetch(`/api/tasks/${id}/touch`, { method: 'POST' });
            loadTasks();
        } catch (e) {
            console.error("Failed to touch task", e);
        }
    };

    const editTask = (task: Task) => {
        const migratedTask = { ...task };
        if (!migratedTask.variables || Array.isArray(migratedTask.variables)) migratedTask.variables = {};
        if (!migratedTask.stealth) {
            migratedTask.stealth = {
                allowTypos: false,
                idleMovements: false,
                overscroll: false,
                deadClicks: false,
                fatigue: false,
                naturalTyping: false
            };
        }
        if ('includeShadowDom' in migratedTask) delete (migratedTask as any).includeShadowDom;
        setCurrentTask(migratedTask);
        setResults(null);
        navigate(`/tasks/${task.id}`);
        if (task.id) touchTask(task.id);
    };

    const deleteTask = async (id: string) => {
        if (!await requestConfirm('Are you sure you want to delete this task?')) return;
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        loadTasks();
        if (location.pathname.includes(id)) {
            navigate('/dashboard');
        }
    };

    const saveTask = async () => {
        if (!currentTask) return;
        const taskToSave = { ...currentTask, last_opened: Date.now() };
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskToSave)
        });
        const saved = await res.json();
        setCurrentTask(saved);
        setSaveMsg("SAVED");
        setTimeout(() => setSaveMsg(''), 2000);
        loadTasks();
        if (location.pathname.includes('new')) {
            navigate(`/tasks/${saved.id}`, { replace: true });
        }
    };

    const stopHeadful = async () => {
        try {
            await fetch('/headful/stop', { method: 'POST' });
        } catch (e) {
            console.error('Failed to stop headful session', e);
        } finally {
            setIsExecuting(false);
        }
    };

    const runTask = async () => {
        if (!currentTask || !currentTask.url) return;

        if (isExecuting && currentTask.mode === 'headful') {
            await stopHeadful();
            return;
        }

        setIsExecuting(true);
        setResults({
            url: currentTask.url,
            logs: [],
            timestamp: 'Running...',
        });

        try {
            const cleanedVars: Record<string, any> = {};
            Object.entries(currentTask.variables).forEach(([name, def]) => {
                cleanedVars[name] = def.value;
            });

            const resolveTemplate = (input: string) => {
                return input.replace(/\{\$(\w+)\}/g, (_match, name) => {
                    if (name === 'now') return new Date().toISOString();
                    const value = cleanedVars[name];
                    if (value === undefined || value === null || value === '') return '';
                    return String(value);
                });
            };

            const resolveMaybe = (value?: string) => {
                if (typeof value !== 'string') return value;
                return resolveTemplate(value);
            };

            const resolvedTask = {
                ...currentTask,
                url: resolveTemplate(currentTask.url || ''),
                selector: resolveMaybe(currentTask.selector),
                actions: currentTask.actions.map((action) => ({
                    ...action,
                    selector: resolveMaybe(action.selector),
                    value: resolveMaybe(action.value),
                    key: resolveMaybe(action.key)
                }))
            };

            const payload = {
                ...resolvedTask,
                taskVariables: cleanedVars,
                variables: cleanedVars,
                runSource: 'editor',
                taskId: currentTask.id,
                taskName: currentTask.name
            };

            const res = await fetch(`/${currentTask.mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || errorData.error || "Request failed");
            }

            const data = await res.json();

            setResults({
                url: currentTask.url,
                finalUrl: data.final_url,
                html: data.html,
                data: data.data ?? data.html ?? "No data captured.",
                screenshotUrl: data.screenshot_url,
                logs: data.logs || [],
                timestamp: new Date().toLocaleTimeString(),
            });
        } catch (e: any) {
            showAlert("Execution crash: " + e.message, 'error');
        } finally {
            if (currentTask.mode !== 'headful') {
                setIsExecuting(false);
            }
        }
    };

    const clearStorage = async (type: 'screenshots' | 'cookies') => {
        if (!await requestConfirm(`Delete all ${type}?`)) return;
        const endpoint = type === 'screenshots' ? '/api/clear-screenshots' : '/api/clear-cookies';
        await fetch(endpoint, { method: 'POST' });
        showAlert(`${formatLabel(type)} cleared.`, 'success');
    };

    const getCurrentScreen = () => {
        if (location.pathname.startsWith('/tasks')) return 'editor';
        if (location.pathname === '/settings') return 'settings';
        if (location.pathname === '/executions') return 'executions';
        return 'dashboard';
    };

    let content: React.ReactNode;
    if (authStatus === 'login' || authStatus === 'setup') {
        content = <AuthScreen status={authStatus} onSubmit={handleAuthSubmit} error={authError} />;
    } else if (authStatus === 'checking') {
        content = <LoadingScreen title="Authenticating" subtitle="Verifying session state" />;
    } else {
        content = (
            <div className="h-full flex flex-row overflow-hidden bg-[#020202]">
                <Sidebar
                    onNavigate={(s) => {
                        if (s === 'dashboard') navigate('/dashboard');
                        else if (s === 'settings') {
                            navigate('/settings');
                        } else if (s === 'executions') {
                            navigate('/executions');
                        }
                    }}
                    onNewTask={createNewTask}
                    onLogout={logout}
                    currentScreen={getCurrentScreen()}
                />

                <Routes>
                    <Route path="/" element={<DashboardScreen tasks={tasks} onNewTask={createNewTask} onEditTask={editTask} onDeleteTask={deleteTask} />} />
                    <Route path="/dashboard" element={<DashboardScreen tasks={tasks} onNewTask={createNewTask} onEditTask={editTask} onDeleteTask={deleteTask} />} />
                    <Route path="/tasks/new" element={
                        currentTask ? (
                        <EditorScreen
                            currentTask={currentTask}
                            setCurrentTask={setCurrentTask}
                            editorView={editorView}
                            setEditorView={setEditorView}
                            isExecuting={isExecuting}
                            onSave={saveTask}
                            onRun={runTask}
                            results={results}
                            saveMsg={saveMsg}
                            onConfirm={requestConfirm}
                            onNotify={showAlert}
                        />
                        ) : <LoadingScreen title="Initializing" subtitle="Preparing task workspace" />
                    } />
                    <Route path="/tasks/:id" element={<EditorLoader tasks={tasks} loadTasks={loadTasks} touchTask={touchTask} currentTask={currentTask} setCurrentTask={setCurrentTask} editorView={editorView} setEditorView={setEditorView} isExecuting={isExecuting} onSave={saveTask} onRun={runTask} results={results} saveMsg={saveMsg} onConfirm={requestConfirm} onNotify={showAlert} />} />
                    <Route path="/settings" element={
                        <SettingsScreen
                            onClearStorage={clearStorage}
                            onConfirm={requestConfirm}
                            onNotify={showAlert}
                        />
                    } />
                    <Route path="/executions" element={<ExecutionsScreen onConfirm={requestConfirm} onNotify={showAlert} />} />
                </Routes>
            </div>
        );
    }

    return (
        <div className="h-full">
            {centerAlert && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                    <div className="glass-card w-full max-w-md rounded-[32px] border border-white/10 p-8 text-center shadow-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">System Alert</p>
                        <p className="mt-4 font-mono text-sm text-white">{centerAlert.message}</p>
                        <button
                            onClick={() => setCenterAlert(null)}
                            className={`mt-6 w-full rounded-2xl px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all ${centerAlert.tone === 'error'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20'
                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                }`}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
            {centerConfirm && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
                    <div className="glass-card w-full max-w-md rounded-[32px] border border-white/10 p-8 text-center shadow-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Confirm</p>
                        <p className="mt-4 font-mono text-sm text-white">{centerConfirm.message}</p>
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={() => closeConfirm(false)}
                                className="w-full rounded-2xl px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => closeConfirm(true)}
                                className="w-full rounded-2xl px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all bg-white text-black hover:scale-105 shadow-xl shadow-white/10"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {content}
        </div>
    );
}

function EditorLoader({ tasks, loadTasks, touchTask, currentTask, setCurrentTask, ...props }: any) {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (currentTask?.id === id) return;

            setLoading(true);
            let targetTasks = tasks;
            if (tasks.length === 0) {
                targetTasks = await loadTasks();
            }

            const task = targetTasks.find((t: any) => String(t.id) === String(id));
            if (task) {
                // Migration logic
                const migrated = { ...task };
                if (!migrated.variables || Array.isArray(migrated.variables)) migrated.variables = {};
                if (!migrated.stealth) {
                    migrated.stealth = { allowTypos: false, idleMovements: false, overscroll: false, deadClicks: false, fatigue: false, naturalTyping: false };
                }
                if ('includeShadowDom' in migrated) delete (migrated as any).includeShadowDom;
                setCurrentTask(migrated);
                if (id) touchTask(id);
            }
            setLoading(false);
        };
        init();
    }, [id, tasks]);

    if (loading || !currentTask || String(currentTask.id) !== String(id)) {
        return <LoadingScreen title="Loading Mission Data" subtitle="Syncing task payload" />;
    }

    return <EditorScreen currentTask={currentTask} setCurrentTask={setCurrentTask} {...props} />;
}
