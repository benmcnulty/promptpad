import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'
import { DebugProvider } from '@/components/DebugProvider'
import { WelcomeProvider } from '@/components/WelcomeProvider'

// Mock the OllamaEndpointProvider module
jest.mock('@/components/OllamaEndpointProvider', () => {
  const mockEndpoints = [
    {
      id: 'default',
      label: 'Default (localhost)',
      url: 'http://localhost:11434',
      isDefault: true,
      healthStatus: 'healthy' as const,
      lastChecked: Date.now(),
      models: [
        { name: 'gpt-oss:20b', family: 'gpt-oss', parameters: '20b' },
        { name: 'llama3.1:8b', family: 'llama', parameters: '8b' }
      ]
    }
  ]

  const mockContextValue = {
    endpoints: mockEndpoints,
    addEndpoint: jest.fn(),
    removeEndpoint: jest.fn(),
    updateEndpoint: jest.fn(),
    checkEndpointHealth: jest.fn(),
    checkAllEndpointsHealth: jest.fn(),
    getEndpointClient: jest.fn(),
    getHealthyEndpoints: jest.fn(() => mockEndpoints),
    loading: false,
    error: null
  }

  return {
    OllamaEndpointProvider: ({ children }: { children: React.ReactNode }) => children,
    useOllamaEndpoints: () => mockContextValue
  }
})

// Complete provider wrapper for testing
export const AllProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ModelProvider>
        <DebugProvider>
          <WelcomeProvider>
            {children}
          </WelcomeProvider>
        </DebugProvider>
      </ModelProvider>
    </ThemeProvider>
  )
}

// Minimal provider wrapper for components that only need model/endpoint context
export const ModelProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ModelProvider>
        {children}
      </ModelProvider>
    </ThemeProvider>
  )
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: 'all' | 'model' | 'none'
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { wrapper = 'all', ...renderOptions } = options

  let Wrapper: React.ComponentType<{ children: React.ReactNode }> | undefined

  switch (wrapper) {
    case 'all':
      Wrapper = AllProvidersWrapper
      break
    case 'model':
      Wrapper = ModelProvidersWrapper
      break
    case 'none':
    default:
      Wrapper = undefined
      break
  }

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions
  })
}

// Mock functions for common test scenarios
export const mockFetch = (mockData: any) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockData,
  })
}

export const mockFetchError = (status = 500, message = 'Server Error') => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
  })
}

// Common test data
export const mockModelsData = [
  { name: 'gpt-oss:20b', family: 'gpt-oss', parameters: '20b', default: true },
  { name: 'llama3.1:8b', family: 'llama', parameters: '8b' },
  { name: 'qwen2.5:7b', family: 'qwen', parameters: '7b' }
]

export const mockEndpointsData = [
  {
    id: 'default',
    label: 'Default (localhost)',
    url: 'http://localhost:11434',
    isDefault: true,
    healthStatus: 'healthy' as const,
    lastChecked: Date.now(),
    models: mockModelsData
  },
  {
    id: 'remote',
    label: 'Remote Server',
    url: 'http://192.168.1.100:11434',
    isDefault: false,
    healthStatus: 'healthy' as const,
    lastChecked: Date.now(),
    models: [
      { name: 'llama3.2:8b', family: 'llama', parameters: '8b' }
    ]
  }
]

// Re-export testing library utilities
export * from '@testing-library/react'
export { customRender as render }

// Sanity test to satisfy Jest's requirement for at least one test in this file when discovered
describe('test-providers helpers', () => {
  it('loads provider helpers', () => {
    expect(typeof AllProvidersWrapper).toBe('function')
  })
})
