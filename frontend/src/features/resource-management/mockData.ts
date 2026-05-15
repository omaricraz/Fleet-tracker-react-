import type { CustomerRow, ProductRow, ZoneRow } from './types'

export const productRows: ProductRow[] = [
  {
    id: 'p1',
    name: 'Premium Bottled Water (24pk)',
    type: 'Beverage',
    price: '$18.50',
    unitWeight: '12.4 kg',
    unitVolume: '0.028 m³',
  },
  {
    id: 'p2',
    name: 'Fortified Cooking Oil (5L)',
    type: 'Grocery',
    price: '$22.00',
    unitWeight: '5.1 kg',
    unitVolume: '0.006 m³',
  },
  {
    id: 'p3',
    name: 'Cold Chain Dairy Crate',
    type: 'Perishable',
    price: '$34.75',
    unitWeight: '18.0 kg',
    unitVolume: '0.045 m³',
  },
  {
    id: 'p4',
    name: 'Bulk Maize Sack (50kg)',
    type: 'Grain',
    price: '$41.20',
    unitWeight: '50.0 kg',
    unitVolume: '0.09 m³',
  },
  {
    id: 'p5',
    name: 'Hygiene Bundle (mixed)',
    type: 'Non-food',
    price: '$27.90',
    unitWeight: '8.2 kg',
    unitVolume: '0.032 m³',
  },
]

export const zoneRows: ZoneRow[] = [
  {
    id: 'z1',
    name: 'Hargeisa East',
    city: 'Hargeisa',
    stores: 28,
    status: 'Active',
  },
  {
    id: 'z2',
    name: 'Hargeisa West',
    city: 'Hargeisa',
    stores: 22,
    status: 'Active',
  },
  {
    id: 'z3',
    name: 'Berbera Port',
    city: 'Berbera',
    stores: 14,
    status: 'Active',
  },
  {
    id: 'z4',
    name: 'Burao Hub',
    city: 'Burao',
    stores: 19,
    status: 'Planning',
  },
  {
    id: 'z5',
    name: 'Borama Corridor',
    city: 'Borama',
    stores: 11,
    status: 'Active',
  },
  {
    id: 'z6',
    name: 'Togdheer North',
    city: 'Burao',
    stores: 9,
    status: 'Planning',
  },
]

export const customerRows: CustomerRow[] = [
  {
    id: 'c1',
    name: 'Barwaaqo Wholesale',
    phone: '+252 63 2001100',
    zone: 'Hargeisa East',
    location: 'Kaah Market',
    lastOrder: 'Apr 18, 2026',
  },
  {
    id: 'c2',
    name: 'Xeeb Retail Group',
    phone: '+252 63 3002200',
    zone: 'Hargeisa West',
    location: 'Downtown Ring',
    lastOrder: 'Apr 19, 2026',
  },
  {
    id: 'c3',
    name: 'Red Sea Mini-mart',
    phone: '+252 63 4003300',
    zone: 'Berbera Port',
    location: 'Harbor Road',
    lastOrder: 'Apr 17, 2026',
  },
  {
    id: 'c4',
    name: 'Togdheer Foods',
    phone: '+252 63 5004400',
    zone: 'Burao Hub',
    location: 'Central Plaza',
    lastOrder: 'Apr 16, 2026',
  },
  {
    id: 'c5',
    name: 'Sahil Fresh Co-op',
    phone: '+252 63 6005500',
    zone: 'Hargeisa East',
    location: 'Industrial Zone B',
    lastOrder: 'Apr 19, 2026',
  },
]
