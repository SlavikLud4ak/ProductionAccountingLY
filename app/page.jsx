'use client'

import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Menu
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { supabase } from './lib/supabase'

// ==================== CONSTANTS ====================
const STAGE_PRICES = {
  vtk: 15,
  soldering: 27,
  lacquering: 15,
  stamping: 0.25,
  fuse_soldering: 1,
}

const STAGE_NAMES = {
  vtk: 'ВТК',
  soldering: "Припайка",
  lacquering: 'Лакування',
  stamping: 'Штампування',
  fuse_soldering: 'Запобіжник',
}

const calculateTotal = (sheet) => {
  return (
    (sheet.vtk_count || 0) * STAGE_PRICES.vtk +
    (sheet.soldering_count || 0) * STAGE_PRICES.soldering +
    (sheet.lacquering_count || 0) * STAGE_PRICES.lacquering +
    (sheet.stamping_count || 0) * STAGE_PRICES.stamping +
    (sheet.fuse_soldering_count || 0) * STAGE_PRICES.fuse_soldering
  )
}

// ==================== SIDEBAR ====================
function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'route-sheets', label: 'Маршрутні листи', icon: FileText },
    { id: 'employees', label: 'Працівники', icon: Users },
    { id: 'inventory', label: 'Склад', icon: Package },
    { id: 'analytics', label: 'Аналітика', icon: BarChart3 },
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-zinc-900/95 lg:bg-zinc-900/50 
        border-r border-zinc-800 p-4 
        flex flex-col min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              Облік
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Система виробництва</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">
            <p>Версія 1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}

// ==================== MOBILE HEADER ====================
function MobileHeader({ setIsOpen, title }) {
  return (
    <div className="lg:hidden flex items-center justify-between mb-4 -mt-2">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-zinc-800 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="w-10" />
    </div>
  )
}

// ==================== LOADING SPINNER ====================
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  )
}

// ==================== DASHBOARD ====================
function Dashboard({ routeSheets, employees, inventory, loading, setIsOpen }) {
  if (loading) return <LoadingSpinner />
  
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const weekSheets = routeSheets.filter(s => new Date(s.created_at) >= weekAgo)
  const totalEarnings = routeSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
  const weekEarnings = weekSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
  const totalDefects = routeSheets.reduce((sum, s) => sum + (s.defect_count || 0), 0)
  const lowInventory = inventory.filter(i => i.quantity <= i.min_quantity).length
  
  const employeeStats = employees.map(emp => {
    const empSheets = routeSheets.filter(s => s.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      earnings: empSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      sheets: empSheets.length,
    }
  })

  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

  return (
    <div className="animate-fadeIn">
      <MobileHeader setIsOpen={setIsOpen} title="Дашборд" />
      <h2 className="hidden lg:block text-2xl font-bold text-white mb-6">Дашборд</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs lg:text-sm">Листів</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <span className="stat-value text-xl lg:text-3xl">{routeSheets.length}</span>
          <span className="text-xs text-emerald-400">+{weekSheets.length} тиждень</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs lg:text-sm">Заробіток</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="stat-value text-xl lg:text-3xl">{totalEarnings.toFixed(0)}₴</span>
          <span className="text-xs text-emerald-400">+{weekEarnings.toFixed(0)}₴</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs lg:text-sm">Брак</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="stat-value text-xl lg:text-3xl">{totalDefects}</span>
          <span className="text-xs text-zinc-500">одиниць</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs lg:text-sm">Склад</span>
            <Package className="w-4 h-4 text-red-400" />
          </div>
          <span className="stat-value text-xl lg:text-3xl">{lowInventory}</span>
          <span className="text-xs text-red-400">критично</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm lg:text-lg font-semibold text-white mb-4">Заробіток</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={employeeStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="earnings" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card">
          <h3 className="text-sm lg:text-lg font-semibold text-white mb-4">Листи</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={employeeStats.filter(e => e.sheets > 0)} dataKey="sheets" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`}>
                {employeeStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card mt-4">
        <h3 className="text-sm lg:text-lg font-semibold text-white mb-4">Останні листи</h3>
        <div className="space-y-2">
          {routeSheets.slice(0, 5).map((sheet) => {
            const employee = employees.find(e => e.id === sheet.employee_id)
            return (
              <div key={sheet.id} className="flex items-center justify-between p-2 lg:p-3 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-8 h-8 bg-sky-600/20 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{employee?.name || '—'}</p>
                    <p className="text-xs text-zinc-500">{new Date(sheet.created_at).toLocaleDateString('uk-UA')}</p>
                  </div>
                </div>
                <span className="text-emerald-400 font-semibold text-sm">{parseFloat(sheet.total_amount || 0).toFixed(2)}₴</span>
              </div>
            )
          })}
          {routeSheets.length === 0 && <p className="text-zinc-500 text-center py-4 text-sm">Немає листів</p>}
        </div>
      </div>
    </div>
  )
}

// ==================== ROUTE SHEETS ====================
function RouteSheets({ routeSheets, setRouteSheets, employees, inventory, setInventory, loading, refreshData, setIsOpen }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSheet, setEditingSheet] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState({})
  const [formData, setFormData] = useState({
    employee_id: '', vtk_count: 0, soldering_count: 0, lacquering_count: 0, stamping_count: 0, fuse_soldering_count: 0, defect_count: 0,
  })

  const resetForm = () => {
    setFormData({ employee_id: '', vtk_count: 0, soldering_count: 0, lacquering_count: 0, stamping_count: 0, fuse_soldering_count: 0, defect_count: 0 })
    setSelectedMaterials({})
    setEditingSheet(null)
  }

  const openModal = (sheet = null) => {
    if (sheet) {
      setEditingSheet(sheet)
      setFormData({
        employee_id: sheet.employee_id, vtk_count: sheet.vtk_count || 0, soldering_count: sheet.soldering_count || 0,
        lacquering_count: sheet.lacquering_count || 0, stamping_count: sheet.stamping_count || 0,
        fuse_soldering_count: sheet.fuse_soldering_count || 0, defect_count: sheet.defect_count || 0,
      })
      setSelectedMaterials(sheet.materials || {})
    } else { resetForm() }
    setIsModalOpen(true)
  }

  const addMaterial = (stage, inventoryId, quantity) => {
    const invItem = inventory.find(i => i.id === parseInt(inventoryId))
    if (!invItem || quantity <= 0) return
    setSelectedMaterials(prev => ({
      ...prev,
      [stage]: [...(prev[stage] || []), { inventory_id: invItem.id, name: invItem.name, quantity: quantity, unit: invItem.unit }]
    }))
  }

  const removeMaterial = (stage, index) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [stage]: prev[stage].filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const total = calculateTotal(formData)
    try {
      if (editingSheet) {
        const { data, error } = await supabase.from('route_sheets').update({
          employee_id: parseInt(formData.employee_id), vtk_count: formData.vtk_count, soldering_count: formData.soldering_count,
          lacquering_count: formData.lacquering_count, stamping_count: formData.stamping_count,
          fuse_soldering_count: formData.fuse_soldering_count, defect_count: formData.defect_count, total_amount: total,
        }).eq('id', editingSheet.id).select().single()
        if (error) throw error
        setRouteSheets(routeSheets.map(s => s.id === editingSheet.id ? { ...data, materials: selectedMaterials } : s))
      } else {
        const { data, error } = await supabase.from('route_sheets').insert({
          employee_id: parseInt(formData.employee_id), vtk_count: formData.vtk_count, soldering_count: formData.soldering_count,
          lacquering_count: formData.lacquering_count, stamping_count: formData.stamping_count,
          fuse_soldering_count: formData.fuse_soldering_count, defect_count: formData.defect_count, total_amount: total,
        }).select().single()
        if (error) throw error
        
        // Списуємо матеріали зі складу
        for (const stage of Object.keys(selectedMaterials)) {
          for (const mat of selectedMaterials[stage]) {
            const invItem = inventory.find(i => i.id === mat.inventory_id)
            if (invItem) {
              const newQty = Math.max(0, invItem.quantity - mat.quantity)
              await supabase.from('inventory').update({ quantity: newQty }).eq('id', mat.inventory_id)
              setInventory(prev => prev.map(i => i.id === mat.inventory_id ? { ...i, quantity: newQty } : i))
            }
          }
        }
        
        setRouteSheets([{ ...data, materials: selectedMaterials }, ...routeSheets])
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      alert('Помилка: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити?')) return
    try {
      const { error } = await supabase.from('route_sheets').delete().eq('id', id)
      if (error) throw error
      setRouteSheets(routeSheets.filter(s => s.id !== id))
    } catch (error) { alert('Помилка: ' + error.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <MobileHeader setIsOpen={setIsOpen} title="Маршрутні листи" />
      <div className="hidden lg:flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Маршрутні листи</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => openModal()} className="btn btn-primary"><Plus className="w-4 h-4" />Новий</button>
        </div>
      </div>
      <div className="flex lg:hidden gap-2 mb-4">
        <button onClick={refreshData} className="btn btn-secondary flex-1"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={() => openModal()} className="btn btn-primary flex-1"><Plus className="w-4 h-4" />Новий</button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block table-container">
        <table className="table">
          <thead><tr><th>Дата</th><th>Працівник</th><th>ВТК</th><th>Припайка</th><th>Лакув.</th><th>Штамп.</th><th>Запоб.</th><th>Брак</th><th>Сума</th><th>Дії</th></tr></thead>
          <tbody>
            {routeSheets.map((sheet) => {
              const employee = employees.find(e => e.id === sheet.employee_id)
              return (
                <tr key={sheet.id}>
                  <td className="text-zinc-400">{new Date(sheet.created_at).toLocaleDateString('uk-UA')}</td>
                  <td className="text-white font-medium">{employee?.name || '—'}</td>
                  <td>{sheet.vtk_count || 0}</td><td>{sheet.soldering_count || 0}</td><td>{sheet.lacquering_count || 0}</td>
                  <td>{sheet.stamping_count || 0}</td><td>{sheet.fuse_soldering_count || 0}</td>
                  <td>{sheet.defect_count > 0 ? <span className="badge badge-danger">{sheet.defect_count}</span> : '0'}</td>
                  <td className="text-emerald-400 font-semibold">{parseFloat(sheet.total_amount || 0).toFixed(2)}₴</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(sheet)} className="p-1.5 hover:bg-zinc-700 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                      <button onClick={() => handleDelete(sheet.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {routeSheets.map((sheet) => {
          const employee = employees.find(e => e.id === sheet.employee_id)
          return (
            <div key={sheet.id} className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-medium text-sm">{employee?.name || '—'}</p>
                  <p className="text-xs text-zinc-500">{new Date(sheet.created_at).toLocaleDateString('uk-UA')}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(sheet)} className="p-2 hover:bg-zinc-700 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                  <button onClick={() => handleDelete(sheet.id)} className="p-2 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">ВТК</p><p className="text-white">{sheet.vtk_count || 0}</p></div>
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">Прип.</p><p className="text-white">{sheet.soldering_count || 0}</p></div>
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">Лак.</p><p className="text-white">{sheet.lacquering_count || 0}</p></div>
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">Штамп.</p><p className="text-white">{sheet.stamping_count || 0}</p></div>
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">Запоб.</p><p className="text-white">{sheet.fuse_soldering_count || 0}</p></div>
                <div className="bg-zinc-800/50 rounded p-1.5 text-center"><p className="text-zinc-500">Брак</p><p className={sheet.defect_count > 0 ? 'text-red-400' : 'text-white'}>{sheet.defect_count || 0}</p></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                <span className="text-zinc-400 text-sm">Сума:</span>
                <span className="text-emerald-400 font-bold">{parseFloat(sheet.total_amount || 0).toFixed(2)}₴</span>
              </div>
            </div>
          )
        })}
      </div>
      
      {routeSheets.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Немає листів</p>
          <button onClick={() => openModal()} className="btn btn-primary mt-4"><Plus className="w-4 h-4" />Створити</button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-xl lg:rounded-xl w-full lg:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
              <h3 className="text-lg font-semibold text-white">{editingSheet ? 'Редагувати' : 'Новий лист'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">Працівник</label>
                <select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="input">
                  <option value="">Оберіть</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              
              {/* Етапи з можливістю додавання матеріалів */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(STAGE_NAMES).map(([key, name]) => (
                  <div key={key} className="bg-zinc-800/50 rounded-lg p-2">
                    <label className="label text-xs flex justify-between"><span>{name}</span><span className="text-sky-400">{STAGE_PRICES[key]}₴</span></label>
                    <input type="number" min="0" value={formData[`${key}_count`]} onChange={(e) => setFormData({ ...formData, [`${key}_count`]: parseInt(e.target.value) || 0 })} className="input py-2 mb-2" placeholder="Кількість" />
                    
                    {/* Вибір матеріалу */}
                    <div className="flex gap-1 mb-1">
                      <select 
                        id={`material-select-${key}`}
                        className="input py-1 text-xs flex-1"
                        defaultValue=""
                      >
                        <option value="">+ Матеріал</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.quantity} {item.unit})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        id={`material-qty-${key}`}
                        min="1" 
                        defaultValue="1"
                        className="input py-1 text-xs w-16"
                        placeholder="К-сть"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const select = document.getElementById(`material-select-${key}`)
                          const qtyInput = document.getElementById(`material-qty-${key}`)
                          if (select.value) {
                            addMaterial(key, select.value, parseInt(qtyInput.value) || 1)
                            select.value = ''
                            qtyInput.value = '1'
                          }
                        }}
                        className="btn btn-secondary py-1 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Список доданих матеріалів */}
                    {selectedMaterials[key]?.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {selectedMaterials[key].map((mat, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-zinc-700/50 rounded px-2 py-1">
                            <span className="text-zinc-300 truncate">{mat.name}: {mat.quantity} {mat.unit}</span>
                            <button onClick={() => removeMaterial(key, idx)} className="text-red-400 hover:text-red-300 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <label className="label">Брак</label>
                <input type="number" min="0" value={formData.defect_count} onChange={(e) => setFormData({ ...formData, defect_count: parseInt(e.target.value) || 0 })} className="input" />
              </div>
              
              {/* Підсумок списання матеріалів */}
              {Object.keys(selectedMaterials).some(k => selectedMaterials[k]?.length > 0) && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-amber-400 text-sm font-medium mb-2">Буде списано зі складу:</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(selectedMaterials).map(([stage, materials]) => 
                      materials?.map((mat, idx) => (
                        <div key={`${stage}-${idx}`} className="flex justify-between text-zinc-300">
                          <span>{mat.name}</span>
                          <span>-{mat.quantity} {mat.unit}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">Сума:</span>
                  <span className="text-xl font-bold text-emerald-400">{calculateTotal(formData).toFixed(2)}₴</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-700 sticky bottom-0 bg-zinc-900">
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="btn btn-secondary flex-1">Скасувати</button>
              <button onClick={handleSave} disabled={!formData.employee_id || saving} className="btn btn-primary flex-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? '...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== EMPLOYEES ====================
function Employees({ employees, setEmployees, loading, refreshData, setIsOpen }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', position: '' })

  const resetForm = () => { setFormData({ name: '', position: '' }); setEditingEmployee(null) }

  const openModal = (employee = null) => {
    if (employee) { setEditingEmployee(employee); setFormData({ name: employee.name, position: employee.position || '' }) }
    else { resetForm() }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingEmployee) {
        const { data, error } = await supabase.from('employees').update(formData).eq('id', editingEmployee.id).select().single()
        if (error) throw error
        setEmployees(employees.map(e => e.id === editingEmployee.id ? data : e))
      } else {
        const { data, error } = await supabase.from('employees').insert(formData).select().single()
        if (error) throw error
        setEmployees([...employees, data])
      }
      setIsModalOpen(false); resetForm()
    } catch (error) { alert('Помилка: ' + error.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити?')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      setEmployees(employees.filter(e => e.id !== id))
    } catch (error) { alert('Помилка: ' + error.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <MobileHeader setIsOpen={setIsOpen} title="Працівники" />
      <div className="hidden lg:flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Працівники</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => openModal()} className="btn btn-primary"><Plus className="w-4 h-4" />Додати</button>
        </div>
      </div>
      <div className="flex lg:hidden gap-2 mb-4">
        <button onClick={refreshData} className="btn btn-secondary flex-1"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={() => openModal()} className="btn btn-primary flex-1"><Plus className="w-4 h-4" />Додати</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {employees.map((emp) => (
          <div key={emp.id} className="card p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{emp.name}</h3>
                  <p className="text-xs text-zinc-500">{emp.position || 'Без посади'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(emp)} className="p-1.5 hover:bg-zinc-700 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                <button onClick={() => handleDelete(emp.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Немає працівників</p>
          <button onClick={() => openModal()} className="btn btn-primary mt-4"><Plus className="w-4 h-4" />Додати</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-xl lg:rounded-xl w-full lg:max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">{editingEmployee ? 'Редагувати' : 'Новий працівник'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="label">Ім'я</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="Ім'я та прізвище" /></div>
              <div><label className="label">Посада</label><input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input" placeholder="Посада" /></div>
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-700">
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="btn btn-secondary flex-1">Скасувати</button>
              <button onClick={handleSave} disabled={!formData.name || saving} className="btn btn-primary flex-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? '...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== INVENTORY ====================
function Inventory({ inventory, setInventory, loading, refreshData, setIsOpen }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', quantity: 0, unit: 'шт', min_quantity: 0 })

  const resetForm = () => { setFormData({ name: '', quantity: 0, unit: 'шт', min_quantity: 0 }); setEditingItem(null) }
  const getStatus = (item) => item.quantity <= item.min_quantity ? 'critical' : item.quantity <= item.min_quantity * 2 ? 'low' : 'ok'

  const openModal = (item = null) => {
    if (item) { setEditingItem(item); setFormData({ name: item.name, quantity: item.quantity, unit: item.unit, min_quantity: item.min_quantity }) }
    else { resetForm() }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingItem) {
        const { data, error } = await supabase.from('inventory').update(formData).eq('id', editingItem.id).select().single()
        if (error) throw error
        setInventory(inventory.map(i => i.id === editingItem.id ? data : i))
      } else {
        const { data, error } = await supabase.from('inventory').insert(formData).select().single()
        if (error) throw error
        setInventory([...inventory, data])
      }
      setIsModalOpen(false); resetForm()
    } catch (error) { alert('Помилка: ' + error.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити?')) return
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id)
      if (error) throw error
      setInventory(inventory.filter(i => i.id !== id))
    } catch (error) { alert('Помилка: ' + error.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <MobileHeader setIsOpen={setIsOpen} title="Склад" />
      <div className="hidden lg:flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Склад</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => openModal()} className="btn btn-primary"><Plus className="w-4 h-4" />Додати</button>
        </div>
      </div>
      <div className="flex lg:hidden gap-2 mb-4">
        <button onClick={refreshData} className="btn btn-secondary flex-1"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={() => openModal()} className="btn btn-primary flex-1"><Plus className="w-4 h-4" />Додати</button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block table-container">
        <table className="table">
          <thead><tr><th>Назва</th><th>Кількість</th><th>Одиниця</th><th>Мін.</th><th>Статус</th><th>Дії</th></tr></thead>
          <tbody>
            {inventory.map((item) => {
              const status = getStatus(item)
              return (
                <tr key={item.id}>
                  <td className="text-white font-medium">{item.name}</td>
                  <td className={status === 'critical' ? 'text-red-400' : status === 'low' ? 'text-amber-400' : ''}>{item.quantity}</td>
                  <td className="text-zinc-400">{item.unit}</td>
                  <td className="text-zinc-400">{item.min_quantity}</td>
                  <td>
                    {status === 'critical' && <span className="badge badge-danger">Критично</span>}
                    {status === 'low' && <span className="badge badge-warning">Мало</span>}
                    {status === 'ok' && <span className="badge badge-success">OK</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(item)} className="p-1.5 hover:bg-zinc-700 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {inventory.map((item) => {
          const status = getStatus(item)
          return (
            <div key={item.id} className={`card p-3 ${status === 'critical' ? 'border-red-500/50' : status === 'low' ? 'border-amber-500/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium text-sm">{item.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openModal(item)} className="p-1.5 hover:bg-zinc-700 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <div><span className="text-zinc-500">Є:</span> <span className={status === 'critical' ? 'text-red-400' : status === 'low' ? 'text-amber-400' : 'text-white'}>{item.quantity}</span></div>
                  <div><span className="text-zinc-500">Мін:</span> <span className="text-zinc-400">{item.min_quantity}</span></div>
                </div>
                {status === 'critical' && <span className="badge badge-danger">!</span>}
                {status === 'low' && <span className="badge badge-warning">!</span>}
                {status === 'ok' && <span className="badge badge-success">OK</span>}
              </div>
            </div>
          )
        })}
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Склад порожній</p>
          <button onClick={() => openModal()} className="btn btn-primary mt-4"><Plus className="w-4 h-4" />Додати</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-xl lg:rounded-xl w-full lg:max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">{editingItem ? 'Редагувати' : 'Нова позиція'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="label">Назва</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Кількість</label><input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} className="input" /></div>
                <div><label className="label">Одиниця</label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input"><option value="шт">шт</option><option value="л">л</option><option value="кг">кг</option><option value="м">м</option></select></div>
              </div>
              <div><label className="label">Мінімум</label><input type="number" min="0" value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })} className="input" /></div>
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-700">
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="btn btn-secondary flex-1">Скасувати</button>
              <button onClick={handleSave} disabled={!formData.name || saving} className="btn btn-primary flex-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? '...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== ANALYTICS ====================
function Analytics({ routeSheets, employees, inventory, loading, setIsOpen }) {
  if (loading) return <LoadingSpinner />
  
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const weeklyStats = employees.map(emp => {
    const empSheets = routeSheets.filter(s => s.employee_id === emp.id && new Date(s.created_at) >= weekAgo)
    const totalOps = empSheets.reduce((sum, s) => sum + (s.vtk_count||0) + (s.soldering_count||0) + (s.lacquering_count||0) + (s.stamping_count||0) + (s.fuse_soldering_count||0), 0)
    const totalDefects = empSheets.reduce((sum, s) => sum + (s.defect_count||0), 0)
    return {
      name: emp.name.split(' ')[0],
      sheets: empSheets.length,
      earnings: empSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      defects: totalDefects,
      defectRate: totalOps > 0 ? ((totalDefects / totalOps) * 100).toFixed(1) : 0,
    }
  })
  
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (6 - i))
    const daySheets = routeSheets.filter(s => new Date(s.created_at).toDateString() === date.toDateString())
    return { date: date.toLocaleDateString('uk-UA', { weekday: 'short' }), earnings: daySheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) }
  })

  return (
    <div className="animate-fadeIn space-y-4">
      <MobileHeader setIsOpen={setIsOpen} title="Аналітика" />
      <h2 className="hidden lg:block text-2xl font-bold text-white">Аналітика</h2>
      
      <div className="card">
        <h3 className="text-sm lg:text-lg font-semibold text-white mb-3">За тиждень</h3>
        <div className="space-y-2">
          {weeklyStats.map((stat, idx) => (
            <div key={idx} className="bg-zinc-800/50 rounded-lg p-2 lg:p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{stat.name}</span>
                <span className="text-emerald-400 font-semibold text-sm">{stat.earnings.toFixed(0)}₴</span>
              </div>
              <div className="flex gap-4 text-xs text-zinc-400">
                <span>Листів: {stat.sheets}</span>
                <span className={stat.defects > 0 ? 'text-red-400' : ''}>Брак: {stat.defects}</span>
                <span>%: {stat.defectRate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-sm lg:text-lg font-semibold text-white mb-3">Тренд (7 днів)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px' }} />
            <Line type="monotone" dataKey="earnings" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="card">
        <h3 className="text-sm lg:text-lg font-semibold text-white mb-3">Критичний склад</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {inventory.filter(i => i.quantity <= i.min_quantity * 2).map((item) => (
            <div key={item.id} className={`p-2 rounded-lg border text-sm ${item.quantity <= item.min_quantity ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-white">{item.name}</span>
                <span className={item.quantity <= item.min_quantity ? 'text-red-400' : 'text-amber-400'}>{item.quantity}/{item.min_quantity}</span>
              </div>
            </div>
          ))}
          {inventory.filter(i => i.quantity <= i.min_quantity * 2).length === 0 && (
            <div className="col-span-full text-center py-4 text-zinc-500 text-sm">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p>Все в нормі</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN APP ====================
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [inventory, setInventory] = useState([])
  const [routeSheets, setRouteSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [empRes, invRes, sheetRes] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('inventory').select('*').order('name'),
        supabase.from('route_sheets').select('*').order('created_at', { ascending: false })
      ])
      if (empRes.error) throw empRes.error
      if (invRes.error) throw invRes.error
      if (sheetRes.error) throw sheetRes.error
      setEmployees(empRes.data || [])
      setInventory(invRes.data || [])
      setRouteSheets(sheetRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Помилка</h3>
          <p className="text-zinc-400 mb-4 text-center text-sm">{error}</p>
          <button onClick={fetchData} className="btn btn-primary"><RefreshCw className="w-4 h-4" />Повторити</button>
        </div>
      )
    }
    
    const props = { loading, refreshData: fetchData, setIsOpen: setSidebarOpen }
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} {...props} />
      case 'route-sheets': return <RouteSheets routeSheets={routeSheets} setRouteSheets={setRouteSheets} employees={employees} inventory={inventory} setInventory={setInventory} {...props} />
      case 'employees': return <Employees employees={employees} setEmployees={setEmployees} {...props} />
      case 'inventory': return <Inventory inventory={inventory} setInventory={setInventory} {...props} />
      case 'analytics': return <Analytics routeSheets={routeSheets} employees={employees} inventory={inventory} {...props} />
      default: return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} {...props} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 p-3 lg:p-6 overflow-auto w-full">{renderContent()}</main>
    </div>
  )
}
