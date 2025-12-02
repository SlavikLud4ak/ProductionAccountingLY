import { createClient } from '@supabase/supabase-js'

// Ці значення потрібно замінити на ваші з Supabase Dashboard
// Settings -> API -> Project URL та anon/public key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типи даних
export const STAGE_PRICES = {
  vtk: 15,
  soldering: 27,
  lacquering: 15,
  stamping: 0.25,
  fuse_soldering: 1,
}

export const STAGE_NAMES = {
  vtk: 'ВТК',
  soldering: 'Припайка роз\'ємів',
  lacquering: 'Лакування + батарея',
  stamping: 'Штампування',
  fuse_soldering: 'Запобіжник',
}

// Функція для підрахунку суми
export function calculateTotal(sheet) {
  return (
    (sheet.vtk_count || 0) * STAGE_PRICES.vtk +
    (sheet.soldering_count || 0) * STAGE_PRICES.soldering +
    (sheet.lacquering_count || 0) * STAGE_PRICES.lacquering +
    (sheet.stamping_count || 0) * STAGE_PRICES.stamping +
    (sheet.fuse_soldering_count || 0) * STAGE_PRICES.fuse_soldering
  )
}

// API функції
export const api = {
  // Працівники
  employees: {
    async getAll() {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
    
    async create(employee) {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async update(id, employee) {
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  },
  
  // Маршрутні листи
  routeSheets: {
    async getAll() {
      const { data, error } = await supabase
        .from('route_sheets')
        .select(`
          *,
          employee:employees(id, name)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    
    async getByEmployee(employeeId) {
      const { data, error } = await supabase
        .from('route_sheets')
        .select(`
          *,
          employee:employees(id, name)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    
    async create(sheet) {
      const { data, error } = await supabase
        .from('route_sheets')
        .insert({
          ...sheet,
          total_amount: calculateTotal(sheet)
        })
        .select(`
          *,
          employee:employees(id, name)
        `)
        .single()
      if (error) throw error
      return data
    },
    
    async update(id, sheet) {
      const { data, error } = await supabase
        .from('route_sheets')
        .update({
          ...sheet,
          total_amount: calculateTotal(sheet)
        })
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, name)
        `)
        .single()
      if (error) throw error
      return data
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('route_sheets')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  },
  
  // Склад
  inventory: {
    async getAll() {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
    
    async create(item) {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async update(id, item) {
      const { data, error } = await supabase
        .from('inventory')
        .update(item)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    
    async updateQuantity(id, change, reason, routeSheetId = null) {
      // Спочатку логуємо зміну
      await supabase
        .from('inventory_logs')
        .insert({
          inventory_id: id,
          route_sheet_id: routeSheetId,
          quantity_change: change,
          reason
        })
      
      // Потім оновлюємо кількість
      const { data: current } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', id)
        .single()
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ quantity: (current?.quantity || 0) + change })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
  },
  
  // Прив'язка матеріалів до етапів
  stageMaterials: {
    async getByRouteSheet(routeSheetId) {
      const { data, error } = await supabase
        .from('stage_materials')
        .select(`
          *,
          inventory:inventory(id, name, unit)
        `)
        .eq('route_sheet_id', routeSheetId)
      if (error) throw error
      return data
    },
    
    async create(material) {
      const { data, error } = await supabase
        .from('stage_materials')
        .insert(material)
        .select(`
          *,
          inventory:inventory(id, name, unit)
        `)
        .single()
      if (error) throw error
      
      // Списуємо зі складу
      await api.inventory.updateQuantity(
        material.inventory_id,
        -material.quantity_used,
        `Списано для етапу: ${STAGE_NAMES[material.stage_name]}`,
        material.route_sheet_id
      )
      
      return data
    },
    
    async delete(id, inventoryId, quantityUsed) {
      // Повертаємо на склад
      await api.inventory.updateQuantity(
        inventoryId,
        quantityUsed,
        'Повернення при видаленні прив\'язки'
      )
      
      const { error } = await supabase
        .from('stage_materials')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  },
  
  // Аналітика
  analytics: {
    async getWeeklyProduction() {
      const { data, error } = await supabase
        .from('weekly_production')
        .select('*')
      if (error) throw error
      return data
    },
    
    async getMonthlyProduction() {
      const { data, error } = await supabase
        .from('monthly_production')
        .select('*')
      if (error) throw error
      return data
    },
    
    async getDefectStatistics() {
      const { data, error } = await supabase
        .from('defect_statistics')
        .select('*')
      if (error) throw error
      return data
    },
    
    async getInventoryStatus() {
      const { data, error } = await supabase
        .from('inventory_status')
        .select('*')
      if (error) throw error
      return data
    },
    
    async getDashboardStats() {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Загальна статистика
      const [
        { count: totalSheets },
        { count: weekSheets },
        { data: totalEarnings },
        { data: weekEarnings },
        { count: totalDefects },
        { count: lowInventory }
      ] = await Promise.all([
        supabase.from('route_sheets').select('*', { count: 'exact', head: true }),
        supabase.from('route_sheets').select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('route_sheets').select('total_amount'),
        supabase.from('route_sheets').select('total_amount')
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('route_sheets').select('defect_count').then(r => ({
          count: r.data?.reduce((sum, s) => sum + (s.defect_count || 0), 0) || 0
        })),
        supabase.from('inventory').select('*', { count: 'exact', head: true })
          .lte('quantity', supabase.rpc ? 'min_quantity' : 0) // Simplified
      ])
      
      return {
        totalSheets: totalSheets || 0,
        weekSheets: weekSheets || 0,
        totalEarnings: totalEarnings?.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) || 0,
        weekEarnings: weekEarnings?.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) || 0,
        totalDefects,
        lowInventory: lowInventory || 0,
      }
    },
  },
}
