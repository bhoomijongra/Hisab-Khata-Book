import { useState, useEffect } from 'react'
import {
  ShoppingBasket,
  Receipt,
  LogOut,
  IndianRupee,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Mail,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

function Logo({ size = 'small' }) {
  return (
    <div className={`logo-badge logo-${size}`}>
      <img src="/logo.jpeg" alt="Hisab" className="logo-image" />
    </div>
  )
}

function Blobs() {
  return (
    <>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
    </>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('username') || '')
  const [mode, setMode] = useState('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [customers, setCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [transactionType, setTransactionType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [customerSelectError, setCustomerSelectError] = useState('')
  const [amountError, setAmountError] = useState('')

  const [reminderStatus, setReminderStatus] = useState({})

  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editError, setEditError] = useState('')

  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCustomers = (authToken) => {
    fetch(`${API_BASE}/api/customers/`, {
      headers: { Authorization: `Token ${authToken}` },
    })
      .then((response) => response.json())
      .then((data) => setCustomers(data))
  }

  useEffect(() => {
    if (token) {
      fetchCustomers(token)
    }
  }, [token])

  const validateLoginForm = () => {
    if (!username.trim() || !password) {
      setAuthError('Please enter both username and password')
      return false
    }
    setAuthError('')
    return true
  }

  const validateRegisterForm = () => {
    let valid = true

    if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters')
      valid = false
    } else {
      setUsernameError('')
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Enter a valid email address')
      valid = false
    } else {
      setEmailError('')
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      valid = false
    } else {
      setPasswordError('')
    }

    return valid
  }

  const validateCustomerForm = () => {
    let valid = true

    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters')
      valid = false
    } else {
      setNameError('')
    }

    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Phone number must be exactly 10 digits')
      valid = false
    } else {
      setPhoneError('')
    }

    return valid
  }

  const validateTransactionForm = () => {
    let valid = true

    if (!selectedCustomer) {
      setCustomerSelectError('Please select a customer')
      valid = false
    } else {
      setCustomerSelectError('')
    }

    if (!amount || Number(amount) <= 0) {
      setAmountError('Enter an amount greater than 0')
      valid = false
    } else {
      setAmountError('')
    }

    return valid
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!validateLoginForm()) return

    fetch(`${API_BASE}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('username', data.username)
          setToken(data.token)
          setLoggedInUser(data.username)
          showToast(`Welcome back, ${data.username}!`)
        } else {
          setAuthError('Invalid username or password')
        }
      })
  }

  const handleRegister = (e) => {
    e.preventDefault()
    if (!validateRegisterForm()) return

    fetch(`${API_BASE}/api/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('username', data.username)
          setToken(data.token)
          setLoggedInUser(data.username)
          showToast(`Welcome to Hisab, ${data.username}!`)
        } else {
          const firstError = Object.values(data)[0]
          setAuthError(
            Array.isArray(firstError) ? firstError[0] : 'Registration failed'
          )
        }
      })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken('')
    setLoggedInUser('')
    setCustomers([])
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
    setHistoryFilter('all')
  }

  const handleAddCustomer = (e) => {
    e.preventDefault()
    if (!validateCustomerForm()) return

    fetch(`${API_BASE}/api/customers/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ name: name, phone_number: phone, email: customerEmail }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setName('')
          setPhone('')
          setCustomerEmail('')
          showToast(`${data.name} added successfully!`)
          fetchCustomers(token)
        } else {
          const firstError = Object.values(data)[0]
          showToast(Array.isArray(firstError) ? firstError[0] : 'Failed to add customer', 'error')
        }
      })
  }

  const handleAddTransaction = (e) => {
    e.preventDefault()
    if (!validateTransactionForm()) return

    fetch(`${API_BASE}/api/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        customer: selectedCustomer,
        transaction_type: transactionType,
        amount: amount,
        note: note,
      }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setAmount('')
          setNote('')
          showToast('Transaction recorded!')
          fetchCustomers(token)
        } else {
          const firstError = Object.values(data)[0]
          showToast(Array.isArray(firstError) ? firstError[0] : 'Failed to add transaction', 'error')
        }
      })
  }

  const handleSendReminder = (customerId) => (e) => {
    e.stopPropagation()

    setReminderStatus((prev) => ({
      ...prev,
      [customerId]: { state: 'sending', message: '' },
    }))

    fetch(`${API_BASE}/api/customers/${customerId}/send-reminder/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setReminderStatus((prev) => ({
            ...prev,
            [customerId]: { state: 'success', message: 'Reminder sent!' },
          }))
        } else {
          setReminderStatus((prev) => ({
            ...prev,
            [customerId]: { state: 'error', message: data.error || 'Failed to send' },
          }))
        }
      })
      .catch(() => {
        setReminderStatus((prev) => ({
          ...prev,
          [customerId]: { state: 'error', message: 'Network error' },
        }))
      })
  }

  const startEdit = (customer) => (e) => {
    e.stopPropagation()
    setEditingCustomerId(customer.id)
    setEditName(customer.name)
    setEditPhone(customer.phone_number)
    setEditEmail(customer.email || '')
    setEditError('')
  }

  const cancelEdit = (e) => {
    if (e) e.stopPropagation()
    setEditingCustomerId(null)
    setEditError('')
  }

  const handleUpdateCustomer = (customerId) => (e) => {
    e.stopPropagation()
    setEditError('')

    if (editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters')
      return
    }
    if (!/^\d{10}$/.test(editPhone)) {
      setEditError('Phone number must be exactly 10 digits')
      return
    }

    fetch(`${API_BASE}/api/customers/${customerId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        name: editName,
        phone_number: editPhone,
        email: editEmail,
      }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setEditingCustomerId(null)
          showToast('Customer updated!')
          fetchCustomers(token)
        } else {
          const firstError = Object.values(data)[0]
          setEditError(
            Array.isArray(firstError) ? firstError[0] : 'Update failed, please check the fields'
          )
        }
      })
  }

  const handleDeleteCustomer = (customerId, customerName) => (e) => {
    e.stopPropagation()
    const confirmed = window.confirm(
      `Delete ${customerName} and all their transaction history? This cannot be undone.`
    )
    if (!confirmed) return

    fetch(`${API_BASE}/api/customers/${customerId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    }).then((response) => {
      if (response.ok) {
        showToast(`${customerName} deleted`)
        fetchCustomers(token)
      } else {
        showToast('Failed to delete customer', 'error')
      }
    })
  }

  const handleDeleteTransaction = (transactionId) => (e) => {
    e.stopPropagation()
    const confirmed = window.confirm('Delete this transaction?')
    if (!confirmed) return

    fetch(`${API_BASE}/api/transactions/${transactionId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    }).then((response) => {
      if (response.ok) {
        showToast('Transaction deleted')
        fetchCustomers(token)
      } else {
        showToast('Failed to delete transaction', 'error')
      }
    })
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setAuthError('')
    setUsernameError('')
    setEmailError('')
    setPasswordError('')
    setUsername('')
    setPassword('')
    setEmail('')
  }

  if (!token) {
    return (
      <div className="login-page">
        <Blobs />
        <div className="login-card">
          <Logo size="large" />
          <h1 className="login-title">Hisab</h1>
          <p className="login-subtitle">Your friendly digital khata book</p>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">Login</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {usernameError && <p className="field-error">{usernameError}</p>}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && <p className="field-error">{emailError}</p>}

              <input
                type="password"
                placeholder="Choose a password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && <p className="field-error">{passwordError}</p>}

              <button type="submit">Create Account</button>
            </form>
          )}

          {authError && <p className="error-text">{authError}</p>}

          {mode === 'login' ? (
            <p className="switch-mode">
              New here?{' '}
              <span onClick={() => switchMode('register')}>
                Create an account
              </span>
            </p>
          ) : (
            <p className="switch-mode">
              Already have an account?{' '}
              <span onClick={() => switchMode('login')}>Login</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_number.includes(searchQuery)
  )

  return (
    <div className="app-shell">
      <Blobs />

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {toast.message}
        </div>
      )}

      <header className="app-header">
        <div className="brand">
          <Logo size="small" />
          <div>
            <h1>Hisab</h1>
            {loggedInUser && <p className="greeting">Hi, {loggedInUser} 👋</p>}
          </div>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <div className="ledger-page">
        <section className="ledger-forms">
          <div className="form-card">
            <div className="card-icon-chip chip-coral">
              <ShoppingBasket size={18} />
            </div>
            <h2>Add Customer</h2>
            <form onSubmit={handleAddCustomer}>
              <input
                type="text"
                placeholder="Customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && <p className="field-error">{nameError}</p>}

              <input
                type="tel"
                placeholder="Phone number (10 digits)"
                pattern="[0-9]{10}"
                title="Enter exactly 10 digits, numbers only"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {phoneError && <p className="field-error">{phoneError}</p>}

              <input
                type="email"
                placeholder="Email (optional, for reminders)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />

              <button type="submit">Add Customer</button>
            </form>
          </div>

          <div className="form-card">
            <div className="card-icon-chip chip-blue">
              <Receipt size={18} />
            </div>
            <h2>Add Transaction</h2>
            <form onSubmit={handleAddTransaction}>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {customerSelectError && (
                <p className="field-error">{customerSelectError}</p>
              )}

              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="credit">Credit Given</option>
                <option value="payment">Payment Received</option>
              </select>

              <div className="amount-input">
                <IndianRupee size={16} className="amount-icon" />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {amountError && <p className="field-error">{amountError}</p>}

              <input
                type="text"
                placeholder="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button type="submit">Add Transaction</button>
            </form>
          </div>
        </section>

        <section className="ledger-book">
          <h2>Customers</h2>

          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredCustomers.length === 0 && (
            <p className="empty-state">
              {customers.length === 0
                ? 'No customers yet — add one above.'
                : 'No customers match your search.'}
            </p>
          )}

          {filteredCustomers.map((customer, index) => {
            const isExpanded = expandedId === customer.id
            const isEditing = editingCustomerId === customer.id
            const sortedTransactions = [...customer.transactions].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            )
            const visibleTransactions =
              historyFilter === 'all'
                ? sortedTransactions
                : sortedTransactions.filter((t) => t.transaction_type === historyFilter)
            const reminder = reminderStatus[customer.id]

            if (isEditing) {
              return (
                <div className="ledger-row edit-row" key={customer.id}>
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                    />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Phone"
                      maxLength={10}
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email"
                    />
                    {editError && <p className="field-error">{editError}</p>}
                  </div>
                  <div className="row-right">
                    <button
                      className="btn-icon btn-save"
                      onClick={handleUpdateCustomer(customer.id)}
                    >
                      <Check size={16} />
                    </button>
                    <button className="btn-icon btn-cancel" onClick={cancelEdit}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={customer.id}>
                <div
                  className="ledger-row clickable"
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => toggleExpand(customer.id)}
                >
                  <div className="ledger-row-info">
                    <h3>{customer.name}</h3>
                    <p className="phone">
                      <Phone size={12} />
                      {customer.phone_number}
                    </p>
                    {reminder && (
                      <p
                        className={`reminder-status ${
                          reminder.state === 'error' ? 'reminder-error' : 'reminder-success'
                        }`}
                      >
                        {reminder.state === 'sending' ? 'Sending...' : reminder.message}
                      </p>
                    )}
                  </div>
                  <div className="row-right">
                    {customer.balance > 0 && (
                      <button
                        className="btn-reminder"
                        onClick={handleSendReminder(customer.id)}
                        disabled={reminder?.state === 'sending'}
                      >
                        <Mail size={14} />
                        Remind
                      </button>
                    )}
                    <div
                      className={`badge ${customer.balance > 0
                          ? 'badge-due'
                          : customer.balance < 0
                            ? 'badge-advance'
                            : 'badge-settled'
                        }`}
                    >
                      {customer.balance > 0 ? (
                        <>
                          <AlertCircle size={14} />
                          DUE ₹{customer.balance}
                        </>
                      ) : customer.balance < 0 ? (
                        <>
                          <Sparkles size={14} />
                          ADVANCE ₹{Math.abs(customer.balance)}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          SETTLED
                        </>
                      )}
                    </div>
                    <button className="btn-icon" onClick={startEdit(customer)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={handleDeleteCustomer(customer.id, customer.name)}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronDown
                      size={18}
                      className={`chevron ${isExpanded ? 'chevron-open' : ''}`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="history-panel">
                    <div className="history-filters">
                      <button
                        className={`filter-pill ${historyFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setHistoryFilter('all')}
                      >
                        All
                      </button>
                      <button
                        className={`filter-pill ${historyFilter === 'credit' ? 'active' : ''}`}
                        onClick={() => setHistoryFilter('credit')}
                      >
                        Credit Given
                      </button>
                      <button
                        className={`filter-pill ${historyFilter === 'payment' ? 'active' : ''}`}
                        onClick={() => setHistoryFilter('payment')}
                      >
                        Payment Received
                      </button>
                    </div>

                    {visibleTransactions.length === 0 ? (
                      <p className="empty-state">No transactions in this filter.</p>
                    ) : (
                      visibleTransactions.map((t) => (
                        <div className="history-row" key={t.id}>
                          {t.transaction_type === 'credit' ? (
                            <ArrowUpCircle size={16} className="icon-credit" />
                          ) : (
                            <ArrowDownCircle size={16} className="icon-payment" />
                          )}
                          <div className="history-details">
                            <p className="history-amount">
                              ₹{t.amount}{' '}
                              <span className="history-type">
                                {t.transaction_type === 'credit' ? 'Credit Given' : 'Payment Received'}
                              </span>
                            </p>
                            {t.note && <p className="history-note">{t.note}</p>}
                          </div>
                          <p className="history-date">
                            {new Date(t.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <button
                            className="btn-icon btn-delete"
                            onClick={handleDeleteTransaction(t.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default App
