import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Upload, 
  UserPlus, 
  Download, 
  RefreshCw, 
  Share2, 
  FileSpreadsheet, 
  Sparkles,
  Award,
  Globe
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import MemberTable from '../components/MemberTable';
import ExcelUploadModal from '../components/ExcelUploadModal';
import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import MemberDetailModal from '../components/MemberDetailModal';
import ToggleStatusModal from '../components/ToggleStatusModal';
import { getAllMembers } from '../services/memberService';
import { exportMembersToExcel } from '../services/excelService';
import { useToast } from '../components/Toast';

export default function AdminDashboard() {
  const { addToast } = useToast();
  
  // State
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [toggleStatusTarget, setToggleStatusTarget] = useState(null);

  // Fetch all members from Firestore
  const fetchMembers = useCallback(async (showToastNotice = false) => {
    setIsLoading(true);
    const res = await getAllMembers();
    setIsLoading(false);

    if (res.success) {
      setMembers(res.data || []);
      if (showToastNotice) {
        addToast(`Refreshed! Loaded ${res.data?.length || 0} members.`, 'info');
      }
    } else {
      addToast(res.error || 'Failed to load members from database.', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Export to Excel
  const handleExport = () => {
    if (members.length === 0) {
      addToast('No members to export.', 'info');
      return;
    }
    exportMembersToExcel(members, `Rotary_Erode_Central_Members_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('Excel export generated successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Action Header */}
      <div className="bg-rotary-navy text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                Member Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotary Club of Erode Central • Member Directory & Profile Portal
              </p>
            </div>


            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Upload Excel Button */}
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition shadow-gold"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Excel</span>
              </button>

              {/* Add Member Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4 text-rotary-gold" />
                <span>Add Member</span>
              </button>

              {/* Export to Excel */}
              <button
                onClick={handleExport}
                title="Export member database to Excel"
                className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Export</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchMembers(true)}
                title="Refresh Member Data"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Metric Cards */}
        <StatsCards members={members} />

        {/* Member Directory Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-800">
                Club Members Directory
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter, view, edit, enable or disable member records
              </p>
            </div>
            
            <div className="text-xs font-medium text-slate-500">
              Total Database Records: <span className="font-bold text-slate-800">{members.length}</span>
            </div>
          </div>

          <MemberTable
            members={members}
            isLoading={isLoading}
            onViewMember={(m) => setViewMember(m)}
            onEditMember={(m) => setEditMember(m)}
            onToggleStatus={(m) => setToggleStatusTarget(m)}
            onOpenUpload={() => setIsExcelModalOpen(true)}
            onOpenAdd={() => setIsAddModalOpen(true)}
          />
        </div>

      </main>

      {/* Modals */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => fetchMembers()}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchMembers()}
      />

      <EditMemberModal
        isOpen={!!editMember}
        member={editMember}
        onClose={() => setEditMember(null)}
        onSuccess={() => fetchMembers()}
      />

      <MemberDetailModal
        isOpen={!!viewMember}
        member={viewMember}
        onClose={() => setViewMember(null)}
        onEdit={(m) => {
          setViewMember(null);
          setEditMember(m);
        }}
        onToggleStatus={(m) => {
          setViewMember(null);
          setToggleStatusTarget(m);
        }}
      />

      <ToggleStatusModal
        isOpen={!!toggleStatusTarget}
        member={toggleStatusTarget}
        onClose={() => setToggleStatusTarget(null)}
        onSuccess={() => fetchMembers()}
      />

    </div>
  );
}
