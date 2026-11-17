
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Appointment = {
  id: string
  resourceId: string
  startsAt: string
  endsAt: string
  status: string
  createdAt: string
  updatedAt: string
}

type AppointmentForm = {
  resourceId: string
  date: string
  startTime: string
  endTime: string
}

type Feedback = {
  type: 'success' | 'error'
  message: string
}

const API_URL = '/api'

const initialForm: AppointmentForm = {
  resourceId: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function App() {
  const [form, setForm] = useState<AppointmentForm>(initialForm)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loadError, setLoadError] = useState('')

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const response = await fetch(`${API_URL}/appointments`)

      if (!response.ok) {
        throw new Error('Não foi possível consultar os agendamentos.')
      }

      const data: Appointment[] = await response.json()

      setAppointments(data)
    } catch {
      setLoadError(
        'Não foi possível conectar à API. Verifique se o servidor está funcionando na porta 3000.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  const filteredAppointments = useMemo(() => {
    const text = filter.trim().toLowerCase()

    return appointments
      .filter((appointment) =>
        appointment.resourceId.toLowerCase().includes(text),
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime(),
      )
  }, [appointments, filter])

  const totalResources = useMemo(() => {
    return new Set(appointments.map((item) => item.resourceId)).size
  }, [appointments])

  const upcomingCount = useMemo(() => {
    const now = Date.now()

    return appointments.filter(
      (item) => new Date(item.startsAt).getTime() > now,
    ).length
  }, [appointments])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const resourceId = form.resourceId.trim()

    if (!resourceId || !form.date || !form.startTime || !form.endTime) {
      setFeedback({
        type: 'error',
        message: 'Preencha todos os campos do agendamento.',
      })
      return
    }

    const startsAt = toISO(form.date, form.startTime)
    const endsAt = toISO(form.date, form.endTime)

    if (new Date(startsAt) >= new Date(endsAt)) {
      setFeedback({
        type: 'error',
        message: 'O horário de término deve ser posterior ao início.',
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          startsAt,
          endsAt,
        }),
      })

      if (response.status === 409) {
        setFeedback({
          type: 'error',
          message:
            'Esse recurso já possui um agendamento nesse período. Escolha outro horário.',
        })
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)

        throw new Error(
          data?.message || 'Não foi possível criar o agendamento.',
        )
      }

      setFeedback({
        type: 'success',
        message: 'Agendamento realizado com sucesso!',
      })

      setForm({
        ...initialForm,
        resourceId,
        date: form.date,
      })

      await loadAppointments()
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao salvar o agendamento.',
      })
    } finally {
      setSaving(false)
    }
  }

  function updateForm(field: keyof AppointmentForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setFeedback(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>

          <div>
            <strong>AgendaFlow</strong>
            <span>Gestão de agendamentos</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Navegação principal">
          <a className="nav-link active" href="#painel">
            ◫ <span>Visão geral</span>
          </a>

          <a className="nav-link" href="#novo-agendamento">
            ＋ <span>Novo agendamento</span>
          </a>

          <a className="nav-link" href="#agendamentos">
            ▦ <span>Agendamentos</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          API AgendaFlow
        </div>
      </aside>

      <main className="main-content" id="painel">
        <header className="page-header">
          <div>
            <span className="eyebrow">PAINEL DE CONTROLE</span>
            <h1>Visão geral</h1>
            <p>Organize seus recursos e acompanhe seus horários.</p>
          </div>

          <button
            className="outline-button"
            type="button"
            onClick={() => void loadAppointments()}
            disabled={loading}
          >
            ↻ Atualizar
          </button>
        </header>

        <section className="stats-grid" aria-label="Resumo">
          <article className="stat-card">
            <span className="stat-label">Total de agendamentos</span>
            <strong className="stat-value">{appointments.length}</strong>
            <span className="stat-description">
              Registros ativos encontrados
            </span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Próximos agendamentos</span>
            <strong className="stat-value">{upcomingCount}</strong>
            <span className="stat-description">
              Com início no futuro
            </span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Recursos cadastrados</span>
            <strong className="stat-value">{totalResources}</strong>
            <span className="stat-description">
              Recursos com agendamentos ativos
            </span>
          </article>
        </section>

        <div className="content-grid">
          <section
            className="panel form-panel"
            id="novo-agendamento"
          >
            <div className="panel-header">
              <div>
                <span className="eyebrow">AGENDAR HORÁRIO</span>
                <h2>Novo agendamento</h2>
                <p>Preencha os dados para reservar um horário.</p>
              </div>
            </div>

            <form className="appointment-form" onSubmit={handleSubmit}>
              <label htmlFor="resource">
                Nome do recurso
                <input
                  id="resource"
                  type="text"
                  placeholder="Ex.: sala-1"
                  value={form.resourceId}
                  onChange={(event) =>
                    updateForm('resourceId', event.target.value)
                  }
                  required
                />
              </label>

              <label htmlFor="date">
                Data do agendamento
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    updateForm('date', event.target.value)
                  }
                  required
                />
              </label>

              <div className="form-row">
                <label htmlFor="startTime">
                  Horário inicial
                  <input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateForm('startTime', event.target.value)
                    }
                    required
                  />
                </label>

                <label htmlFor="endTime">
                  Horário final
                  <input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateForm('endTime', event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              {feedback && (
                <div
                  className={`feedback ${feedback.type}`}
                  role="alert"
                >
                  {feedback.message}
                </div>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Confirmar agendamento'}
              </button>
            </form>
          </section>

          <section className="panel list-panel" id="agendamentos">
            <div className="panel-header">
              <div>
                <span className="eyebrow">CONSULTAR RESERVAS</span>
                <h2>Agendamentos</h2>
                <p>Confira os horários registrados no sistema.</p>
              </div>
            </div>

            <div className="search-wrapper">
              <input
                type="search"
                placeholder="Buscar por recurso..."
                aria-label="Buscar por recurso"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="empty-state">
                Carregando agendamentos...
              </div>
            ) : loadError ? (
              <div className="empty-state error-text" role="alert">
                {loadError}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▦</div>
                <strong>Nenhum agendamento encontrado</strong>
                <p>
                  Crie um agendamento para visualizar os horários aqui.
                </p>
              </div>
            ) : (
              <div className="appointments-list">
                {filteredAppointments.map((appointment) => (
                  <article
                    className="appointment-item"
                    key={appointment.id}
                  >
                    <div className="appointment-avatar">
                      {appointment.resourceId.charAt(0).toUpperCase()}
                    </div>

                    <div className="appointment-info">
                      <strong>{appointment.resourceId}</strong>

                      <span>
                        {formatDate(appointment.startsAt)}
                      </span>

                      <small>
                        {formatTime(appointment.startsAt)} às{' '}
                        {formatTime(appointment.endsAt)}
                      </small>
                    </div>

                    <span className="status-badge">Ativo</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="page-footer">
          AgendaFlow · Sistema de agendamentos
        </footer>
      </main>
    </div>
  )
}

export default App
