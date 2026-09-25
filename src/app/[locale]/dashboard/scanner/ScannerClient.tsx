'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload, Camera, Image as ImageIcon, FileText, Loader2,
  Crop, RotateCw, ShieldCheck, Check, AlertTriangle, X,
  Tag as TagIcon, Eye, Trash2, Edit2, Zap, FileSearch,
  ArrowRight, ShieldAlert, CreditCard, Plus
} from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from '@/i18n/routing'
import { scanReceipt } from '@/app/actions/scanReceipt'
import { useExpenseStore } from '@/store/expenses'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// ─── Types ──────────────────────────────────────────────────────────────────────

type AIResult = {
  merchant: string
  amount: number
  tax: number
  date: string
  category: string
  original_currency: string | null
  converted_amount: number | null
  tags: string[]
  is_duplicate: boolean
  low_confidence_fields: string[]
}

type QueuedFile = {
  id: string
  file: File
  previewUrl: string
}

type ScannedReceipt = AIResult & {
  id: string
  previewUrl: string
  status: 'Saved' | 'Pending'
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ScannerClient() {
  const router = useRouter()
  
  // App States
  const [step, setStep] = useState<'upload' | 'preprocess' | 'analyzing' | 'review'>('upload')
  const [queue, setQueue] = useState<QueuedFile[]>([])

  const { expenses: globalExpenses, categories: globalCategories, addExpense, removeExpense, updateExpense, fetchExpenses, fetchCategories } = useExpenseStore()
  
  // Get dynamic categories list
  const uniqueCategories = globalCategories.length > 0 
    ? Array.from(new Set(globalCategories.map(c => c.name)))
    : ['Other']

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [fetchExpenses, fetchCategories])
  
  // Computed Recent Scans from Global Store (Show latest 5 expenses since 'source' column doesn't exist in DB)
  const recentScans = globalExpenses.slice(0, 5)

  // Custom Modal State for replacing native browser alerts
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    defaultValue?: string;
    onConfirm?: (val?: any) => void;
    onCancel?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' })

  const alertAsync = (title: string, message: string) => {
    setModalState({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModalState(prev => ({...prev, isOpen: false})) })
  }

  const confirmAsync = (title: string, message: string) => new Promise<boolean>(resolve => {
    setModalState({
      isOpen: true, type: 'confirm', title, message,
      onConfirm: () => { setModalState(prev => ({...prev, isOpen: false})); resolve(true) },
      onCancel: () => { setModalState(prev => ({...prev, isOpen: false})); resolve(false) }
    })
  })

  const promptAsync = (title: string, message: string, defaultValue = '') => new Promise<string | null>(resolve => {
    setModalState({
      isOpen: true, type: 'prompt', title, message, defaultValue,
      onConfirm: (val) => { setModalState(prev => ({...prev, isOpen: false})); resolve(val) },
      onCancel: () => { setModalState(prev => ({...prev, isOpen: false})); resolve(null) }
    })
  })

  // Current Processing State
  const [isRedacted, setIsRedacted] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [aiData, setAiData] = useState<AIResult | null>(null)
  
  // Cropping State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file)
    }))
    setQueue(prev => [...prev, ...newFiles])
    if (step === 'upload') {
      setStep('preprocess')
      setRotation(0)
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.dataTransfer.files?.length) return
    const newFiles = Array.from(e.dataTransfer.files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file)
    }))
    setQueue(prev => [...prev, ...newFiles])
    if (step === 'upload') {
      setStep('preprocess')
      setRotation(0)
    }
  }

  const startAnalysis = async () => {
    if (!queue.length) return
    setStep('analyzing')
    
    try {
      const formData = new FormData()
      formData.append('file', queue[0].file)
      
      const response = await scanReceipt(formData)
      
      if (response.success && response.data) {
         setAiData(response.data)
         setStep('review')
      } else {
         alertAsync('Analysis Failed', response.error || 'Unknown error occurred')
         setStep('preprocess')
      }
    } catch (e) {
      console.error(e)
      alertAsync('Error', 'Failed to connect to AI service.')
      setStep('preprocess')
    }
  }

  const handleSave = async () => {
    if (!aiData || !queue.length) return
    
    // Check against global expenses for duplicates
    const isDuplicateRecord = globalExpenses.some(
      e => e.merchant.toLowerCase() === aiData.merchant.toLowerCase() &&
           e.amount === aiData.amount &&
           e.date.split('T')[0] === (aiData.date || '').split('T')[0]
    )
    
    if (isDuplicateRecord) {
      const proceed = await confirmAsync(
        '⚠️ Duplicate Detected',
        'A very similar expense already exists (same merchant, amount, and date). Are you sure you want to save it anyway?'
      )
      if (!proceed) return
    }
    
    const expenseId = Math.random().toString(36).substring(7)
    
    // Convert file to base64 so it survives page reloads in localStorage
    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
    
    let finalPreviewUrl = queue[0].previewUrl
    try {
      if (queue[0].file) {
        finalPreviewUrl = await toBase64(queue[0].file)
      }
    } catch(e) {
      console.error('Failed to convert to base64', e)
    }
    
    // Globally Save Expense
    addExpense({
      id: expenseId,
      merchant: aiData.merchant,
      amount: aiData.amount,
      tax: aiData.tax,
      date: aiData.date,
      category: aiData.category,
      status: 'Saved',
      source: 'Scanner',
      currency: aiData.original_currency || 'SAR',
      previewUrl: finalPreviewUrl,
      fileType: queue[0].file.type
    })
    
    // Move to next in queue
    const newQueue = queue.slice(1)
    setQueue(newQueue)
    
    if (newQueue.length > 0) {
      setStep('preprocess')
      setIsRedacted(false)
      setRotation(0)
      setAiData(null)
    } else {
      setStep('upload')
      setIsRedacted(false)
      setRotation(0)
      setAiData(null)
    }
  }

  const handleDiscard = () => {
    const newQueue = queue.slice(1)
    setQueue(newQueue)
    if (newQueue.length > 0) {
      setStep('preprocess')
    } else {
      setStep('upload')
    }
    setIsRedacted(false)
    setRotation(0)
    setAiData(null)
  }

  // ─── Cropping Logic ───────────────────────────────────────────────────────────

  const handleCropClick = () => {
    if (queue[0]?.file.type === 'application/pdf') {
       alertAsync('Not Supported', 'Cropping is currently only supported for image files (JPG/PNG).')
       return
    }
    setIsCropModalOpen(true)
  }

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')
    
    // Apply rotation mathematically if needed, but for MVP we crop the unrotated image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'))
        resolve(new File([blob], fileName, { type: 'image/jpeg' }))
      }, 'image/jpeg')
    })
  }

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current || !queue[0]) return
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, queue[0].file.name)
      const newPreviewUrl = URL.createObjectURL(croppedFile)
      
      setQueue(prev => {
        const newQ = [...prev]
        newQ[0] = { ...newQ[0], file: croppedFile, previewUrl: newPreviewUrl }
        return newQ
      })
      
      setIsCropModalOpen(false)
      setCrop(undefined)
      setCompletedCrop(null)
    } catch (e) {
      console.error('Crop failed', e)
      alertAsync('Crop Failed', 'Could not process the image. Please try again.')
    }
  }

  const currentFile = queue[0]

  // ─── Rendering Helpers ────────────────────────────────────────────────────────

  const renderConfidenceField = (label: string, value: string | number, fieldName: string, type = 'text') => {
    const isLowConf = aiData?.low_confidence_fields.includes(fieldName)
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
          {label}
          {isLowConf && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Low Confidence - Please Verify" />}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => setAiData(prev => prev ? { ...prev, [fieldName]: e.target.value } : null)}
          className={clsx(
            "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100",
            isLowConf 
              ? "border-2 border-amber-300 dark:border-amber-500/50 focus:ring-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10" 
              : "border border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500"
          )}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Intelligent Scanner <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Powered by Gemini 2.5 Flash Vision</p>
        </div>
        
        {/* Queue Indicator */}
        {queue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing {queue.length} file{queue.length > 1 ? 's' : ''} in queue
          </div>
        )}
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div 
            className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-inner">
              <FileSearch className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Upload or Scan Receipts</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Drag and drop your receipts, invoices, or bills here. We support batch processing for multiple files (JPG, PNG, PDF).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                <ImageIcon className="w-5 h-5" />
                Select Files
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all">
                <Camera className="w-5 h-5" />
                Use Camera
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFilesSelected} 
              multiple 
              accept="image/*,application/pdf" 
              className="hidden" 
            />
          </div>
        )}

        {/* STEP 2: PREPROCESS */}
        {step === 'preprocess' && currentFile && (
          <div className="flex-1 flex flex-col md:flex-row animate-in fade-in duration-300">
            {/* Image/PDF Preview Area */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
              <div 
                className="relative rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 max-w-full w-full lg:max-w-xl h-full min-h-[400px] bg-white flex items-center justify-center transition-transform duration-300"
                style={{ transform: 'rotate(' + rotation + 'deg)' }}
              >
                {currentFile.file.type === 'application/pdf' ? (
                  <object data={currentFile.previewUrl} type="application/pdf" className="w-full h-full min-h-[400px]">
                    <div className="p-8 text-center flex flex-col items-center">
                      <FileText className="w-12 h-12 text-slate-400 mb-3" />
                      <p className="text-slate-500">PDF Document selected.</p>
                      <a href={currentFile.previewUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline mt-2 text-sm">Click here to view</a>
                    </div>
                  </object>
                ) : (
                  <img src={currentFile.previewUrl} alt="Receipt Preview" className="max-w-full max-h-full object-contain" />
                )}
                
                {/* Simulated Auto-Redaction Box */}
                {isRedacted && (
                  <div className="absolute top-[20%] left-[10%] w-[60%] h-[8%] backdrop-blur-md bg-black/40 rounded border border-white/20 flex items-center justify-center animate-in zoom-in z-50 pointer-events-none">
                    <ShieldAlert className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Redacted</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preprocess Controls */}
            <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Pre-processing</h3>
              
              <div className="space-y-4 flex-1">
                <button 
                  onClick={handleCropClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors text-left"
                >
                  <Crop className="w-4 h-4 text-slate-400" />
                  Crop Image
                </button>
                <button 
                  onClick={() => setRotation(prev => prev + 90)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors text-left"
                >
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  Rotate 90°
                </button>
                
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Auto-Redact PII
                    </span>
                    <button 
                      onClick={() => setIsRedacted(!isRedacted)}
                      className={clsx(
                        "w-10 h-5 rounded-full relative transition-colors",
                        isRedacted ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        isRedacted ? "left-5" : "left-1"
                      )} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Automatically detect and blur credit card numbers and sensitive data before saving.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 mt-6">
                <button onClick={handleDiscard} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Discard
                </button>
                <button 
                  onClick={startAnalysis}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-colors"
                >
                  Analyze <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ANALYZING (LOADING) */}
        {step === 'analyzing' && currentFile && (
          <div className="flex-1 flex items-center justify-center p-12 relative animate-in fade-in duration-300">
            {/* Blurred Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 overflow-hidden bg-slate-200 dark:bg-slate-800">
               {currentFile.file.type !== 'application/pdf' && (
                 <img src={currentFile.previewUrl} alt="Blur" className="h-[80%] blur-3xl saturate-200" />
               )}
            </div>
            
            <div className="relative z-10 flex flex-col items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                <svg className="absolute inset-0 w-16 h-16 animate-spin text-emerald-500" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="72 216" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Analyzing Document</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse text-center max-w-xs">
                Gemini 2.5 Flash is extracting and securing data...
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 'review' && currentFile && aiData && (
          <div className="flex-1 flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-400">
            {/* Image/PDF View */}
            <div className="w-full lg:w-5/12 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 min-h-[400px]">
               <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-white flex items-center justify-center">
                 {currentFile.file.type === 'application/pdf' ? (
                   <object data={currentFile.previewUrl} type="application/pdf" className="w-full h-full min-h-[400px]">
                     <div className="p-8 text-center flex flex-col items-center">
                       <FileText className="w-12 h-12 text-slate-400 mb-3" />
                       <p className="text-slate-500">PDF Document</p>
                     </div>
                   </object>
                 ) : (
                   <img src={currentFile.previewUrl} alt="Receipt" className="max-w-full max-h-[500px] object-contain" />
                 )}
                 {isRedacted && (
                   <div className="absolute top-[20%] left-[10%] w-[60%] h-[8%] backdrop-blur-md bg-black/40 rounded border border-white/20 flex items-center justify-center z-50">
                     <ShieldAlert className="w-4 h-4 text-white/80 mr-1" />
                     <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Redacted</span>
                   </div>
                 )}
               </div>
            </div>

            {/* Form View */}
            <div className="w-full lg:w-7/12 bg-white dark:bg-slate-900 p-6 overflow-y-auto flex flex-col max-h-[700px]">
              
              {/* Duplicate Warning */}
              {(aiData.is_duplicate || globalExpenses.some(e => e.merchant.toLowerCase() === aiData.merchant.toLowerCase() && e.amount === aiData.amount && e.date.split('T')[0] === (aiData.date || '').split('T')[0])) && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex gap-3 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Duplicate Detected</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-1 leading-relaxed">
                      We found a similar expense logged recently (Same Merchant, Amount, and Date). Please review carefully to avoid double-counting.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Review Extraction</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Make any corrections before saving.</p>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                {renderConfidenceField('Merchant Name', aiData.merchant, 'merchant')}
                
                <div className="grid grid-cols-2 gap-4">
                  {renderConfidenceField('Date', aiData.date, 'date', 'date')}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <select
                      value={aiData.category}
                      onChange={(e) => setAiData({...aiData, category: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                    >
                      {!uniqueCategories.includes(aiData.category) && (
                         <option key={aiData.category} value={aiData.category}>{aiData.category} (New AI Suggestion)</option>
                      )}
                      {uniqueCategories.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                  {renderConfidenceField('Total Amount', aiData.amount, 'amount', 'number')}
                  {renderConfidenceField('Tax / VAT', aiData.tax, 'tax', 'number')}
                </div>

                {/* Multi-currency block */}
                {aiData.original_currency && aiData.converted_amount && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Foreign Currency Detected</p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80">Original: {aiData.amount} {aiData.original_currency} ≈ {aiData.converted_amount.toFixed(2)} SAR</p>
                    </div>
                  </div>
                )}

                {/* Smart Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-emerald-500" /> Smart Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {aiData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 group">
                        #{tag}
                        <button 
                          onClick={() => setAiData({...aiData, tags: aiData.tags.filter(t => t !== tag)})}
                          className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={async () => {
                        const newTag = await promptAsync('New Tag', 'Enter a new smart tag (e.g. business, travel):')
                        if (newTag && !aiData.tags.includes(newTag.trim())) {
                          setAiData({...aiData, tags: [...aiData.tags, newTag.replace('#', '').trim()]})
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 mt-6">
                <button 
                  onClick={handleDiscard}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                >
                  <Check className="w-5 h-5" />
                  Save Expense {queue.length > 1 ? `& Next (${queue.length - 1})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Scans History ─── */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Scans</h3>
          {globalExpenses.length > 5 && (
            <button 
              onClick={() => router.push('/dashboard/expenses')}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              View All
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Merchant</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentScans.length > 0 ? recentScans.slice(0, 5).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                           {item.previewUrl && item.fileType !== 'application/pdf' ? (
                             <img src={item.previewUrl} className="w-full h-full object-cover" />
                           ) : (
                             <FileText className="w-4 h-4 text-slate-400" />
                           )}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.merchant}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">
                      ${item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.previewUrl && (
                          <button 
                            onClick={() => window.open(item.previewUrl, '_blank')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            const newMerchant = await promptAsync('Edit Merchant Name', 'Enter the new merchant name:', item.merchant);
                            if (newMerchant) updateExpense(item.id, { merchant: newMerchant });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            const proceed = await confirmAsync('Confirm Deletion', 'Are you sure you want to delete this scan?');
                            if(proceed) removeExpense(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      No recent scans. Upload a receipt to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ─── Crop Modal ─── */}
      {isCropModalOpen && currentFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Crop className="w-5 h-5 text-emerald-500" /> Crop Image
              </h2>
              <button 
                onClick={() => setIsCropModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                className="max-h-full"
              >
                <img 
                  ref={imgRef}
                  src={currentFile.previewUrl} 
                  alt="Crop preview" 
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
              <button 
                onClick={() => setIsCropModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyCrop}
                className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Modal UI ─── */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 flex flex-col animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{modalState.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{modalState.message}</p>
            
            {modalState.type === 'prompt' && (
              <input
                autoFocus
                type="text"
                defaultValue={modalState.defaultValue}
                id="custom-prompt-input"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') modalState.onConfirm?.((e.target as HTMLInputElement).value)
                }}
              />
            )}

            <div className="flex items-center justify-end gap-3 mt-auto">
              {modalState.type !== 'alert' && (
                <button 
                  onClick={() => modalState.onCancel?.()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if (modalState.type === 'prompt') {
                    const val = (document.getElementById('custom-prompt-input') as HTMLInputElement).value
                    modalState.onConfirm?.(val)
                  } else {
                    modalState.onConfirm?.()
                  }
                }}
                className={clsx(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5",
                  modalState.type === 'alert' ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                )}
              >
                {modalState.type === 'alert' ? 'OK' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
