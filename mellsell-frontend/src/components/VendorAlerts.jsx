import useMySupplierId from '../hooks/useMySupplierId'
import VendorNotificationStack from './VendorNotificationStack'

/** Toasts ao vivo para apicultores — vendas e estoque esgotado em qualquer página. */
export default function VendorAlerts() {
  const { supplierId, isVendor, loading } = useMySupplierId()

  if (!isVendor || loading || !supplierId) return null

  return <VendorNotificationStack supplierId={supplierId} />
}