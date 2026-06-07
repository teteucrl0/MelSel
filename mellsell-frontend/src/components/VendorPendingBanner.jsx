/** Banner exibido enquanto o fornecedor aguarda aprovação do admin. */
export default function VendorPendingBanner({ className = '' }) {
  return (
    <div
      className={`alert alert-warning mb-6 ${className}`.trim()}
      role="status"
    >
      <strong>Aguardando aprovação da equipe MelSell.</strong> Você já pode acessar sua conta; assim que
      aprovado, seus produtos aparecerão na loja e você poderá cadastrar itens no estoque.
    </div>
  )
}