import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AddDriverModal } from './components/AddDriverModal'
import { CustomersTable } from './components/CustomersTable'
import { DriversTable } from './components/DriversTable'
import { KpiStatCard } from './components/KpiStatCard'
import { PaginationBar } from './components/PaginationBar'
import { ProductsTable } from './components/ProductsTable'
import { ResourceTabs } from './components/ResourceTabs'
import { ResourceToolbar } from './components/ResourceToolbar'
import { SalesViewsPanel } from './components/SalesViewsPanel'
import { ZonesTable } from './components/ZonesTable'
import { customerRows, driverRows, productRows, zoneRows } from './mockData'
import type {
  CustomerRow,
  DriverRow,
  ProductRow,
  ResourceView,
  ZoneRow,
} from './types'

const PAGE_SIZE = 10

const views: ResourceView[] = ['products', 'zones', 'drivers', 'customers', 'sales']

function parseView(raw: string | null): ResourceView {
  if (raw && views.includes(raw as ResourceView)) {
    return raw as ResourceView
  }
  return 'drivers'
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export function ResourceManagementPage() {
  const [searchParams] = useSearchParams()
  const view = parseView(searchParams.get('view'))

  const [search, setSearch] = useState('')
  const [primaryFilter, setPrimaryFilter] = useState('All Zones')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const primaryOptions = useMemo(() => {
    if (view === 'drivers') {
      return ['All Zones', ...uniqueSorted(driverRows.map((d) => d.zone))]
    }
    if (view === 'products') {
      return ['All Types', ...uniqueSorted(productRows.map((p) => p.type))]
    }
    if (view === 'zones') {
      return ['All Cities', ...uniqueSorted(zoneRows.map((z) => z.city))]
    }
    if (view === 'customers') {
      return ['All Zones', ...uniqueSorted(customerRows.map((c) => c.zone))]
    }
    return ['All Regions', 'Hargeisa', 'Berbera', 'Burao']
  }, [view])

  const statusOptions = useMemo(() => {
    if (view === 'drivers') {
      return ['All Status', 'Available', 'On Trip', 'Off Duty']
    }
    if (view === 'products') {
      return ['All Status', 'Active', 'Archived']
    }
    if (view === 'zones') {
      return ['All Status', 'Active', 'Planning']
    }
    if (view === 'customers') {
      return ['All Status', 'Recent', 'At risk']
    }
    return ['All Channels', 'Wholesale', 'Retail', 'Mixed']
  }, [view])

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return driverRows.filter((row) => {
      const zoneOk = primaryFilter === 'All Zones' || row.zone === primaryFilter
      const statusOk =
        statusFilter === 'All Status' || row.status === statusFilter
      const textOk =
        q.length === 0 ||
        row.fullName.toLowerCase().includes(q) ||
        row.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        row.plate.toLowerCase().includes(q) ||
        row.vehicleModel.toLowerCase().includes(q) ||
        row.driverId.toLowerCase().includes(q)
      return zoneOk && statusOk && textOk
    })
  }, [search, primaryFilter, statusFilter])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return productRows.filter((row) => {
      const typeOk = primaryFilter === 'All Types' || row.type === primaryFilter
      const statusOk = statusFilter === 'All Status' || statusFilter === 'Active'
      const textOk =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q)
      return typeOk && statusOk && textOk
    })
  }, [search, primaryFilter, statusFilter])

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase()
    return zoneRows.filter((row) => {
      const cityOk = primaryFilter === 'All Cities' || row.city === primaryFilter
      const statusOk = statusFilter === 'All Status' || row.status === statusFilter
      const textOk =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q)
      return cityOk && statusOk && textOk
    })
  }, [search, primaryFilter, statusFilter])

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customerRows.filter((row) => {
      const zoneOk = primaryFilter === 'All Zones' || row.zone === primaryFilter
      const statusOk =
        statusFilter === 'All Status' ||
        (statusFilter === 'Recent' && row.lastOrder.includes('Apr')) ||
        (statusFilter === 'At risk' && row.name.includes('Mini'))
      const textOk =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        row.location.toLowerCase().includes(q)
      return zoneOk && statusOk && textOk
    })
  }, [search, primaryFilter, statusFilter])

  useEffect(() => {
    setPage(1)
    setSearch('')
    setPrimaryFilter(primaryOptions[0] ?? '')
    setStatusFilter(statusOptions[0] ?? 'All Status')
  }, [view, primaryOptions, statusOptions])

  const pagedDrivers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredDrivers.slice(start, start + PAGE_SIZE)
  }, [filteredDrivers, page])

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, page])

  const pagedZones = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredZones.slice(start, start + PAGE_SIZE)
  }, [filteredZones, page])

  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredCustomers.slice(start, start + PAGE_SIZE)
  }, [filteredCustomers, page])

  function handleEditDriver(row: DriverRow) {
    window.alert(`Edit driver (placeholder): ${row.fullName} (${row.driverId})`)
  }

  function handleDeleteDriver(row: DriverRow) {
    if (window.confirm(`Remove ${row.fullName} from the directory?`)) {
      window.alert('Delete action is frontend-only for now.')
    }
  }

  function handleEditProduct(row: ProductRow) {
    window.alert(`Edit product (placeholder): ${row.name}`)
  }

  function handleDeleteProduct(row: ProductRow) {
    if (window.confirm(`Remove ${row.name} from the catalog?`)) {
      window.alert('Delete action is frontend-only for now.')
    }
  }

  function handleEditZone(row: ZoneRow) {
    window.alert(`Edit zone (placeholder): ${row.name}`)
  }

  function handleDeleteZone(row: ZoneRow) {
    if (window.confirm(`Remove ${row.name}?`)) {
      window.alert('Delete action is frontend-only for now.')
    }
  }

  function handleEditCustomer(row: CustomerRow) {
    window.alert(`Edit customer (placeholder): ${row.name}`)
  }

  function handleDeleteCustomer(row: CustomerRow) {
    if (window.confirm(`Remove ${row.name}?`)) {
      window.alert('Delete action is frontend-only for now.')
    }
  }

  function openAddModal() {
    setAddOpen(true)
  }

  const addModalCopy = useMemo(() => {
    if (view === 'drivers') {
      return {
        title: 'Add driver',
        description:
          'Driver onboarding will connect to tenant APIs. This dialog is a UI placeholder.',
      }
    }
    if (view === 'products') {
      return {
        title: 'Add product',
        description: 'Product master data forms will arrive with the inventory service.',
      }
    }
    if (view === 'zones') {
      return {
        title: 'Add zone',
        description: 'Geospatial boundaries and hub metadata will be editable here later.',
      }
    }
    if (view === 'customers') {
      return {
        title: 'Add customer',
        description: 'CRM sync and credit checks will plug in behind this action.',
      }
    }
    return {
      title: 'Create sales view',
      description: 'Saved analytical views will be configurable once reporting ships.',
    }
  }, [view])

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Resource Management</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Manage products, teams, customers, zones, and sales in a centralized command center.
          </p>
        </div>
        <ResourceTabs view={view} />
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiStatCard label="Total Products" value="24" hint="+2 this wk" hintTone="success" />
        <KpiStatCard label="Total Drivers" value="18" hint="Active now" />
        <KpiStatCard label="Total Customers" value="142" hint="+12%" hintTone="success" />
        <KpiStatCard label="Total Sales" value="20" hint="Weekly Target" />
        <KpiStatCard
          className="col-span-2 md:col-span-1"
          label="Total Zones"
          value="6"
          hint="Global Hubs"
        />
      </section>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <ResourceToolbar
          view={view}
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          zoneFilter={primaryFilter}
          onZoneFilterChange={(v) => {
            setPrimaryFilter(v)
            setPage(1)
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
          zoneOptions={primaryOptions}
          statusOptions={statusOptions}
          onAddClick={openAddModal}
        />

        {view === 'sales' ? (
          <SalesViewsPanel />
        ) : (
          <>
            {view === 'drivers' ? (
              <>
                <DriversTable
                  rows={pagedDrivers}
                  onEdit={handleEditDriver}
                  onDelete={handleDeleteDriver}
                />
                <PaginationBar
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={filteredDrivers.length}
                  entityLabel="drivers"
                  onPageChange={setPage}
                />
              </>
            ) : null}

            {view === 'products' ? (
              <>
                <ProductsTable
                  rows={pagedProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
                <PaginationBar
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={filteredProducts.length}
                  entityLabel="products"
                  onPageChange={setPage}
                />
              </>
            ) : null}

            {view === 'zones' ? (
              <>
                <ZonesTable
                  rows={pagedZones}
                  onEdit={handleEditZone}
                  onDelete={handleDeleteZone}
                />
                <PaginationBar
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={filteredZones.length}
                  entityLabel="zones"
                  onPageChange={setPage}
                />
              </>
            ) : null}

            {view === 'customers' ? (
              <>
                <CustomersTable
                  rows={pagedCustomers}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                />
                <PaginationBar
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={filteredCustomers.length}
                  entityLabel="customers"
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </>
        )}
      </div>

      <AddDriverModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={addModalCopy.title}
        description={addModalCopy.description}
      />
    </div>
  )
}
