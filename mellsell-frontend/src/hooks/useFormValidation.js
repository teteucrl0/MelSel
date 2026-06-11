import { useMemo, useState } from 'react'

export default function useFormValidation({ initialValues = {}, validators = {} } = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setFieldValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const setFieldError = (field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error || '' }))
  }

  const validateField = (field, nextValues = values) => {
    const validator = validators[field]
    const error = validator ? validator(nextValues[field], nextValues) || '' : ''
    setFieldError(field, error)
    return !error
  }

  const validateForm = () => {
    const nextErrors = {}
    let valid = true

    Object.keys(validators).forEach((field) => {
      const error = validators[field]?.(values[field], values) || ''
      nextErrors[field] = error
      if (error) valid = false
    })

    setErrors((prev) => ({ ...prev, ...nextErrors }))
    const touchedFields = Object.fromEntries(Object.keys(validators).map((key) => [key, true]))
    setTouched((prev) => ({ ...prev, ...touchedFields }))
    return valid
  }

  const handleChange = (field) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
    setFieldValue(field, value)
    if (touched[field]) validateField(field, { ...values, [field]: value })
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field)
  }

  const resetForm = (nextValues = initialValues) => {
    setValues(nextValues)
    setErrors({})
    setTouched({})
  }

  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors])

  return {
    values,
    errors,
    touched,
    hasErrors,
    setValues,
    setErrors,
    setTouched,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    resetForm,
  }
}
