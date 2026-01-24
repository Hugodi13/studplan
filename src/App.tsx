import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './Pages/Home.jsx'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  )
}

export default App
