import { useEffect, useState } from 'react'
import './App.css'

const location = {
  name: 'Seattle, WA',
  latitude: 47.6062,
  longitude: -122.3321,
}

function App() {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [forecast, setForecast] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    // allows the effect to be cancelled if the component unmounts
    // before the fetch completes
    const controller = new AbortController()

    async function loadWeather() {
      try {
        setStatus('loading')
        setError('')

        const pointResponse = await fetch(
          `https://api.weather.gov/points/${location.latitude},${location.longitude}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/geo+json',
            },
          }
        )
        if (!pointResponse.ok) {
          throw new Error('Unable to load the weather location.')
        }
        const pointData = await pointResponse.json()
        const forecastUrl = pointData?.properties?.forecast

        if (!forecastUrl) {
          throw new Error('The forecast endpoint was not available.')
        }
        const forecastResponse = await fetch(forecastUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/geo+json',
          },
        })
        if (!forecastResponse.ok) {
          throw new Error('Unable to load the forecast data.')
        }
        const forecastData = await forecastResponse.json()
        const periods = forecastData?.properties?.periods ?? []

        if (!periods.length) {
          throw new Error('No forecast periods were returned.')
        }

        setCurrent(periods[0])
        setForecast(periods.slice(1, 5))
        setStatus('ready')
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return
        }

        setError(fetchError.message || 'Something went wrong loading the forecast.')
        setStatus('error')
      }
    }

    loadWeather()

    return () => {
      controller.abort()
    }
  }, [])

  const statusText =
    status === 'loading'
      ? 'Loading latest forecast...'
      : status === 'error'
      ? 'Forecast unavailable'
      : 'Powered by weather.gov'

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="label">Weather Dashboard</p>
          <h1>{location.name}</h1>
        </div>
        <p className="status">{statusText}</p>
      </header>

      <section className="current-card">
        {current ? (
          <>
            <div>
              <p className="weather-label">{current.name}</p>
              <h2>
                {current.temperature}
                {current.temperatureUnit}
              </h2>
              <p className="summary">{current.shortForecast}</p>
            </div>
            <div className="metrics">
              <div>
                <span>Wind</span>
                <strong>{current.windSpeed || 'Calm'}</strong>
              </div>
              <div>
                <span>Direction</span>
                <strong>{current.windDirection || 'N/A'}</strong>
              </div>
              <div>
                <span>Period</span>
                <strong>{current.isDaytime ? 'Day' : 'Night'}</strong>
              </div>
              <div>
                <span>Forecast</span>
                <strong>{current.temperatureUnit}</strong>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="weather-label">Current conditions</p>
            <h2>{status === 'loading' ? '...' : '--'}</h2>
            <p className="summary">
              {error || 'Fetching the latest National Weather Service forecast.'}
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <h3>Next Forecasts</h3>
          <p>Directly from the National Weather Service</p>
        </div>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="forecast-grid">
            {forecast.map((item) => (
              <article className="forecast-card" key={item.number}>
                <span>{item.name}</span>
                <strong aria-hidden="true">
                  {item.temperature}
                  {item.temperatureUnit}
                </strong>
                <p>{item.shortForecast}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App