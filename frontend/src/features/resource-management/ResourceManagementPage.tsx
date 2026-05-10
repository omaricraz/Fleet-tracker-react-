import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useToast } from '@/components/providers/toast-provider'
import { ApiError } from '@/services/api/client'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '@/services/api/customers'
import { createDriver, deleteDriver, listDrivers, updateDriver } from '@/services/api/drivers'
import { createProduct, deleteProduct, listProducts, updateProduct } from '@/services/api/products'
import { createZone, deleteZone, listZones, updateZone } from '@/services/api/zones'
import { AddDriverModal, type ResourceFormField, type ResourceFormValues } from './components/AddDriverModal'
import { CustomersTable } from './components/CustomersTable'
import { DriversTable } from './components/DriversTable'
import { KpiStatCard } from './components/KpiStatCard'
import { PaginationBar } from './components/PaginationBar'
import { ProductsTable } from './components/ProductsTable'
import { ResourceTabs } from './components/ResourceTabs'
import { ResourceToolbar } from './components/ResourceToolbar'
import { ZonesTable } from './components/ZonesTable'
import type {
  CustomerRow,
  DriverRow,
  ProductRow,
  ResourceView,
  ZoneRow,
} from './types'

const PAGE_SIZE = 10

const views: ResourceView[] = ['products', 'zones', 'drivers', 'customers']

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
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const view = parseView(searchParams.get('view'))

  const [search, setSearch] = useState('')
  const [primaryFilter, setPrimaryFilter] = useState('All Zones')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({})

  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'resource-list'],
    queryFn: () => listZones({ per_page: 100, sort: 'name', direction: 'asc' }),
  })
  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'resource-list'],
    queryFn: () => listDrivers({ per_page: 100, sort: 'full_name', direction: 'asc' }),
  })
  const { data: productsData } = useQuery({
    queryKey: ['products', 'resource-list'],
    queryFn: () => listProducts({ per_page: 100, sort: 'item', direction: 'asc' }),
  })
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'resource-list'],
    queryFn: () => listCustomers({ per_page: 100, sort: 'full_name', direction: 'asc' }),
  })

  const zones = useMemo(() => zonesData?.items ?? [], [zonesData])
  const drivers = useMemo(() => driversData?.items ?? [], [driversData])
  const products = useMemo(() => productsData?.items ?? [], [productsData])
  const customers = useMemo(() => customersData?.items ?? [], [customersData])

  const driverRows = useMemo<DriverRow[]>(
    () =>
      drivers.map((row) => ({
        id: String(row.id),
        fullName: row.full_name,
        driverId: String(row.id),
        phone: row.phone,
        zone: row.zone?.name ?? 'Unassigned',
        vehicleModel: '—',
        plate: '—',
        status: 'Available',
      })),
    [drivers],
  )

  const productRows = useMemo<ProductRow[]>(
    () =>
      products.map((row) => ({
        id: String(row.id),
        name: row.item,
        type: row.type ?? '—',
        price: `$${(Number(row.price) || 0).toFixed(2)}`,
        unitWeight: row.unit_weight != null ? String(row.unit_weight) : '—',
        unitVolume: row.unit_volume != null ? String(row.unit_volume) : '—',
      })),
    [products],
  )

  const zoneRows = useMemo<ZoneRow[]>(
    () =>
      zones.map((row) => ({
        id: String(row.id),
        name: row.name,
        city: row.city,
        stores: Number(row.number_of_stores) || 0,
        assignedDrivers: drivers.filter((d) => d.zone_id === row.id).length,
        status: 'Active',
      })),
    [zones, drivers],
  )

  const customerRows = useMemo<CustomerRow[]>(
    () =>
      customers.map((row) => ({
        id: String(row.id),
        name: row.full_name,
        phone: row.phone,
        zone: row.zone?.name ?? 'Unassigned',
        location: [row.latitude, row.longitude].every((v) => v != null)
          ? `${row.latitude}, ${row.longitude}`
          : '—',
        lastOrder: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—',
      })),
    [customers],
  )

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
    return ['All Zones']
  }, [view, driverRows, productRows, zoneRows, customerRows])

  const statusOptions = useMemo(() => {
    if (view === 'drivers') {
      return ['All Status', 'Available']
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
    return ['All Status']
  }, [view])

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const normalizedQueryPhone = q.replace(/\s/g, '')
    return driverRows.filter((row) => {
      const zoneOk = primaryFilter === 'All Zones' || row.zone === primaryFilter
      const statusOk = statusFilter === 'All Status' || row.status === statusFilter
      const normalizedPhone = (row.phone ?? '').replace(/\s/g, '')
      const textOk =
        q.length === 0 ||
        row.fullName.toLowerCase().includes(q) ||
        normalizedPhone.includes(normalizedQueryPhone) ||
        row.plate.toLowerCase().includes(q) ||
        row.vehicleModel.toLowerCase().includes(q) ||
        row.driverId.toLowerCase().includes(q)
      return zoneOk && statusOk && textOk
    })
  }, [driverRows, search, primaryFilter, statusFilter])

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
  }, [productRows, search, primaryFilter, statusFilter])

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
  }, [zoneRows, search, primaryFilter, statusFilter])

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const normalizedQueryPhone = q.replace(/\s/g, '')
    return customerRows.filter((row) => {
      const zoneOk = primaryFilter === 'All Zones' || row.zone === primaryFilter
      const statusOk = statusFilter === 'All Status' || statusFilter === 'Recent' || statusFilter === 'At risk'
      const normalizedPhone = (row.phone ?? '').replace(/\s/g, '')
      const textOk =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        normalizedPhone.includes(normalizedQueryPhone) ||
        row.location.toLowerCase().includes(q)
      return zoneOk && statusOk && textOk
    })
  }, [customerRows, search, primaryFilter, statusFilter])

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

  const driverMut = useMutation({
    mutationFn: async (v: ResourceFormValues) => {
      const body = { full_name: v.full_name?.trim() ?? '', phone: v.phone?.trim() ?? '', zone_id: v.zone_id ? Number(v.zone_id) : null }
      if (editingId) return updateDriver(editingId, body)
      return createDriver(body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['drivers'] })
      setAddOpen(false)
      setEditingId(null)
      setModalErrors({})
      pushToast('success', editingId ? 'Driver updated.' : 'Driver created.')
    },
  })
  const productMut = useMutation({
    mutationFn: async (v: ResourceFormValues) => {
      const body = {
        item: v.item?.trim() ?? '',
        type: v.type?.trim() || null,
        price: v.price?.trim() ? Number(v.price) : null,
        unit_volume: v.unit_volume?.trim() ? Number(v.unit_volume) : null,
        unit_weight: v.unit_weight?.trim() ? Number(v.unit_weight) : null,
      }
      if (editingId) return updateProduct(editingId, body)
      return createProduct(body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      setAddOpen(false)
      setEditingId(null)
      setModalErrors({})
      pushToast('success', editingId ? 'Product updated.' : 'Product created.')
    },
  })
  const zoneMut = useMutation({
    mutationFn: async (v: ResourceFormValues) => {
      const body = { city: v.city?.trim() ?? '', name: v.name?.trim() ?? '', number_of_stores: v.number_of_stores?.trim() ? Number(v.number_of_stores) : 0 }
      if (editingId) return updateZone(editingId, body)
      return createZone(body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['zones'] })
      setAddOpen(false)
      setEditingId(null)
      setModalErrors({})
      pushToast('success', editingId ? 'Zone updated.' : 'Zone created.')
    },
  })
  const customerMut = useMutation({
    mutationFn: async (v: ResourceFormValues) => {
      const body = {
        full_name: v.full_name?.trim() ?? '',
        phone: v.phone?.trim() ?? '',
        zone_id: v.zone_id ? Number(v.zone_id) : null,
        latitude: v.latitude?.trim() ? Number(v.latitude) : null,
        longitude: v.longitude?.trim() ? Number(v.longitude) : null,
      }
      if (editingId) return updateCustomer(editingId, body)
      return createCustomer(body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      setAddOpen(false)
      setEditingId(null)
      setModalErrors({})
      pushToast('success', editingId ? 'Customer updated.' : 'Customer created.')
    },
  })

  function handleMutationError(e: unknown) {
    if (e instanceof ApiError) {
      const fieldErrs: Record<string, string> = {}
      for (const [k, v] of Object.entries(e.errors)) {
        fieldErrs[k] = v[0] ?? 'Invalid value'
      }
      setModalErrors(fieldErrs)
      pushToast('error', e.message)
      return
    }
    pushToast('error', 'Request failed.')
  }

  function handleEditDriver(row: DriverRow) {
    setEditingId(row.id)
    setModalErrors({})
    setAddOpen(true)
  }

  function handleDeleteDriver(row: DriverRow) {
    if (window.confirm(`Remove ${row.fullName} from the directory?`)) {
      void deleteDriver(row.id)
        .then(() => {
          void qc.invalidateQueries({ queryKey: ['drivers'] })
          pushToast('success', 'Driver deleted.')
        })
        .catch(handleMutationError)
    }
  }

  function handleEditProduct(row: ProductRow) {
    setEditingId(row.id)
    setModalErrors({})
    setAddOpen(true)
  }

  function handleDeleteProduct(row: ProductRow) {
    if (window.confirm(`Remove ${row.name} from the catalog?`)) {
      void deleteProduct(row.id)
        .then(() => {
          void qc.invalidateQueries({ queryKey: ['products'] })
          pushToast('success', 'Product deleted.')
        })
        .catch(handleMutationError)
    }
  }

  function handleEditZone(row: ZoneRow) {
    setEditingId(row.id)
    setModalErrors({})
    setAddOpen(true)
  }

  function handleDeleteZone(row: ZoneRow) {
    if (window.confirm(`Remove ${row.name}?`)) {
      void deleteZone(row.id)
        .then(() => {
          void qc.invalidateQueries({ queryKey: ['zones'] })
          pushToast('success', 'Zone deleted.')
        })
        .catch(handleMutationError)
    }
  }

  function handleEditCustomer(row: CustomerRow) {
    setEditingId(row.id)
    setModalErrors({})
    setAddOpen(true)
  }

  function handleDeleteCustomer(row: CustomerRow) {
    if (window.confirm(`Remove ${row.name}?`)) {
      void deleteCustomer(row.id)
        .then(() => {
          void qc.invalidateQueries({ queryKey: ['customers'] })
          pushToast('success', 'Customer deleted.')
        })
        .catch(handleMutationError)
    }
  }

  function openAddModal() {
    setEditingId(null)
    setModalErrors({})
    setAddOpen(true)
  }

  const addModalConfig = useMemo(() => {
    const editingDriver = editingId ? drivers.find((d) => String(d.id) === editingId) : undefined
    const editingProduct = editingId ? products.find((d) => String(d.id) === editingId) : undefined
    const editingZone = editingId ? zones.find((d) => String(d.id) === editingId) : undefined
    const editingCustomer = editingId ? customers.find((d) => String(d.id) === editingId) : undefined

    if (view === 'drivers') {
      return {
        title: editingId ? 'Edit driver' : 'Add driver',
        description: 'Create or update tenant driver profiles.',
        submitLabel: editingId ? 'Save driver' : 'Create driver',
        fields: [
          { key: 'full_name', label: 'Full name', required: true },
          { key: 'phone', label: 'Phone', required: true },
          { key: 'zone_id', label: 'Zone ID', type: 'number' },
        ] satisfies ResourceFormField[],
        values: {
          full_name: editingDriver?.full_name ?? '',
          phone: editingDriver?.phone ?? '',
          zone_id: editingDriver?.zone_id != null ? String(editingDriver.zone_id) : '',
        } satisfies ResourceFormValues,
      }
    }
    if (view === 'products') {
      return {
        title: editingId ? 'Edit product' : 'Add product',
        description: 'Create or update products for sales and inventory.',
        submitLabel: editingId ? 'Save product' : 'Create product',
        fields: [
          { key: 'item', label: 'Item', required: true },
          { key: 'type', label: 'Type' },
          { key: 'price', label: 'Price', type: 'number' },
          { key: 'unit_volume', label: 'Unit volume', type: 'number' },
          { key: 'unit_weight', label: 'Unit weight', type: 'number' },
        ] satisfies ResourceFormField[],
        values: {
          item: editingProduct?.item ?? '',
          type: editingProduct?.type ?? '',
          price: editingProduct?.price != null ? String(editingProduct.price) : '',
          unit_volume: editingProduct?.unit_volume != null ? String(editingProduct.unit_volume) : '',
          unit_weight: editingProduct?.unit_weight != null ? String(editingProduct.unit_weight) : '',
        } satisfies ResourceFormValues,
      }
    }
    if (view === 'zones') {
      return {
        title: editingId ? 'Edit zone' : 'Add zone',
        description: 'Create or update delivery zones.',
        submitLabel: editingId ? 'Save zone' : 'Create zone',
        fields: [
          { key: 'city', label: 'City', required: true },
          { key: 'name', label: 'Zone name', required: true },
          { key: 'number_of_stores', label: 'Number of stores', type: 'number' },
        ] satisfies ResourceFormField[],
        values: {
          city: editingZone?.city ?? '',
          name: editingZone?.name ?? '',
          number_of_stores: editingZone?.number_of_stores != null ? String(editingZone.number_of_stores) : '',
        } satisfies ResourceFormValues,
      }
    }
    if (view === 'customers') {
      return {
        title: editingId ? 'Edit customer' : 'Add customer',
        description: 'Create or update customer records.',
        submitLabel: editingId ? 'Save customer' : 'Create customer',
        fields: [
          { key: 'full_name', label: 'Full name', required: true },
          { key: 'phone', label: 'Phone', required: true },
          { key: 'zone_id', label: 'Zone ID', type: 'number' },
          { key: 'latitude', label: 'Latitude', type: 'number' },
          { key: 'longitude', label: 'Longitude', type: 'number' },
        ] satisfies ResourceFormField[],
        values: {
          full_name: editingCustomer?.full_name ?? '',
          phone: editingCustomer?.phone ?? '',
          zone_id: editingCustomer?.zone_id != null ? String(editingCustomer.zone_id) : '',
          latitude: editingCustomer?.latitude != null ? String(editingCustomer.latitude) : '',
          longitude: editingCustomer?.longitude != null ? String(editingCustomer.longitude) : '',
        } satisfies ResourceFormValues,
      }
    }
    return {
      title: 'Create sales view',
      description: 'Saved analytical views will be configurable once reporting ships.',
      submitLabel: 'Close',
      fields: [] satisfies ResourceFormField[],
      values: {} satisfies ResourceFormValues,
    }
  }, [view, editingId, drivers, products, zones, customers])

  const modalSubmitting = driverMut.isPending || productMut.isPending || zoneMut.isPending || customerMut.isPending

  function handleSubmitModal(values: ResourceFormValues) {
    setModalErrors({})
    if (view === 'drivers') {
      driverMut.mutate(values, { onError: handleMutationError })
      return
    }
    if (view === 'products') {
      productMut.mutate(values, { onError: handleMutationError })
      return
    }
    if (view === 'zones') {
      zoneMut.mutate(values, { onError: handleMutationError })
      return
    }
    if (view === 'customers') {
      customerMut.mutate(values, { onError: handleMutationError })
      return
    }
    setAddOpen(false)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Resource Management</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Manage products, teams, customers, and zones in a centralized command center.
          </p>
        </div>
        <ResourceTabs view={view} />
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiStatCard label="Total Products" value={String(productRows.length)} hint="+2 this wk" hintTone="success" />
        <KpiStatCard label="Total Drivers" value={String(driverRows.length)} hint="Active now" />
        <KpiStatCard label="Total Customers" value={String(customerRows.length)} hint="+12%" hintTone="success" />
        <KpiStatCard
          className="col-span-2 md:col-span-1"
          label="Total Zones"
          value={String(zoneRows.length)}
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
      </div>

      <AddDriverModal
        key={`${view}-${editingId ?? 'new'}-${addOpen ? 'open' : 'closed'}`}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={addModalConfig.title}
        description={addModalConfig.description}
        submitLabel={addModalConfig.submitLabel}
        fields={addModalConfig.fields}
        initialValues={addModalConfig.values}
        errors={modalErrors}
        submitting={modalSubmitting}
        onSubmit={handleSubmitModal}
      />
    </div>
  )
}
