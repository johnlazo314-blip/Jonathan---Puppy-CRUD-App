import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const emptyForm = {
  name: '',
  breed: '',
  age: ''
}

const Body = () => {
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const formTitle = useMemo(
    () => (editingId ? 'Edit Puppy' : 'Add Puppy'),
    [editingId]
  )

  const fetchUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { data } = await axios.get(API_BASE_URL)
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load data from the API.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setIsFormVisible(false)
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setError('')

    const payload = {
      name: formData.name.trim(),
      breed: formData.breed.trim(),
      age: Number(formData.age)
    }

    if (!payload.name || !payload.breed || Number.isNaN(payload.age)) {
      setError('Please complete name, breed, and age before submitting.')
      return
    }

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/${editingId}`, payload)
      } else {
        await axios.post(API_BASE_URL, payload)
      }

      await fetchUsers()
      resetForm()
    } catch {
      setError('Could not save this puppy. Please try again.')
    }
  }

  const startEditing = (user) => {
    setFormData({
      name: user.name ?? '',
      breed: user.breed ?? '',
      age: user.age ?? ''
    })
    setEditingId(user.id)
    setIsFormVisible(true)
  }

  const deleteUser = async (id) => {
    setError('')
    try {
      await axios.delete(`${API_BASE_URL}/${id}`)
      await fetchUsers()
    } catch {
      setError('Could not delete this puppy. Please try again.')
    }
  }

  return (
    <main className="app-body">
      <section className="panel">
        <div className="panel-top">
          <h2>Puppy Table</h2>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setIsFormVisible(true)
              setEditingId(null)
              setFormData(emptyForm)
            }}
          >
            Add
          </button>
        </div>

        {error && <p className="status error">{error}</p>}
        {isLoading && <p className="status">Loading...</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Breed</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan="5">No data yet. Add your first puppy.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.breed}</td>
                    <td>{user.age}</td>
                    <td className="actions">
                      <button
                        className="btn btn-edit"
                        type="button"
                        onClick={() => startEditing(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormVisible && (
        <section className="panel form-panel">
          <h2>{formTitle}</h2>
          <form className="user-form" onSubmit={submitForm}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="breed">Breed</label>
            <input
              id="breed"
              name="breed"
              type="text"
              value={formData.breed}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="age">Age</label>
            <input
              id="age"
              name="age"
              type="number"
              min="0"
              value={formData.age}
              onChange={handleFieldChange}
              required
            />

            <div className="form-actions">
              <button className="btn" type="submit">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                className="btn btn-cancel"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  )
}

export default Body
