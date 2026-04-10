// Generate Order ID like BLM-2024-XXXXX
// Fix for Express 5 params type issue
export const param = (p: string | string[]): string => {
  return Array.isArray(p) ? p[0] : p
}
export const generateOrderId = (): string => {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `BLM-${year}-${random}`
}

// Format price in Indian format ₹1,00,000
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

// Calculate discount percentage
export const calculateDiscount = (mrp: number, price: number): number => {
  return Math.round(((mrp - price) / mrp) * 100)
}

// Generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Standard API response
export const sendResponse = (
  res: any,
  statusCode: number,
  success: boolean,
  message: string,
  data?: any,
  pagination?: any
) => {
  const response: any = { success, message }
  if (data !== undefined) response.data = data
  if (pagination) response.pagination = pagination
  return res.status(statusCode).json(response)
}

// Delivery charge logic
export const calculateDeliveryCharge = (orderAmount: number): number => {
  return orderAmount >= 499 ? 0 : 40
}

// Calculate expected delivery date
export const getExpectedDelivery = (city: string): Date => {
  const days = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'].includes(city)
    ? 2  // Metro: 2 days
    : 5  // Others: 5 days
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}