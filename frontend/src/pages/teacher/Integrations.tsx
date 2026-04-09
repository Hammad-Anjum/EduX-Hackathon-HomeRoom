import { useState } from 'react';
import { importGoogleClassroom, exportCsv } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function Integrations({ user, classroomId }: { user: User; classroomId: string }) {
  const { t } = useTranslation(user.language);
  const [gcLoading, setGcLoading] = useState(false);
  const [gcResult, setGcResult] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvDone, setCsvDone] = useState(false);

  const handleGoogleClassroomImport = async () => {
    setGcLoading(true);
    setGcResult(null);
    try {
      const res = await importGoogleClassroom(classroomId);
      setGcResult(res.data);
    } catch {
      setGcResult({ status: 'error', message: 'Import failed.' });
    } finally {
      setGcLoading(false);
    }
  };

  const handleCsvExport = async () => {
    setCsvLoading(true);
    try {
      const res = await exportCsv(classroomId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `homeroom_${classroomId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setCsvDone(true);
      setTimeout(() => setCsvDone(false), 3000);
    } catch {
      // silent
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('integrations.title')}</h1>
      <p className="text-sm text-gray-400 mb-6">Sync data with external platforms or export progress reports.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Google Classroom */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg font-bold">G</div>
            <div>
              <h3 className="font-semibold text-sm text-gray-800">{t('integrations.google_classroom')}</h3>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Connected</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">{t('integrations.gc_desc')}</p>
          <button
            onClick={handleGoogleClassroomImport}
            disabled={gcLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 w-full"
          >
            {gcLoading ? t('integrations.importing') : t('integrations.import')}
          </button>

          {gcResult && gcResult.status === 'success' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-green-700">Import Complete</p>
              <p className="text-green-600">Course: {gcResult.course_name}</p>
              <p className="text-green-600">Students matched: {gcResult.students_matched}/{gcResult.students_total}</p>
              <p className="text-green-600">Assignments imported: {gcResult.imported_assignments}</p>
              <p className="text-green-600">Grades synced: {gcResult.imported_grades}</p>
              {gcResult.skipped_existing > 0 && (
                <p className="text-amber-600">Skipped (already imported): {gcResult.skipped_existing}</p>
              )}
            </div>
          )}

          {gcResult && gcResult.status === 'error' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
              <p className="text-red-600">{gcResult.message}</p>
            </div>
          )}
        </div>

        {/* CSV Export */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">CSV</div>
            <h3 className="font-semibold text-sm text-gray-800">{t('integrations.export_csv')}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">{t('integrations.csv_desc')}</p>
          <button
            onClick={handleCsvExport}
            disabled={csvLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 w-full"
          >
            {csvLoading ? t('integrations.exporting') : csvDone ? 'Downloaded!' : t('integrations.export_csv')}
          </button>
        </div>

        {/* Google Sheets — Coming Soon */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">S</div>
            <div>
              <h3 className="font-semibold text-sm text-gray-800">{t('integrations.google_sheets')}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t('integrations.coming_soon')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('integrations.gs_desc')}</p>
        </div>

        {/* School Portal — Coming Soon */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">P</div>
            <div>
              <h3 className="font-semibold text-sm text-gray-800">{t('integrations.school_portal')}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t('integrations.coming_soon')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('integrations.sp_desc')}</p>
        </div>
      </div>
    </div>
  );
}
