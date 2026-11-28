import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/useAuth'

import './LoginPage.css'

function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [organizationSlug, setOrganizationSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn({
        organizationSlug: organizationSlug.trim(),
        email: email.trim(),
        password,
      })

      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível realizar o login.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">A</div>
          <h1>Atlas<span>One</span></h1>
        </div>

        <div className="login-heading">
          <h2>Bem-vindo de volta</h2>
          <p>Entre na sua conta para acessar o painel.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="organizationSlug">Identificador da empresa</label>
          <input
            id="organizationSlug"
            type="text"
            value={organizationSlug}
            onChange={(event) => setOrganizationSlug(event.target.value)}
            placeholder="Sua empresa"
            required
          />

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar no AtlasOne'}
          </button>
        </form>

        <p className="login-footer">
          AtlasOne · Gestão inteligente de entregas
        </p>
      </section>
    </main>
  )
}

export default LoginPage