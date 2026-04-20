export type ResourceView =
  | 'drivers'
  | 'products'
  | 'zones'
  | 'customers'
  | 'sales'

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty'

export interface DriverRow {
  id: string
  fullName: string
  driverId: string
  phone: string
  zone: string
  vehicleModel: string
  plate: string
  status: DriverStatus
}

export interface ProductRow {
  id: string
  name: string
  type: string
  price: string
  unitWeight: string
  unitVolume: string
}

export type ZoneStatus = 'Active' | 'Planning'

export interface ZoneRow {
  id: string
  name: string
  city: string
  stores: number
  assignedDrivers: number
  status: ZoneStatus
}

export interface CustomerRow {
  id: string
  name: string
  phone: string
  zone: string
  location: string
  lastOrder: string
}
