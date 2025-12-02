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
  Check
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

// ==================== MOCK DATA (для демо без Supabase) ====================
const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Тарас Ільків', position: 'Монтажник' },
  { id: 2, name: 'Марія Коваль', position: 'Монтажник' },
  { id: 3, name: 'Петро Шевченко', position: 'Старший монтажник' },
]

const INITIAL_INVENTORY = [
  { id: 1, name: "Роз'єм USB Type-C", quantity: 500, unit: 'шт', min_quantity: 100 },
  { id: 2, name: 'Перемикач тактовий', quantity: 300, unit: 'шт', min_quantity: 50 },
  { id: 3, name: 'Контакти позолочені', quantity: 1000, unit: 'шт', min_quantity: 200 },
  { id: 4, name: 'Лак захисний', quantity: 50, unit: 'л', min_quantity: 10 },
  { id: 5, name: 'Батарея Li-Ion 3.7V', quantity: 200, unit: 'шт', min_quantity: 50 },
  { id: 6, name: 'Клей епоксидний', quantity: 30, unit: 'шт', min_quantity: 5 },
  { id: 7, name: 'Контакти для штампування', quantity: 2000, unit: 'шт', min_quantity: 500 },
  { id: 8, name: 'Запобіжник 5A', quantity: 400, unit: 'шт', min_quantity: 100 },
]

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

// ==================== DASHBOARD ====================
function Dashboard({ routeSheets, employees, inventory }) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const weekSheets = routeSheets.filter(s => new Date(s.created_at) >= weekAgo)
  const totalEarnings = routeSheets.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  const weekEarnings = weekSheets.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  const totalDefects = routeSheets.reduce((sum, s) => sum + (s.defect_count || 0), 0)
  const lowInventory = inventory.filter(i => i.quantity <= i.min_quantity).length
  
  // Дані для графіка по працівниках
  const employeeStats = employees.map(emp => {
    const empSheets = routeSheets.filter(s => s.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      earnings: empSheets.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      sheets: empSheets.length,
      defects: empSheets.reduce((sum, s) => sum + (s.defect_count || 0), 0),
    }
  })

  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-white mb-6">Дашборд</h2>
      
      {/* Stats Grid */}
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
      
      {/* Charts */}
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
                data={employeeStats}
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
      
      {/* Recent Activity */}
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
                  <p className="text-emerald-400 font-semibold">{sheet.total_amount?.toFixed(2)}₴</p>
                  {sheet.defect_count > 0 && (
                    <p className="text-xs text-amber-400">Брак: {sheet.defect_count}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ==================== ROUTE SHEETS ====================
function RouteSheets({ routeSheets, setRouteSheets, employees, inventory, setInventory }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSheet, setEditingSheet] = useState(null)
  const [selectedMaterials, setSelectedMaterials] = useState({})
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
    setSelectedMaterials({})
    setEditingSheet(null)
  }

  const openModal = (sheet = null) => {
    if (sheet) {
      setEditingSheet(sheet)
      setFormData({
        employee_id: sheet.employee_id,
        vtk_count: sheet.vtk_count,
        soldering_count: sheet.soldering_count,
        lacquering_count: sheet.lacquering_count,
        stamping_count: sheet.stamping_count,
        fuse_soldering_count: sheet.fuse_soldering_count,
        defect_count: sheet.defect_count,
      })
      setSelectedMaterials(sheet.materials || {})
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    const total = calculateTotal(formData)
    
    if (editingSheet) {
      setRouteSheets(routeSheets.map(s => 
        s.id === editingSheet.id 
          ? { ...s, ...formData, total_amount: total, materials: selectedMaterials }
          : s
      ))
    } else {
      const newSheet = {
        id: Date.now(),
        ...formData,
        employee_id: parseInt(formData.employee_id),
        total_amount: total,
        materials: selectedMaterials,
        created_at: new Date().toISOString(),
      }
      setRouteSheets([newSheet, ...routeSheets])
      
      // Списуємо матеріали зі складу
      Object.entries(selectedMaterials).forEach(([stage, items]) => {
        items.forEach(item => {
          setInventory(inv => inv.map(i => 
            i.id === item.inventory_id
              ? { ...i, quantity: i.quantity - item.quantity }
              : i
          ))
        })
      })
    }
    
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = (id) => {
    if (confirm('Видалити цей маршрутний лист?')) {
      setRouteSheets(routeSheets.filter(s => s.id !== id))
    }
  }

  const addMaterial = (stage, inventoryId, quantity) => {
    const invItem = inventory.find(i => i.id === inventoryId)
    if (!invItem) return
    
    setSelectedMaterials(prev => ({
      ...prev,
      [stage]: [
        ...(prev[stage] || []),
        { inventory_id: inventoryId, name: invItem.name, quantity }
      ]
    }))
  }

  const removeMaterial = (stage, index) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [stage]: prev[stage].filter((_, i) => i !== index)
    }))
  }

  const currentTotal = calculateTotal(formData)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Маршрутні листи</h2>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Новий лист
        </button>
      </div>

      {/* Table */}
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
                  <td>{sheet.vtk_count}</td>
                  <td>{sheet.soldering_count}</td>
                  <td>{sheet.lacquering_count}</td>
                  <td>{sheet.stamping_count}</td>
                  <td>{sheet.fuse_soldering_count}</td>
                  <td>
                    {sheet.defect_count > 0 ? (
                      <span className="badge badge-danger">{sheet.defect_count}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                  <td className="text-emerald-400 font-semibold">
                    {sheet.total_amount?.toFixed(2)}₴
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
              {/* Employee Select */}
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
              
              {/* Stages */}
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
                    
                    {/* Materials for stage */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          className="input text-sm py-1"
                          onChange={(e) => {
                            if (e.target.value) {
                              addMaterial(key, parseInt(e.target.value), 1)
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">+ Матеріал</option>
                          {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.quantity} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedMaterials[key]?.map((mat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                          <span>{mat.name}: {mat.quantity}</span>
                          <button
                            onClick={() => removeMaterial(key, idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Defects */}
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
              
              {/* Total */}
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
                disabled={!formData.employee_id}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== EMPLOYEES ====================
function Employees({ employees, setEmployees }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
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

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id ? { ...e, ...formData } : e
      ))
    } else {
      setEmployees([...employees, { id: Date.now(), ...formData }])
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = (id) => {
    if (confirm('Видалити цього працівника?')) {
      setEmployees(employees.filter(e => e.id !== id))
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Працівники</h2>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Додати працівника
        </button>
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
                disabled={!formData.name}
                className="btn btn-primary disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== INVENTORY ====================
function Inventory({ inventory, setInventory }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
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

  const handleSave = () => {
    if (editingItem) {
      setInventory(inventory.map(i => 
        i.id === editingItem.id ? { ...i, ...formData } : i
      ))
    } else {
      setInventory([...inventory, { id: Date.now(), ...formData }])
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = (id) => {
    if (confirm('Видалити цю позицію?')) {
      setInventory(inventory.filter(i => i.id !== id))
    }
  }

  const getStatus = (item) => {
    if (item.quantity <= item.min_quantity) return 'critical'
    if (item.quantity <= item.min_quantity * 2) return 'low'
    return 'ok'
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Склад</h2>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Додати позицію
        </button>
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
              <button onClick={handleSave} disabled={!formData.name} className="btn btn-primary disabled:opacity-50">
                <Save className="w-4 h-4" />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== ANALYTICS ====================
function Analytics({ routeSheets, employees, inventory }) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Статистика по працівниках за тиждень
  const weeklyStats = employees.map(emp => {
    const empSheets = routeSheets.filter(
      s => s.employee_id === emp.id && new Date(s.created_at) >= weekAgo
    )
    const totalOps = empSheets.reduce((sum, s) => 
      sum + s.vtk_count + s.soldering_count + s.lacquering_count + s.stamping_count + s.fuse_soldering_count, 0
    )
    const totalDefects = empSheets.reduce((sum, s) => sum + s.defect_count, 0)
    
    return {
      name: emp.name,
      sheets: empSheets.length,
      earnings: empSheets.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      operations: totalOps,
      defects: totalDefects,
      defectRate: totalOps > 0 ? ((totalDefects / totalOps) * 100).toFixed(2) : 0,
    }
  })
  
  // Статистика по працівниках за місяць
  const monthlyStats = employees.map(emp => {
    const empSheets = routeSheets.filter(
      s => s.employee_id === emp.id && new Date(s.created_at) >= monthAgo
    )
    return {
      name: emp.name,
      sheets: empSheets.length,
      earnings: empSheets.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    }
  })
  
  // Статистика браку по етапах
  const defectsByEmployee = employees.map(emp => {
    const empSheets = routeSheets.filter(s => s.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      defects: empSheets.reduce((sum, s) => sum + s.defect_count, 0),
    }
  })
  
  // Тренд виробництва по днях
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (6 - i))
    const daySheets = routeSheets.filter(s => {
      const sheetDate = new Date(s.created_at)
      return sheetDate.toDateString() === date.toDateString()
    })
    return {
      date: date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
      earnings: daySheets.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      sheets: daySheets.length,
    }
  })
  
  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-bold text-white">Аналітика</h2>
      
      {/* Weekly Stats */}
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
      
      {/* Charts Row */}
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
      
      {/* Monthly Stats */}
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
      
      {/* Inventory Status */}
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
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [routeSheets, setRouteSheets] = useState([
    {
      id: 1,
      employee_id: 1,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      vtk_count: 10,
      soldering_count: 8,
      lacquering_count: 7,
      stamping_count: 100,
      fuse_soldering_count: 15,
      defect_count: 2,
      total_amount: 10*15 + 8*27 + 7*15 + 100*0.25 + 15*1,
    },
    {
      id: 2,
      employee_id: 2,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      vtk_count: 12,
      soldering_count: 10,
      lacquering_count: 9,
      stamping_count: 80,
      fuse_soldering_count: 20,
      defect_count: 1,
      total_amount: 12*15 + 10*27 + 9*15 + 80*0.25 + 20*1,
    },
    {
      id: 3,
      employee_id: 3,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      vtk_count: 15,
      soldering_count: 12,
      lacquering_count: 11,
      stamping_count: 120,
      fuse_soldering_count: 25,
      defect_count: 0,
      total_amount: 15*15 + 12*27 + 11*15 + 120*0.25 + 25*1,
    },
  ])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} />
      case 'route-sheets':
        return <RouteSheets 
          routeSheets={routeSheets} 
          setRouteSheets={setRouteSheets} 
          employees={employees}
          inventory={inventory}
          setInventory={setInventory}
        />
      case 'employees':
        return <Employees employees={employees} setEmployees={setEmployees} />
      case 'inventory':
        return <Inventory inventory={inventory} setInventory={setInventory} />
      case 'analytics':
        return <Analytics routeSheets={routeSheets} employees={employees} inventory={inventory} />
      default:
        return <Dashboard routeSheets={routeSheets} employees={employees} inventory={inventory} />
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
