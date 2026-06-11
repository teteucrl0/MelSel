import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import userService from '../services/userService'
import authService from '../services/authService'
import PageHeader from '../components/PageHeader'
import ProfileAvatarUpload from '../components/ProfileAvatarUpload'
import BirthDateInput from '../components/BirthDateInput'
import { MotionPage, MotionAlert } from '../components/motion/Motion'
import { formatApiError } from '../utils/apiValidationError'
import { brDateToIso, isoToBrDate, isValidBrBirthDate } from '../utils/birthDateBr'
import { getFullNameError, normalizeFullName } from '../utils/fullName'
import {
  getVendorStoreNameError,
  getVendorDescriptionError,
  getVendorCityError,
  getVendorStateError,
  getSafeStoreNameError,
  stripMarkupChars,
} from '../utils/inputSanitizer'
import VendorRegisterPanel from '../components/VendorRegisterPanel'
import { hasRole } from '../services/authUtil'
import PageLoadPlaceholder from '../components/PageLoadPlaceholder'
import FormInput from '../components/FormInput'
import PasswordStrengthInput from '../components/PasswordStrengthInput'
import Button from '../components/Button'
import { validatePasswordSecurity } from '../utils/validators'

const ROLE_LABELS = {
  CLIENTE: 'Cliente',
  VENDEDOR: 'Apicultor',
  ADMIN: 'Administrador',
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [storeName, setStoreName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [nameError, setNameError] = useState('')
  const [vendorStoreName, setVendorStoreName] = useState('')
  const [supplierDescription, setSupplierDescription] = useState('')
  const [supplierCity, setSupplierCity] = useState('')
  const [supplierState, setSupplierState] = useState('')
  const [vendorStoreError, setVendorStoreError] = useState('')
  const [vendorDescriptionError, setVendorDescriptionError] = useState('')
  const [vendorCityError, setVendorCityError] = useState('')
  const [vendorStateError, setVendorStateError] = useState('')
  const [becomingVendor, setBecomingVendor] = useState(false)

  const isVendor = profile?.vendor || hasRole('VENDEDOR')

  useEffect(() => {
    userService
      .getProfile()
      .then((data) => {
        setProfile(data)
        setName(data.name || '')
        setBirthDate(isoToBrDate(data.birthDate))
        setStoreName(data.storeName || '')
        if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl)
        else localStorage.removeItem('avatarUrl')
      })
      .catch((err) => {
        setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível carregar o perfil.') })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(t)
  }, [notice])

  const onProfileSaved = (data) => {
    authService.persistSession(data)
    setProfile(data.profile)
    setName(data.profile.name || '')
    setBirthDate(isoToBrDate(data.profile.birthDate))
    setStoreName(data.profile.storeName || '')
    setNotice({ type: 'success', text: 'Perfil atualizado.' })
    window.dispatchEvent(new Event('mellsell-profile-updated'))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const nameErr = getFullNameError(name)
    if (nameErr) {
      setNameError(nameErr)
      setNotice({ type: 'error', text: nameErr })
      return
    }
    setNameError('')
    if (isVendor) {
      const storeErr = getSafeStoreNameError(storeName)
      if (storeErr) {
        setNotice({ type: 'error', text: storeErr })
        return
      }
    }
    const iso = birthDate ? brDateToIso(birthDate) : null
    if (birthDate && !isValidBrBirthDate(birthDate)) {
      setNotice({ type: 'error', text: 'Data de nascimento inválida.' })
      return
    }

    setSaving(true)
    try {
      const data = await userService.updateProfile({
        name: normalizeFullName(name),
        birthDate: iso || undefined,
        storeName: isVendor ? storeName.trim() || undefined : undefined,
      })
      onProfileSaved(data)
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível salvar o perfil.') })
    } finally {
      setSaving(false)
    }
  }

  const submitBecomeVendor = async (e) => {
    e.preventDefault()
    const storeErr = getVendorStoreNameError(vendorStoreName)
    const descErr = getVendorDescriptionError(supplierDescription)
    const cityErr = getVendorCityError(supplierCity)
    const uf = supplierState.trim().toUpperCase()
    const stateErr = getVendorStateError(uf)
    setVendorStoreError(storeErr || '')
    setVendorDescriptionError(descErr || '')
    setVendorCityError(cityErr || '')
    setVendorStateError(stateErr || '')
    if (storeErr || descErr || cityErr || stateErr) {
      setNotice({ type: 'error', text: storeErr || descErr || cityErr || stateErr })
      return
    }

    setBecomingVendor(true)
    try {
      const data = await userService.becomeVendor({
        storeName: vendorStoreName.trim(),
        supplierDescription: supplierDescription.trim(),
        supplierCity: supplierCity.trim(),
        supplierState: uf,
      })
      authService.persistSession({
        token: data.token,
        roles: data.roles
          ? Array.isArray(data.roles)
            ? data.roles
            : [...data.roles]
          : data.profile?.roles
            ? [...data.profile.roles]
            : undefined,
        displayName: data.displayName,
        profile: data.profile,
      })
      setProfile(data.profile)
      setStoreName(data.profile?.storeName || vendorStoreName.trim())
      if (data.pendingApproval) {
        setNotice({
          type: 'success',
          text: (
            <>
              Solicitação enviada! Sua loja aguarda aprovação da equipe MelSell.{' '}
              <Link to="/vendor/dashboard" className="font-medium underline">
                Ir ao painel vendedor
              </Link>
            </>
          ),
        })
      } else {
        setNotice({
          type: 'success',
          text: (
            <>
              Você agora pode vender no MelSell!{' '}
              <Link to="/vendor/dashboard" className="font-medium underline">
                Abrir painel vendedor
              </Link>
            </>
          ),
        })
      }
      window.dispatchEvent(new Event('mellsell-profile-updated'))
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível solicitar venda no MelSell.') })
    } finally {
      setBecomingVendor(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      setNotice({ type: 'error', text: 'Preencha a senha atual e a nova senha.' })
      return
    }
    const passwordError = validatePasswordSecurity(newPassword)
    if (passwordError) {
      setNotice({ type: 'error', text: passwordError })
      return
    }
    setChangingPassword(true)
    try {
      await userService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setNotice({ type: 'success', text: 'Senha alterada com sucesso.' })
    } catch (err) {
      setNotice({ type: 'error', text: formatApiError(err, 'Não foi possível alterar a senha.') })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <PageLoadPlaceholder />

  if (!profile) {
    return (
      <MotionPage className="mx-auto max-w-lg space-y-6">
        <PageHeader title="Meu perfil" description="Não foi possível carregar seus dados." />
        {notice && (
          <MotionAlert className="alert alert-error">{notice.text}</MotionAlert>
        )}
        <div className="surface p-8 text-center">
          <p className="text-sm text-muted">
            {notice?.text || 'Perfil indisponível.'}
          </p>
          <p className="mt-3 text-xs text-muted">
            Confira se o backend foi reiniciado após a atualização (./run-presentation.sh).
          </p>
          <Button type="button" variant="primary" className="mt-6" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </MotionPage>
    )
  }

  const rolesText = (profile.roles || [])
    .map((r) => ROLE_LABELS[r] || r)
    .join(' · ')

  return (
    <MotionPage className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Meu perfil"
        description="Atualize sua foto e dados pessoais. Papéis e permissões do sistema não podem ser alterados aqui."
      />

      {notice && (
        <MotionAlert className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {notice.text}
        </MotionAlert>
      )}

      <section className="surface p-6">
        <h2 className="section-title">Atalhos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/orders" className="btn-secondary text-sm">Meus pedidos</Link>
          <Link to="/cart" className="btn-secondary text-sm">Carrinho</Link>
          <Link to="/" className="btn-ghost text-sm">Catálogo</Link>
          {isVendor && (
            <>
              <Link to="/vendor/dashboard" className="btn-ghost text-sm">Painel vendedor</Link>
              <Link to="/vendor/products" className="btn-ghost text-sm">Estoque</Link>
            </>
          )}
          {hasRole('ADMIN') && (
            <Link to="/admin/dashboard" className="btn-ghost text-sm">Painel admin</Link>
          )}
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="section-title">Foto de perfil</h2>
        <ProfileAvatarUpload
          avatarUrl={profile.avatarUrl}
          onUpdated={(p) => {
            setProfile(p)
            authService.persistSession({ profile: p, displayName: p.name })
            window.dispatchEvent(new Event('mellsell-profile-updated'))
          }}
        />
      </section>

      {!isVendor && (
        <form onSubmit={submitBecomeVendor} className="surface space-y-4 p-6">
          <h2 className="section-title">Quero vender no MelSell</h2>
          <p className="text-sm text-muted">
            Cadastre sua loja ou apiário para vender mel e produtos derivados. Após o envio, sua conta
            ganha acesso de apicultor; a vitrine pode ficar aguardando aprovação da equipe.
          </p>
          <VendorRegisterPanel
            storeName={vendorStoreName}
            onStoreNameChange={(v) => {
              const clean = stripMarkupChars(v)
              setVendorStoreName(clean)
              if (vendorStoreError) setVendorStoreError(getVendorStoreNameError(clean) || '')
            }}
            storeError={vendorStoreError}
            description={supplierDescription}
            onDescriptionChange={(v) => {
              const clean = stripMarkupChars(v)
              setSupplierDescription(clean)
              if (vendorDescriptionError) setVendorDescriptionError(getVendorDescriptionError(clean) || '')
            }}
            descriptionError={vendorDescriptionError}
            city={supplierCity}
            onCityChange={(v) => {
              const clean = stripMarkupChars(v)
              setSupplierCity(clean)
              if (vendorCityError) setVendorCityError(getVendorCityError(clean) || '')
            }}
            cityError={vendorCityError}
            state={supplierState}
            onStateChange={(v) => {
              const clean = stripMarkupChars(v).toUpperCase().slice(0, 2)
              setSupplierState(clean)
              if (vendorStateError) setVendorStateError(getVendorStateError(clean) || '')
            }}
            stateError={vendorStateError}
            disabled={becomingVendor}
          />
          <Button type="submit" variant="primary" disabled={becomingVendor}>
            {becomingVendor ? 'Enviando...' : 'Quero vender no MelSell'}
          </Button>
        </form>
      )}

      <form onSubmit={saveProfile} className="surface space-y-4 p-6">
        <h2 className="section-title">Dados pessoais</h2>

        <FormInput
          id="profile-email"
          label="E-mail"
          value={profile.email}
          readOnly
          disabled
          hint="O e-mail de login não pode ser alterado aqui."
          inputClassName="bg-stone-50 dark:bg-stone-800/80"
        />

        <FormInput
          id="profile-name"
          label="Nome completo"
          value={name}
          onChange={(e) => {
            const v = stripMarkupChars(e.target.value)
            setName(v)
            if (nameError) setNameError(getFullNameError(v) || '')
          }}
          onBlur={() => setNameError(getFullNameError(name) || '')}
          required
          maxLength={120}
          error={nameError}
          success={Boolean(name && !nameError)}
          autoComplete="name"
        />

        <BirthDateInput
          id="profile-birth"
          value={birthDate}
          onChange={setBirthDate}
          required={false}
        />

        {isVendor && (
          <FormInput
            id="profile-store"
            label="Nome da loja / apiário"
            value={storeName}
            onChange={(e) => setStoreName(stripMarkupChars(e.target.value))}
            placeholder="Como aparece para os clientes"
            maxLength={120}
          />
        )}

        <div>
          <p className="text-xs font-medium text-muted">Tipo de conta</p>
          <p className="mt-1 text-sm text-stone-800 dark:text-stone-200">{rolesText || '—'}</p>
        </div>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <form onSubmit={savePassword} className="surface space-y-4 p-6">
        <h2 className="section-title">Alterar senha</h2>
        <FormInput
          id="current-password"
          type="password"
          label="Senha atual"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <PasswordStrengthInput
          id="new-password"
          label="Nova senha"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="secondary" disabled={changingPassword}>
          {changingPassword ? 'Alterando...' : 'Atualizar senha'}
        </Button>
      </form>
    </MotionPage>
  )
}