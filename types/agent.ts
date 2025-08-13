export interface AgentCallpoint {
  id: string
  label: string
  endpointId: string
  modelName: string
  systemInstructions: string
  inputSource: 'user' | string // 'user' or callpoint ID
  customPrompt?: string
  temperature?: number
  isCollapsed?: boolean
  isExecuting?: boolean
  output?: string
  error?: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export interface AgentWorkflow {
  id: string
  name: string
  description?: string
  callpoints: AgentCallpoint[]
  createdAt: number
  updatedAt: number
}

export interface WorkflowExecution {
  workflowId: string
  callpointResults: Record<string, {
    output: string
    error?: string
    usage?: {
      input_tokens: number
      output_tokens: number
    }
    timestamp: number
  }>
  isRunning: boolean
  currentStep?: string
}