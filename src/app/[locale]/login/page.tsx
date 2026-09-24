import SleekAuthForm from './SleekAuthForm'
import { PieChart, Receipt, ScanLine, Zap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen w-full flex bg-white text-slate-900"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      
      {/* Left Side: Clean Authentication Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 md:px-16 relative z-10 bg-white">
        <div className="w-full max-w-[380px] mx-auto relative z-20">
          <SleekAuthForm />
        </div>
      </div>

      {/* Right Side: Professional SaaS 3D Showcase */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center bg-slate-50 overflow-hidden border-l border-slate-200">
        
        {/* Decorative Grid: Clean linear SaaS grid (Gray/Slate) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.4] pointer-events-none"></div>

        {/* 3D Composition Container */}
        <div className="relative z-20 w-full max-w-2xl h-[600px] flex items-center justify-center pointer-events-none">
          
          {/* BACKGROUND ELEMENT: The Minimalist App/Dashboard Panel */}
          <div className="absolute w-[340px] h-[480px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/10 border border-slate-100 p-7 transform -translate-x-12 -translate-y-8 animate-float-delayed">
            
            {/* Mock App UI - Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Expenses</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">$3,492.50</div>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                <PieChart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            {/* Mock App UI - Bar Chart */}
            <div className="w-full h-32 bg-slate-50/50 rounded-2xl border border-slate-100 mb-6 relative overflow-hidden flex items-end px-3 pb-3 gap-2.5">
              <div className="w-full bg-slate-200 rounded-t-md h-[40%]"></div>
              <div className="w-full bg-slate-200 rounded-t-md h-[60%]"></div>
              <div className="w-full bg-emerald-600 rounded-t-md h-[90%] shadow-[0_0_12px_rgba(5,150,105,0.4)]"></div>
              <div className="w-full bg-slate-200 rounded-t-md h-[50%]"></div>
              <div className="w-full bg-slate-200 rounded-t-md h-[75%]"></div>
            </div>
            
            {/* Mock App UI - Recent Scans List */}
            <div className="space-y-4">
              <div className="text-slate-900 font-bold text-sm mb-3">Recent Scans</div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Receipt className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="w-24 h-2.5 bg-slate-200 rounded-full mb-2"></div>
                    <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="w-12 h-2.5 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* FOREGROUND ELEMENT: The Premium 3D Floating Smart Receipt */}
          <div className="absolute w-[300px] h-[360px] bg-white rounded-[1.5rem] p-7 transform rotate-[8deg] translate-x-12 translate-y-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-100 animate-float overflow-hidden flex flex-col">
            
            {/* Receipt Content */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-emerald-100/50">
                <ScanLine className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="w-24 h-3 bg-slate-800 rounded-full mb-2.5"></div>
              <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
            </div>
            
            <div className="w-full h-px border-t-2 border-dashed border-slate-200 my-4"></div>
            
            <div className="space-y-5 my-3">
              <div className="flex justify-between items-center">
                <div className="w-24 h-2.5 bg-slate-200 rounded-full"></div>
                <div className="w-10 h-2.5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-16 h-2.5 bg-slate-200 rounded-full"></div>
                <div className="w-12 h-2.5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-20 h-2.5 bg-slate-200 rounded-full"></div>
                <div className="w-14 h-2.5 bg-slate-200 rounded-full"></div>
              </div>
            </div>
            
            <div className="w-full h-px border-t-2 border-dashed border-slate-200 my-4"></div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="w-16 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-20 h-4 bg-emerald-600 rounded-full"></div>
            </div>

            {/* AI Scanner Laser Line */}
            <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.5)] animate-scan z-30"></div>
            <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent to-emerald-500/20 animate-scan -translate-y-full z-20 pointer-events-none"></div>
          </div>

          {/* Floating Accent Badge */}
          <div className="absolute top-[25%] right-[5%] bg-white border border-slate-100 p-3.5 rounded-2xl shadow-2xl shadow-slate-900/10 flex items-center gap-3 animate-float-delayed">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-[13px] tracking-wide">AI Extracted</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}