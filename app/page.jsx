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
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  ChevronDown,
  Link as LinkIcon,
  Check,
  Loader2,
  RefreshCw
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
  soldering: "Припайка роз'ємів",
  lacquering: 'Лакування + батарея',
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
function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'route-sheets', label: 'Маршрутні листи', icon: FileText },
    { id: 'employees', label: 'Працівники', icon: Users },
    { id: 'inventory', label: 'Склад', icon: Package },
    { id: 'analytics', label: 'Аналітика', icon: BarChart3 },
  ]

  return (
    <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 p-4 flex flex-col min-h-screen">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          Облік
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Система виробництва</p>
      </div>
      
      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          <p className="mt-1">© 2024 Production Accounting</p>
        </div>
      </div>
    </aside>
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
function Dashboard({ routeSheets, employees, inventory, loading }) {
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
      defects: empSheets.reduce((sum, s) => sum + (s.defect_count || 0), 0),
    }
  })

  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-white mb-6">Дашборд</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Всього листів</span>
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <span className="stat-value">{routeSheets.length}</span>
          <span className="text-xs text-emerald-400">+{weekSheets.length} за тиждень</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Загальний заробіток</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="stat-value">{totalEarnings.toFixed(2)}₴</span>
          <span className="text-xs text-emerald-400">+{weekEarnings.toFixed(2)}₴ за тиждень</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Кількість браку</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <span className="stat-value">{totalDefects}</span>
          <span className="text-xs text-zinc-500">одиниць всього</span>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Критичний склад</span>
            <Package className="w-5 h-5 text-red-400" />
          </div>
          <span className="stat-value">{lowInventory}</span>
          <span className="text-xs text-red-400">позицій потребують поповнення</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Заробіток по працівниках</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="earnings" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Заробіток (₴)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Кількість листів</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={employeeStats.filter(e => e.sheets > 0)}
                dataKey="sheets"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {employeeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Останні маршрутні листи</h3>
        <div className="space-y-3">
          {routeSheets.slice(0, 5).map((sheet) => {
            const employee = employees.find(e => e.id === sheet.employee_id)
            return (
              <div key={sheet.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-600/20 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{employee?.name || 'Невідомий'}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(sheet.created_at).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">{parseFloat(sheet.total_amount || 0).toFixed(2)}₴</p>
                  {sheet.defect_count > 0 && (
                    <p className="text-xs text-amber-400">Брак: {sheet.defect_count}</p>
                  )}
                </div>
              </div>
            )
          })}
          {routeSheets.length === 0 && (
            <p className="text-zinc-500 text-center py-4">Немає маршрутних листів</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== ROUTE SHEETS ====================
function RouteSheets({ routeSheets, setRouteSheets, employees, inventory, setInventory, loading, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSheet, setEditingSheet] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '',
    vtk_count: 0,
    soldering_count: 0,
    lacquering_count: 0,
    stamping_count: 0,
    fuse_soldering_count: 0,
    defect_count: 0,
  })

  const resetForm = () => {
    setFormData({
      employee_id: '',
      vtk_count: 0,
      soldering_count: 0,
      lacquering_count: 0,
      stamping_count: 0,
      fuse_soldering_count: 0,
      defect_count: 0,
    })
    setEditingSheet(null)
  }

  const openModal = (sheet = null) => {
    if (sheet) {
      setEditingSheet(sheet)
      setFormData({
        employee_id: sheet.employee_id,
        vtk_count: sheet.vtk_count || 0,
        soldering_count: sheet.soldering_count || 0,
        lacquering_count: sheet.lacquering_count || 0,
        stamping_count: sheet.stamping_count || 0,
        fuse_soldering_count: sheet.fuse_soldering_count || 0,
        defect_count: sheet.defect_count || 0,
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const total = calculateTotal(formData)
    
    try {
      if (editingSheet) {
        // UPDATE
        const { data, error } = await supabase
          .from('route_sheets')
          .update({
            employee_id: parseInt(formData.employee_id),
            vtk_count: formData.vtk_count,
            soldering_count: formData.soldering_count,
            lacquering_count: formData.lacquering_count,
            stamping_count: formData.stamping_count,
            fuse_soldering_count: formData.fuse_soldering_count,
            defect_count: formData.defect_count,
            total_amount: total,
          })
          .eq('id', editingSheet.id)
          .select()
          .single()
        
        if (error) throw error
        
        setRouteSheets(routeSheets.map(s => s.id === editingSheet.id ? data : s))
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('route_sheets')
          .insert({
            employee_id: parseInt(formData.employee_id),
            vtk_count: formData.vtk_count,
            soldering_count: formData.soldering_count,
            lacquering_count: formData.lacquering_count,
            stamping_count: formData.stamping_count,
            fuse_soldering_count: formData.fuse_soldering_count,
            defect_count: formData.defect_count,
            total_amount: total,
          })
          .select()
          .single()
        
        if (error) throw error
        
        setRouteSheets([data, ...routeSheets])
      }
      
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Помилка збереження: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити цей маршрутний лист?')) return
    
    try {
      const { error } = await supabase
        .from('route_sheets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setRouteSheets(routeSheets.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Помилка видалення: ' + error.message)
    }
  }

  const currentTotal = calculateTotal(formData)

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Маршрутні листи</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Новий лист
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Працівник</th>
              <th>ВТК</th>
              <th>Припайка</th>
              <th>Лакування</th>
              <th>Штампування</th>
              <th>Запобіжник</th>
              <th>Брак</th>
              <th>Сума</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {routeSheets.map((sheet) => {
              const employee = employees.find(e => e.id === sheet.employee_id)
              return (
                <tr key={sheet.id}>
                  <td className="text-zinc-400">
                    {new Date(sheet.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="text-white font-medium">{employee?.name || '—'}</td>
                  <td>{sheet.vtk_count || 0}</td>
                  <td>{sheet.soldering_count || 0}</td>
                  <td>{sheet.lacquering_count || 0}</td>
                  <td>{sheet.stamping_count || 0}</td>
                  <td>{sheet.fuse_soldering_count || 0}</td>
                  <td>
                    {sheet.defect_count > 0 ? (
                      <span className="badge badge-danger">{sheet.defect_count}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                  <td className="text-emerald-400 font-semibold">
                    {parseFloat(sheet.total_amount || 0).toFixed(2)}₴
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(sheet)}
                        className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(sheet.id)}
                        className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {routeSheets.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Немає маршрутних листів</p>
            <button onClick={() => openModal()} className="btn btn-primary mt-4">
              <Plus className="w-4 h-4" />
              Створити перший
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">
                {editingSheet ? 'Редагувати лист' : 'Новий маршрутний лист'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-1 hover:bg-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="label">Працівник</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="input"
                >
                  <option value="">Оберіть працівника</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(STAGE_NAMES).map(([key, name]) => (
                  <div key={key} className="bg-zinc-800/50 rounded-lg p-3">
                    <label className="label flex items-center justify-between">
                      <span>{name}</span>
                      <span className="text-sky-400">{STAGE_PRICES[key]}₴</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData[`${key}_count`]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [`${key}_count`]: parseInt(e.target.value) || 0 
                      })}
                      className="input"
                      placeholder="Кількість"
                    />
                  </div>
                ))}
              </div>
              
              <div>
                <label className="label">Кількість браку</label>
                <input
                  type="number"
                  min="0"
                  value={formData.defect_count}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    defect_count: parseInt(e.target.value) || 0 
                  })}
                  className="input"
                  placeholder="0"
                />
              </div>
              
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-medium">Загальна сума:</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {currentTotal.toFixed(2)}₴
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="btn btn-secondary"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.employee_id || saving}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== EMPLOYEES ====================
function Employees({ employees, setEmployees, loading, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', position: '' })

  const resetForm = () => {
    setFormData({ name: '', position: '' })
    setEditingEmployee(null)
  }

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({ name: employee.name, position: employee.position || '' })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      if (editingEmployee) {
        const { data, error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', editingEmployee.id)
          .select()
          .single()
        
        if (error) throw error
        
        setEmployees(employees.map(e => e.id === editingEmployee.id ? data : e))
      } else {
        const { data, error } = await supabase
          .from('employees')
          .insert(formData)
          .select()
          .single()
        
        if (error) throw error
        
        setEmployees([...employees, data])
      }
      
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Помилка збереження: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити цього працівника?')) return
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setEmployees(employees.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Помилка видалення: ' + error.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Працівники</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Додати працівника
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="card group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-white font-medium">{emp.name}</h3>
                  <p className="text-sm text-zinc-500">{emp.position || 'Без посади'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openModal(emp)}
                  className="p-1.5 hover:bg-zinc-700 rounded-lg"
                >
                  <Edit2 className="w-4 h-4 text-zinc-400" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Немає працівників</p>
          <button onClick={() => openModal()} className="btn btn-primary mt-4">
            <Plus className="w-4 h-4" />
            Додати першого
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">
                {editingEmployee ? 'Редагувати працівника' : 'Новий працівник'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-1 hover:bg-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="label">Ім'я та прізвище</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Введіть ім'я"
                />
              </div>
              <div>
                <label className="label">Посада</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="input"
                  placeholder="Введіть посаду"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="btn btn-secondary"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || saving}
                className="btn btn-primary disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== INVENTORY ====================
function Inventory({ inventory, setInventory, loading, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', quantity: 0, unit: 'шт', min_quantity: 0 })

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, unit: 'шт', min_quantity: 0 })
    setEditingItem(null)
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        min_quantity: item.min_quantity
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      if (editingItem) {
        const { data, error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', editingItem.id)
          .select()
          .single()
        
        if (error) throw error
        
        setInventory(inventory.map(i => i.id === editingItem.id ? data : i))
      } else {
        const { data, error } = await supabase
          .from('inventory')
          .insert(formData)
          .select()
          .single()
        
        if (error) throw error
        
        setInventory([...inventory, data])
      }
      
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Помилка збереження: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити цю позицію?')) return
    
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setInventory(inventory.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Помилка видалення: ' + error.message)
    }
  }

  const getStatus = (item) => {
    if (item.quantity <= item.min_quantity) return 'critical'
    if (item.quantity <= item.min_quantity * 2) return 'low'
    return 'ok'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Склад</h2>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Додати позицію
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Кількість</th>
              <th>Одиниця</th>
              <th>Мін. запас</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const status = getStatus(item)
              return (
                <tr key={item.id}>
                  <td className="text-white font-medium">{item.name}</td>
                  <td className={status === 'critical' ? 'text-red-400' : status === 'low' ? 'text-amber-400' : ''}>
                    {item.quantity}
                  </td>
                  <td className="text-zinc-400">{item.unit}</td>
                  <td className="text-zinc-400">{item.min_quantity}</td>
                  <td>
                    {status === 'critical' && (
                      <span className="badge badge-danger">Критично</span>
                    )}
                    {status === 'low' && (
                      <span className="badge badge-warning">Мало</span>
                    )}
                    {status === 'ok' && (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 hover:bg-zinc-700 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {inventory.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Склад порожній</p>
            <button onClick={() => openModal()} className="btn btn-primary mt-4">
              <Plus className="w-4 h-4" />
              Додати перший матеріал
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? 'Редагувати позицію' : 'Нова позиція'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1 hover:bg-zinc-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="label">Назва</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Назва матеріалу"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Кількість</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Одиниця</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input"
                  >
                    <option value="шт">шт</option>
                    <option value="л">л</option>
                    <option value="кг">кг</option>
                    <option value="м">м</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Мінімальний запас</label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary">
                Скасувати
              </button>
              <button onClick={handleSave} disabled={!formData.name || saving} className="btn btn-primary disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== ANALYTICS ====================
function Analytics({ routeSheets, employees, inventory, loading }) {
  if (loading) return <LoadingSpinner />
  
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const weeklyStats = employees.map(emp => {
    const empSheets = routeSheets.filter(
      s => s.employee_id === emp.id && new Date(s.created_at) >= weekAgo
    )
    const totalOps = empSheets.reduce((sum, s) => 
      sum + (s.vtk_count||0) + (s.soldering_count||0) + (s.lacquering_count||0) + (s.stamping_count||0) + (s.fuse_soldering_count||0), 0
    )
    const totalDefects = empSheets.reduce((sum, s) => sum + (s.defect_count||0), 0)
    
    return {
      name: emp.name,
      sheets: empSheets.length,
      earnings: empSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      operations: totalOps,
      defects: totalDefects,
      defectRate: totalOps > 0 ? ((totalDefects / totalOps) * 100).toFixed(2) : 0,
    }
  })
  
  const monthlyStats = employees.map(emp => {
    const empSheets = routeSheets.filter(
      s => s.employee_id === emp.id && new Date(s.created_at) >= monthAgo
    )
    return {
      name: emp.name,
      sheets: empSheets.length,
      earnings: empSheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
    }
  })
  
  const defectsByEmployee = employees.map(emp => {
    const empSheets = routeSheets.filter(s => s.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      defects: empSheets.reduce((sum, s) => sum + (s.defect_count||0), 0),
    }
  })
  
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (6 - i))
    const daySheets = routeSheets.filter(s => {
      const sheetDate = new Date(s.created_at)
      return sheetDate.toDateString() === date.toDateString()
    })
    return {
      date: date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
      earnings: daySheets.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      sheets: daySheets.length,
    }
  })

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-bold text-white">Аналітика</h2>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Виробництво за тиждень</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Працівник</th>
                <th>Листів</th>
                <th>Операцій</th>
                <th>Браку</th>
                <th>% браку</th>
                <th>Заробіток</th>
              </tr>
            </thead>
            <tbody>
              {weeklyStats.map((stat, idx) => (
                <tr key={idx}>
                  <td className="text-white font-medium">{stat.name}</td>
                  <td>{stat.sheets}</td>
                  <td>{stat.operations}</td>
                  <td>
                    {stat.defects > 0 ? (
                      <span className="text-red-400">{stat.defects}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                  <td>
                    <span className={parseFloat(stat.defectRate) > 5 ? 'text-red-400' : 'text-emerald-400'}>
                      {stat.defectRate}%
                    </span>
                  </td>
                  <td className="text-emerald-400 font-semibold">{stat.earnings.toFixed(2)}₴</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Тренд заробітку (7 днів)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
                name="Заробіток (₴)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Брак по працівниках</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={defectsByEmployee}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="defects" fill="#ef4444" radius={[4, 4, 0, 0]} name="Брак (шт)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Виробництво за місяць</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" />
            <YAxis dataKey="name" type="category" stroke="#71717a" width={120} />
            <Tooltip 
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="earnings" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Заробіток (₴)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Статус складу</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventory.filter(i => i.quantity <= i.min_quantity * 2).map((item) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-lg border ${
                item.quantity <= item.min_quantity 
                  ? 'bg-red-900/20 border-red-500/30' 
                  : 'bg-amber-900/20 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-4 h-4 ${
                  item.quantity <= item.min_quantity ? 'text-red-400' : 'text-amber-400'
                }`} />
                <span className="text-white font-medium text-sm">{item.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Залишок:</span>
                <span className={item.quantity <= item.min_quantity ? 'text-red-400' : 'text-amber-400'}>
                  {item.quantity} {item.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Мінімум:</span>
                <span className="text-zinc-500">{item.min_quantity} {item.unit}</span>
              </div>
            </div>
          ))}
          {inventory.filter(i => i.quantity <= i.min_quantity * 2).length === 0 && (
            <div className="col-span-3 text-center py-8 text-zinc-500">
              <Check className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
              <p>Всі матеріали в достатній кількості</p>
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
  const [employees, setEmployees] = useState([])
  const [inventory, setInventory] = useState([])
  const [routeSheets, setRouteSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Функція завантаження даних
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Завантажуємо працівників
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      
      if (empError) throw empError
      setEmployees(empData || [])
      
      // Завантажуємо склад
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .order('name')
      
      if (invError) throw invError
      setInventory(invData || [])
      
      // Завантажуємо маршрутні листи
      const { data: sheetData, error: sheetError } = await supabase
        .from('route_sheets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (sheetError) throw sheetError
      setRouteSheets(sheetData || [])
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Завантажуємо дані при першому рендері
  useEffect(() => {
    fetchData()
  }, [])

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Помилка підключення</h3>
          <p className="text-zinc-400 mb-4 text-center max-w-md">{error}</p>
          <p className="text-zinc-500 text-sm mb-4">Перевірте налаштування Supabase</p>
          <button onClick={fetchData} className="btn btn-primary">
            <RefreshCw className="w-4 h-4" />
            Спробувати знову
          </button>
        </div>
      )
    }
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} loading={loading} />
      case 'route-sheets':
        return <RouteSheets 
          routeSheets={routeSheets} 
          setRouteSheets={setRouteSheets} 
          employees={employees}
          inventory={inventory}
          setInventory={setInventory}
          loading={loading}
          refreshData={fetchData}
        />
      case 'employees':
        return <Employees employees={employees} setEmployees={setEmployees} loading={loading} refreshData={fetchData} />
      case 'inventory':
        return <Inventory inventory={inventory} setInventory={setInventory} loading={loading} refreshData={fetchData} />
      case 'analytics':
        return <Analytics routeSheets={routeSheets} employees={employees} inventory={inventory} loading={loading} />
      default:
        return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} loading={loading} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}
