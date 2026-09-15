import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  type Branch,
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
} from '../store/branchContextStore'

export interface AdminOverviewData {
  today_sales: number
  today_bills: number
  today_expenses: number
  branches: Array<{
    branch_id: string
    code: string
    name: string
    branch_type: string
    is_active: boolean
    today_sales: number
    today_bills: number
    low_stock_count: number
    total_products: number
  }>
  generated_at?: string
}

export interface BranchDashboardData {
  branch: {
    id: string
    code: string
    name: string
    branch_type?: string
    branchType?: string
  }
  today_sales: number
  today_bills: number
  avg_bill: number
  inventory_value: number
  low_stock_count: number
  top_products: Array<{
    product_name: string
    quantity_sold: number
    total_amount: number
  }>
  alerts: Array<{
    id: string | number
    name: string
    stock_quantity: number
    low_stock_alert: number
  }>
  daily_sales: Array<{
    date: string
    sales: number
    bills: number
  }>
}

export async function fetchBranches(): Promise<Branch[]> {
  if (!isSupabaseConfigured) {
    return [DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH]
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, code, name, branch_type, is_active')
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (error || !data || data.length === 0) {
      return [DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH]
    }

    return data.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      branchType: b.branch_type || 'retail',
      isActive: b.is_active,
    }))
  } catch (err) {
    console.warn('Failed to load branches from Supabase, using defaults:', err)
    return [DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH]
  }
}

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  if (!isSupabaseConfigured) {
    return {
      today_sales: 74270,
      today_bills: 310,
      today_expenses: 12840,
      branches: [
        {
          branch_id: DEFAULT_TEXTILE_BRANCH.id,
          code: 'TEXTILE',
          name: 'CLAD TEXTILE',
          branch_type: 'retail',
          is_active: true,
          today_sales: 42850,
          today_bills: 126,
          low_stock_count: 8,
          total_products: 45,
        },
        {
          branch_id: DEFAULT_GROCERY_BRANCH.id,
          code: 'GROCERY',
          name: 'CLAD GROCERY',
          branch_type: 'grocery',
          is_active: true,
          today_sales: 31420,
          today_bills: 184,
          low_stock_count: 14,
          total_products: 68,
        },
      ],
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_admin_overview')
    if (error || !data) {
      throw error || new Error('No data returned from get_admin_overview')
    }
    return data as AdminOverviewData
  } catch (err) {
    console.warn('RPC get_admin_overview failed, calculating fallback:', err)
    return {
      today_sales: 0,
      today_bills: 0,
      today_expenses: 0,
      branches: [
        {
          branch_id: DEFAULT_TEXTILE_BRANCH.id,
          code: 'TEXTILE',
          name: 'CLAD TEXTILE',
          branch_type: 'retail',
          is_active: true,
          today_sales: 0,
          today_bills: 0,
          low_stock_count: 0,
          total_products: 0,
        },
        {
          branch_id: DEFAULT_GROCERY_BRANCH.id,
          code: 'GROCERY',
          name: 'CLAD GROCERY',
          branch_type: 'grocery',
          is_active: true,
          today_sales: 0,
          today_bills: 0,
          low_stock_count: 0,
          total_products: 0,
        },
      ],
    }
  }
}

export async function fetchBranchDashboard(branchId: string): Promise<BranchDashboardData> {
  if (!isSupabaseConfigured) {
    const isGrocery = branchId === DEFAULT_GROCERY_BRANCH.id
    const b = isGrocery ? DEFAULT_GROCERY_BRANCH : DEFAULT_TEXTILE_BRANCH
    return {
      branch: {
        id: b.id,
        code: b.code,
        name: b.name,
        branch_type: b.branchType,
        branchType: b.branchType,
      },
      today_sales: isGrocery ? 31420 : 42850,
      today_bills: isGrocery ? 184 : 126,
      avg_bill: isGrocery ? 170 : 340,
      inventory_value: isGrocery ? 524000 : 842000,
      low_stock_count: isGrocery ? 14 : 8,
      top_products: isGrocery
        ? [
            { product_name: 'Ponni Boiled Rice 25kg', quantity_sold: 45, total_amount: 54000 },
            { product_name: 'Sunland Sunflower Oil 1L', quantity_sold: 62, total_amount: 8680 },
            { product_name: 'Tata Salt 1kg', quantity_sold: 38, total_amount: 950 },
          ]
        : [
            { product_name: 'Cotton Formal Shirt', quantity_sold: 32, total_amount: 22400 },
            { product_name: 'Slim Fit Denim Jeans', quantity_sold: 24, total_amount: 21600 },
            { product_name: 'Kanchipuram Silk Saree', quantity_sold: 19, total_amount: 38000 },
          ],
      alerts: isGrocery
        ? [
            { id: '1', name: 'Aashirvaad Atta 10kg', stock_quantity: 2, low_stock_alert: 5 },
            { id: '2', name: 'Toor Dal 1kg', stock_quantity: 3, low_stock_alert: 10 },
          ]
        : [
            { id: '1', name: 'Men Slim Fit Denim Jeans', stock_quantity: 3, low_stock_alert: 5 },
            { id: '2', name: 'Classic White Shirt', stock_quantity: 2, low_stock_alert: 5 },
          ],
      daily_sales: [
        { date: 'Mon', sales: isGrocery ? 28000 : 38000, bills: 140 },
        { date: 'Tue', sales: isGrocery ? 32000 : 41000, bills: 160 },
        { date: 'Wed', sales: isGrocery ? 29500 : 35000, bills: 135 },
        { date: 'Thu', sales: isGrocery ? 34000 : 44000, bills: 170 },
        { date: 'Fri', sales: isGrocery ? 31420 : 42850, bills: 184 },
      ],
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_branch_dashboard', { p_branch_id: branchId })
    if (error || !data) {
      throw error || new Error('Failed to load branch dashboard data')
    }
    return data as BranchDashboardData
  } catch (err) {
    console.warn('RPC get_branch_dashboard failed:', err)
    const isGrocery = branchId === DEFAULT_GROCERY_BRANCH.id
    const b = isGrocery ? DEFAULT_GROCERY_BRANCH : DEFAULT_TEXTILE_BRANCH
    return {
      branch: {
        id: b.id,
        code: b.code,
        name: b.name,
        branch_type: b.branchType,
        branchType: b.branchType,
      },
      today_sales: 0,
      today_bills: 0,
      avg_bill: 0,
      inventory_value: 0,
      low_stock_count: 0,
      top_products: [],
      alerts: [],
      daily_sales: [],
    }
  }
}
