import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { PosBranch } from '../store/store'
import { getPeriodRange } from '../lib/dateRanges'
import { buildCsv, downloadCsvFile } from '../lib/csv'

export interface ExpenseRecord {
  id: string
  expense_date: string // YYYY-MM-DD
  category_id: number | null
  category_name: string
  amount: number
  description: string
  payment_mode?: string
  recorded_by_name?: string
  branch?: PosBranch
  created_at: string
  updated_at?: string
}

export interface ExpenseCategory {
  id: number
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ExpenseSummaryMetrics {
  today: number
  this_week: number
  this_month: number
  this_year: number
  total_all_time: number
}

export interface ExpenseFilterPayload {
  fromDate?: string
  toDate?: string
  categoryId?: number | string
}

const STORAGE_EXPENSES_KEY = 'yg_expenses_records_v1'
const LEGACY_STORAGE_EXPENSES_KEY = 'clad_expenses_records_v1'
const STORAGE_CATEGORIES_KEY = 'yg_expense_categories_v1'
const LEGACY_STORAGE_CATEGORIES_KEY = 'clad_expense_categories_v1'

// Default starter categories
export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Maintenance',
  'Marketing',
  'Other',
  'Rent',
  'Salaries',
  'Supplies',
]

// Track remote schema availability to prevent continuous 404 network spam
let remoteExpensesAvailable: boolean | null = null
let remoteCategoriesAvailable: boolean | null = null

const loadLocalExpenses = (): ExpenseRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_EXPENSES_KEY) || localStorage.getItem(LEGACY_STORAGE_EXPENSES_KEY)
    return raw ? (JSON.parse(raw) as ExpenseRecord[]) : []
  } catch {
    return []
  }
}

const saveLocalExpenses = (records: ExpenseRecord[]) => {
  try {
    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(records))
  } catch (err) {
    console.warn('Failed to save expenses to localStorage:', err)
  }
}

const categoryStorageKey = (branch: PosBranch) => `${STORAGE_CATEGORIES_KEY}_${branch}`
const loadLocalCategories = (branch: PosBranch): ExpenseCategory[] => {
  try {
    const raw = localStorage.getItem(categoryStorageKey(branch)) || (branch === 'pos1' ? localStorage.getItem(STORAGE_CATEGORIES_KEY) || localStorage.getItem(LEGACY_STORAGE_CATEGORIES_KEY) : null)
    if (raw) return JSON.parse(raw) as ExpenseCategory[]
  } catch {
    // fallback
  }
  const defaults = DEFAULT_EXPENSE_CATEGORIES.map((name, idx) => ({
    id: idx + 1,
    name,
    is_active: true,
  }))
  saveLocalCategories(branch, defaults)
  return defaults
}

const saveLocalCategories = (branch: PosBranch, cats: ExpenseCategory[]) => {
  try {
    localStorage.setItem(categoryStorageKey(branch), JSON.stringify(cats))
  } catch (err) {
    console.warn('Failed to save categories to localStorage:', err)
  }
}

function calculateMetricsFromList(expenses: ExpenseRecord[]): ExpenseSummaryMetrics {
  const todayStr = getPeriodRange('today').from
  const week = getPeriodRange('week')
  const month = getPeriodRange('month')
  const year = getPeriodRange('year')

  let today = 0
  let this_week = 0
  let this_month = 0
  let this_year = 0
  let total_all_time = 0

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0
    total_all_time += amt
    if (exp.expense_date === todayStr) today += amt
    if (exp.expense_date >= week.from && exp.expense_date <= week.to) this_week += amt
    if (exp.expense_date >= month.from && exp.expense_date <= month.to) this_month += amt
    if (exp.expense_date >= year.from && exp.expense_date <= year.to) this_year += amt
  }

  return { today, this_week, this_month, this_year, total_all_time }
}

export const expenseService = {
  // 1. Fetch KPI Metrics
  async getMetrics(branch: PosBranch): Promise<ExpenseSummaryMetrics> {
    if (isSupabaseConfigured && remoteExpensesAvailable !== false) {
      try {
        const { data, error } = await supabase.rpc('get_expense_summary_metrics', { p_branch: branch })
        if (!error && data) {
          remoteExpensesAvailable = true
          return {
            today: Number(data.today) || 0,
            this_week: Number(data.this_week) || 0,
            this_month: Number(data.this_month) || 0,
            this_year: Number(data.this_year) || 0,
            total_all_time: Number(data.total_all_time) || 0,
          }
        }
        if (error && (error.code === 'PGRST202' || error.code === 'PGRST205' || error.message?.includes('not find'))) {
          // Table/RPC not in schema cache
          remoteExpensesAvailable = false
        }
      } catch {
        remoteExpensesAvailable = false
      }
    }

    // Direct local / remote list fallback
    const list = await this.getExpenses(branch)
    return calculateMetricsFromList(list)
  },

  // 2. Fetch Expenses with Date Filtering
  async getExpenses(branch: PosBranch, filters?: ExpenseFilterPayload): Promise<ExpenseRecord[]> {
    if (isSupabaseConfigured && remoteExpensesAvailable !== false) {
      try {
        let query = supabase
          .from('expenses')
          .select('*')
          .eq('branch', branch)
          .order('expense_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (filters?.fromDate) {
          query = query.gte('expense_date', filters.fromDate)
        }
        if (filters?.toDate) {
          query = query.lte('expense_date', filters.toDate)
        }
        if (filters?.categoryId && filters.categoryId !== 'all') {
          const catNum = Number(filters.categoryId)
          if (!Number.isNaN(catNum) && catNum > 0) {
            query = query.eq('category_id', catNum)
          } else {
            query = query.ilike('category_name', String(filters.categoryId))
          }
        }

        const { data, error } = await query
        if (!error && data) {
          remoteExpensesAvailable = true
          // Update local backup
          if (!filters?.fromDate && !filters?.toDate && (!filters?.categoryId || filters.categoryId === 'all')) {
            saveLocalExpenses([...loadLocalExpenses().filter(e => (e.branch || 'pos1') !== branch), ...(data as ExpenseRecord[])])
          }
          return data as ExpenseRecord[]
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteExpensesAvailable = false
        }
      } catch {
        remoteExpensesAvailable = false
      }
    }

    // Local Storage Filter
    let local = loadLocalExpenses().filter((e) => (e.branch || 'pos1') === branch)
    if (filters?.fromDate) {
      local = local.filter((e) => e.expense_date >= filters.fromDate!)
    }
    if (filters?.toDate) {
      local = local.filter((e) => e.expense_date <= filters.toDate!)
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      local = local.filter(
        (e) =>
          String(e.category_id) === String(filters.categoryId) ||
          e.category_name.toLowerCase() === String(filters.categoryId).toLowerCase()
      )
    }

    return local.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  },

  // 3. Record a New Expense
  async createExpense(payload: {
    expense_date: string
    category_id: number | null
    category_name: string
    amount: number
    description?: string
    payment_mode?: string
    recorded_by_name?: string
    branch: PosBranch
  }): Promise<ExpenseRecord> {
    const newRecord: ExpenseRecord = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `exp_${Date.now()}`,
      expense_date: payload.expense_date,
      category_id: payload.category_id || null,
      category_name: payload.category_name.trim(),
      amount: Math.max(0.01, payload.amount),
      description: (payload.description || '').trim(),
      payment_mode: payload.payment_mode || 'cash',
      recorded_by_name: payload.recorded_by_name || 'Staff',
      branch: payload.branch,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured && remoteExpensesAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            expense_date: newRecord.expense_date,
            category_id: newRecord.category_id,
            category_name: newRecord.category_name,
            amount: newRecord.amount,
            description: newRecord.description,
            payment_mode: newRecord.payment_mode,
            recorded_by_name: newRecord.recorded_by_name,
            branch: newRecord.branch,
          })
          .select()
          .single()

        if (!error && data) {
          remoteExpensesAvailable = true
          const local = loadLocalExpenses()
          saveLocalExpenses([data as ExpenseRecord, ...local])
          return data as ExpenseRecord
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteExpensesAvailable = false
        }
      } catch {
        remoteExpensesAvailable = false
      }
    }

    // Save to local storage
    const current = loadLocalExpenses()
    const updated = [newRecord, ...current]
    saveLocalExpenses(updated)
    return newRecord
  },

  // 3b. Update an Expense
  async updateExpense(
    id: string,
    branch: PosBranch,
    payload: {
      expense_date?: string
      category_id?: number | null
      category_name?: string
      amount?: number
      description?: string
      payment_mode?: string
    }
  ): Promise<ExpenseRecord> {
    const updatedAt = new Date().toISOString()
    if (isSupabaseConfigured && remoteExpensesAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            ...(payload.expense_date !== undefined && { expense_date: payload.expense_date }),
            ...(payload.category_id !== undefined && { category_id: payload.category_id }),
            ...(payload.category_name !== undefined && { category_name: payload.category_name }),
            ...(payload.amount !== undefined && { amount: payload.amount }),
            ...(payload.description !== undefined && { description: payload.description }),
            ...(payload.payment_mode !== undefined && { payment_mode: payload.payment_mode }),
            updated_at: updatedAt,
          })
          .eq('id', id)
          .eq('branch', branch)
          .select()
          .single()

        if (!error && data) {
          remoteExpensesAvailable = true
          const local = loadLocalExpenses()
          const updated = local.map((e) =>
            e.id === id && (e.branch || 'pos1') === branch ? (data as ExpenseRecord) : e,
          )
          saveLocalExpenses(updated)
          return data as ExpenseRecord
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteExpensesAvailable = false
        }
      } catch {
        remoteExpensesAvailable = false
      }
    }

    // Update in local storage
    const current = loadLocalExpenses()
    let updatedRecord: ExpenseRecord | null = null
    const updated = current.map((e) => {
      if (e.id === id && (e.branch || 'pos1') === branch) {
        updatedRecord = {
          ...e,
          ...payload,
          branch,
          updated_at: updatedAt,
        }
        return updatedRecord
      }
      return e
    })
    saveLocalExpenses(updated)
    if (!updatedRecord) {
      throw new Error('Expense record not found')
    }
    return updatedRecord
  },

  // 4. Delete an Expense
  async deleteExpense(id: string, branch: PosBranch): Promise<void> {
    if (isSupabaseConfigured && remoteExpensesAvailable !== false) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id).eq('branch', branch)
        if (!error) {
          remoteExpensesAvailable = true
        } else if (error.code === 'PGRST205' || error.message?.includes('not find')) {
          remoteExpensesAvailable = false
        }
      } catch {
        remoteExpensesAvailable = false
      }
    }

    const current = loadLocalExpenses()
    const filtered = current.filter((e) => !(e.id === id && (e.branch || 'pos1') === branch))
    saveLocalExpenses(filtered)
  },

  // 5. Category Operations
  async getCategories(branch: PosBranch): Promise<ExpenseCategory[]> {
    if (isSupabaseConfigured && remoteCategoriesAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('branch', branch)
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          remoteCategoriesAvailable = true
          saveLocalCategories(branch, data as ExpenseCategory[])
          return data as ExpenseCategory[]
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteCategoriesAvailable = false
        }
      } catch {
        remoteCategoriesAvailable = false
      }
    }

    return loadLocalCategories(branch)
  },

  async createCategory(name: string, branch: PosBranch): Promise<ExpenseCategory> {
    const cleanName = name.trim()
    if (!cleanName) throw new Error('Category name cannot be empty')

    if (isSupabaseConfigured && remoteCategoriesAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .insert({ name: cleanName, is_active: true, branch })
          .select()
          .single()

        if (!error && data) {
          remoteCategoriesAvailable = true
          const local = loadLocalCategories(branch)
          saveLocalCategories(branch, [...local, data as ExpenseCategory])
          return data as ExpenseCategory
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteCategoriesAvailable = false
        }
      } catch {
        remoteCategoriesAvailable = false
      }
    }

    const local = loadLocalCategories(branch)
    const newCat: ExpenseCategory = {
      id: Date.now(),
      name: cleanName,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    saveLocalCategories(branch, [...local, newCat])
    return newCat
  },

  async deleteCategory(id: number, branch: PosBranch): Promise<void> {
    if (isSupabaseConfigured && remoteCategoriesAvailable !== false) {
      try {
        const { error } = await supabase
          .from('expense_categories')
          .delete()
          .eq('branch', branch)
          .eq('id', id)

        if (!error) {
          remoteCategoriesAvailable = true
        } else if (error.code === 'PGRST205' || error.message?.includes('not find')) {
          remoteCategoriesAvailable = false
        }
      } catch {
        remoteCategoriesAvailable = false
      }
    }

    const local = loadLocalCategories(branch)
    const filtered = local.filter((c) => c.id !== id)
    saveLocalCategories(branch, filtered)
  },

  async updateCategory(id: number, name: string, branch: PosBranch): Promise<ExpenseCategory> {
    const cleanName = name.trim()
    if (!cleanName) throw new Error('Category name cannot be empty')

    if (isSupabaseConfigured && remoteCategoriesAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .update({ name: cleanName, updated_at: new Date().toISOString() })
          .eq('branch', branch)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) {
          remoteCategoriesAvailable = true
          const local = loadLocalCategories(branch)
          const updated = local.map((c) => (c.id === id ? (data as ExpenseCategory) : c))
          saveLocalCategories(branch, updated)
          return data as ExpenseCategory
        }
        if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
          remoteCategoriesAvailable = false
        }
      } catch {
        remoteCategoriesAvailable = false
      }
    }

    const local = loadLocalCategories(branch)
    let updatedCat: ExpenseCategory = { id, name: cleanName, is_active: true }
    const updated = local.map((c) => {
      if (c.id === id) {
        updatedCat = { ...c, name: cleanName, updated_at: new Date().toISOString() }
        return updatedCat
      }
      return c
    })
    saveLocalCategories(branch, updated)
    return updatedCat
  },
}

// 6. CSV Ledger Export Utility
export function exportExpensesToCSV(expenses: ExpenseRecord[], branch?: PosBranch): void {
  if (!Array.isArray(expenses) || expenses.length === 0) return

  const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Mode', 'Recorded By']
  const rows = expenses.map((e) => [
    String(e?.expense_date || ''),
    String(e?.category_name || 'Uncategorized'),
    String(e?.description ?? ''),
    Number(e?.amount || 0).toFixed(2),
    String(e?.payment_mode || 'Cash'),
    String(e?.recorded_by_name || 'Staff'),
  ])

  const storePrefix = branch === 'pos2' ? 'Taj-Textiles' : 'Mariyam-Kids-World'
  downloadCsvFile(`${storePrefix}-Expenses-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(headers, rows))
}
