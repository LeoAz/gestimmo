export interface Apartment {
  id: number
  title: string
  floor_number: number
  price: string | null
  surface_area: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  balconies_count: number | null
  kitchens_count: number | null
  has_kitchen: boolean
  status: string
}

export interface Payment {
  id: number
  amount: string
  payment_date: string
  invoice_number: string
  status: string
  tenant_name?: string
  rental_id?: number
}

export interface Tenant {
  id: number
  first_name: string
  last_name: string
}

export interface Rental {
  id: number
  tenant: Tenant
  rent_amount: string
  start_date: string
  next_payment_date: string | null
  status: 'active' | 'completed' | 'cancelled'
  payments: Payment[]
}

export interface Property {
  id: number
  property_category_id: number
  title: string
  description: string | null
  address: string | null
  city: string | null
  price: string | null
  type: string | null
  surface_area: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  balconies_count: number | null
  kitchens_count: number | null
  has_kitchen: boolean
  has_solar_panels: boolean
  has_generator: boolean
  status: 'available' | 'sold' | 'rented'
  parent_id: number | null
  category: {
    id: number
    name: string
    slug: string
  }
  apartments: Apartment[]
}
