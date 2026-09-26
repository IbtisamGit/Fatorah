'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload, Camera, Image as ImageIcon, FileText, Loader2,
  Crop, RotateCw, ShieldCheck, Check, AlertTriangle, X,
  Tag as TagIcon, Eye, Trash2, Edit2, Zap, FileSearch,
  ArrowRight, ShieldAlert, CreditCard, Plus, Paintbrush
} from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from '@/i18n/routing'
import { scanReceipt } from '@/app/actions/scanReceipt'
import { useExpenseStore } from '@/store/expenses'
import ReactCrop, { type Crop as ReactCropType, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from 'next-intl'

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

// ─── Redact Modal ─────────────────────────────────────────────────────────────
function RedactModal({ 
  imageUrl, 
  onClose, 
  onSave 
}: { 
  imageUrl: string, 
  onClose: () => void, 
  onSave: (blob: Blob, dataUrl: string) => void 
}) {
  const t = useTranslations('Scanner')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [brushSize, setBrushSize] = useState(25)
  const [imgWidth, setImgWidth] = useState(1000)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    
    // Only load image once
    if (!ctx) {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.src = imageUrl
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        setImgWidth(img.width)
        context.drawImage(img, 0, 0)
        
        context.lineJoin = 'round'
        context.lineCap = 'round'
        context.strokeStyle = '#1e293b' // dark slate color for redaction
        
        setCtx(context)
      }
    }
  }, [imageUrl, ctx])

  // Update brush size when slider changes (scale it relative to image width so it feels consistent)
  useEffect(() => {
    if (ctx) {
      ctx.lineWidth = brushSize * (imgWidth / 500)
    }
  }, [brushSize, ctx, imgWidth])

  const startDrawing = (e: React.PointerEvent) => {
    if (!ctx || !canvasRef.current) return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    ctx.beginPath()
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
  }

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !ctx || !canvasRef.current) return
    e.preventDefault() 
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!ctx) return
    ctx.closePath()
    setIsDrawing(false)
  }

  const handleSave = () => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onSave(blob, canvasRef.current!.toDataURL('image/jpeg', 0.9))
      }
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-rose-500" />
              {t('manual_redaction')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('manual_redaction_desc')}</p>
          </div>
          
          <div className="flex items-center gap-4 self-stretch sm:self-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500">{t('brush_size')}</span>
              <input 
                type="range" 
                min="5" 
                max="80" 
                value={brushSize} 
                onChange={e => setBrushSize(parseInt(e.target.value))}
                className="w-24 accent-rose-500"
              />
            </div>
            
            <div className="flex gap-2 ml-auto text-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">{t('cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0">
                <Check className="w-4 h-4" />
                {t('apply_redaction')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-black/20 min-h-[500px]">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            className="max-w-full h-auto cursor-crosshair touch-none shadow-md rounded border border-slate-200 dark:border-slate-700"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          />
        </div>
      </div>
    </div>
  )
}

export function ScannerClient() {
  const t = useTranslations('Scanner')
  const tNames = useTranslations('CategoryNames')
  const router = useRouter()
  
  // App States
  const [step, setStep] = useState<'upload' | 'preprocess' | 'analyzing' | 'review'>('upload')
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { expenses: globalExpenses, categories: globalCategories, isLoading, addExpense, removeExpense, updateExpense, fetchExpenses, fetchCategories } = useExpenseStore()
  
  const getCategoryName = (name: string) => {
    try {
      const defaults = ["Groceries", "Personal Care", "Travel", "Entertainment & Subscriptions", "Other", "Transportation", "Electronics", "Housing & Rent", "Shopping", "Education", "Healthcare", "Restaurants & Cafes", "Utilities & Bills"]
      if (defaults.includes(name)) {
        return tNames(name as any)
      }
      return name
    } catch {
      return name
    }
  }

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
  const [isRedacted, setIsRedacted] = useState(false) // keeping this to show the "Redacted" badge if we want
  const [isRedactModalOpen, setIsRedactModalOpen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [aiData, setAiData] = useState<AIResult | null>(null)
  
  // Cropping State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState<ReactCropType>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleRedactSave = (blob: Blob, dataUrl: string) => {
    // Update the current file with the redacted version
    setQueue(prev => prev.map((item, idx) => {
      if (idx === 0) {
        return {
          ...item,
          file: new File([blob], item.file.name, { type: 'image/jpeg' }),
          previewUrl: dataUrl
        }
      }
      return item
    }))
    setIsRedacted(true) // show a badge or status if needed
    setIsRedactModalOpen(false)
  }

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
      formData.append('categories', JSON.stringify(uniqueCategories))
      
      const response = await scanReceipt(formData)
      
      if (response.success && response.data) {
         setAiData(response.data)
         setStep('review')
      } else {
         alertAsync(t('analysis_failed'), response.error || t('unknown_error'))
         setStep('preprocess')
      }
    } catch (e) {
      console.error(e)
      alertAsync(t('error'), t('connection_error'))
      setStep('preprocess')
    }
  }

  const handleSave = async () => {
    if (!aiData || !queue.length || isSaving) return
    setIsSaving(true)
    
    // Check against global expenses for duplicates
    const isDuplicateRecord = globalExpenses.some(
      e => e.merchant.toLowerCase() === aiData.merchant.toLowerCase() &&
           e.amount === aiData.amount &&
           e.date.split('T')[0] === (aiData.date || '').split('T')[0]
    )
    
    if (isDuplicateRecord) {
      const proceed = await confirmAsync(
        `⚠️ ${t('duplicate_detected')}`,
        t('duplicate_desc_confirm')
      )
      if (!proceed) {
        setIsSaving(false)
        return
      }
    }
    
    const expenseId = Math.random().toString(36).substring(7)
    
    let finalPreviewUrl = queue[0].previewUrl
    try {
      if (queue[0].file) {
        const file = queue[0].file
        const fileExt = file.name.split('.').pop()
        const fileName = `${expenseId}-${Date.now()}.${fileExt}`
        
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const filePath = `${user.id}/${fileName}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, file, { upsert: false })
            
          if (uploadError) {
            console.error('Supabase upload failed:', uploadError)
          } else if (uploadData) {
            // We store the path. The store will generate a signed URL when fetching.
            finalPreviewUrl = filePath
          }
        }
      }
    } catch(e) {
      console.error('Failed to upload to Supabase', e)
    }
    
    // Globally Save Expense
    try {
      await addExpense({
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
    } catch (err) {
      console.error('Failed to add expense:', err)
      setIsSaving(false)
      return
    }
    
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
    setIsSaving(false)
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
       alertAsync(t('not_supported'), t('crop_not_supported'))
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
      alertAsync(t('crop_failed'), t('crop_failed_desc'))
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
          {isLowConf && <span title="Low Confidence - Please Verify"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>}
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
            {t('title')} <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
        </div>
        
        {/* Queue Indicator */}
        {queue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('processing_queue', { count: queue.length })}
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
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('upload_title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              {t('upload_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                <ImageIcon className="w-5 h-5" />
                {t('select_files')}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all">
                <Camera className="w-5 h-5" />
                {t('use_camera')}
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
                      <p className="text-slate-500">{t('pdf_selected')}</p>
                      <a href={currentFile.previewUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline mt-2 text-sm">{t('click_to_view')}</a>
                    </div>
                  </object>
                ) : (
                  <img src={currentFile.previewUrl} alt="Receipt Preview" className="max-w-full max-h-full object-contain" />
                )}
                
                {/* Simulated Auto-Redaction Box */}
                {isRedacted && (
                  <div className="absolute top-[20%] left-[10%] w-[60%] h-[8%] backdrop-blur-md bg-black/40 rounded border border-white/20 flex items-center justify-center animate-in zoom-in z-50 pointer-events-none">
                    <ShieldAlert className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">{t('redacted')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preprocess Controls */}
            <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('preprocessing')}</h3>
              
              <div className="space-y-4 flex-1">
                <button 
                  onClick={handleCropClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors text-start"
                >
                  <Crop className="w-4 h-4 text-slate-400" />
                  {t('crop_image')}
                </button>
                <button 
                  onClick={() => setRotation(prev => prev + 90)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors text-start"
                >
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  {t('rotate')}
                </button>
                
                {/* Manual Redact Button */}
                {currentFile.file.type !== 'application/pdf' && (
                  <button 
                    onClick={() => setIsRedactModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-6 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Paintbrush className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-start">
                        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {t('manual_redaction')}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">{t('hide_sensitive')}</span>
                      </div>
                    </div>
                    {isRedacted ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-md">{t('applied')}</span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                    )}
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 mt-6">
                <button onClick={handleDiscard} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {t('discard')}
                </button>
                <button 
                  onClick={startAnalysis}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-colors"
                >
                  {t('analyze')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('analyzing')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse text-center max-w-xs">
                {t('analyzing_desc')}
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
                     <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">{t('redacted')}</span>
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
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">{t('duplicate_detected')}</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-1 leading-relaxed">
                      {t('duplicate_desc_review')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('review_extraction')}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('make_corrections')}</p>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                {renderConfidenceField(t('merchant_name'), aiData.merchant, 'merchant')}
                
                <div className="grid grid-cols-2 gap-4">
                  {renderConfidenceField(t('date'), aiData.date, 'date', 'date')}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('category')}</label>
                    <select
                      value={aiData.category}
                      onChange={(e) => setAiData({...aiData, category: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                    >
                      {!uniqueCategories.includes(aiData.category) && (
                         <option key={aiData.category} value={aiData.category}>{getCategoryName(aiData.category)} {t('new_ai_suggestion')}</option>
                      )}
                      {uniqueCategories.map(cat => (
                         <option key={cat} value={cat}>{getCategoryName(cat)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                  {renderConfidenceField(t('total_amount'), aiData.amount, 'amount', 'number')}
                  {renderConfidenceField(t('tax_vat'), aiData.tax, 'tax', 'number')}
                </div>

                {/* Multi-currency block */}
                {aiData.original_currency && aiData.converted_amount && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">{t('foreign_currency')}</p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80">{t('original')}: {aiData.amount} {aiData.original_currency} ≈ {aiData.converted_amount.toFixed(2)} SAR</p>
                    </div>
                  </div>
                )}

                {/* Smart Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-emerald-500" /> {t('smart_tags')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {aiData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 group">
                        #{tag}
                        <button 
                          onClick={() => setAiData({...aiData, tags: aiData.tags.filter(t => t !== tag)})}
                          className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity ms-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={async () => {
                        const newTag = await promptAsync(t('new_tag'), t('new_tag_prompt'))
                        if (newTag && !aiData.tags.includes(newTag.trim())) {
                          setAiData({...aiData, tags: [...aiData.tags, newTag.replace('#', '').trim()]})
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> {t('add')}
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
                  {t('discard')}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {isSaving ? t('saving') : (queue.length > 1 ? t('save_and_next', { count: queue.length - 1 }) : t('save_expense'))}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Scans History ─── */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('recent_scans')}</h3>
          {globalExpenses.length > 5 && (
            <button 
              onClick={() => router.push('/dashboard/expenses')}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              {t('view_all')}
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">{t('table_merchant')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">{t('table_date')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">{t('table_amount')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">{t('table_status')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-end">{t('table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-white dark:bg-slate-900">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800" />
                          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : recentScans.length > 0 ? recentScans.slice(0, 5).map((item, i) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'SAR' }).format(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/dashboard/expenses?edit=${item.id}`)}
                          title={t('view_edit')}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            const proceed = await confirmAsync(t('confirm_deletion'), t('confirm_delete_desc'));
                            if(proceed) removeExpense(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      {t('no_recent_scans')}
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
                <Crop className="w-5 h-5 text-emerald-500" /> {t('crop_image')}
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
                {t('cancel')}
              </button>
              <button 
                onClick={handleApplyCrop}
                className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                {t('crop_image')}
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6 text-slate-900 dark:text-slate-100"
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
                  {t('cancel')}
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
                {modalState.type === 'alert' ? t('ok') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Redact Modal */}
      {isRedactModalOpen && currentFile && (
        <RedactModal
          imageUrl={currentFile.previewUrl}
          onClose={() => setIsRedactModalOpen(false)}
          onSave={handleRedactSave}
        />
      )}
    </div>
  )
}
