import React from 'react';
import { Users, CheckCircle, Clock, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';

const isMemberCompleted = (m) => {
  if (!m) return false;
  if (m.status === 'Completed') return true;
  return Boolean(
    m.name?.trim() &&
    m.phone &&
    String(m.phone).replace(/\D/g, '').slice(-10) &&
    m.businessAddress?.trim() &&
    m.vertical?.trim() &&
    m.profilePhoto?.trim()
  );
};

export default function StatsCards({ members = [] }) {
  const total = members.length;
  const completed = members.filter(isMemberCompleted).length;
  const pending = members.filter((m) => !isMemberCompleted(m)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* Total Members Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Members
            </p>
            <h3 className="text-3xl font-extrabold font-display text-rotary-navy mt-1">
              {total}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Registered in database</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Completed Profiles Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-all group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Completed Profiles
            </p>
            <h3 className="text-3xl font-extrabold font-display text-emerald-700 mt-1">
              {completed}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full details submitted</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Profiles Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-all group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pending Profiles
            </p>
            <h3 className="text-3xl font-extrabold font-display text-amber-700 mt-1">
              {pending}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Awaiting member form</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rotary-darkBlue to-rotary-navy rounded-2xl p-6 shadow-md text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rotary-goldLight uppercase tracking-wider">
              Completion Rate
            </p>
            <h3 className="text-3xl font-extrabold font-display text-white mt-1">
              {completionRate}%
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-rotary-gold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-rotary-gold h-full rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-300 mt-1.5 font-medium">
            <span>{completed} of {total} complete</span>
            <span className="text-rotary-goldLight">{100 - completionRate}% pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
