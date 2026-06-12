import { useEffect, useState } from "react";
import { Shield, Calendar, Terminal, Info, RefreshCw } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import { getApiUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

export default function SecurityAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [securityScore, setSecurityScore] = useState(85);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/security-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold text-sm">Monitor immutable system security audits and actions.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Security Score Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20 col-span-1 md:col-span-2 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Overall Security Score</h4>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">GreenGo Platform Protection metrics score</p>
            <div className="mt-3 flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">✔ Email Unique</span>
              <span className="flex items-center gap-1">✔ 2FA Enabled</span>
              <span className="flex items-center gap-1">✔ Strong Passwords</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{securityScore}</span>
            <span className="text-lg font-black text-slate-400">/100</span>
          </div>
        </Card>

        <Card className="p-5 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Logs Rule</h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Logs are append-only. Delete and update operations are strictly blocked.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
            <Shield size={14} className="text-brand-500" />
            <span>Immutable Integrity</span>
          </div>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <h3 className="font-black text-slate-950 dark:text-white text-base">Audit Event Logs</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center font-bold text-slate-500">No security logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        log.action.includes("failed") || log.action.includes("lock")
                          ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                          : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300"
                      }`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{log.ipAddress || "system"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
