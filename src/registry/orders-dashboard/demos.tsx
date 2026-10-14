import { OrdersDashboard } from '@/components/blocks/orders-dashboard'

import { activity, asOf, notifications, orders } from './mock-data'

export function OrdersDashboardDemo() {
  return (
    <OrdersDashboard
      orders={orders}
      activity={activity}
      notifications={notifications}
      asOf={asOf}
    />
  )
}

export function OrdersDashboardEmptyDemo() {
  return <OrdersDashboard orders={[]} activity={[]} notifications={[]} asOf={asOf} />
}
